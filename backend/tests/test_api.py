import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from catalog.models import Book, BookFile, Form, Subject

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


def test_healthz_endpoint(api_client):
    response = api_client.get("/healthz")
    assert response.status_code == 200
    assert response.content == b"ok"


def test_kitoblar_royxati_va_tillar(api_client, kitob):
    response = api_client.get("/api/kitoblar/")
    assert response.status_code == 200
    data = response.json()
    assert "soni" in data
    assert "keyingi" in data
    assert "oldingi" in data
    assert "natijalar" in data
    assert data["soni"] == 1

    item = data["natijalar"][0]
    assert item["slug"] == kitob.slug
    assert item["nomi"] == kitob.nomi
    assert item["turi"]["slug"] == "darslik"
    assert item["turi"]["nomi"]["uz"] == "Darslik"
    assert item["turi"]["nomi"]["ru"] == "Учебник"
    assert item["turi"]["nomi"]["en"] == "Textbook"
    assert item["yonalishlar"][0]["nomi"]["uz"] == "Kardiologiya"
    assert item["yonalishlar"][0]["nomi"]["ru"] == "Кардиология"
    assert item["yonalishlar"][0]["nomi"]["en"] == "Cardiology"
    assert item["mualliflar"] == ["Abu Ali ibn Sino"]
    assert "korishlar_soni" in item
    assert "muqova" in item
    assert "formatlar" in item


def test_turi_filtri(api_client, kitob, form_qolyozma, form_darslik):
    """Turi filtri to'g'ri ishlashini tekshirish."""
    kitob2 = Book.objects.create(nomi="Qo'lyozma kitobi", turi=form_qolyozma, til="uz")

    res = api_client.get("/api/kitoblar/?turi=darslik")
    assert res.json()["soni"] == 1
    assert res.json()["natijalar"][0]["slug"] == kitob.slug

    res = api_client.get("/api/kitoblar/?turi=qolyozma")
    assert res.json()["soni"] == 1
    assert res.json()["natijalar"][0]["slug"] == kitob2.slug


def test_ierarxik_yonalish_filtri(api_client, kitob, subject_ichki, subject_terapiya, form_darslik):
    kitob2 = Book.objects.create(nomi="Terapiya qo'llanmasi", turi=form_darslik, til="uz")
    kitob2.yonalishlar.add(subject_terapiya)

    # Ota yo'nalish orqali qidirganda bola dagi kitob ham chiqishi kerak
    res = api_client.get("/api/kitoblar/?yonalish=ichki-kasalliklar")
    assert res.status_code == 200
    data = res.json()
    assert data["soni"] == 1
    assert data["natijalar"][0]["slug"] == kitob.slug

    # Terapiya orqali qidirganda faqat kitob2 chiqadi
    res = api_client.get("/api/kitoblar/?yonalish=terapiya")
    assert res.status_code == 200
    assert res.json()["soni"] == 1
    assert res.json()["natijalar"][0]["slug"] == kitob2.slug


def test_qidiruv_va_filtrlar(api_client, kitob, form_qolyozma):
    Book.objects.create(nomi="Tibbiyot tarixi qo'lyozmasi", turi=form_qolyozma, yil=1990, til="ru")

    # Qidiruv q= bo'yicha (kitob nomi)
    res = api_client.get("/api/kitoblar/?q=tarixi")
    assert res.json()["soni"] == 1

    # Qidiruv q= bo'yicha (muallif ismi)
    res = api_client.get("/api/kitoblar/?q=Sino")
    assert res.json()["soni"] == 1
    assert res.json()["natijalar"][0]["slug"] == kitob.slug

    # Til bo'yicha filtr
    res = api_client.get("/api/kitoblar/?til=ru")
    assert res.json()["soni"] == 1

    # Yil oralig'i bo'yicha filtr
    res = api_client.get("/api/kitoblar/?yil_dan=2020&yil_gacha=2025")
    assert res.json()["soni"] == 1
    assert res.json()["natijalar"][0]["slug"] == kitob.slug


def test_post_put_delete_ruxsat_etilmaydi(api_client, kitob):
    res_post = api_client.post("/api/kitoblar/", {"nomi": "Test"})
    assert res_post.status_code == 405

    res_put = api_client.put(f"/api/kitoblar/{kitob.slug}/", {"nomi": "Test"})
    assert res_put.status_code == 405

    res_delete = api_client.delete(f"/api/kitoblar/{kitob.slug}/")
    assert res_delete.status_code == 405


