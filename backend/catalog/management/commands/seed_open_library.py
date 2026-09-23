"""Seed the catalog with openly licensed Open RN nursing textbooks."""

from dataclasses import dataclass
from pathlib import Path
import tempfile

import requests
from django.core.management.base import BaseCommand, CommandError

from catalog.models import Author, Book, BookFile, Form, Subject
from catalog.storage import get_saqlagich


AUTHOR_NAME = "Open Resources for Nursing (Open RN)"
LICENSE_NOTE = (
    "Manba: NCBI Bookshelf / Open Resources for Nursing (Open RN). "
    "Litsenziya: Creative Commons Attribution 4.0 International (CC BY 4.0). "
    "Ushbu material ochiq ta'lim resursi sifatida katalogga kiritildi."
)


@dataclass(frozen=True)
class FormSeed:
    nomi_uz: str
    nomi_ru: str
    nomi_en: str
    slug: str


@dataclass(frozen=True)
class SubjectSeed:
    nomi_uz: str
    nomi_ru: str
    nomi_en: str
    slug: str


@dataclass(frozen=True)
class BookSeed:
    nomi: str
    slug: str
    tavsif: str
    yil: int
    form_slug: str
    subject_slugs: tuple[str, ...]
    pdf_url: str


FORMS = [
    FormSeed("Darslik", "Учебник", "Textbook", "darslik"),
    FormSeed("Ochiq ta'lim resursi", "Открытый образовательный ресурс", "Open educational resource", "ochiq-talim-resursi"),
    FormSeed("Amaliy ko'nikmalar qo'llanmasi", "Практическое пособие", "Practical skills guide", "amaliy-konikmalar"),
    FormSeed("Farmakologiya qo'llanmasi", "Пособие по фармакологии", "Pharmacology guide", "farmakologiya-qollanmasi"),
    FormSeed("Klinik parvarish qo'llanmasi", "Руководство по клиническому уходу", "Clinical care guide", "klinik-parvarish"),
    FormSeed("Terminologiya lug'ati", "Медицинская терминология", "Medical terminology", "terminologiya"),
    FormSeed("Sog'liqni targ'ib qilish", "Укрепление здоровья", "Health promotion", "sogliqni-targib"),
    FormSeed("Menejment va etika", "Менеджмент и этика", "Management and ethics", "menejment-etika"),
    FormSeed("Ruhiy salomatlik", "Психическое здоровье", "Mental health", "ruhiy-salomatlik"),
    FormSeed("Yordamchi hamshiralik", "Помощник медсестры", "Nursing assistant", "yordamchi-hamshiralik"),
]

SUBJECTS = [
    SubjectSeed("Hamshiralik ishi asoslari", "Основы сестринского дела", "Nursing fundamentals", "hamshiralik-ishi-asoslari"),
    SubjectSeed("Klinik ko'nikmalar", "Клинические навыки", "Clinical skills", "klinik-konikmalar"),
    SubjectSeed("Kengaytirilgan ko'nikmalar", "Расширенные навыки", "Advanced skills", "kengaytirilgan-konikmalar"),
    SubjectSeed("Farmakologiya", "Фармакология", "Pharmacology", "farmakologiya"),
    SubjectSeed("Sog'liqni targ'ib qilish", "Укрепление здоровья", "Health promotion", "sogliqni-targib-qilish"),
    SubjectSeed("Kasallik va sog'liq buzilishlari", "Нарушения здоровья", "Health alterations", "sogliq-buzilishlari"),
    SubjectSeed("Ruhiy salomatlik va jamoa", "Психическое здоровье и сообщество", "Mental health and community", "ruhiy-salomatlik-va-jamoa"),
    SubjectSeed("Menejment va professional amaliyot", "Менеджмент и профессиональная практика", "Management and professional practice", "menejment-professional-amaliyot"),
    SubjectSeed("Tibbiy terminologiya", "Медицинская терминология", "Medical terminology", "tibbiy-terminologiya"),
    SubjectSeed("Yordamchi parvarish", "Вспомогательный уход", "Assistant care", "yordamchi-parvarish"),
]

