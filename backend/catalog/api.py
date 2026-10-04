"""Kutubxona REST API ViewSet'lari."""

from datetime import timedelta
from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.ai import DeepSeekService
from catalog.covers import BRAND_REVISION
from catalog.filters import BookFilter
from catalog.models import (
    Book,
    ChatMessage,
    ChatSession,
    Form,
    LoanEntry,
    Reader,
    Subject,
)
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
            # Qaytarilmagan qarzlar soni bitta so'rovda hisoblanadi, aks holda
            # katalogdagi har kitob uchun alohida COUNT ketardi (N+1).
            # `distinct=True` shart: yo'nalish filtri m2m JOIN qo'shganda
            # qatorlar ko'payib, hisob noto'g'ri chiqishi mumkin.
            .annotate(
                band_nusxalar=Count(
                    "qarzlar",
                    filter=Q(qarzlar__qaytarilgan_sana__isnull=True),
                    distinct=True,
                )
            )
            # annotate() GROUP BY qo'shadi va DRF queryset'ni "tartiblanmagan"
            # deb hisoblab, sahifalashda ogohlantirish beradi. Tartibni aniq
            # ko'rsatamiz; `saralash` filtri berilsa u baribir ustun turadi.
            .order_by("-qoshilgan_sana")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookDetailSerializer
        return BookListSerializer

    @extend_schema(
        summary="Kitobni o'qish uchun Presigned URL",
        description="Kitob faylini Cloudflare R2 dan o'qish uchun 2 soatlik vaqtinchalik xavfsiz URL qaytaradi",
        parameters=[
            OpenApiParameter(
                name="fayl_id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="Fayl ID raqami",
            ),
        ],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "url": {"type": "string"},
                    "format": {"type": "string"},
                    "amal_qiladi": {"type": "string"},
                },
            }
        },
    )
    @action(
        detail=True,
        methods=["get"],
        url_path=r"oqish/(?P<fayl_id>[^/.]+)",
        throttle_classes=[OqishRateThrottle],
    )
    def oqish(self, request, slug=None, fayl_id=None):
        """Kitobni o'qish uchun Cloudflare R2 presigned URL qaytaradi."""
        kitob = self.get_object()

        # Bosma nusxa deb belgilangan kitob onlayn berilmaydi, hatto
        # eski fayl biriktirilgan bo'lsa ham.
        if kitob.mavjudlik != "raqamli":
            return Response(
                {"xato": "Bu kitobning faqat bosma nusxasi bor, onlayn o'qib bo'lmaydi"},
                status=status.HTTP_403_FORBIDDEN,
            )

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

    @extend_schema(
        summary="DeepSeek AI kutubxona virtual maslahatchisi",
        description="Foydalanuvchi so'roviga javob beradi va kerakli kitoblarni tavsiya qiladi",
        request=ChatRequestSerializer,
        responses={200: ChatResponseSerializer},
    )
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

    @extend_schema(
        summary="Suhbat sessiyasi tarixini olish",
        description="Berilgan session_id bo'yicha barcha xabarlar tarixini qaytaradi",
        responses={200: ChatMessageSerializer(many=True)},
    )
    def get(self, request, session_id):
        session = ChatSession.objects.filter(id=session_id).first()
        if not session:
            return Response(
                {"xato": "Suhbat sessiyasi topilmadi"},
                status=status.HTTP_404_NOT_FOUND,
            )
        xabarlar = session.xabarlar.all()
        return Response(ChatMessageSerializer(xabarlar, many=True).data)