def test_kitob_tafsiloti(api_client, kitob):
    fayl_pdf = BookFile.objects.create(
        kitob=kitob, storage_key="kitoblar/2024/yurak.pdf",
        format="pdf", hajm=18432000, sahifalar_soni=340,
    )
    fayl_epub = BookFile.objects.create(
        kitob=kitob, storage_key="kitoblar/2024/yurak.epub",
        format="epub", hajm=2100000,
    )

    res = api_client.get(f"/api/kitoblar/{kitob.slug}/")
    assert res.status_code == 200
    data = res.json()
    assert "tavsif" in data
    assert "nashriyot" in data
    assert "qoshilgan_sana" in data
    assert len(data["fayllar"]) == 2
    assert data["fayllar"][0]["id"] == fayl_pdf.id
    assert data["fayllar"][0]["format"] == "pdf"
    assert data["fayllar"][0]["hajm"] == 18432000
    assert data["fayllar"][0]["sahifalar_soni"] == 340
    assert data["fayllar"][1]["id"] == fayl_epub.id
    assert data["fayllar"][1]["sahifalar_soni"] is None
    assert data["formatlar"] == ["pdf", "epub"]


def test_oqish_url_va_korishlar_oshadi(api_client, kitob):
    fayl = BookFile.objects.create(
        kitob=kitob, storage_key="kitoblar/2024/yurak.pdf",
        format="pdf", hajm=1048576, sahifalar_soni=120,
    )

    boshlangich = kitob.korishlar_soni
    res = api_client.get(f"/api/kitoblar/{kitob.slug}/oqish/{fayl.id}/")
    assert res.status_code == 200
    data = res.json()
    assert "url" in data
    assert "amal_qiladi" in data
    assert data["format"] == "pdf"

    kitob.refresh_from_db()
    assert kitob.korishlar_soni == boshlangich + 1


def test_oqish_mavjud_bolmagan_fayl(api_client, kitob):
    """Mavjud bo'lmagan fayl ID bilan so'rov yuborilsa 404 qaytishi kerak."""
    res = api_client.get(f"/api/kitoblar/{kitob.slug}/oqish/99999/")
    assert res.status_code == 404
    assert "xato" in res.json()


def test_turlar_api(api_client, kitob):
    res = api_client.get("/api/turlar/")
    assert res.status_code == 200
    turlar = res.json()
    assert len(turlar) >= 1
    tur = turlar[0]
    assert "slug" in tur
    assert "nomi" in tur
    assert "kitoblar_soni" in tur
    assert tur["nomi"]["uz"]
    assert tur["nomi"]["ru"]
    assert tur["nomi"]["en"]
    assert tur["kitoblar_soni"] >= 1


def test_yonalishlar_ierarxik_api(api_client, kitob, subject_ichki, subject_kardiologiya):
    res = api_client.get("/api/yonalishlar/")
    assert res.status_code == 200
    yonalishlar = res.json()
    assert len(yonalishlar) >= 1

    ichki = next(y for y in yonalishlar if y["slug"] == "ichki-kasalliklar")
    assert ichki["kitoblar_soni"] == 1  # bola orqali
    assert "nomi" in ichki
    assert ichki["nomi"]["uz"] == "Ichki kasalliklar"
    assert len(ichki["bolalar"]) == 1
    assert ichki["bolalar"][0]["slug"] == "kardiologiya"
    assert ichki["bolalar"][0]["kitoblar_soni"] == 1
    assert ichki["bolalar"][0]["bolalar"] == []


def test_cors_ruxsat_berilgan_origin(api_client):
    res = api_client.get(
        "/api/kitoblar/",
        HTTP_ORIGIN="http://localhost:3000",
    )
    assert res.status_code == 200
    assert res.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"


def test_cors_begona_origin_bloklash(api_client):
    res = api_client.get(
        "/api/kitoblar/",
        HTTP_ORIGIN="http://hacker.com",
    )
    assert "Access-Control-Allow-Origin" not in res.headers


def test_sahifalash_24_ta(api_client, form_darslik):
    books = [
        Book(nomi=f"Kitob {i}", slug=f"kitob-{i}", turi=form_darslik, til="uz")
        for i in range(1, 26)
    ]
    Book.objects.bulk_create(books)

    res = api_client.get("/api/kitoblar/")
    assert res.status_code == 200
    data = res.json()
    assert data["soni"] == 25
    assert len(data["natijalar"]) == 24
    assert data["keyingi"] is not None
    assert data["oldingi"] is None

    res2 = api_client.get("/api/kitoblar/?sahifa=2")
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["natijalar"]) == 1
    assert data2["keyingi"] is None
    assert data2["oldingi"] is not None
