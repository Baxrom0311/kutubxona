from unittest.mock import MagicMock, patch
import pytest

from catalog.storage import DiskSaqlagich, SoxtaSaqlagich, R2Saqlagich, get_saqlagich


def test_soxta_saqlagich_oqish_url():
    storage = SoxtaSaqlagich()
    url = storage.oqish_url("kitoblar/2026/anatomiya.pdf", muddat=3600)
    assert "kitoblar/2026/anatomiya.pdf" in url
    assert "muddat=3600" in url


def test_soxta_saqlagich_yuklash_url():
    storage = SoxtaSaqlagich()
    url = storage.yuklash_url("kitoblar/2026/yangi.pdf", content_type="application/pdf", muddat=600)
    assert "content_type=application/pdf" in url
    assert "muddat=600" in url


def test_soxta_saqlagich_ochiq_url():
    storage = SoxtaSaqlagich()
    url = storage.ochiq_url("muqovalar/2026/anatomiya.webp")
    assert url.startswith("https://muqovalar.kutubxona.uz/")
    assert url.endswith("muqovalar/2026/anatomiya.webp")


def test_soxta_saqlagich_fayl_amallari():
    storage = SoxtaSaqlagich()
    key = "kitoblar/test.pdf"

    assert not storage.mavjudmi(key)
    assert storage.hajm(key) == 0

    storage.fayl_qoshish(key, b"12345")
    assert storage.mavjudmi(key)
    assert storage.hajm(key) == 5

    storage.ochirish(key)
    assert not storage.mavjudmi(key)


def test_soxta_saqlagich_yuklash_fayl_obyektidan():
    from django.core.files.uploadedfile import SimpleUploadedFile

    storage = SoxtaSaqlagich()
    key = "kitoblar/upload.pdf"
    uploaded = SimpleUploadedFile("upload.pdf", b"%PDF-1.4")

    storage.yuklash(key, uploaded, content_type="application/pdf")

    assert storage.mavjudmi(key)
    assert storage.hajm(key) == 8


def test_soxta_saqlagich_muqova_yuklash():
    from django.core.files.uploadedfile import SimpleUploadedFile

    storage = SoxtaSaqlagich()
    key = "covers/demo.png"
    uploaded = SimpleUploadedFile("demo.png", b"png")

    storage.muqova_yuklash(key, uploaded, content_type="image/png")

    assert storage.mavjudmi(key)
    assert storage.ochiq_url(key).endswith(key)


def test_get_saqlagich_sozlamadan_olinadi(settings):
    settings.SAQLAGICH = "catalog.storage.SoxtaSaqlagich"
    assert isinstance(get_saqlagich(), SoxtaSaqlagich)

    settings.SAQLAGICH = "catalog.storage.DiskSaqlagich"
    assert isinstance(get_saqlagich(), DiskSaqlagich)


@patch("boto3.client")
def test_r2_saqlagich_boto3_chaqiruvlari(mock_boto_client):
    mock_s3 = MagicMock()
    mock_boto_client.return_value = mock_s3
    mock_s3.generate_presigned_url.return_value = "https://r2.example.com/presigned"

    r2 = R2Saqlagich()
    url = r2.oqish_url("kitoblar/demo.pdf", muddat=7200)

    assert url == "https://r2.example.com/presigned"
    mock_s3.generate_presigned_url.assert_called_once_with(
        ClientMethod="get_object",
        Params={"Bucket": r2.bucket_kitoblar, "Key": "kitoblar/demo.pdf"},
        ExpiresIn=7200,
    )


@patch("boto3.client")
def test_r2_saqlagich_yuklash_upload_fileobj_ishlatadi(mock_boto_client):
    from django.core.files.uploadedfile import SimpleUploadedFile

    mock_s3 = MagicMock()
    mock_boto_client.return_value = mock_s3

    r2 = R2Saqlagich()
    uploaded = SimpleUploadedFile("demo.pdf", b"%PDF-1.4")
    r2.yuklash("kitoblar/demo.pdf", uploaded, content_type="application/pdf")

    mock_s3.upload_fileobj.assert_called_once()
    args, kwargs = mock_s3.upload_fileobj.call_args
    assert args[1] == r2.bucket_kitoblar
    assert args[2] == "kitoblar/demo.pdf"
    assert kwargs["ExtraArgs"] == {"ContentType": "application/pdf"}


@patch("boto3.client")
def test_r2_saqlagich_muqova_yuklash_muqova_bucketga(mock_boto_client):
    from django.core.files.uploadedfile import SimpleUploadedFile

    mock_s3 = MagicMock()
    mock_boto_client.return_value = mock_s3

    r2 = R2Saqlagich()
    uploaded = SimpleUploadedFile("demo.png", b"png")
    r2.muqova_yuklash("covers/demo.png", uploaded, content_type="image/png")

    mock_s3.upload_fileobj.assert_called_once()
    args, kwargs = mock_s3.upload_fileobj.call_args
    assert args[1] == r2.bucket_muqovalar
    assert args[2] == "covers/demo.png"
    assert kwargs["ExtraArgs"] == {"ContentType": "image/png"}


def test_disk_saqlagich_yozish_oqish_ochirish(tmp_path, settings):
    """Disk saqlagichi faylni MEDIA_ROOT ichiga yozadi va to'liq URL beradi."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    settings.MEDIA_ROOT = tmp_path
    settings.MEDIA_URL = "media/"
    settings.MEDIA_ASOS_URL = "http://localhost:8001"

    storage = DiskSaqlagich()
    key = "muqovalar/anatomiya-ab12cd34.png"
    storage.muqova_yuklash(key, SimpleUploadedFile("a.png", b"rasm"), content_type="image/png")

    assert (tmp_path / key).read_bytes() == b"rasm"
    assert storage.mavjudmi(key)
    assert storage.hajm(key) == 4
    assert storage.ochiq_url(key) == f"http://localhost:8001/media/{key}"
    assert storage.oqish_url(key) == f"http://localhost:8001/media/{key}"

    storage.ochirish(key)
    assert not storage.mavjudmi(key)


def test_disk_saqlagich_katalogdan_chiqishni_rad_etadi(tmp_path, settings):
    """`..` bilan MEDIA_ROOT tashqarisiga yozishga urinish to'xtatilsin."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    settings.MEDIA_ROOT = tmp_path
    storage = DiskSaqlagich()

    with pytest.raises(ValueError):
        storage.yuklash("../parol.txt", SimpleUploadedFile("x", b"x"))

    # mavjudmi/hajm/ochirish xato ko'tarmasdan xavfsiz qaytishi kerak
    assert storage.mavjudmi("../parol.txt") is False
    assert storage.hajm("../parol.txt") == 0
    storage.ochirish("../parol.txt")


def test_disk_saqlagich_tashqi_url_ozgarmaydi(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    storage = DiskSaqlagich()
    assert storage.ochiq_url("https://cdn.example.com/a.png") == "https://cdn.example.com/a.png"
    assert storage.ochiq_url("") == ""
