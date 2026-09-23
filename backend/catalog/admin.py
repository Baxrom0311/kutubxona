"""Django admin paneli sozlamalari va kutubxonachi jurnali."""

from pathlib import Path
import uuid

from django import forms
from django.conf import settings
from django.contrib import admin
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from catalog.models import (
    AiBotConfig,
    Author,
    Book,
    BookFile,
    ChatMessage,
    ChatSession,
    Form,
    LoanEntry,
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


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("ism",)
    search_fields = ("ism",)


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ("nomi_uz", "nomi_ru", "nomi_en", "slug", "tartib")
    search_fields = ("nomi_uz", "nomi_ru", "nomi_en", "slug")
    list_editable = ("tartib",)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("nomi_uz", "ota", "slug", "tartib")
    list_filter = ("ota",)
    search_fields = ("nomi_uz", "nomi_ru", "nomi_en", "slug")
    list_editable = ("tartib",)


class BookFileInlineForm(forms.ModelForm):
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
            raise forms.ValidationError("Yangi fayl uchun fayl yuklang yoki storage key kiriting.")

        return cleaned


class BookFileInline(admin.TabularInline):
    model = BookFile
    form = BookFileInlineForm
    extra = 1
    fields = ("fayl", "format", "storage_key", "hajm", "sahifalar_soni", "tartib")
    readonly_fields = ("storage_key", "hajm")


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("nomi", "turi", "til", "yil", "korishlar_soni", "qoshilgan_sana")
    list_filter = ("turi", "til", "yil", "yonalishlar")
    search_fields = ("nomi", "mualliflar__ism", "slug", "nashriyot")
    filter_horizontal = ("mualliflar", "yonalishlar")
    readonly_fields = ("slug", "korishlar_soni", "qoshilgan_sana")
    inlines = [BookFileInline]

    def save_formset(self, request, form, formset, change):
        if formset.model is not BookFile:
            return super().save_formset(request, form, formset, change)

        saqlagich = get_saqlagich()

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

            obj = inline_form.save(commit=False)
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


@admin.register(Reader)
class ReaderAdmin(admin.ModelAdmin):
    list_display = ("fish", "guruh", "telefon")
    search_fields = ("fish", "guruh", "telefon")
    list_filter = ("guruh",)


@admin.register(LoanEntry)
class LoanEntryAdmin(admin.ModelAdmin):
    list_display = (
        "kitob",
        "oquvchi",
        "berilgan_sana",
        "qaytarilgan_sana",
        "kutubxonachi",
        "holati",
    )
    list_filter = (QaytarilganFilter, "berilgan_sana", "kutubxonachi")
    search_fields = (
        "kitob__nomi",
        "oquvchi__fish",
        "oquvchi__guruh",
        "oquvchi__telefon",
    )
    readonly_fields = ("berilgan_sana",)
    actions = ["qaytarilgan_deb_belgilash"]

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
