"""Elektron kutubxona katalog modellari."""

import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from catalog.slugs import generate_unique_slug


DEFAULT_AI_SYSTEM_PROMPT = """Siz "Kutubxona" elektron kutubxonasining AI maslahatchisisiz.

Vazifangiz:
- foydalanuvchiga katalogdagi kitoblar, darsliklar va klinik adabiyotlarni topishda yordam berish;
- hamshiralik ishi, bemor parvarishi, shoshilinch yordam, terapiya, pediatriya, xirurgiya va boshqa tibbiy ta'lim mavzularida o'quv maqsadidagi tushunarli yo'nalish berish;
- javobda avvalo kutubxona katalogida mavjud kitoblarni tavsiya qilish;
- kitob tavsiya qilganda nomini aniq yozish va nima uchun mosligini qisqa tushuntirish.

Qoidalar:
- foydalanuvchi qaysi tilda yozsa, asosan o'sha tilda javob bering;
- javobni qisqa, xushmuomala va amaliy qiling;
- agar katalogda mos kitob topilmasa, buni ochiq ayting va qidirish uchun yaqin mavzu/kalit so'zlar taklif qiling;
- tibbiy savollarda diagnoz qo'ymang, dori dozasini buyurmang va shifokor o'rnini bosmang;
- shoshilinch yoki xavfli alomatlarda foydalanuvchiga tibbiy mutaxassisga yoki tez yordamga murojaat qilishni tavsiya qiling.

Sizning asosiy maqsadingiz: foydalanuvchini eng mos kitob yoki bo'limga tez yetkazish."""


