import pytest
from django.contrib.admin.sites import site
from django.contrib.messages.storage.fallback import FallbackStorage
from django.core.exceptions import ValidationError

from catalog.admin import LoanEntryAdmin, QaytarilganFilter
from catalog.models import LoanEntry

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


def test_axes_brute_force_qayd_qilish(client):
    """Admin panelga ketma-ket noto'g'ri kirish urinishlari qayd etilishini tekshirish."""
    from axes.models import AccessAttempt
    for _ in range(3):
        client.post("/admin/login/", {"username": "hacker", "password": "wrongpassword"})
    assert AccessAttempt.objects.filter(username="hacker").exists()



def _kichik_png() -> bytes:
    """Django ImageField tekshiruvidan o'tadigan eng kichik haqiqiy PNG."""
    import base64

    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
        "YPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )


def test_admin_muqova_yuklaydi(client, kitob, kutubxonachi):
    """Admin panelidan muqova rasmi yuklanib, muqova_key to'ldirilsin."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    from catalog.storage import get_saqlagich

    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    assert kitob.muqova_key == ""

    response = client.post(
        f"/admin/catalog/book/{kitob.pk}/change/",
        {
            "nomi": kitob.nomi,
            "tavsif": "",
            "nashriyot": "",
            "yil": kitob.yil,
            "til": kitob.til,
            "turi": kitob.turi_id,
            "mavjudlik": "raqamli",
            "mualliflar": [m.pk for m in kitob.mualliflar.all()],
            "yonalishlar": [y.pk for y in kitob.yonalishlar.all()],
            "muqova_key": "",
            "muqova_fayl": SimpleUploadedFile("muqova.png", _kichik_png(), "image/png"),
            "fayllar-TOTAL_FORMS": "0",
            "fayllar-INITIAL_FORMS": "0",
            "fayllar-MIN_NUM_FORMS": "0",
            "fayllar-MAX_NUM_FORMS": "1000",
        },
        follow=True,
    )
    assert response.status_code == 200

    kitob.refresh_from_db()
    assert kitob.muqova_key.startswith("muqovalar/")
    assert kitob.muqova_key.endswith(".png")
    assert get_saqlagich().mavjudmi(kitob.muqova_key)


def test_admin_muqova_notogri_format_rad_etadi():
    """PDF ni muqova sifatida yuklashga urinish forma darajasida to'xtatilsin."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    from catalog.admin import BookAdminForm

    form = BookAdminForm()
    form.cleaned_data = {
        "muqova_fayl": SimpleUploadedFile("kitob.pdf", b"%PDF-1.4", "application/pdf")
    }
    with pytest.raises(ValidationError):
        form.clean_muqova_fayl()


def test_admin_pdf_fayl_yuklaydi(client, kitob, kutubxonachi):
    """Admin panelidan PDF yuklanib, storage_key va hajm to'ldirilsin."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    from catalog.models import BookFile
    from catalog.storage import get_saqlagich

    kutubxonachi.is_superuser = True
    kutubxonachi.save(update_fields=["is_superuser"])
    client.force_login(kutubxonachi)

    response = client.post(
        f"/admin/catalog/book/{kitob.pk}/change/",
        {
            "nomi": kitob.nomi,
            "tavsif": "",
            "nashriyot": "",
            "yil": kitob.yil,
            "til": kitob.til,
            "turi": kitob.turi_id,
            "mavjudlik": "raqamli",
            "mualliflar": [m.pk for m in kitob.mualliflar.all()],
            "yonalishlar": [y.pk for y in kitob.yonalishlar.all()],
            "muqova_key": "",
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
