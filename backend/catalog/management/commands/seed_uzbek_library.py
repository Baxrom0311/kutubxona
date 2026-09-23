"""Seed the catalog with Uzbek medical and nursing books from ZiyoNET."""

from dataclasses import dataclass
from pathlib import Path
import tempfile

import requests
from django.core.management.base import BaseCommand, CommandError

from catalog.models import Author, Book, BookFile, Form, Subject
from catalog.storage import get_saqlagich


SOURCE_NOTE = (
    "Manba: ZiyoNET elektron kutubxonasi. "
    "Materialdan foydalanilganda www.ziyonet.uz havolasini ko'rsatish tavsiya etiladi."
)


@dataclass(frozen=True)
class UzbekBookSeed:
    nomi: str
    slug: str
    authors: tuple[str, ...]
    tavsif: str
    yil: int | None
    form_slug: str
    form_name: str
    subject_slug: str
    subject_name: str
    pdf_url: str


BOOKS = [
    UzbekBookSeed(
        "Hamshiralik ishi",
        "hamshiralik-ishi-xujamberdiyev",
        ("M.A. Xujamberdiyev", "N.S. Mamasoliyev", "R.U. Muhitdinov"),
        "Hamshiralik ishi bo'yicha muolajalarni bajarish texnikalari va amaliy ko'nikmalarni o'rganishga bag'ishlangan o'quv qo'llanma.",
        None,
        "oquv-qollanma",
        "O'quv qo'llanma",
        "hamshiralik-ishi-asoslari",
        "Hamshiralik ishi asoslari",
        "https://api.ziyonet.uz/uploads/books/459675/5af4081aca78f.pdf",
    ),
    UzbekBookSeed(
        "Pediatriyada hamshiralik ishi",
        "pediatriyada-hamshiralik-ishi",
        ("Q. Inomov", "M. G'aniyeva"),
        "Bolalar anatomofiziologik xususiyatlari, pediatrik tekshiruv, parvarish va shoshilinch yordam ko'nikmalari bo'yicha qo'llanma.",
        2017,
        "oquv-qollanma",
        "O'quv qo'llanma",
        "pediatriya-parvarishi",
        "Pediatriya parvarishi",
        "https://api.ziyonet.uz/uploads/books/555273/5a7063675812d.pdf",
    ),
    UzbekBookSeed(
        "Bolalarda hamshiralik parvarishi",
        "bolalarda-hamshiralik-parvarishi",
        ("M.F. Ziyayeva", "O.Z. Rizayeva"),
        "Tibbiyot kollejlari hamshiralik ishi o'quvchilari uchun bolalarda hamshiralik parvarishi, rivojlanish va kasalliklarda parvarish mavzulari.",
        2016,
        "darslik",
        "Darslik",
        "pediatriya-parvarishi",
        "Pediatriya parvarishi",
        "https://api.ziyonet.uz/uploads/books/719417/58a156fd4c04c.pdf",
    ),
    UzbekBookSeed(
        "Hamshiralik ishida shoshilinch holatlar",
        "hamshiralik-ishida-shoshilinch-holatlar",
        ("A.M. Sharipov", "Sh.T. Ismailova", "Sh.A. Karieva"),
        "Favqulodda vaziyatlar va shoshilinch tibbiy yordam sharoitida hamshiralik yondashuvlari bo'yicha o'quv qo'llanma.",
        2018,
        "oquv-qollanma",
        "O'quv qo'llanma",
        "shoshilinch-tibbiy-yordam",
        "Shoshilinch tibbiy yordam",
        "https://api.ziyonet.uz/uploads/books/1248420/60645ab60451b.pdf",
    ),
    UzbekBookSeed(
        "Umumiy farmakologiya va retseptura",
        "umumiy-farmakologiya-va-retseptura",
        ("F.Sh. Toshmuhamedova", "H.U. Aliyev", "R.Z. Nizomov"),
        "Farmakologiya tarixi, dori shakllari, retsept yozish namunalari va dori guruhlari haqida o'quv qo'llanma.",
        2013,
        "oquv-qollanma",
        "O'quv qo'llanma",
        "farmakologiya",
        "Farmakologiya",
        "https://api.ziyonet.uz/uploads/books/26622/55d5d7d4c9a35.pdf",
    ),
    UzbekBookSeed(
        "Farmakologiya asoslari",
        "farmakologiya-asoslari",
        ("N.A. Musayeva", "M.N. Maxsumov", "Sh.Sh. Talipova"),
        "Farmakologiyaning umumiy va xususiy qismlari, dori vositalarining asosiy guruhlari bo'yicha o'quv qo'llanma.",
        2016,
        "oquv-qollanma",
        "O'quv qo'llanma",
        "farmakologiya",
        "Farmakologiya",
        "https://api.ziyonet.uz/uploads/books/696768/588f02c4486d7.pdf",
    ),
    UzbekBookSeed(
        "Fiziologiya odam anatomiyasi asoslari bilan",
        "fiziologiya-odam-anatomiyasi-asoslari-bilan",
        ("G.N. Sultonov", "V.V. Serebryakov", "G.I. Namozova", "R.I. Yusupova", "I.N. Turaxanov", "M.A. Raxmonberdiyev"),
        "Farmatsevtika fakultetlari uchun odam anatomiyasi va fiziologiyasini integratsiyalashgan holda o'rgatuvchi darslik.",
        2026,
        "darslik",
        "Darslik",
        "anatomiya-fiziologiya",
        "Anatomiya va fiziologiya",
        "https://api.ziyonet.uz/uploads/books/10007709/lCwnthI4n5Tl90d.pdf",
    ),
    UzbekBookSeed(
        "Anatomiya, fiziologiya va patologiya",
        "anatomiya-fiziologiya-va-patologiya",
        ("ZiyoNET mualliflari",),
        "Anatomiya, fiziologiya va patologiya fani dasturi asosida tayyorlangan tibbiy ta'lim adabiyoti.",
        None,
        "darslik",
        "Darslik",
        "anatomiya-fiziologiya",
        "Anatomiya va fiziologiya",
        "https://api.ziyonet.uz/uploads/books/719417/589aecfd181ca.pdf",
    ),
    UzbekBookSeed(
        "Odam anatomiyasi va fiziologiyasi",
        "odam-anatomiyasi-va-fiziologiyasi-mamatqulov",
        ("D.A. Mamatqulov",),
        "Odam tanasi tuzilishi, hujayra, to'qima, a'zolar joylashuvi, yosh xususiyatlari va tashqi muhit ta'siri haqida darslik.",
        2021,
        "darslik",
        "Darslik",
        "anatomiya-fiziologiya",
        "Anatomiya va fiziologiya",
        "https://api.ziyonet.uz/uploads/books/1248420/5ce52ddb9372e.pdf",
    ),
    UzbekBookSeed(
        "Jamoada hamshiralik ishi",
        "jamoada-hamshiralik-ishi",
        ("B.M. Mamatkulov", "X.E. Rustamova"),
        "Aholi salomatligini o'rganish, sanitariya-statistik tadqiqot usullari va jamoada hamshiralik faoliyati bo'yicha darslik.",
        2016,
        "darslik",
        "Darslik",
        "jamoada-hamshiralik",
        "Jamoada hamshiralik ishi",
        "https://api.ziyonet.uz/uploads/books/1248420/5d1478eea0acc.pdf",
    ),
]