class Author(models.Model):
    """Kitob muallifi."""

    ism = models.CharField(max_length=200, db_index=True)
    tavsif = models.TextField(blank=True)

    class Meta:
        verbose_name = "Muallif"
        verbose_name_plural = "Mualliflar"
        ordering = ["ism"]

    @property
    def kitoblar_soni(self) -> int:
        """Ushbu muallifga tegishli kitoblar soni."""
        return self.kitoblar.count()

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

    @property
    def kitoblar_soni(self) -> int:
        """Ushbu turdagi kitoblar soni."""
        if hasattr(self, "_kitoblar_soni"):
            return self._kitoblar_soni
        return self.kitoblar.count()

    @kitoblar_soni.setter
    def kitoblar_soni(self, value: int):
        self._kitoblar_soni = value

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
        verbose_name="Yuqori yo'nalish",
        help_text="Ierarxik tuzilma uchun asosiy yo'nalishni tanlang.",
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

    @property
    def kitoblar_soni(self) -> int:
        """Ushbu yo'nalishdagi kitoblar soni."""
        if hasattr(self, "_kitoblar_soni"):
            return self._kitoblar_soni
        return self.kitoblar.count()

    @kitoblar_soni.setter
    def kitoblar_soni(self, value: int):
        self._kitoblar_soni = value

    @property
    def bolalar_soni(self) -> int:
        """Quyi yo'nalishlar (tarmoqlar) soni."""
        return self.bolalar.count()

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

    # Kutubxona 100% elektron emas: ayrim kitoblarning faqat bosma nusxasi
    # bor. Ularning muqovasi katalogda ko'rinadi, lekin onlayn o'qilmaydi —
    # o'quvchi kitobni kutubxonadan olishi kerak.
    MAVJUDLIK_TANLOVI = [
        ("raqamli", "Raqamli — onlayn o'qish mumkin"),
        ("bosma", "Faqat bosma nusxa — kutubxonadan olinadi"),
    ]

    nomi = models.CharField(max_length=300, db_index=True)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    tavsif = models.TextField(blank=True)
    nashriyot = models.CharField(max_length=200, blank=True)
    yil = models.PositiveSmallIntegerField(null=True, blank=True)
    til = models.CharField(max_length=5, choices=TIL_TANLOVI, default="uz")
    muqova_key = models.CharField(max_length=500, blank=True)
    mavjudlik = models.CharField(
        max_length=10,
        choices=MAVJUDLIK_TANLOVI,
        default="raqamli",
        db_index=True,
        help_text=(
            "Raqamli — PDF/EPUB yuklang, saytda o'qiladi. "
            "Faqat bosma — faqat muqova yuklang, saytda «kutubxonadan olasiz» deb ko'rinadi."
        ),
    )
    nusxalar_soni = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Nusxalar soni",
        help_text="Bosma kitob uchun kutubxonadagi nusxalar soni.",
    )

    mualliflar = models.ManyToManyField(
        Author,
        blank=True,
        related_name="kitoblar",
        verbose_name="Mualliflar",
        help_text="Kitob mualliflari",
    )
    turi = models.ForeignKey(
        Form,
        on_delete=models.PROTECT,
        related_name="kitoblar",
        verbose_name="Kitob turi",
        help_text="Kitob turi (darslik, monografiya, badiiy adabiyot va h.k.)",
    )
    yonalishlar = models.ManyToManyField(
        Subject,
        blank=True,
        related_name="kitoblar",
        verbose_name="Yo'nalishlar",
        help_text="Tegishli fan yoki soha yo'nalishlari",
    )

    korishlar_soni = models.PositiveIntegerField(default=0, verbose_name="Ko'rishlar soni")
    qoshilgan_sana = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Qo'shilgan sana")

    class Meta:
        verbose_name = "Kitob"
        verbose_name_plural = "Kitoblar"
        ordering = ["-qoshilgan_sana"]
        indexes = [
            models.Index(fields=["turi", "til"]),
            models.Index(fields=["-qoshilgan_sana"]),
        ]

    def clean(self):
        super().clean()
        if self.mavjudlik == "bosma":
            if self.nusxalar_soni is not None and self.nusxalar_soni < 1:
                raise ValidationError({"nusxalar_soni": "Nusxalar soni kamida 1 bo'lishi kerak."})
        elif self.mavjudlik == "raqamli":
            self.nusxalar_soni = None

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.nomi, max_length=300)
        if self.mavjudlik == "bosma" and not self.nusxalar_soni:
            self.nusxalar_soni = 1
        elif self.mavjudlik == "raqamli":
            self.nusxalar_soni = None
        super().save(*args, **kwargs)

    def oqish_mumkinmi(self) -> bool:
        """Saytda onlayn o'qish mumkinmi — raqamli belgilangan va fayli bor."""
        return self.mavjudlik == "raqamli" and self.fayllar.exists()

    def korishni_qoshish(self):
        """F() ifodasi yordamida parallel so'rovlarda hisob yo'qolmasligi uchun."""
        Book.objects.filter(pk=self.pk).update(korishlar_soni=models.F("korishlar_soni") + 1)
        self.korishlar_soni = Book.objects.filter(pk=self.pk).values_list("korishlar_soni", flat=True).first()

    def hozir_kimda(self):
        """Kitob hozir qaysi o'quvchidaligini qaytaradi (qaytarilmagan bo'lsa)."""
        loan = self.qarzlar.filter(qaytarilgan_sana__isnull=True).select_related("oquvchi").first()
        return loan.oquvchi if loan else None

    @property
    def mualliflar_matni(self) -> str:
        """Mualliflar ismlari ro'yxatini matn ko'rinishida qaytaradi."""
        return ", ".join(m.ism for m in self.mualliflar.all()) or "Muallif ko'rsatilmagan"

    def faol_qarzlar(self):
        """Hozir o'quvchilarda bo'lgan (qaytarilmagan) qarz yozuvlari."""
        return self.qarzlar.filter(qaytarilgan_sana__isnull=True)

    @property
    def band_nusxalar_soni(self) -> int:
        """Hozir o'quvchilarda qarzda turgan nusxalar soni."""
        return self.faol_qarzlar().count()

    @property
    def bosh_nusxalar_soni(self) -> int:
        """Kutubxonada mavjud bo'sh nusxalar soni."""
        jami = self.nusxalar_soni or 1
        return max(0, jami - self.band_nusxalar_soni)

    def __str__(self) -> str:
        return self.nomi


class DigitalBook(Book):
    """Raqamli (onlayn o'qiladigan) kitoblar uchun proxy model."""

    class Meta:
        proxy = True
        verbose_name = "Raqamli kitob"
        verbose_name_plural = "Raqamli kitoblar"

    def clean(self):
        self.mavjudlik = "raqamli"
        self.nusxalar_soni = None
        super().clean()

    def save(self, *args, **kwargs):
        self.mavjudlik = "raqamli"
        self.nusxalar_soni = None
        super().save(*args, **kwargs)