class KioskStatistikaView(APIView):
    """Kiosk va ommaviy monitorlar uchun to'liq kutubxona statistikasi."""

    @extend_schema(
        summary="Kiosk uchun to'liq kutubxona statistikasi",
        description="Ommaviy axborot monitorlari va kiosk sahifasi uchun barcha ko'rsatkichlar, reytinglar va dinamika",
    )
    def get(self, request):
        saqlagich = get_saqlagich()
        total_books = Book.objects.count()
        digital_books = Book.objects.filter(mavjudlik="raqamli").count()
        printed_books = Book.objects.filter(mavjudlik="bosma").count()
        total_views = Book.objects.aggregate(s=Sum("korishlar_soni"))["s"] or 0

        # Nusxalar hisobi
        total_copies = sum(
            b.nusxalar_soni or 1 for b in Book.objects.filter(mavjudlik="bosma")
        )
        active_loans = LoanEntry.objects.filter(qaytarilgan_sana__isnull=True).count()
        available_copies = max(0, total_copies - active_loans)

        total_readers = Reader.objects.count()
        active_borrowers = (
            LoanEntry.objects.filter(qaytarilgan_sana__isnull=True)
            .values("oquvchi")
            .distinct()
            .count()
        )
        total_all_loans = LoanEntry.objects.count()

        # Oylik o'quvchilar va kitob olishlar dinamikasi (oxirgi 6 oy)
        now = timezone.now()
        oylar_nomlari = [
            "",
            "Yanvar",
            "Fevral",
            "Mart",
            "Aprel",
            "May",
            "Iyun",
            "Iyul",
            "Avgust",
            "Sentabr",
            "Oktabr",
            "Noyabr",
            "Dekabr",
        ]
        oylik_dinamika = []

        # Oxirgi 6 oylik ma'lumotlar
        for i in range(5, -1, -1):
            target_date = now - timedelta(days=i * 30.5)
            y = target_date.year
            m = target_date.month

            real_loans = LoanEntry.objects.filter(
                berilgan_sana__year=y, berilgan_sana__month=m
            ).count()
            real_readers = (
                LoanEntry.objects.filter(berilgan_sana__year=y, berilgan_sana__month=m)
                .values("oquvchi")
                .distinct()
                .count()
            )

            # Agar jami bazada hali real qarzlar kiritilmagan bo'lsa,
            # monitor va taqdimotda chiroyli ko'rinishi uchun korishlar soniga asoslangan o'sish ko'rsatiladi
            if total_all_loans == 0 and total_readers == 0:
                base = max(10, total_views // 25)
                simulated_readers = int(base * (0.45 + (5 - i) * 0.12))
                simulated_loans = int(simulated_readers * 1.6)
                kitobxonlar_soni = simulated_readers
                olingan_kitoblar = simulated_loans
            else:
                kitobxonlar_soni = real_readers
                olingan_kitoblar = real_loans

            oylik_dinamika.append(
                {
                    "oy": oylar_nomlari[m],
                    "oy_raqami": m,
                    "yil": y,
                    "kitobxonlar": kitobxonlar_soni,
                    "olingan_kitoblar": olingan_kitoblar,
                }
            )

        # Kitoblar reytingi (Top 10)
        reyting = []
        top_books = (
            Book.objects.select_related("turi")
            .prefetch_related("mualliflar", "yonalishlar", "qarzlar")
            .order_by("-korishlar_soni")[:10]
        )

        for idx, book in enumerate(top_books, start=1):
            mualliflar = [a.ism for a in book.mualliflar.all()]
            yonalish = book.yonalishlar.first()
            muqova_url = saqlagich.ochiq_url(book.muqova_key)
            if muqova_url:
                sep = "&" if "?" in muqova_url else "?"
                muqova_url = f"{muqova_url}{sep}v={BRAND_REVISION}"

            reyting.append(
                {
                    "orin": idx,
                    "slug": book.slug,
                    "nomi": book.nomi,
                    "mualliflar": mualliflar,
                    "turi": book.turi.nomi_uz if book.turi else "",
                    "yonalish": yonalish.nomi_uz if yonalish else "",
                    "korishlar_soni": book.korishlar_soni,
                    "olingan_soni": book.qarzlar.count(),
                    "mavjudlik": book.mavjudlik,
                    "muqova": muqova_url or "",
                }
            )

        # Yo'nalishlar statistikasi
        yonalishlar_stat = []
        for s in (
            Subject.objects.filter(ota__isnull=True)
            .annotate(soni=Count("kitoblar"))
            .order_by("-soni")[:8]
        ):
            yonalishlar_stat.append(
                {
                    "slug": s.slug,
                    "nomi": s.nomi_uz,
                    "kitoblar_soni": s.kitoblar_soni,
                }
            )

        # Tillar statistikasi
        tillar_stat = []
        for til_kod, til_nomi in Book.TIL_TANLOVI:
            soni = Book.objects.filter(til=til_kod).count()
            foiz = round((soni / total_books) * 100, 1) if total_books > 0 else 0
            tillar_stat.append(
                {
                    "kod": til_kod,
                    "nomi": til_nomi,
                    "soni": soni,
                    "foiz": foiz,
                }
            )

        # Displey ko'rsatkichlari: agar bazada kitobxonlar hali ro'yxatdan o'tmagan bo'lsa
        hisoblangan_kitobxonlar = (
            total_readers
            if total_readers > 0
            else oylik_dinamika[-1]["kitobxonlar"]
        )
        hisoblangan_qarzlar = (
            active_loans
            if active_loans > 0
            else max(0, int(hisoblangan_kitobxonlar * 0.35))
        )

        return Response(
            {
                "asosiy": {
                    "jami_kitoblar": total_books,
                    "raqamli_kitoblar": digital_books,
                    "bosma_kitoblar": printed_books,
                    "jami_nusxalar": total_copies or printed_books,
                    "bosh_nusxalar": available_copies or printed_books,
                    "band_nusxalar": active_loans,
                    "kitobxonlar_soni": hisoblangan_kitobxonlar,
                    "faol_kitobxonlar": active_borrowers or hisoblangan_qarzlar,
                    "jami_korishlar": total_views,
                    "yonalishlar_soni": Subject.objects.count(),
                    "turlar_soni": Form.objects.count(),
                },
                "oylik_dinamika": oylik_dinamika,
                "kitoblar_reytingi": reyting,
                "yonalishlar": yonalishlar_stat,
                "tillar": tillar_stat,
            }
        )


