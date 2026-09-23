"""Cloudflare R2 (S3-mos) va testlar uchun soxta saqlagich adapteri."""

from abc import ABC, abstractmethod
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from django.conf import settings
from django.utils.module_loading import import_string


class Saqlagich(ABC):
    """Fayl saqlagich interfeysi (shartnomasi)."""

    @abstractmethod
    def oqish_url(self, key: str, muddat: int = 7200) -> str:
        """Presigned GET URL. Standart 2 soat."""
        pass

    @abstractmethod
    def yuklash_url(self, key: str, content_type: str, muddat: int = 900) -> str:
        """Presigned PUT URL. 15 daqiqa — admin yuklashi uchun yetarli."""
        pass

    @abstractmethod
    def yuklash(self, key: str, fayl, content_type: str = "application/octet-stream") -> None:
        """Fayl obyektini saqlagichga yuklash."""
        pass

    @abstractmethod
    def muqova_yuklash(self, key: str, fayl, content_type: str = "image/png") -> None:
        """Muqova faylini ochiq bucketga yuklash."""
        pass

    @abstractmethod
    def ochiq_url(self, key: str) -> str:
        """Ochiq bucket uchun oddiy URL, imzosiz."""
        pass

    @abstractmethod
    def ochirish(self, key: str) -> None:
        """Faylni bucketdan o'chirish."""
        pass

    @abstractmethod
    def mavjudmi(self, key: str) -> bool:
        """Fayl bucketda mavjudligini tekshirish."""
        pass

    @abstractmethod
    def hajm(self, key: str) -> int:
        """Fayl hajmini baytlarda qaytarish."""
        pass


class R2Saqlagich(Saqlagich):
    """Cloudflare R2 (va boshqa S3-mos) obyekt saqlagich implementatsiyasi."""

    def __init__(self):
        self.endpoint_url = getattr(settings, "S3_ENDPOINT", "")
        self.region = getattr(settings, "S3_REGION", "auto")
        self.access_key = getattr(settings, "S3_ACCESS_KEY", "")
        self.secret_key = getattr(settings, "S3_SECRET_KEY", "")
        self.bucket_kitoblar = getattr(settings, "S3_BUCKET_KITOBLAR", "kutubxona-kitoblar")
        self.bucket_muqovalar = getattr(settings, "S3_BUCKET_MUQOVALAR", "kutubxona-muqovalar")
        self.ochiq_domen = getattr(settings, "S3_OCHIQ_DOMEN", "https://muqovalar.kutubxona.uz")

        client_kwargs = {
            "service_name": "s3",
            "aws_access_key_id": self.access_key or None,
            "aws_secret_access_key": self.secret_key or None,
            "region_name": self.region or "auto",
            "config": Config(s3={"addressing_style": "path"}, signature_version="s3v4"),
        }
        if self.endpoint_url:
            client_kwargs["endpoint_url"] = self.endpoint_url

        self._client = boto3.client(**client_kwargs)

    def oqish_url(self, key: str, muddat: int = 7200) -> str:
        return self._client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self.bucket_kitoblar, "Key": key},
            ExpiresIn=muddat,
        )

    def yuklash_url(self, key: str, content_type: str, muddat: int = 900) -> str:
        return self._client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket_kitoblar,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=muddat,
        )

    def yuklash(self, key: str, fayl, content_type: str = "application/octet-stream") -> None:
        if hasattr(fayl, "seek") and (not hasattr(fayl, "seekable") or fayl.seekable()):
            fayl.seek(0)
        self._client.upload_fileobj(
            fayl,
            self.bucket_kitoblar,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    def muqova_yuklash(self, key: str, fayl, content_type: str = "image/png") -> None:
        if hasattr(fayl, "seek") and (not hasattr(fayl, "seekable") or fayl.seekable()):
            fayl.seek(0)
        self._client.upload_fileobj(
            fayl,
            self.bucket_muqovalar,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    def ochiq_url(self, key: str) -> str:
        if not key:
            return ""
        if key.startswith("http://") or key.startswith("https://"):
            return key
        return f"{self.ochiq_domen.rstrip('/')}/{key.lstrip('/')}"

    def ochirish(self, key: str) -> None:
        self._client.delete_object(Bucket=self.bucket_kitoblar, Key=key)

    def mavjudmi(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self.bucket_kitoblar, Key=key)
            return True
        except ClientError:
            return False

    def hajm(self, key: str) -> int:
        try:
            resp = self._client.head_object(Bucket=self.bucket_kitoblar, Key=key)
            return int(resp.get("ContentLength", 0))
        except ClientError:
            return 0


class SoxtaSaqlagich(Saqlagich):
    """Testlar va lokal ishlab chiqish uchun xotiradagi soxta saqlagich."""

    _global_fayllar = {}

    def __init__(self):
        self.bucket_kitoblar = getattr(settings, "S3_BUCKET_KITOBLAR", "kutubxona-kitoblar")
        self.bucket_muqovalar = getattr(settings, "S3_BUCKET_MUQOVALAR", "kutubxona-muqovalar")
        self.ochiq_domen = getattr(settings, "S3_OCHIQ_DOMEN", "https://muqovalar.kutubxona.uz")
        self._fayllar = self.__class__._global_fayllar

    def oqish_url(self, key: str, muddat: int = 7200) -> str:
        return f"https://r2.mock.local/{self.bucket_kitoblar}/{key.lstrip('/')}?muddat={muddat}"

    def yuklash_url(self, key: str, content_type: str, muddat: int = 900) -> str:
        return f"https://r2.mock.local/{self.bucket_kitoblar}/{key.lstrip('/')}?content_type={content_type}&muddat={muddat}"

    def yuklash(self, key: str, fayl, content_type: str = "application/octet-stream") -> None:
        if hasattr(fayl, "seek") and (not hasattr(fayl, "seekable") or fayl.seekable()):
            fayl.seek(0)
        self._fayllar[key] = fayl.read()

    def muqova_yuklash(self, key: str, fayl, content_type: str = "image/png") -> None:
        if hasattr(fayl, "seek") and (not hasattr(fayl, "seekable") or fayl.seekable()):
            fayl.seek(0)
        self._fayllar[key] = fayl.read()

    def ochiq_url(self, key: str) -> str:
        if not key:
            return ""
        if key.startswith("http://") or key.startswith("https://"):
            return key
        return f"{self.ochiq_domen.rstrip('/')}/{key.lstrip('/')}"

    def ochirish(self, key: str) -> None:
        self._fayllar.pop(key, None)

    def mavjudmi(self, key: str) -> bool:
        return key in self._fayllar

    def hajm(self, key: str) -> int:
        content = self._fayllar.get(key)
        return len(content) if content is not None else 0

    def fayl_qoshish(self, key: str, kontent: bytes = b"test content") -> None:
        """Testlar uchun qo'shimcha yordamchi metod."""
        self._fayllar[key] = kontent


def get_saqlagich() -> Saqlagich:
    """Konfiguratsiyada ko'rsatilgan saqlagichni qaytaradi."""
    saqlagich_sinfi_yoli = getattr(settings, "SAQLAGICH", "catalog.storage.SoxtaSaqlagich")
    sinf = import_string(saqlagich_sinfi_yoli)
    return sinf()