class PrintedBook(Book):
    """Faqat kutubxonada mavjud bosma kitoblar uchun proxy model."""

    class Meta:
        proxy = True
        verbose_name = "Bosma kitob"
        verbose_name_plural = "Bosma kitoblar"

    def clean(self):
        self.mavjudlik = "bosma"
        super().clean()

    def save(self, *args, **kwargs):
        self.mavjudlik = "bosma"
        if not self.nusxalar_soni:
            self.nusxalar_soni = 1
        super().save(*args, **kwargs)


class BookFile(models.Model):
    """Kitobning raqamli fayli (PDF yoki EPUB)."""

    FORMAT_TANLOVI = [
        ("pdf", "PDF"),
        ("epub", "EPUB"),
    ]

    kitob = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="fayllar",
        verbose_name="Kitob",
        help_text="Fayl tegishli bo'lgan kitob",
    )
    storage_key = models.CharField(max_length=500, verbose_name="Storage kaliti")
    format = models.CharField(max_length=10, choices=FORMAT_TANLOVI, verbose_name="Fayl formati")
    hajm = models.PositiveBigIntegerField(default=0, verbose_name="Fayl hajmi (baytlarda)")
    sahifalar_soni = models.PositiveIntegerField(null=True, blank=True, verbose_name="Sahifalar soni")
    tartib = models.PositiveSmallIntegerField(default=0, verbose_name="Tartib raqami")

    class Meta:
        verbose_name = "Kitob fayli"
        verbose_name_plural = "Kitob fayllari"
        ordering = ["tartib", "id"]

    def __str__(self) -> str:
        return f"{self.kitob.nomi} ({self.format.upper()})"


class Reader(models.Model):
    """Kutubxona o'quvchisi (login talab qilinmaydi, jurnal uchun)."""

    fish = models.CharField(max_length=200, db_index=True, verbose_name="F.I.SH.")
    guruh = models.CharField(max_length=50, blank=True, verbose_name="Guruhi")
    telefon = models.CharField(max_length=20, blank=True, verbose_name="Telefon raqami")
    izoh = models.TextField(blank=True, verbose_name="Izoh")

    class Meta:
        verbose_name = "O'quvchi"
        verbose_name_plural = "O'quvchilar"
        ordering = ["fish"]

    def faol_qarzlar(self):
        """O'quvchining hozirgi qaytarilmagan kitoblari."""
        return self.qarzlar.filter(qaytarilgan_sana__isnull=True).select_related("kitob")

    @property
    def faol_qarzlar_soni(self) -> int:
        """O'quvchi qo'lidagi qaytarilmagan kitoblar soni."""
        return self.faol_qarzlar().count()

    @property
    def qarzdormi(self) -> bool:
        """O'quvchida qaytarilmagan kitob bormi?"""
        return self.faol_qarzlar().exists()

    def __str__(self) -> str:
        if self.guruh:
            return f"{self.fish} ({self.guruh})"
        return self.fish


class LoanEntry(models.Model):
    """Kitob berish/qaytarish jurnali yozuvi."""

    kitob = models.ForeignKey(
        Book,
        on_delete=models.PROTECT,
        related_name="qarzlar",
        verbose_name="Kitob",
        help_text="Berilgan bosma kitob",
    )
    oquvchi = models.ForeignKey(
        Reader,
        on_delete=models.PROTECT,
        related_name="qarzlar",
        verbose_name="O'quvchi",
        help_text="Kitob berilgan o'quvchi",
    )
    berilgan_sana = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Berilgan sana",
    )
    qaytarilgan_sana = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Qaytarilgan sana",
        help_text="Kitob qaytarilganda sana yoziladi. Bo'sh bo'lsa — kitob qarzda hisoblanadi.",
    )
    kutubxonachi = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="berilgan_qarzlar",
        verbose_name="Kutubxonachi",
        help_text="Kitobni bergan xodim",
    )
    izoh = models.TextField(blank=True, verbose_name="Izoh")

    class Meta:
        verbose_name = "Kitob berish/qaytarish"
        verbose_name_plural = "Kitob berish/qaytarish"
        ordering = ["-berilgan_sana"]
        indexes = [
            models.Index(fields=["kitob", "qaytarilgan_sana"]),
            models.Index(fields=["oquvchi", "qaytarilgan_sana"]),
        ]

    def clean(self):
        super().clean()
        if self.kitob_id:
            if getattr(self.kitob, "mavjudlik", "bosma") != "bosma":
                raise ValidationError("Kitob berish faqat bosma kitoblar uchun mumkin. Raqamli (onlayn) kitoblarni qarzga berib bo'lmaydi.")
            if not self.qaytarilgan_sana:
                qs = LoanEntry.objects.filter(kitob=self.kitob, qaytarilgan_sana__isnull=True)
                if self.pk:
                    qs = qs.exclude(pk=self.pk)
                limit = getattr(self.kitob, "nusxalar_soni", None) or 1
                if qs.count() >= limit:
                    raise ValidationError("Bu kitobning barcha nusxalari berilgan va hali qaytarilmagan.")

    def qaytarish(self):
        """Kitobni qaytarilgan deb belgilash."""
        self.qaytarilgan_sana = timezone.now()
        self.save(update_fields=["qaytarilgan_sana"])

    def __str__(self) -> str:
        return f"{self.kitob} → {self.oquvchi}"


