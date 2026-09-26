"""Django admin paneli sozlamalari va kutubxonachi jurnali."""

from pathlib import Path
import uuid

from django import forms
from django.conf import settings
from django.contrib import admin
from django.db.models import Count, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from catalog.covers import cover_key, render_cover_png
from catalog.models import (
    AiBotConfig,
    Author,
    Book,
    BookFile,
    ChatMessage,
    ChatSession,
    DigitalBook,
    Form,
    LoanEntry,
    PrintedBook,
    Reader,
    Subject,
)
from catalog.storage import get_saqlagich


BOOK_CONTENT_TYPES = {
    "pdf": "application/pdf",
    "epub": "application/epub+zip",
}


class QaytarilganFilter(admin.SimpleListFilter):
    """Jurnalda qaytarilgan yoki qaytarilmagan kitoblarni ajratish filtri."""

    title = _("Holati")
    parameter_name = "holat"

    def lookups(self, request, model_admin):
        return [
            ("qarzda", _("Faqat qaytarilmaganlar (qarzda)")),
            ("qaytarilgan", _("Qaytarilganlar")),
        ]

    def queryset(self, request, queryset):
        if self.value() == "qarzda":
            return queryset.filter(qaytarilgan_sana__isnull=True)
        if self.value() == "qaytarilgan":
            return queryset.filter(qaytarilgan_sana__isnull=False)
        return queryset


def mavjud_bosma_kitoblar(instance=None):
    """Hozir bo'sh nusxasi bor bosma kitoblar.

    Hisob bazada bajariladi — barcha kitoblarni xotiraga yuklamaydi.
    Yozuv tahrirlanayotgan bo'lsa, o'sha yozuvning o'zi band deb sanalmaydi.
    """
    faol = Q(qarzlar__qaytarilgan_sana__isnull=True)
    if instance is not None and instance.pk:
        faol &= ~Q(qarzlar__pk=instance.pk)

    return (
        Book.objects.filter(mavjudlik="bosma")
        .annotate(band=Count("qarzlar", filter=faol, distinct=True))
        .filter(band__lt=Coalesce("nusxalar_soni", Value(1)))
        .order_by("nomi")
    )


class LoanEntryForm(forms.ModelForm):
    """Kutubxonachi kitob berayotganda faqat mavjud BOSMA kitoblarni ko'rsatuvchi form."""

    class Meta:
        model = LoanEntry
        fields = ("kitob", "oquvchi", "qaytarilgan_sana", "kutubxonachi", "izoh")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["kitob"].queryset = mavjud_bosma_kitoblar(self.instance)
        self.fields["kitob"].label = _("Qaysi kitob berildi (Faqat bosma)")
        self.fields["kitob"].help_text = _(
            "Faqat kutubxonadagi bo'sh bosma nusxalar ko'rinadi "
            "(onlayn kitoblar va hammasi berilgan kitoblar chiqmaydi)."
        )
        self.fields["oquvchi"].label = _("Kimga berildi")
        self.fields["oquvchi"].help_text = _("Agar o'quvchi ro'yxatda bo'lmasa, avval «O'quvchilar» bo'limida qo'shing.")
        self.fields["izoh"].label = _("Izoh")
        self.fields["izoh"].help_text = _("Masalan: kitob holati, kelishilgan qaytarish sanasi yoki boshqa eslatma.")


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("ism",)
    search_fields = ("ism",)


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    fields = ("nomi_uz", "slug", "tartib")
    list_display = ("nomi_uz", "slug", "tartib")
    search_fields = ("nomi_uz", "nomi_ru", "nomi_en", "slug")
    list_editable = ("tartib",)
    prepopulated_fields = {"slug": ("nomi_uz",)}

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)
        if db_field.name == "nomi_uz":
            formfield.label = _("Nomi")
            formfield.help_text = _(
                "Admin uchun bitta nom yetarli. Sayt boshqa tillarda shu nomni fallback sifatida ko'rsatadi."
            )
        return formfield


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    fields = ("nomi_uz", "ota", "slug", "tartib")
    list_display = ("nomi_uz", "ota", "slug", "tartib")
    list_filter = ("ota",)
    search_fields = ("nomi_uz", "nomi_ru", "nomi_en", "slug")
    list_editable = ("tartib",)
    prepopulated_fields = {"slug": ("nomi_uz",)}

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)
        if db_field.name == "nomi_uz":
            formfield.label = _("Nomi")
            formfield.help_text = _(
                "Yo'nalish nomini bitta tilda kiriting. Kerak bo'lsa slug avtomatik to'ldiriladi."
            )
        return formfield


