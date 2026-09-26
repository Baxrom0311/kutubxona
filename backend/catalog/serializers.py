"""Kutubxona API serializatorlari."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from catalog.models import Author, Book, BookFile, Form, Subject
from catalog.storage import get_saqlagich


def get_multilingual_name(obj) -> dict:
    """Uchala tildagi nomni lug'at ko'rinishida qaytaradi."""
    return {
        "uz": obj.nomi_uz,
        "ru": obj.nomi_ru or obj.nomi_uz,
        "en": obj.nomi_en or obj.nomi_uz,
    }


class FormSerializer(serializers.ModelSerializer):
    """Kitob turi serializatori."""

    nomi = serializers.SerializerMethodField()
    kitoblar_soni = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Form
        fields = ["slug", "nomi", "kitoblar_soni"]

    def get_nomi(self, obj) -> dict:
        return get_multilingual_name(obj)


class SubjectSerializer(serializers.ModelSerializer):
    """Yo'nalish ierarxik serializatori (bolalari bilan)."""

    nomi = serializers.SerializerMethodField()
    bolalar = serializers.SerializerMethodField()
    kitoblar_soni = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ["slug", "nomi", "kitoblar_soni", "bolalar"]

    def get_nomi(self, obj) -> dict:
        return get_multilingual_name(obj)

    def _get_all_descendant_ids(self, obj) -> list[int]:
        ids = [obj.id]
        level = [obj.id]
        while level:
            children_ids = list(
                Subject.objects.filter(ota_id__in=level).values_list("id", flat=True)
            )
            if not children_ids:
                break
            ids.extend(children_ids)
            level = children_ids
        return ids

    def get_kitoblar_soni(self, obj) -> int:
        all_ids = self._get_all_descendant_ids(obj)
        return Book.objects.filter(yonalishlar__id__in=all_ids).distinct().count()

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_bolalar(self, obj):
        children = obj.bolalar.all().order_by("tartib", "nomi_uz")
        return SubjectSerializer(children, many=True).data


class BookFileSerializer(serializers.ModelSerializer):
    """Kitob raqamli fayli serializatori."""

    class Meta:
        model = BookFile
        fields = ["id", "format", "hajm", "sahifalar_soni"]


class BookListSerializer(serializers.ModelSerializer):
    """Katalogdagi kitoblar ro'yxati serializatori."""

    mualliflar = serializers.SerializerMethodField()
    turi = serializers.SerializerMethodField()
    yonalishlar = serializers.SerializerMethodField()
    muqova = serializers.SerializerMethodField()
    formatlar = serializers.SerializerMethodField()
    oqish_mumkin = serializers.SerializerMethodField()
    nusxalar_soni = serializers.SerializerMethodField()
    bosh_nusxalar_soni = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "slug",
            "nomi",
            "mualliflar",
            "turi",
            "yonalishlar",
            "yil",
            "til",
            "muqova",
            "formatlar",
            "mavjudlik",
            "nusxalar_soni",
            "bosh_nusxalar_soni",
            "oqish_mumkin",
            "korishlar_soni",
        ]

    def get_mualliflar(self, obj) -> list[str]:
        return [author.ism for author in obj.mualliflar.all()]

    def get_turi(self, obj) -> dict:
        return {
            "slug": obj.turi.slug,
            "nomi": get_multilingual_name(obj.turi),
        }

    def get_yonalishlar(self, obj) -> list[dict]:
        return [
            {
                "slug": s.slug,
                "nomi": get_multilingual_name(s),
            }
            for s in obj.yonalishlar.all()
        ]

    def get_muqova(self, obj) -> str:
        saqlagich = get_saqlagich()
        return saqlagich.ochiq_url(obj.muqova_key)

    def get_formatlar(self, obj) -> list[str]:
        return list(dict.fromkeys(f.format for f in obj.fayllar.all()))

    def get_oqish_mumkin(self, obj) -> bool:
        """Saytda onlayn o'qish mumkinmi. `fayllar` prefetch qilingani uchun
        qo'shimcha so'rov yuzaga kelmaydi."""
        return obj.mavjudlik == "raqamli" and bool(obj.fayllar.all())

    def get_nusxalar_soni(self, obj) -> int | None:
        """Kutubxonadagi jami bosma nusxalar soni (kamida 1)."""
        if obj.mavjudlik != "bosma":
            return None
        return obj.nusxalar_soni or 1

    def get_bosh_nusxalar_soni(self, obj) -> int | None:
        """Hozir kutubxonada bo'sh turgan nusxalar soni.

        Qarzga berilgan nusxalar ayiriladi, shuning uchun foydalanuvchi
        kutubxonaga borishdan oldin kitob joyidami yoki yo'qligini biladi.
        """
        if obj.mavjudlik != "bosma":
            return None
        return obj.bosh_nusxalar_soni


class BookDetailSerializer(BookListSerializer):
    """Bitta kitobning to'liq ma'lumotlari serializatori."""

    fayllar = BookFileSerializer(many=True, read_only=True)

    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + [
            "tavsif",
            "nashriyot",
            "qoshilgan_sana",
            "fayllar",
        ]


class ChatRequestSerializer(serializers.Serializer):
    """AI chatbotga yuboriladigan xabar formati."""

    xabar = serializers.CharField(required=True, max_length=2000)
    session_id = serializers.UUIDField(required=False, allow_null=True)
    tarix = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )


class TavsiyaKitobSerializer(serializers.Serializer):
    """AI tavsiya etgan kitob qisqacha ma'lumoti."""

    slug = serializers.CharField()
    nomi = serializers.CharField()


class ChatResponseSerializer(serializers.Serializer):
    """AI chatbot javobi formati."""

    javob = serializers.CharField()
    session_id = serializers.UUIDField()
    tavsiya_etilgan_kitoblar = TavsiyaKitobSerializer(many=True, default=list)


class ChatMessageSerializer(serializers.ModelSerializer):
    """Suhbat xabarlari serializatori."""

    class Meta:
        from catalog.models import ChatMessage
        model = ChatMessage
        fields = ["id", "rol", "matn", "yaratilgan_sana"]


class AiBotConfigSerializer(serializers.ModelSerializer):
    """AI bot konfiguratsiyasi serializatori."""

    class Meta:
        from catalog.models import AiBotConfig
        model = AiBotConfig
        fields = [
            "id",
            "nomi",
            "tizim_prompti",
            "model_nomi",
            "harorat",
            "max_tokens",
            "katalog_konteksti_yoqilgan",
            "faol",
            "yangilangan_sana",
        ]

