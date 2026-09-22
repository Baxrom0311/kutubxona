import pytest
from django.core.exceptions import ValidationError

from catalog.models import Book, LoanEntry, Subject


def test_kitob_slug_avtomatik_yaratiladi(kitob):
    assert kitob.slug
    assert "yurak" in kitob.slug


def test_slug_takrorlanmaydi(db, form_darslik):
    a = Book.objects.create(nomi="Anatomiya", turi=form_darslik)
    b = Book.objects.create(nomi="Anatomiya", turi=form_darslik)
    assert a.slug != b.slug


def test_subject_ierarxiyasi(subject_kardiologiya, subject_ichki):
    assert subject_kardiologiya.ota == subject_ichki
    assert subject_kardiologiya.toliq_nomi() == "Ichki kasalliklar → Kardiologiya"
    assert list(subject_ichki.bolalar.all()) == [subject_kardiologiya]


def test_toifa_nomi_tilga_qarab(subject_terapiya):
    assert subject_terapiya.nomi("uz") == "Terapiya"
    assert subject_terapiya.nomi("ru") == "Терапия"
    assert subject_terapiya.nomi("en") == "Therapy"


def test_bosh_tilda_nom_bosh_bolsa_uzbekchaga_qaytadi(db):
    s = Subject.objects.create(nomi_uz="Jarrohlik")
    assert s.nomi("ru") == "Jarrohlik"


def test_qaytarilmagan_kitobni_qayta_berib_bolmaydi(kitob, oquvchi, kutubxonachi):
    LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    ikkinchi = LoanEntry(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    with pytest.raises(ValidationError):
        ikkinchi.full_clean()


def test_qaytarilgandan_keyin_qayta_berish_mumkin(kitob, oquvchi, kutubxonachi):
    birinchi = LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    birinchi.qaytarish()
    ikkinchi = LoanEntry(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    ikkinchi.full_clean()  # xato bermasligi kerak


def test_kitob_hozir_kimdaligi(kitob, oquvchi, kutubxonachi):
    assert kitob.hozir_kimda() is None
    LoanEntry.objects.create(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    assert kitob.hozir_kimda() == oquvchi


def test_korishni_hisoblash(kitob):
    assert kitob.korishlar_soni == 0
    kitob.korishni_qoshish()
    kitob.refresh_from_db()
    assert kitob.korishlar_soni == 1
