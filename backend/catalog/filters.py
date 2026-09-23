"""Kitoblar katalogi uchun maxsus filtrlar."""

import django_filters
from django.db.models import Q

from catalog.models import Book, Subject


class BookFilter(django_filters.FilterSet):
    """Katalogdagi kitoblarni tur, yo'nalish, til, yil va qidiruv bo'yicha saralash."""

    turi = django_filters.CharFilter(field_name="turi__slug")
    mavjudlik = django_filters.CharFilter(field_name="mavjudlik")
    til = django_filters.CharFilter(field_name="til")
    yil_dan = django_filters.NumberFilter(field_name="yil", lookup_expr="gte")
    yil_gacha = django_filters.NumberFilter(field_name="yil", lookup_expr="lte")
    q = django_filters.CharFilter(method="filter_q")
    yonalish = django_filters.CharFilter(method="filter_yonalish")
    saralash = django_filters.OrderingFilter(
        fields=(
            ("qoshilgan_sana", "qoshilgan_sana"),
            ("nomi", "nomi"),
            ("korishlar_soni", "korishlar_soni"),
            ("yil", "yil"),
        ),
        field_labels={
            "qoshilgan_sana": "Qo'shilgan sana",
            "nomi": "Kitob nomi",
            "korishlar_soni": "Ko'rishlar soni",
            "yil": "Chiqarilgan yili",
        },
    )

    class Meta:
        model = Book
        fields = [
            "turi",
            "yonalish",
            "til",
            "mavjudlik",
            "yil_dan",
            "yil_gacha",
            "q",
            "saralash",
        ]

    def filter_q(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(
            Q(nomi__icontains=value) | Q(mualliflar__ism__icontains=value)
        ).distinct()

    def filter_yonalish(self, queryset, name, value):
        if not value:
            return queryset

        try:
            subject = Subject.objects.get(slug=value)
        except Subject.DoesNotExist:
            return queryset.none()

        # Ierarxik: o'zi va barcha avlod yo'nalishlarini qamrab oladi
        all_ids = [subject.id]
        level = [subject.id]
        while level:
            children_ids = list(
                Subject.objects.filter(ota_id__in=level).values_list("id", flat=True)
            )
            if not children_ids:
                break
            all_ids.extend(children_ids)
            level = children_ids

        return queryset.filter(yonalishlar__id__in=all_ids).distinct()
