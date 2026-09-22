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

