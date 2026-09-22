"""Kutubxona REST API ViewSet'lari."""

from datetime import timedelta
from django.db.models import Count
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.ai import DeepSeekService
from catalog.filters import BookFilter
from catalog.models import Book, ChatMessage, ChatSession, Form, Subject
from catalog.serializers import (
    BookDetailSerializer,
    BookListSerializer,
    ChatMessageSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
    FormSerializer,
    SubjectSerializer,
)
from catalog.storage import get_saqlagich
from catalog.throttling import ChatRateThrottle, OqishRateThrottle


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    """Kitoblar katalogi uchun ochiq API (faqat GET)."""

    lookup_field = "slug"
    filterset_class = BookFilter

    def get_queryset(self):
        return (
            Book.objects.select_related("turi")
            .prefetch_related("mualliflar", "yonalishlar", "fayllar")
            .all()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookDetailSerializer
        return BookListSerializer

    @action(
        detail=True,
        methods=["get"],
        url_path=r"oqish/(?P<fayl_id>[^/.]+)",
        throttle_classes=[OqishRateThrottle],
    )
    def oqish(self, request, slug=None, fayl_id=None):
        """Kitobni o'qish uchun Cloudflare R2 presigned URL qaytaradi."""
        kitob = self.get_object()
        try:
            fayl = kitob.fayllar.get(pk=fayl_id)
        except kitob.fayllar.model.DoesNotExist:
            return Response(
                {"xato": "Kitob fayli topilmadi"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Yon ta'sir: ko'rishlar soni oshadi
        kitob.korishni_qoshish()

        muddat = 7200  # 2 soat
        saqlagich = get_saqlagich()
        presigned_url = saqlagich.oqish_url(fayl.storage_key, muddat=muddat)
        amal_qiladi = (timezone.now() + timedelta(seconds=muddat)).isoformat()

        return Response(
            {
                "url": presigned_url,
                "format": fayl.format,
                "amal_qiladi": amal_qiladi,
            }
        )


class FormViewSet(viewsets.ReadOnlyModelViewSet):
    """Kitob turlari API."""

    lookup_field = "slug"
    serializer_class = FormSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Form.objects.annotate(kitoblar_soni=Count("kitoblar"))
            .order_by("tartib", "nomi_uz")
        )


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    """Kitob yo'nalishlari API (ierarxik daraxt)."""

    lookup_field = "slug"
    serializer_class = SubjectSerializer
    pagination_class = None

    def get_queryset(self):
        # Faqat ildiz (root) yo'nalishlar qaytadi, bolalari serializer orqali olinadi
        return (
            Subject.objects.filter(ota__isnull=True)
            .prefetch_related("bolalar")
            .order_by("tartib", "nomi_uz")
        )


class ChatBotView(APIView):
    """DeepSeek AI kutubxona virtual maslahatchisi bilan suhbat endpointi."""

    throttle_classes = [ChatRateThrottle]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        xabar = serializer.validated_data["xabar"]
        session_id = serializer.validated_data.get("session_id")
        tarix = serializer.validated_data.get("tarix", [])

        service = DeepSeekService()
        javob_matni, session, tavsiyalar = service.javob_olish(
            xabar=xabar,
            session_id=str(session_id) if session_id else None,
            tarix=tarix,
        )

        response_serializer = ChatResponseSerializer(
            {
                "javob": javob_matni,
                "session_id": session.id,
                "tavsiya_etilgan_kitoblar": tavsiyalar,
            }
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class ChatSessionView(APIView):
    """Suhbat sessiyasi tarixini olish."""

    def get(self, request, session_id):
        session = ChatSession.objects.filter(id=session_id).first()
        if not session:
            return Response(
                {"xato": "Suhbat sessiyasi topilmadi"},
                status=status.HTTP_404_NOT_FOUND,
            )
        xabarlar = session.xabarlar.all()
        return Response(ChatMessageSerializer(xabarlar, many=True).data)

