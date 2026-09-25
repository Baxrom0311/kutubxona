import pytest
from io import BytesIO
from django.contrib.admin.sites import site
from django.contrib.messages.storage.fallback import FallbackStorage
from django.core.exceptions import ValidationError

from catalog.admin import (
    BookAdmin,
    DigitalBookAdmin,
    FormAdmin,
    LoanEntryAdmin,
    LoanEntryForm,
    PrintedBookAdmin,
    QaytarilganFilter,
    SubjectAdmin,
)
from catalog.models import Book, DigitalBook, Form, LoanEntry, PrintedBook, Subject

pytestmark = pytest.mark.django_db



def test_mehmon_admin_panelga_kirmaydi(client):
    response = client.get("/admin/")
    assert response.status_code == 302
    assert "/admin/login/" in response.url


def test_staff_admin_panelga_kiradi(client, kutubxonachi):
    client.force_login(kutubxonachi)
    response = client.get("/admin/")
    assert response.status_code == 200


def test_staff_jurnal_yozuvi_yaratadi_ikkinchisida_xato_oladi(client, kitob, oquvchi, kutubxonachi):
    """Admin orqali LoanEntry yaratish va ikkinchi marta xato olish."""
    # Birinchi yozuv
    loan1 = LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    assert loan1.qaytarilgan_sana is None

    # Ikkinchi marta — xato berishi kerak
    ikkinchi = LoanEntry(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    with pytest.raises(ValidationError):
        ikkinchi.full_clean()


def test_admin_action_qaytarilgan_deb_belgilash(rf, kitob, oquvchi, kutubxonachi):
    loan = LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    assert loan.qaytarilgan_sana is None

    model_admin = LoanEntryAdmin(LoanEntry, site)
    request = rf.post("/admin/catalog/loanentry/")
    request.user = kutubxonachi
    setattr(request, "session", {})
    setattr(request, "_messages", FallbackStorage(request))

    qs = LoanEntry.objects.filter(pk=loan.pk)
    model_admin.qaytarilgan_deb_belgilash(request, qs)

    loan.refresh_from_db()
    assert loan.qaytarilgan_sana is not None
    assert model_admin.holati(loan) == "✅ Qaytarilgan"


def test_admin_holat_filtri(rf, kitob, oquvchi, kutubxonachi, form_darslik):
    kitob2 = kitob.__class__.objects.create(nomi="Fiziologiya", turi=form_darslik)

    qarz1 = LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    qarz2 = LoanEntry.objects.create(kitob=kitob2, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    qarz2.qaytarish()

    model_admin = LoanEntryAdmin(LoanEntry, site)

    # Filter qarzda
    request = rf.get("/admin/catalog/loanentry/", {"holat": "qarzda"})
    f_qarzda = QaytarilganFilter(request, {"holat": ["qarzda"]}, LoanEntry, model_admin)
    qs_qarzda = f_qarzda.queryset(request, LoanEntry.objects.all())
    assert list(qs_qarzda) == [qarz1]

    # Filter qaytarilgan
    request = rf.get("/admin/catalog/loanentry/", {"holat": "qaytarilgan"})
    f_qaytarilgan = QaytarilganFilter(request, {"holat": ["qaytarilgan"]}, LoanEntry, model_admin)
    qs_qaytarilgan = f_qaytarilgan.queryset(request, LoanEntry.objects.all())
    assert list(qs_qaytarilgan) == [qarz2]


def test_kitob_berish_admin_nomi_aniq():
    assert LoanEntry._meta.verbose_name == "Kitob berish/qaytarish"
    assert LoanEntry._meta.verbose_name_plural == "Kitob berish/qaytarish"


def test_kitob_berish_formi_qarzdagi_kitobni_yashiradi(kitob, oquvchi, kutubxonachi, form_darslik):
    bosh_kitob = Book.objects.create(nomi="Bo'sh kitob", turi=form_darslik)
    LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)

    form = LoanEntryForm()

    assert kitob not in form.fields["kitob"].queryset
    assert bosh_kitob in form.fields["kitob"].queryset
    assert form.fields["kitob"].label == "Qaysi kitob berildi"


def test_kitob_berish_admin_qoshishda_faqat_berish_maydonlari_korinadi(rf):
    model_admin = LoanEntryAdmin(LoanEntry, site)
    request = rf.get("/admin/catalog/loanentry/add/")
    request.user = type("User", (), {"has_perm": lambda self, perm: True})()

    fieldsets = model_admin.get_fieldsets(request, obj=None)
    fields = fieldsets[0][1]["fields"]

    assert fields == ("kitob", "oquvchi", "izoh")
    assert "qaytarilgan_sana" not in fields
    assert "kutubxonachi" not in fields


def test_axes_brute_force_qayd_qilish(client):
    """Admin panelga ketma-ket noto'g'ri kirish urinishlari qayd etilishini tekshirish."""
    from axes.models import AccessAttempt
    for _ in range(3):
        client.post("/admin/login/", {"username": "hacker", "password": "wrongpassword"})
    assert AccessAttempt.objects.filter(username="hacker").exists()

def test_admin_muqova_avtomatik_generatsiya_qiladi(client, kitob, kutubxonachi):
    """Admin kitob saqlaganda muqova yagona shablonda avtomatik yaratilsin."""
    from catalog.storage import get_saqlagich

    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    assert kitob.muqova_key == ""

    response = client.post(
        f"/admin/catalog/digitalbook/{kitob.pk}/change/",
        {
            "nomi": kitob.nomi,
            "tavsif": "",
            "nashriyot": "",
            "yil": kitob.yil,
            "til": kitob.til,
            "turi": kitob.turi_id,
            "mualliflar": [m.pk for m in kitob.mualliflar.all()],
            "yonalishlar": [y.pk for y in kitob.yonalishlar.all()],
            "fayllar-TOTAL_FORMS": "0",
            "fayllar-INITIAL_FORMS": "0",
            "fayllar-MIN_NUM_FORMS": "0",
            "fayllar-MAX_NUM_FORMS": "1000",
        },
        follow=True,
    )
    assert response.status_code == 200

    kitob.refresh_from_db()
    assert kitob.muqova_key == f"covers/{kitob.slug}.png"
    assert kitob.muqova_key.endswith(".png")
    assert get_saqlagich().mavjudmi(kitob.muqova_key)


def test_admin_muqova_yuklash_maydoni_yoq(rf):
    """Muqova qo'lda yuklanmaydi; admin form faqat generatsiyadan foydalanadi."""
    model_admin = DigitalBookAdmin(DigitalBook, site)
    request = rf.get("/admin/catalog/digitalbook/add/")
    request.user = type("User", (), {"has_perm": lambda self, perm: True})()
    form_class = model_admin.get_form(request)

    assert "muqova_fayl" not in form_class.base_fields


def test_admin_tur_va_yonalish_bitta_nom_bilan_korinadi(rf):
    """Tur/yo'nalish adminida ru/en tarjima maydonlari kutubxonachini chalg'itmasin."""
    request = rf.get("/admin/catalog/form/add/")
    request.user = type("User", (), {"has_perm": lambda self, perm: True})()

    form_admin = FormAdmin(Form, site)
    form_class = form_admin.get_form(request)
    assert "nomi_uz" in form_class.base_fields
    assert "nomi_ru" not in form_class.base_fields
    assert "nomi_en" not in form_class.base_fields
    assert form_class.base_fields["nomi_uz"].label == "Nomi"

    subject_admin = SubjectAdmin(Subject, site)
    subject_form_class = subject_admin.get_form(request)
    assert "nomi_uz" in subject_form_class.base_fields
    assert "nomi_ru" not in subject_form_class.base_fields
    assert "nomi_en" not in subject_form_class.base_fields
    assert subject_form_class.base_fields["nomi_uz"].label == "Nomi"


def test_admin_kitobda_til_nomdan_oldin_keladi(rf):
    """Kutubxonachi avval asl tilni tanlaydi, keyin nomni o'sha tilda yozadi."""
    model_admin = DigitalBookAdmin(DigitalBook, site)
    request = rf.get("/admin/catalog/digitalbook/add/")
    request.user = type("User", (), {"has_perm": lambda self, perm: True})()
    form_class = model_admin.get_form(request)

    fields = list(form_class.base_fields)
    assert fields.index("til") < fields.index("nomi")


def test_admin_pdf_fayl_yuklaydi(client, kitob, kutubxonachi):
    """Admin panelidan PDF yuklanib, storage_key va hajm to'ldirilsin."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    from catalog.models import BookFile
    from catalog.storage import get_saqlagich

    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    response = client.post(
        f"/admin/catalog/digitalbook/{kitob.pk}/change/",
        {
            "nomi": kitob.nomi,
            "tavsif": "",
            "nashriyot": "",
            "yil": kitob.yil,
            "til": kitob.til,
            "turi": kitob.turi_id,
            "mualliflar": [m.pk for m in kitob.mualliflar.all()],
            "yonalishlar": [y.pk for y in kitob.yonalishlar.all()],
            "fayllar-TOTAL_FORMS": "1",
            "fayllar-INITIAL_FORMS": "0",
            "fayllar-MIN_NUM_FORMS": "0",
            "fayllar-MAX_NUM_FORMS": "1000",
            "fayllar-0-id": "",
            "fayllar-0-kitob": kitob.pk,
            "fayllar-0-format": "pdf",
            "fayllar-0-sahifalar_soni": "120",
            "fayllar-0-tartib": "0",
            "fayllar-0-fayl": SimpleUploadedFile(
                "anatomiya.pdf", b"%PDF-1.4 test", "application/pdf"
            ),
        },
        follow=True,
    )
    assert response.status_code == 200

    fayl = BookFile.objects.get(kitob=kitob)
    assert fayl.format == "pdf"
    assert fayl.hajm == len(b"%PDF-1.4 test")
    assert fayl.storage_key.startswith(f"kitoblar/")
    assert fayl.storage_key.endswith(".pdf")
    assert get_saqlagich().mavjudmi(fayl.storage_key)


def test_admin_muqova_nom_yoki_til_ozgarsa_qayta_generatsiya_qiladi(client, kitob, kutubxonachi):
    """Muqova kitobning asl tili va nomiga bog'liq, shuning uchun o'zgarishda yangilansin."""
    from catalog.storage import get_saqlagich

    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    storage = get_saqlagich()
    kitob.muqova_key = f"covers/{kitob.slug}.png"
    kitob.save(update_fields=["muqova_key"])
    storage.muqova_yuklash(kitob.muqova_key, BytesIO(b"old-cover"), content_type="image/png")

    response = client.post(
        f"/admin/catalog/digitalbook/{kitob.pk}/change/",
        {
            "nomi": "Cardiology Basics",
            "tavsif": "",
            "nashriyot": "",
            "yil": kitob.yil,
            "til": "en",
            "turi": kitob.turi_id,
            "mualliflar": [m.pk for m in kitob.mualliflar.all()],
            "yonalishlar": [y.pk for y in kitob.yonalishlar.all()],
            "fayllar-TOTAL_FORMS": "0",
            "fayllar-INITIAL_FORMS": "0",
            "fayllar-MIN_NUM_FORMS": "0",
            "fayllar-MAX_NUM_FORMS": "1000",
        },
        follow=True,
    )
    assert response.status_code == 200

    kitob.refresh_from_db()
    assert kitob.nomi == "Cardiology Basics"
    assert kitob.til == "en"
    assert storage.mavjudmi(kitob.muqova_key)
    assert storage.hajm(kitob.muqova_key) > len(b"old-cover")


def test_admin_fieldsets_ortiqcha_tizim_va_muqova_yoq(rf):
    """Adminda Muqova va Tizim ma'lumotlari fieldsetlari ko'rsatilmasin."""
    for model_cls, admin_cls, endpoint in [
        (DigitalBook, DigitalBookAdmin, "/admin/catalog/digitalbook/add/"),
        (PrintedBook, PrintedBookAdmin, "/admin/catalog/printedbook/add/"),
    ]:
        model_admin = admin_cls(model_cls, site)
        request = rf.get(endpoint)
        request.user = type("User", (), {"has_perm": lambda self, perm: True})()

        fieldsets = model_admin.get_fieldsets(request)
        sarlavhalar = [f[0] for f in fieldsets]

        assert "Muqova" not in sarlavhalar
        assert "Tizim ma'lumotlari" not in sarlavhalar

        all_fields = []
        for _, f_dict in fieldsets:
            all_fields.extend(f_dict.get("fields", ()))

        assert "slug" not in all_fields
        assert "muqova_key" not in all_fields
        assert "korishlar_soni" not in all_fields
        assert "qoshilgan_sana" not in all_fields
        assert "muqova_korinishi" not in all_fields


def test_admin_bosma_kitob_nusxalar_sonini_talab_qiladi(client, form_darslik, kutubxonachi):
    """Faqat bosma kitob tanlanganda nusxalar soni talab qilinsin."""
    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    # Nusxalar sonisiz saqlashga urinish
    res = client.post(
        "/admin/catalog/printedbook/add/",
        {
            "nomi": "Jarrohlik asoslari",
            "tavsif": "",
            "nashriyot": "",
            "til": "uz",
            "turi": form_darslik.pk,
            "nusxalar_soni": "",
        },
    )
    # Formada xatolik bo'lishi kerak
    assert res.status_code == 200
    assert "Kutubxonadagi nusxalar sonini kiriting" in res.content.decode("utf-8")


def test_admin_bosma_kitob_faylsiz_saqlanadi(client, form_darslik, kutubxonachi):
    """Bosma kitob saqlanganda PDF talab qilinmasin, nusxalar soni bilan muvaffaqiyatli saqlansin."""
    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    res = client.post(
        "/admin/catalog/printedbook/add/",
        {
            "nomi": "Terapevtik stomatologiya",
            "tavsif": "Darslik",
            "nashriyot": "Ibn Sino",
            "til": "uz",
            "turi": form_darslik.pk,
            "nusxalar_soni": "5",
        },
        follow=True,
    )
    assert res.status_code == 200
    book = Book.objects.get(nomi="Terapevtik stomatologiya")
    assert book.mavjudlik == "bosma"
    assert book.nusxalar_soni == 5
    assert book.fayllar.count() == 0


def test_proxy_modellar_admin_paneldan_joy_olgan(client, kutubxonachi, form_darslik):
    """DigitalBook va PrintedBook admin panelda 2 ta mustaqil bo'lim sifatida ishlaydi."""
    from catalog.models import DigitalBook, PrintedBook

    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    # 1. DigitalBook qo'shish
    res = client.post(
        "/admin/catalog/digitalbook/add/",
        {
            "nomi": "Elektron Gematologiya",
            "tavsif": "PDF kitob",
            "nashriyot": "Tibbiyot",
            "til": "uz",
            "turi": form_darslik.pk,
            "fayllar-TOTAL_FORMS": "0",
            "fayllar-INITIAL_FORMS": "0",
            "fayllar-MIN_NUM_FORMS": "0",
            "fayllar-MAX_NUM_FORMS": "1000",
        },
        follow=True,
    )
    assert res.status_code == 200
    d_book = Book.objects.get(nomi="Elektron Gematologiya")
    assert d_book.mavjudlik == "raqamli"
    assert d_book.nusxalar_soni is None

    # 2. PrintedBook qo'shish (Fayl umuman yo'q, faqat nusxalar soni)
    res2 = client.post(
        "/admin/catalog/printedbook/add/",
        {
            "nomi": "Bosma Nevrologiya",
            "tavsif": "Kutubxonadagi kitob",
            "nashriyot": "Fan",
            "til": "uz",
            "turi": form_darslik.pk,
            "nusxalar_soni": "12",
        },
        follow=True,
    )
    assert res2.status_code == 200
    p_book = Book.objects.get(nomi="Bosma Nevrologiya")
    assert p_book.mavjudlik == "bosma"
    assert p_book.nusxalar_soni == 12

    # 3. Queryset tekshiruvi: DigitalBook faqat raqamlini, PrintedBook faqat bosmani ko'rsatadi
    assert DigitalBook.objects.filter(pk=d_book.pk).exists()
    assert not DigitalBook.objects.filter(pk=p_book.pk, mavjudlik="raqamli").exists()
    assert PrintedBook.objects.filter(pk=p_book.pk).exists()
    assert not PrintedBook.objects.filter(pk=d_book.pk, mavjudlik="bosma").exists()


def test_admin_umumiy_kitoblar_menyu_yoq_faqat_bosma_va_raqamli(client, kutubxonachi):
    """Admin panelda umumiy 'Kitoblar' (Book) bo'limi yo'q, faqat 'Raqamli kitoblar' va 'Bosma kitoblar' mavjud."""
    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    # Django admin registry-da Book yo'q, DigitalBook va PrintedBook bor
    assert Book not in site._registry
    assert DigitalBook in site._registry
    assert PrintedBook in site._registry

    # Admin bosh sahifasida tekshirish
    res = client.get("/admin/")
    assert res.status_code == 200
    content = res.content.decode("utf-8")
    assert "/admin/catalog/digitalbook/" in content
    assert "/admin/catalog/printedbook/" in content
    assert "/admin/catalog/book/" not in content