class BookAdminForm(forms.ModelForm):
    """Kitob admin formasi — mavjudlikka qarab validatsiya qiladi."""

    class Meta:
        model = Book
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        mavjudlik = cleaned_data.get("mavjudlik")
        nusxalar_soni = cleaned_data.get("nusxalar_soni")

        if mavjudlik == "bosma":
            if not nusxalar_soni or nusxalar_soni < 1:
                self.add_error("nusxalar_soni", _("Bosma kitob uchun nusxalar sonini kiriting (kamida 1)."))
        elif mavjudlik == "raqamli":
            cleaned_data["nusxalar_soni"] = None

        return cleaned_data


class BookFileInlineForm(forms.ModelForm):
    format = forms.ChoiceField(
        choices=[("", "- Select an option -")] + BookFile.FORMAT_TANLOVI,
        required=False,
    )
    fayl = forms.FileField(
        required=False,
        label="Fayl yuklash",
        help_text="PDF yoki EPUB fayl tanlang. Format, hajm va storage key avtomatik to'ldiriladi.",
    )

    class Meta:
        model = BookFile
        fields = ("fayl", "format", "storage_key", "hajm", "sahifalar_soni", "tartib")

    def clean_fayl(self):
        fayl = self.cleaned_data.get("fayl")
        if not fayl:
            return fayl

        ext = Path(fayl.name).suffix.lower().lstrip(".")
        allowed = getattr(settings, "ALLOWED_BOOK_EXTENSIONS", ["pdf", "epub"])
        if ext not in allowed:
            raise forms.ValidationError("Faqat PDF yoki EPUB fayl yuklash mumkin.")

        max_mb = getattr(settings, "MAX_BOOK_FILE_MB", 200)
        if fayl.size > max_mb * 1024 * 1024:
            raise forms.ValidationError(f"Fayl hajmi {max_mb} MB dan oshmasligi kerak.")

        return fayl

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("DELETE"):
            return cleaned

        fayl = cleaned.get("fayl")
        storage_key = cleaned.get("storage_key")
        if not self.instance.pk and not fayl and not storage_key:
            if cleaned.get("sahifalar_soni"):
                raise forms.ValidationError("Yangi fayl uchun fayl yuklang yoki storage key kiriting.")

        return cleaned


class BookFileInline(admin.TabularInline):
    model = BookFile
    form = BookFileInlineForm
    extra = 1
    fields = ("fayl", "format", "storage_key", "hajm", "sahifalar_soni", "tartib")
    readonly_fields = ("storage_key", "hajm")


class BaseBookAdmin(admin.ModelAdmin):
    """Kitoblar uchun umumiy admin — qidiruv, m2m va muqova generatsiyasi."""

    search_fields = ("nomi", "mualliflar__ism", "slug", "nashriyot")
    filter_horizontal = ("mualliflar", "yonalishlar")

    def _generate_muqova(self, book: Book, saqlagich):
        key = cover_key(book)
        saqlagich.muqova_yuklash(key, render_cover_png(book), content_type="image/png")
        book.muqova_key = key
        book.save(update_fields=["muqova_key"])

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        cover_fields = {"nomi", "til", "turi", "mualliflar", "yonalishlar", "yil", "mavjudlik"}
        should_regenerate = not form.instance.muqova_key or bool(cover_fields & set(form.changed_data))
        if should_regenerate:
            self._generate_muqova(form.instance, get_saqlagich())


class DigitalBookForm(forms.ModelForm):
    class Meta:
        model = DigitalBook
        fields = ("til", "nomi", "mualliflar", "tavsif", "nashriyot", "yil", "turi", "yonalishlar")