class AiBotConfig(models.Model):
    """DeepSeek AI bot konfiguratsiyasi va tizim prompti (Admin orqali boshqariladi)."""

    nomi = models.CharField(max_length=100, default="Kutubxona AI Maslahatchisi")
    tizim_prompti = models.TextField(
        default=DEFAULT_AI_SYSTEM_PROMPT,
        help_text="AI uchun tizim yo'riqnomasi (System Prompt). Admin buni xohlagan vaqt o'zgartirishi mumkin.",
    )
    model_nomi = models.CharField(max_length=50, default="deepseek-chat")
    harorat = models.FloatField(
        default=0.7,
        help_text="Ijodiylik darajasi (0.0 — qat'iy/aniq, 1.0 — ijodiy). Standart: 0.7",
    )
    max_tokens = models.PositiveIntegerField(
        default=2000,
        help_text="Javob uchun maksimal tokenlar soni",
    )
    katalog_konteksti_yoqilgan = models.BooleanField(
        default=True,
        help_text="Kutubxonada mavjud kitoblar ro'yxatini AI tizimiga avtomatik kontekst sifatida uzatish",
    )
    faol = models.BooleanField(default=True, help_text="Ushbu konfiguratsiya faolmi?")
    yaratilgan_sana = models.DateTimeField(auto_now_add=True)
    yangilangan_sana = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AI Bot Sozlamasi"
        verbose_name_plural = "AI Bot Sozlamalari"

    def __str__(self) -> str:
        holat = "Faol" if self.faol else "Nofaol"
        return f"{self.nomi} ({holat})"

    @classmethod
    def get_active_config(cls) -> "AiBotConfig":
        """Faol konfiguratsiyani oladi yoki mavjud bo'lmasa standart yaratadi."""
        config = cls.objects.filter(faol=True).order_by("-yangilangan_sana").first()
        if not config:
            config = cls.objects.create(
                nomi="Kutubxona AI Maslahatchisi",
                faol=True,
            )
        return config


class ChatSession(models.Model):
    """Foydalanuvchi bilan suhbat sessiyasi."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    yaratilgan_sana = models.DateTimeField(auto_now_add=True)
    yangilangan_sana = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AI Suhbat Sessiyasi"
        verbose_name_plural = "AI Suhbat Sessiyalari"
        ordering = ["-yangilangan_sana"]

    def __str__(self) -> str:
        return f"Sessiya {str(self.id)[:8]} ({self.yaratilgan_sana.strftime('%Y-%m-%d %H:%M')})"


class ChatMessage(models.Model):
    """Suhbat xabarlari (Foydalanuvchi va AI o'rtasidagi yozishmalar)."""

    ROL_TANLOVI = [
        ("user", "Foydalanuvchi"),
        ("assistant", "AI Maslahatchi"),
        ("system", "Tizim"),
    ]

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="xabarlar",
        verbose_name="Suhbat sessiyasi",
        help_text="Xabar tegishli bo'lgan AI sessiyasi",
    )
    rol = models.CharField(max_length=20, choices=ROL_TANLOVI, verbose_name="Xabar muallifi")
    matn = models.TextField(verbose_name="Xabar matni")
    yaratilgan_sana = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Yaratilgan sana")

    class Meta:
        verbose_name = "Suhbat xabari"
        verbose_name_plural = "Suhbat xabarlari"
        ordering = ["yaratilgan_sana"]

    def __str__(self) -> str:
        return f"{self.rol}: {self.matn[:50]}"
