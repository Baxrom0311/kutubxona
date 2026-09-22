from unittest.mock import MagicMock, patch
import pytest

from catalog.storage import SoxtaSaqlagich, R2Saqlagich, get_saqlagich


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


def test_get_saqlagich_standart():
    storage = get_saqlagich()
    assert isinstance(storage, SoxtaSaqlagich)


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
