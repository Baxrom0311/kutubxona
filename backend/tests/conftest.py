import pytest

from catalog.models import Author, Book, Form, Reader, Subject


@pytest.fixture(autouse=True)
def soxta_saqlagich(settings):
    """Testlar diskka yozmasligi uchun xotiradagi saqlagichga o'tkaziladi.

    Ishlab chiqarishdagi standart DiskSaqlagich bo'lgani uchun bu majburiy."""
    settings.SAQLAGICH = "catalog.storage.SoxtaSaqlagich"


@pytest.fixture
def form_darslik(db):
    return Form.objects.create(nomi_uz="Darslik", nomi_ru="Учебник", nomi_en="Textbook")


@pytest.fixture
def form_qolyozma(db):
    return Form.objects.create(nomi_uz="Qo'lyozma", nomi_ru="Рукопись", nomi_en="Manuscript")


@pytest.fixture
def subject_ichki(db):
    return Subject.objects.create(
        nomi_uz="Ichki kasalliklar", nomi_ru="Внутренние болезни", nomi_en="Internal medicine"
    )


@pytest.fixture
def subject_kardiologiya(db, subject_ichki):
    return Subject.objects.create(
        nomi_uz="Kardiologiya", nomi_ru="Кардиология", nomi_en="Cardiology", ota=subject_ichki
    )


@pytest.fixture
def subject_terapiya(db):
    return Subject.objects.create(nomi_uz="Terapiya", nomi_ru="Терапия", nomi_en="Therapy")


@pytest.fixture
def muallif(db):
    return Author.objects.create(ism="Abu Ali ibn Sino")


@pytest.fixture
def kitob(db, form_darslik, subject_kardiologiya, muallif):
    book = Book.objects.create(
        nomi="Yurak kasalliklari asoslari", turi=form_darslik, yil=2024, til="uz"
    )
    book.mualliflar.add(muallif)
    book.yonalishlar.add(subject_kardiologiya)
    return book


@pytest.fixture
def bosma_kitob(db, form_darslik, subject_kardiologiya, muallif):
    book = Book.objects.create(
        nomi="Jarrohlik darsligi",
        turi=form_darslik,
        yil=2023,
        til="uz",
        mavjudlik="bosma",
        nusxalar_soni=1,
    )
    book.mualliflar.add(muallif)
    book.yonalishlar.add(subject_kardiologiya)
    return book


@pytest.fixture
def oquvchi(db):
    return Reader.objects.create(fish="Aliyev Vali", guruh="201-A")


@pytest.fixture
def kutubxonachi(db, django_user_model):
    return django_user_model.objects.create_user(
        username="kutubxonachi", password="parol12345", is_staff=True
    )
