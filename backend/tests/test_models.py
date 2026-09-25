import pytest
from django.core.exceptions import ValidationError
from django.db.models import ProtectedError

from catalog.models import Book, BookFile, Form, LoanEntry, Subject
from catalog.slugs import translit_uz


def test_kitob_slug_avtomatik_yaratiladi(kitob):
    assert kitob.slug
    assert "yurak" in kitob.slug


def test_slug_takrorlanmaydi(db, form_darslik):
    a = Book.objects.create(nomi="Anatomiya", turi=form_darslik)
    b = Book.objects.create(nomi="Anatomiya", turi=form_darslik)
    assert a.slug != b.slug
    assert a.slug == "anatomiya"
    assert b.slug == "anatomiya-2"


def test_kirill_transliteratsiya(db, form_darslik):
    """ARCHITECTURE.md 5.4: Kirill nomli kitob ham o'qiladigan URL oladi."""
    kitob = Book.objects.create(nomi="Кардиология", turi=form_darslik)
    assert kitob.slug == "kardiologiya"


def test_translit_uz_funktsiyasi():
    """slugs.py translit lug'atining to'g'riligini tekshirish."""
    assert translit_uz("Кардиология") == "kardiologiya"
    assert translit_uz("O'zbek tili") == "ozbek tili"
    assert translit_uz("Ёш юраклар") == "yosh yuraklar"
    assert translit_uz("Қўлёзма") == "qolyozma"


def test_subject_ierarxiyasi(subject_kardiologiya, subject_ichki):
    assert subject_kardiologiya.ota == subject_ichki
    assert subject_kardiologiya.toliq_nomi() == "Ichki kasalliklar → Kardiologiya"
    assert list(subject_ichki.bolalar.all()) == [subject_kardiologiya]


def test_subject_oziga_ota_bola_olmaydi(db):
    """ARCHITECTURE.md 5.3 qoida 4: Subject o'zining otasi bo'la olmaydi."""
    s = Subject.objects.create(nomi_uz="Test yo'nalish")
    s.ota = s
    with pytest.raises(ValidationError):
        s.full_clean()


def test_toifa_nomi_tilga_qarab(subject_terapiya):
    assert subject_terapiya.nomi("uz") == "Terapiya"
    assert subject_terapiya.nomi("ru") == "Терапия"
    assert subject_terapiya.nomi("en") == "Therapy"


def test_bosh_tilda_nom_bosh_bolsa_uzbekchaga_qaytadi(db):
    s = Subject.objects.create(nomi_uz="Jarrohlik")
    assert s.nomi("ru") == "Jarrohlik"


def test_form_nomi_tilga_qarab(form_darslik):
    """Form.nomi(til) metodi ham to'g'ri ishlashini tekshirish."""
    assert form_darslik.nomi("uz") == "Darslik"
    assert form_darslik.nomi("ru") == "Учебник"
    assert form_darslik.nomi("en") == "Textbook"


def test_form_boglangan_kitob_bolsa_ochirilmaydi(db, form_darslik):
    """ARCHITECTURE.md 5.3 qoida 3: Form o'chirilmaydi, agar unga bog'langan kitob bo'lsa (PROTECT)."""
    Book.objects.create(nomi="Test kitob", turi=form_darslik)
    with pytest.raises(ProtectedError):
        form_darslik.delete()


def test_raqamli_kitobni_qarzga_berib_bolmaydi(kitob, oquvchi, kutubxonachi):
    """Raqamli kitobni qarzga berishga urinilganda validatsiya xatosi berilsin."""
    kitob.mavjudlik = "raqamli"
    kitob.save(update_fields=["mavjudlik"])
    loan = LoanEntry(kitob=kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    with pytest.raises(ValidationError) as exc:
        loan.full_clean()
    assert "faqat bosma kitoblar uchun" in str(exc.value)


def test_qaytarilmagan_kitobni_qayta_berib_bolmaydi(bosma_kitob, oquvchi, kutubxonachi):
    LoanEntry.objects.create(kitob=bosma_kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    ikkinchi = LoanEntry(kitob=bosma_kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    with pytest.raises(ValidationError):
        ikkinchi.full_clean()


def test_qaytarilgandan_keyin_qayta_berish_mumkin(bosma_kitob, oquvchi, kutubxonachi):
    birinchi = LoanEntry.objects.create(kitob=bosma_kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    birinchi.qaytarish()
    ikkinchi = LoanEntry(kitob=bosma_kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    ikkinchi.full_clean()  # xato bermasligi kerak


def test_kitob_hozir_kimdaligi(bosma_kitob, oquvchi, kutubxonachi):
    assert bosma_kitob.hozir_kimda() is None
    LoanEntry.objects.create(kitob=bosma_kitob, oquvchi=oquvchi, kutubxonachi=kutubxonachi)
    assert bosma_kitob.hozir_kimda() == oquvchi


def test_korishni_hisoblash(kitob):
    assert kitob.korishlar_soni == 0
    kitob.korishni_qoshish()
    kitob.refresh_from_db()
    assert kitob.korishlar_soni == 1