@admin.register(DigitalBook)
class DigitalBookAdmin(BaseBookAdmin):
    """💻 Raqamli (onlayn) kitoblar boshqaruvi — faqat PDF/EPUB yuklanadi."""

    form = DigitalBookForm
    list_display = ("nomi", "turi", "holati", "til", "yil", "korishlar_soni")
    list_filter = ("turi", "til", "yil", "yonalishlar")
    inlines = [BookFileInline]
    fieldsets = (
        (
            _("Kitob haqida"),
            {
                "fields": ("til", "nomi", "mualliflar", "tavsif", "nashriyot", "yil"),
                "description": _(
                    "Avval kitob tilini tanlang. Kitob nomi va avtomatik muqova shu tilda saqlanadi."
                ),
            },
        ),
        (
            _("Toifalash"),
            {"fields": ("turi", "yonalishlar")},
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).filter(mavjudlik="raqamli")

    @admin.display(description=_("Fayl holati"))
    def holati(self, obj: DigitalBook) -> str:
        if obj.fayllar.exists():
            return "💻 Onlayn o'qiladi"
        return "⚠️ Fayl yuklanmagan"

    def save_model(self, request, obj, form, change):
        obj.mavjudlik = "raqamli"
        obj.nusxalar_soni = None
        super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        if formset.model is not BookFile:
            return super().save_formset(request, form, formset, change)

        saqlagich = get_saqlagich()
        formset.save(commit=False)

        for deleted in formset.deleted_objects:
            if deleted.storage_key:
                try:
                    saqlagich.ochirish(deleted.storage_key)
                except Exception:
                    pass
            deleted.delete()

        for inline_form in formset.forms:
            if not inline_form.cleaned_data or inline_form.cleaned_data.get("DELETE"):
                continue
            if not inline_form.has_changed():
                continue

            obj = inline_form.instance
            uploaded = inline_form.cleaned_data.get("fayl")
            if uploaded:
                ext = Path(uploaded.name).suffix.lower().lstrip(".")
                old_key = obj.storage_key
                obj.format = ext
                obj.hajm = uploaded.size
                obj.storage_key = self._book_file_key(form.instance, uploaded.name, ext)
                saqlagich.yuklash(
                    obj.storage_key,
                    uploaded,
                    content_type=BOOK_CONTENT_TYPES.get(ext, "application/octet-stream"),
                )
                if old_key and old_key != obj.storage_key:
                    try:
                        saqlagich.ochirish(old_key)
                    except Exception:
                        pass
            obj.kitob = form.instance
            obj.save()

        formset.save_m2m()

    def _book_file_key(self, book: Book, filename: str, ext: str) -> str:
        safe_stem = Path(filename).stem[:80] or book.slug
        return f"kitoblar/{timezone.now():%Y}/{book.slug}/{safe_stem}-{uuid.uuid4().hex[:8]}.{ext}"


class PrintedBookForm(forms.ModelForm):
    class Meta:
        model = PrintedBook
        fields = ("til", "nomi", "mualliflar", "tavsif", "nashriyot", "yil", "turi", "yonalishlar", "nusxalar_soni")

    def clean_nusxalar_soni(self):
        soni = self.cleaned_data.get("nusxalar_soni")
        if not soni or soni < 1:
            raise forms.ValidationError("Kutubxonadagi nusxalar sonini kiriting (kamida 1).")
        return soni


@admin.register(PrintedBook)
class PrintedBookAdmin(BaseBookAdmin):
    """📕 Bosma kitoblar boshqaruvi — fayl yuklanmaydi, faqat nusxalar soni kiritiladi."""

    form = PrintedBookForm
    list_display = (
        "nomi",
        "turi",
        "til",
        "yil",
        "nusxalar_soni_korinishi",
        "band_nusxalar",
        "korishlar_soni",
    )
    list_filter = ("turi", "til", "yil", "yonalishlar")
    inlines = []  # Fayl yuklash mutlaqo yo'q!
    fieldsets = (
        (
            _("Kitob haqida"),
            {
                "fields": ("til", "nomi", "mualliflar", "tavsif", "nashriyot", "yil"),
                "description": _(
                    "Avval kitob tilini tanlang. Kitob nomi va avtomatik muqova shu tilda saqlanadi."
                ),
            },
        ),
        (
            _("Toifalash"),
            {"fields": ("turi", "yonalishlar")},
        ),
        (
            _("Kutubxonadagi nusxalar"),
            {
                "fields": ("nusxalar_soni",),
                "description": _(
                    "Kutubxonada mavjud bosma nusxalar sonini kiriting. Saytda «kutubxonadan olasiz» deb ko'rinadi."
                ),
            },
        ),
    )

    def get_queryset(self, request):
        # Qarzlar bitta so'rovda sanaladi — aks holda ro'yxatdagi har kitob
        # uchun alohida COUNT ketardi (N+1).
        return (
            super()
            .get_queryset(request)
            .filter(mavjudlik="bosma")
            .annotate(
                band_nusxalar=Count(
                    "qarzlar",
                    filter=Q(qarzlar__qaytarilgan_sana__isnull=True),
                    distinct=True,
                )
            )
        )

    @admin.display(description=_("Nusxalar soni"))
    def nusxalar_soni_korinishi(self, obj: PrintedBook) -> str:
        return f"{obj.nusxalar_soni or 1} ta"

    @admin.display(description=_("Band / Qarzda"))
    def band_nusxalar(self, obj: PrintedBook) -> str:
        qarz_soni = obj.band_nusxalar_soni
        jami = obj.nusxalar_soni or 1
        if qarz_soni >= jami:
            return f"❌ Hammasi berilgan ({qarz_soni}/{jami})"
        if qarz_soni > 0:
            return f"⚠️ {qarz_soni} ta berilgan ({jami - qarz_soni} ta bo'sh)"
        return f"✅ Barchasi bo'sh ({jami} ta)"

    def save_model(self, request, obj, form, change):
        obj.mavjudlik = "bosma"
        if not obj.nusxalar_soni:
            obj.nusxalar_soni = 1
        super().save_model(request, obj, form, change)


@admin.register(Book)
class BookAdmin(DigitalBookAdmin):
    """
    LoanEntryAdmin autocomplete ishlashi uchun ro'yxatdan o'tkaziladi.
    Admin menyusida (app listda) 'Kitoblar' ko'rsatilmaydi — faqat 'Bosma kitoblar'
    va 'Raqamli kitoblar' ko'rinadi.
    """

    model = Book
    form = BookAdminForm
    search_fields = ("nomi", "mualliflar__ism", "slug", "nashriyot")

    def has_module_permission(self, request):
        return False

    def get_queryset(self, request):
        # LoanEntryAdmin autocomplete shu ro'yxatdan qidiradi, shuning uchun
        # forma queryset'i bilan bir xil bo'lishi kerak — aks holda
        # kutubxonachi tanlagan kitob saqlashda "noto'g'ri tanlov" deb
        # rad etilardi.
        return mavjud_bosma_kitoblar()

    def save_model(self, request, obj, form, change):
        admin.ModelAdmin.save_model(self, request, obj, form, change)


@admin.register(Reader)
class ReaderAdmin(admin.ModelAdmin):
    list_display = ("fish", "guruh", "telefon")
    search_fields = ("fish", "guruh", "telefon")
    list_filter = ("guruh",)


@admin.register(LoanEntry)
class LoanEntryAdmin(admin.ModelAdmin):
    form = LoanEntryForm
    list_display = (
        "holati",
        "kitob",
        "oquvchi",
        "berilgan_sana",
        "qaytarilgan_sana",
        "kutubxonachi",
    )
    list_filter = (QaytarilganFilter, "berilgan_sana", "kutubxonachi")
    search_fields = (
        "kitob__nomi",
        "oquvchi__fish",
        "oquvchi__guruh",
        "oquvchi__telefon",
    )
    autocomplete_fields = ("kitob", "oquvchi")
    readonly_fields = ("berilgan_sana", "kutubxonachi")
    actions = ["qaytarilgan_deb_belgilash"]
    date_hierarchy = "berilgan_sana"

    fieldsets = (
        (
            _("Kitob berish"),
            {
                "fields": ("kitob", "oquvchi", "izoh"),
                "description": _(
                    "Kitobni o'quvchiga berganda shu yerda yozuv yarating. "
                    "Berilgan sana va kutubxonachi avtomatik yoziladi."
                ),
            },
        ),
        (
            _("Qaytarish holati"),
            {
                "fields": ("qaytarilgan_sana",),
                "description": _(
                    "Kitob hali o'quvchida bo'lsa bu maydonni bo'sh qoldiring. "
                    "Qaytganda ro'yxatdan yozuvni tanlab «qaytarilgan deb belgilash» actionini ishlating."
                ),
            },
        ),
        (
            _("Tizim ma'lumotlari"),
            {"fields": ("berilgan_sana", "kutubxonachi"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("kitob", "oquvchi", "kutubxonachi")

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return (
                (
                    _("Kitob berish"),
                    {
                        "fields": ("kitob", "oquvchi", "izoh"),
                        "description": _(
                            "Kitobni o'quvchiga berish uchun kitob va o'quvchini tanlang. "
                            "Qaytarilgan sana keyin, kitob qaytganda to'ldiriladi."
                        ),
                    },
                ),
            )
        return super().get_fieldsets(request, obj)

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return ()
        return self.readonly_fields

    @admin.display(description=_("Holati"))
    def holati(self, obj: LoanEntry) -> str:
        if obj.qaytarilgan_sana:
            return "✅ Qaytarilgan"
        return "⏳ Qarzda"

    @admin.action(description=_("Tanlangan kitoblarni qaytarilgan deb belgilash"))
    def qaytarilgan_deb_belgilash(self, request, queryset):
        yangilangan = queryset.filter(qaytarilgan_sana__isnull=True).update(
            qaytarilgan_sana=timezone.now()
        )
        self.message_user(
            request,
            _("%(count)d ta kitob muvaffaqiyatli qaytarildi.") % {"count": yangilangan},
        )

    def save_model(self, request, obj, form, change):
        if not obj.kutubxonachi_id:
            obj.kutubxonachi = request.user
        super().save_model(request, obj, form, change)


@admin.register(AiBotConfig)
class AiBotConfigAdmin(admin.ModelAdmin):
    """DeepSeek AI Bot tizim prompti va parametrlarini boshqarish."""

    list_display = (
        "nomi",
        "model_nomi",
        "harorat",
        "katalog_konteksti_yoqilgan",
        "faol",
        "yangilangan_sana",
    )
    list_editable = ("faol",)
    fieldsets = (
        (
            _("Asosiy sozlamalar"),
            {
                "fields": ("nomi", "faol", "model_nomi"),
            },
        ),
        (
            _("Tizim Yo'riqnomasi (System Prompt)"),
            {
                "fields": ("tizim_prompti", "katalog_konteksti_yoqilgan"),
                "description": _(
                    "Kutubxona AI yordamchisining fe'l-atvori va yo'riqnomasini shu yerdan o'zgartiring. "
                    "Katalog konteksti yoqilgan bo'lsa, mavjud kitoblar ro'yxati AI ga avtomatik taqdim etiladi."
                ),
            },
        ),
        (
            _("Qo'shimcha parametrlar"),
            {
                "fields": ("harorat", "max_tokens"),
                "classes": ("collapse",),
            },
        ),
    )


class ChatMessageInline(admin.TabularInline):
    """Sessiyadagi xabarlar (faqat o'qish uchun)."""

    model = ChatMessage
    extra = 0
    readonly_fields = ("rol", "matn", "yaratilgan_sana")
    can_delete = False


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    """Foydalanuvchilarning AI bilan suhbatlari jurnali."""

    list_display = ("id", "yaratilgan_sana", "yangilangan_sana", "xabarlar_soni")
    readonly_fields = ("id", "yaratilgan_sana", "yangilangan_sana")
    inlines = [ChatMessageInline]
    search_fields = ("xabarlar__matn",)

    @admin.display(description=_("Xabarlar soni"))
    def xabarlar_soni(self, obj):
        return obj.xabarlar.count()
