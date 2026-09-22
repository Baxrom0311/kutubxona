"""Elektron kutubxona katalog modellari."""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from catalog.slugs import generate_unique_slug


class Author(models.Model):
    """Kitob muallifi."""

    ism = models.CharField(max_length=200, db_index=True)
    tavsif = models.TextField(blank=True)

    class Meta:
        verbose_name = "Muallif"
        verbose_name_plural = "Mualliflar"
        ordering = ["ism"]

    def __str__(self) -> str:
        return self.ism


class Form(models.Model):
    """Kitob turi (darslik, badiiy adabiyot, qo'lyozma, dissertatsiya)."""

    nomi_uz = models.CharField(max_length=100)
    nomi_ru = models.CharField(max_length=100, blank=True)
    nomi_en = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    tartib = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Kitob turi"
        verbose_name_plural = "Kitob turlari"
        ordering = ["tartib", "nomi_uz"]

    def nomi(self, til: str = "uz") -> str:
        return getattr(self, f"nomi_{til}", "") or self.nomi_uz

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.nomi_uz, max_length=100)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.nomi_uz


class Subject(models.Model):
    """Kitob yo'nalishi (ierarxik)."""

    nomi_uz = models.CharField(max_length=100)
    nomi_ru = models.CharField(max_length=100, blank=True)
    nomi_en = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    ota = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="bolalar",
    )
    tartib = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Yo'nalish"
        verbose_name_plural = "Yo'nalishlar"
        ordering = ["tartib", "nomi_uz"]

    def nomi(self, til: str = "uz") -> str:
        return getattr(self, f"nomi_{til}", "") or self.nomi_uz

    def toliq_nomi(self) -> str:
        if self.ota:
            return f"{self.ota.toliq_nomi()} → {self.nomi_uz}"
        return self.nomi_uz

    def clean(self):
        super().clean()
        if self.ota_id and self.pk and self.ota_id == self.pk:
            raise ValidationError("Yo'nalish o'zining otasi bo'la olmaydi.")

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.slug:
            self.slug = generate_unique_slug(self, self.nomi_uz, max_length=100)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.toliq_nomi()


class Book(models.Model):
    """Asosiy kitob modeli."""

    TIL_TANLOVI = [
        ("uz", "O'zbekcha"),
        ("ru", "Русский"),
        ("en", "English"),
    ]

    nomi = models.CharField(max_length=300, db_index=True)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    tavsif = models.TextField(blank=True)
    nashriyot = models.CharField(max_length=200, blank=True)
    yil = models.PositiveSmallIntegerField(null=True, blank=True)
    til = models.CharField(max_length=5, choices=TIL_TANLOVI, default="uz")
    muqova_key = models.CharField(max_length=500, blank=True)

    mualliflar = models.ManyToManyField(Author, blank=True, related_name="kitoblar")
    turi = models.ForeignKey(Form, on_delete=models.PROTECT, related_name="kitoblar")
    yonalishlar = models.ManyToManyField(Subject, blank=True, related_name="kitoblar")

    korishlar_soni = models.PositiveIntegerField(default=0)
    qoshilgan_sana = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Kitob"
        verbose_name_plural = "Kitoblar"
        ordering = ["-qoshilgan_sana"]
        indexes = [
            models.Index(fields=["turi", "til"]),
            models.Index(fields=["-qoshilgan_sana"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.nomi, max_length=300)
        super().save(*args, **kwargs)

    def korishni_qoshish(self):
        """F() ifodasi yordamida parallel so'rovlarda hisob yo'qolmasligi uchun."""
        Book.objects.filter(pk=self.pk).update(korishlar_soni=models.F("korishlar_soni") + 1)
        self.korishlar_soni = Book.objects.filter(pk=self.pk).values_list("korishlar_soni", flat=True).first()

    def hozir_kimda(self):
        """Kitob hozir qaysi o'quvchidaligini qaytaradi (qaytarilmagan bo'lsa)."""
        loan = self.qarzlar.filter(qaytarilgan_sana__isnull=True).select_related("oquvchi").first()
        return loan.oquvchi if loan else None

    def __str__(self) -> str:
        return self.nomi


class BookFile(models.Model):
    """Kitobning raqamli fayli (PDF yoki EPUB)."""

    FORMAT_TANLOVI = [
        ("pdf", "PDF"),
        ("epub", "EPUB"),
    ]

    kitob = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="fayllar")
    storage_key = models.CharField(max_length=500)
    format = models.CharField(max_length=10, choices=FORMAT_TANLOVI)
    hajm = models.PositiveBigIntegerField(default=0)
    sahifalar_soni = models.PositiveIntegerField(null=True, blank=True)
    tartib = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "Kitob fayli"
        verbose_name_plural = "Kitob fayllari"
        ordering = ["tartib", "id"]

    def __str__(self) -> str:
        return f"{self.kitob.nomi} ({self.format.upper()})"


class Reader(models.Model):
    """Kutubxona o'quvchisi (login talab qilinmaydi, jurnal uchun)."""

    fish = models.CharField(max_length=200, db_index=True)
    guruh = models.CharField(max_length=50, blank=True)
    telefon = models.CharField(max_length=20, blank=True)
    izoh = models.TextField(blank=True)

    class Meta:
        verbose_name = "O'quvchi"
        verbose_name_plural = "O'quvchilar"
        ordering = ["fish"]

    def __str__(self) -> str:
        if self.guruh:
            return f"{self.fish} ({self.guruh})"
        return self.fish


class LoanEntry(models.Model):
    """Kitob berish/qaytarish jurnali yozuvi."""

    kitob = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="qarzlar")
    oquvchi = models.ForeignKey(Reader, on_delete=models.PROTECT, related_name="qarzlar")
    berilgan_sana = models.DateTimeField(auto_now_add=True)
    qaytarilgan_sana = models.DateTimeField(null=True, blank=True)
    kutubxonachi = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="berilgan_qarzlar",
    )
    izoh = models.TextField(blank=True)

    class Meta:
        verbose_name = "Jurnal yozuvi"
        verbose_name_plural = "Jurnal yozuvlari"
        ordering = ["-berilgan_sana"]

    def clean(self):
        super().clean()
        if not self.qaytarilgan_sana and self.kitob_id:
            qs = LoanEntry.objects.filter(kitob=self.kitob, qaytarilgan_sana__isnull=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Bu kitob allaqachon berilgan va hali qaytarilmagan.")

    def qaytarish(self):
        """Kitobni qaytarilgan deb belgilash."""
        self.qaytarilgan_sana = timezone.now()
        self.save(update_fields=["qaytarilgan_sana"])

    def __str__(self) -> str:
        return f"{self.kitob} → {self.oquvchi}"