BOOKS = [
    BookSeed(
        "Nursing Fundamentals, 2nd edition",
        "nursing-fundamentals-2e",
        "Entry-level nursing students uchun parvarish, muloqot, xavfsizlik, infeksiya nazorati, ovqatlanish, suyuqlik-elektrolitlar va boshqa asosiy hamshiralik mavzulari.",
        2024,
        "darslik",
        ("hamshiralik-ishi-asoslari",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK610815/pdf/Bookshelf_NBK610815.pdf",
    ),
    BookSeed(
        "Nursing Pharmacology, 2nd edition",
        "nursing-pharmacology-2e",
        "Dori vositalarini xavfsiz qo'llash, farmakokinetika, farmakodinamika va asosiy dori guruhlari bo'yicha OpenRN darsligi.",
        2023,
        "farmakologiya-qollanmasi",
        ("farmakologiya",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK595000/pdf/Bookshelf_NBK595000.pdf",
    ),
    BookSeed(
        "Nursing Skills, 2nd edition",
        "nursing-skills-2e",
        "Qon bosimi, aseptika, baholash, kislorod terapiyasi, dori yuborish, yara parvarishi va IV terapiya kabi amaliy ko'nikmalar.",
        2023,
        "amaliy-konikmalar",
        ("klinik-konikmalar",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK596735/pdf/Bookshelf_NBK596735.pdf",
    ),
    BookSeed(
        "Nursing Advanced Skills",
        "nursing-advanced-skills",
        "IV infuziya, qon komponentlari, markaziy kateterlar, EKG talqini, ko'krak drenaji va enteral naychalar kabi kengaytirilgan hamshiralik ko'nikmalari.",
        2023,
        "amaliy-konikmalar",
        ("kengaytirilgan-konikmalar", "klinik-konikmalar"),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK594492/pdf/Bookshelf_NBK594492.pdf",
    ),
    BookSeed(
        "Nursing Health Promotion",
        "nursing-health-promotion",
        "Hayot davomida shaxs va oilalar salomatligini targ'ib qilish, profilaktika va jamoa bilan ishlash mavzulari.",
        2025,
        "sogliqni-targib",
        ("sogliqni-targib-qilish",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK615319/pdf/Bookshelf_NBK615319.pdf",
    ),
    BookSeed(
        "Nursing Management and Professional Concepts, 2nd edition",
        "nursing-management-professional-concepts-2e",
        "Hamshiralik menejmenti, ustuvorlik, delegatsiya, etika, huquqiy masalalar, sifat va evidence-based practice bo'yicha darslik.",
        2024,
        "menejment-etika",
        ("menejment-professional-amaliyot",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK610445/pdf/Bookshelf_NBK610445.pdf",
    ),
    BookSeed(
        "Nursing: Mental Health and Community Concepts, 2nd edition",
        "nursing-mental-health-community-concepts-2e",
        "Ruhiy salomatlik, terapevtik muloqot, stress, psixotrop dorilar, jamoa salomatligi va zaif guruhlar bo'yicha OpenRN resursi.",
        2025,
        "ruhiy-salomatlik",
        ("ruhiy-salomatlik-va-jamoa",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK616982/pdf/Bookshelf_NBK616982.pdf",
    ),
    BookSeed(
        "Medical Terminology, 2nd edition",
        "medical-terminology-2e",
        "Tibbiy atamalar, prefiks/suffiks/ildizlar va tana tizimlari bo'yicha diagnostik, terapevtik va simptomatik terminologiya.",
        2024,
        "terminologiya",
        ("tibbiy-terminologiya",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK607454/pdf/Bookshelf_NBK607454.pdf",
    ),
    BookSeed(
        "Health Alterations",
        "health-alterations",
        "Perioperativ parvarish, gematologik, yurak-qon tomir, respirator, endokrin, buyrak, nevrologik va GI o'zgarishlar.",
        2024,
        "klinik-parvarish",
        ("sogliq-buzilishlari",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK613078/pdf/Bookshelf_NBK613078.pdf",
    ),
    BookSeed(
        "Nursing Assistant",
        "nursing-assistant",
        "Yordamchi hamshira uchun professional muloqot, xavfsizlik, infeksiya nazorati, shaxsiy parvarish va mobilizatsiya bo'yicha OER.",
        2022,
        "yordamchi-hamshiralik",
        ("yordamchi-parvarish",),
        "https://www.ncbi.nlm.nih.gov/sites/books/NBK599384/pdf/Bookshelf_NBK599384.pdf",
    ),
]


class Command(BaseCommand):
    help = "Seed forms, subjects, and 10 openly licensed Open RN books with PDFs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--upload-pdfs",
            action="store_true",
            help="Download PDFs from NCBI and upload them to the configured storage.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be created without writing to the database or storage.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        upload_pdfs = options["upload_pdfs"]

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: database and storage will not be changed."))

        author = None if dry_run else self._seed_author()
        form_map = self._seed_forms(dry_run)
        subject_map = self._seed_subjects(dry_run)
        storage = None if dry_run or not upload_pdfs else get_saqlagich()

        for seed in BOOKS:
            if dry_run:
                self.stdout.write(f"Would seed book: {seed.nomi}")
                continue

            book = self._seed_book(seed, author, form_map, subject_map)
            if upload_pdfs:
                self._ensure_pdf(book, seed, storage)

        self.stdout.write(self.style.SUCCESS("Open library seed complete."))

    def _seed_author(self):
        author, created = Author.objects.get_or_create(
            ism=AUTHOR_NAME,
            defaults={
                "tavsif": "OpenRN ochiq hamshiralik ta'lim resurslari mualliflari va muharrirlari.",
            },
        )
        self.stdout.write(("Created" if created else "Exists") + f" author: {author.ism}")
        return author

    def _seed_forms(self, dry_run):
        form_map = {}
        for index, seed in enumerate(FORMS):
            if dry_run:
                self.stdout.write(f"Would seed form: {seed.nomi_uz}")
                continue
            form, created = Form.objects.update_or_create(
                slug=seed.slug,
                defaults={
                    "nomi_uz": seed.nomi_uz,
                    "nomi_ru": seed.nomi_ru,
                    "nomi_en": seed.nomi_en,
                    "tartib": index,
                },
            )
            form_map[seed.slug] = form
            self.stdout.write(("Created" if created else "Updated") + f" form: {form.nomi_uz}")
        return form_map

    def _seed_subjects(self, dry_run):
        subject_map = {}
        for index, seed in enumerate(SUBJECTS):
            if dry_run:
                self.stdout.write(f"Would seed subject: {seed.nomi_uz}")
                continue
            subject, created = Subject.objects.update_or_create(
                slug=seed.slug,
                defaults={
                    "nomi_uz": seed.nomi_uz,
                    "nomi_ru": seed.nomi_ru,
                    "nomi_en": seed.nomi_en,
                    "tartib": index,
                },
            )
            subject_map[seed.slug] = subject
            self.stdout.write(("Created" if created else "Updated") + f" subject: {subject.nomi_uz}")
        return subject_map

    def _seed_book(self, seed, author, form_map, subject_map):
        form = form_map[seed.form_slug]
        book, created = Book.objects.update_or_create(
            slug=seed.slug,
            defaults={
                "nomi": seed.nomi,
                "tavsif": f"{seed.tavsif}\n\n{LICENSE_NOTE}",
                "nashriyot": "NCBI Bookshelf / Chippewa Valley Technical College",
                "yil": seed.yil,
                "til": "en",
                "turi": form,
            },
        )
        book.mualliflar.set([author])
        book.yonalishlar.set([subject_map[slug] for slug in seed.subject_slugs])
        self.stdout.write(("Created" if created else "Updated") + f" book: {book.nomi}")
        return book

    def _ensure_pdf(self, book, seed, storage):
        existing = book.fayllar.filter(format="pdf").first()
        if existing and existing.storage_key and storage.mavjudmi(existing.storage_key):
            self.stdout.write(f"PDF exists, skipping upload: {book.nomi}")
            return

        key = f"kitoblar/{seed.yil}/{book.slug}/{Path(seed.pdf_url).name}"
        self.stdout.write(f"Downloading PDF: {book.nomi}")
        try:
            with requests.get(
                seed.pdf_url,
                stream=True,
                timeout=120,
                headers={
                    "User-Agent": "KutubxonaOpenLibrarySeeder/1.0 (+https://kutubxona-three.vercel.app)",
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
