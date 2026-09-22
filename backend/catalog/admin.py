"""Django admin paneli sozlamalari va kutubxonachi jurnali."""

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


class BookFileInline(admin.TabularInline):
    model = BookFile
    extra = 1
    fields = ("format", "storage_key", "hajm", "sahifalar_soni", "tartib")


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("nomi", "turi", "til", "yil", "korishlar_soni", "qoshilgan_sana")
    list_filter = ("turi", "til", "yil", "yonalishlar")
    search_fields = ("nomi", "mualliflar__ism", "slug", "nashriyot")
    filter_horizontal = ("mualliflar", "yonalishlar")
    readonly_fields = ("slug", "korishlar_soni", "qoshilgan_sana")
    inlines = [BookFileInline]


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