class Command(BaseCommand):
    help = "Seed Uzbek medical and nursing books from ZiyoNET."

    def add_arguments(self, parser):
        parser.add_argument("--upload-pdfs", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        upload_pdfs = options["upload_pdfs"]
        storage = None if dry_run or not upload_pdfs else get_saqlagich()

        for seed in BOOKS:
            if dry_run:
                self.stdout.write(f"Would seed Uzbek book: {seed.nomi}")
                continue

            form = self._form(seed)
            subject = self._subject(seed)
            authors = [self._author(name) for name in seed.authors]
            book = self._book(seed, form, subject, authors)
            if upload_pdfs:
                self._ensure_pdf(book, seed, storage)

        self.stdout.write(self.style.SUCCESS("Uzbek library seed complete."))

    def _form(self, seed):
        translations = {
            "darslik": ("Darslik", "Учебник", "Textbook"),
            "oquv-qollanma": ("O'quv qo'llanma", "Учебное пособие", "Study guide"),
        }
        nomi_uz, nomi_ru, nomi_en = translations.get(
            seed.form_slug,
            (seed.form_name, seed.form_name, seed.form_name),
        )
        form, _ = Form.objects.update_or_create(
            slug=seed.form_slug,
            defaults={"nomi_uz": nomi_uz, "nomi_ru": nomi_ru, "nomi_en": nomi_en},
        )
        return form

    def _subject(self, seed):
        subject, _ = Subject.objects.update_or_create(
            slug=seed.subject_slug,
            defaults={"nomi_uz": seed.subject_name, "nomi_ru": seed.subject_name, "nomi_en": seed.subject_name},
        )
        return subject

    def _author(self, name):
        author, _ = Author.objects.get_or_create(ism=name)
        return author

    def _book(self, seed, form, subject, authors):
        book, created = Book.objects.update_or_create(
            slug=seed.slug,
            defaults={
                "nomi": seed.nomi,
                "tavsif": f"{seed.tavsif}\n\n{SOURCE_NOTE}",
                "nashriyot": "ZiyoNET elektron kutubxonasi",
                "yil": seed.yil,
                "til": "uz",
                "turi": form,
            },
        )
        book.mualliflar.set(authors)
        book.yonalishlar.set([subject])
        self.stdout.write(("Created" if created else "Updated") + f" Uzbek book: {book.nomi}")
        return book

    def _ensure_pdf(self, book, seed, storage):
        existing = book.fayllar.filter(format="pdf").first()
        if existing and existing.storage_key and storage.mavjudmi(existing.storage_key):
            self.stdout.write(f"PDF exists, skipping upload: {book.nomi}")
            return

        key = f"kitoblar/{seed.yil or 'unknown'}/{book.slug}/{Path(seed.pdf_url).name}"
        self.stdout.write(f"Downloading PDF: {book.nomi}")
        try:
            with requests.get(
                seed.pdf_url,
                stream=True,
                timeout=120,
                headers={
                    "User-Agent": "KutubxonaZiyoNETSeeder/1.0 (+https://kutubxona-three.vercel.app)",
                    "Accept": "application/pdf,*/*",
                },
            ) as response:
                response.raise_for_status()
                size = int(response.headers.get("content-length") or 0)
                with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp:
                    downloaded = 0
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if not chunk:
                            continue
                        tmp.write(chunk)
                        downloaded += len(chunk)
                    tmp.flush()
                    tmp.seek(0)
                    size = size or downloaded
                    self.stdout.write(f"Uploading to storage: {key} ({size} bytes)")
                    storage.yuklash(key, tmp, content_type="application/pdf")
        except requests.RequestException as exc:
            raise CommandError(f"PDF download failed for {book.nomi}: {exc}") from exc

        if existing:
            existing.storage_key = key
            existing.hajm = size
            existing.save(update_fields=["storage_key", "hajm"])
        else:
            BookFile.objects.create(
                kitob=book,
                storage_key=key,
                format="pdf",
                hajm=size,
                tartib=0,
            )
