"""Kutubxona API serializatorlari."""

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
