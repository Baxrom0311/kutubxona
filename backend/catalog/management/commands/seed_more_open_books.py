"""Seed the catalog with additional openly licensed OpenStax textbooks."""

from dataclasses import dataclass
from pathlib import Path
import tempfile

import requests
from django.core.management.base import BaseCommand, CommandError

from catalog.models import Author, Book, BookFile, Form, Subject
from catalog.storage import get_saqlagich


AUTHOR_NAME = "OpenStax"
LICENSE_NOTE = (
    "Manba: OpenStax, Rice University. "
    "OpenStax darsliklari bepul PDF sifatida taqdim etiladi va Creative Commons litsenziyalari asosida tarqatiladi. "
    "Attribution: Access for free at openstax.org."
)


@dataclass(frozen=True)
class BookSeed:
    nomi: str
    slug: str
    tavsif: str
    yil: int | None
    form_slug: str
    form_name: str
    subject_slug: str
    subject_name: str
    pdf_url: str


BOOKS = [
    BookSeed(
        "Clinical Nursing Skills",
        "openstax-clinical-nursing-skills",
        "Hamshiralik amaliyoti uchun klinik ko'nikmalar, xavfsizlik, bemor bilan ishlash va protseduralar bo'yicha OpenStax darsligi.",
        2025,
        "amaliy-konikmalar",
        "Amaliy ko'nikmalar qo'llanmasi",
        "klinik-konikmalar",
        "Klinik ko'nikmalar",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Clinical-Nursing-Skills-WEB.pdf",
    ),
    BookSeed(
        "Fundamentals of Nursing",
        "openstax-fundamentals-of-nursing",
        "Hamshiralik asoslari, bemor xavfsizligi, parvarish jarayoni, muloqot va professional amaliyot bo'yicha kirish darsligi.",
        2023,
        "darslik",
        "Darslik",
        "hamshiralik-ishi-asoslari",
        "Hamshiralik ishi asoslari",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Fundamentals_of_Nursing_-_WEB.pdf",
    ),
    BookSeed(
        "Maternal-Newborn Nursing",
        "openstax-maternal-newborn-nursing",
        "Homiladorlik, tug'ruq, tug'ruqdan keyingi davr va yangi tug'ilgan chaqaloq parvarishi bo'yicha hamshiralik darsligi.",
        2024,
        "darslik",
        "Darslik",
        "pediatriya-parvarishi",
        "Pediatriya va neonatal parvarish",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Maternal-Newborn_Nursing-WEB.pdf",
    ),
    BookSeed(
        "Medical-Surgical Nursing",
        "openstax-medical-surgical-nursing",
        "Tibbiy-xirurgik bemorlarni baholash, parvarish rejalari, klinik qaror qabul qilish va xavfsiz amaliyot bo'yicha qo'llanma.",
        2025,
        "klinik-parvarish",
        "Klinik parvarish qo'llanmasi",
        "sogliq-buzilishlari",
        "Kasallik va sog'liq buzilishlari",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Medical-Surgical_Nursing-WEB.pdf",
    ),
    BookSeed(
        "Nutrition for Nurses",
        "openstax-nutrition-for-nurses",
        "Hamshiralar uchun ovqatlanish, metabolizm, parhez, klinik parvarish va turli bemor guruhlarida nutrition yondashuvlari.",
        2024,
        "klinik-parvarish",
        "Klinik parvarish qo'llanmasi",
        "ovqatlanish-parvarishi",
        "Ovqatlanish va parhez parvarishi",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Nutrition_for_Nurses-WEB.pdf",
    ),
    BookSeed(
        "Pharmacology for Nurses",
        "openstax-pharmacology-for-nurses",
        "Hamshiralar uchun farmakologiya: dori xavfsizligi, asosiy dori guruhlari, monitoring va bemorni o'qitish mavzulari.",
        2024,
        "farmakologiya-qollanmasi",
        "Farmakologiya qo'llanmasi",
        "farmakologiya",
        "Farmakologiya",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Pharmacology-WEB.pdf",
    ),
    BookSeed(
        "Population Health for Nurses",
        "openstax-population-health-for-nurses",
        "Aholi salomatligi, profilaktika, sog'liq tengsizligi, jamoa bilan ishlash va epidemiologik yondashuvlar bo'yicha darslik.",
        2024,
        "sogliqni-targib",
        "Sog'liqni targ'ib qilish",
        "jamoada-hamshiralik",
        "Jamoada hamshiralik ishi",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Population_Health_for_Nurses_-_WEB.pdf",
    ),
    BookSeed(
        "Psychiatric-Mental Health Nursing",
        "openstax-psychiatric-mental-health-nursing",
        "Ruhiy salomatlik hamshiraligi, terapevtik muloqot, psixiatrik baholash va jamoa resurslari haqida OpenStax darsligi.",
        2024,
        "ruhiy-salomatlik",
        "Ruhiy salomatlik",
        "ruhiy-salomatlik-va-jamoa",
        "Ruhiy salomatlik va jamoa",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Psychiatric-Mental_Health_Nursing-WEB.pdf",
    ),
    BookSeed(
        "Anatomy and Physiology 2e",
        "openstax-anatomy-and-physiology-2e",
        "Tibbiy ta'lim uchun tana tizimlari, tuzilish-funksional bog'liqlik, gomeostaz va fiziologik jarayonlar bo'yicha asosiy darslik.",
        2022,
        "darslik",
        "Darslik",
        "anatomiya-fiziologiya",
        "Anatomiya va fiziologiya",
        "https://assets.openstax.org/oscms-prodcms/media/documents/anatomy-and-physiology-2e_-_WEB.pdf",
    ),
    BookSeed(
        "Microbiology",
        "openstax-microbiology",
        "Mikroorganizmlar, infeksiya, immunitet, laborator diagnostika va klinik mikrobiologiya asoslariga oid OpenStax darsligi.",
        2025,
        "darslik",
        "Darslik",
        "mikrobiologiya",
        "Mikrobiologiya",
        "https://assets.openstax.org/oscms-prodcms/media/documents/microbiology_-_WEB.pdf",
    ),
    BookSeed(
        "Biology 2e",
        "openstax-biology-2e",
        "Hujayra biologiyasi, genetika, evolyutsiya, fiziologiya va ekologiya bo'yicha keng qamrovli biologiya darsligi.",
        2020,
        "darslik",
        "Darslik",
        "biologiya",
        "Biologiya",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Biology-2e_-_WEB.pdf",
    ),
    BookSeed(
        "Concepts of Biology",
        "openstax-concepts-of-biology",
        "Biologiyaning asosiy konsepsiyalari: hujayra, irsiyat, evolyutsiya, organizmlar va ekologik tizimlar.",
        2024,
        "darslik",
        "Darslik",
        "biologiya",
        "Biologiya",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Concepts-Biology_-_WEB.pdf",
    ),
    BookSeed(
        "Chemistry 2e",
        "openstax-chemistry-2e",
        "Tibbiy va farmatsevtik fanlar uchun zarur bo'lgan umumiy kimyo: atom, bog'lanish, eritmalar, kinetika va muvozanat.",
        2022,
        "darslik",
        "Darslik",
        "kimyo-biokimyo",
        "Kimyo va biokimyo asoslari",
        "https://assets.openstax.org/oscms-prodcms/media/documents/chemistry-2e_-_WEB.pdf",
    ),
    BookSeed(
        "Chemistry: Atoms First 2e",
        "openstax-chemistry-atoms-first-2e",
        "Kimyoni atom tuzilishidan boshlab tushuntiradigan, farmakologiya va biologiya asoslari uchun foydali darslik.",
        2023,
        "darslik",
        "Darslik",
        "kimyo-biokimyo",
        "Kimyo va biokimyo asoslari",
        "https://assets.openstax.org/oscms-prodcms/media/documents/chemistry-atoms-first-2e_-_WEB.pdf",
    ),
    BookSeed(
        "Organic Chemistry: A Tenth Edition",
        "openstax-organic-chemistry",
        "Organik birikmalar, reaksiyalar, funksional guruhlar va biomolekulalar kimyosiga kirish bo'yicha OpenStax darsligi.",
        2024,
        "darslik",
        "Darslik",
        "kimyo-biokimyo",
        "Kimyo va biokimyo asoslari",
        "https://assets.openstax.org/oscms-prodcms/media/documents/organic-chemistry_-_WEB.pdf",
    ),
    BookSeed(
        "Psychology 2e",
        "openstax-psychology-2e",
        "Psixologiya asoslari: miya va xulq, rivojlanish, o'rganish, stress, shaxsiyat va ruhiy salomatlik mavzulari.",
        2020,
        "darslik",
        "Darslik",
        "psixologiya",
        "Psixologiya",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Psychology2e_WEB.pdf",
    ),
    BookSeed(
        "Lifespan Development",
        "openstax-lifespan-development",
        "Inson rivojlanishi: chaqaloqlikdan keksalikkacha jismoniy, kognitiv va psixosotsial o'zgarishlar.",
        2024,
        "darslik",
        "Darslik",
        "rivojlanish-psixologiyasi",
        "Rivojlanish psixologiyasi",
        "https://assets.openstax.org/oscms-prodcms/media/documents/Lifespan_Development_-_WEB.pdf",
    ),
    BookSeed(
        "Introduction to Sociology 3e",
        "openstax-introduction-to-sociology-3e",
        "Jamiyat, madaniyat, oila, sog'liq tengsizligi, ijtimoiy institutlar va guruhlar bo'yicha kirish darsligi.",
        2021,
        "darslik",
        "Darslik",
        "sogliq-sotsiologiyasi",
        "Sog'liq va jamiyat",
        "https://assets.openstax.org/oscms-prodcms/media/documents/introduction-sociology-3e_-_WEB.pdf",
    ),
    BookSeed(
        "Introductory Statistics 2e",
        "openstax-introductory-statistics-2e",
        "Tibbiy tadqiqotlar va evidence-based practice uchun foydali statistik tushunchalar: ehtimollik, taqsimot, ishonch oralig'i va testlar.",
        2023,
        "darslik",
        "Darslik",
        "tibbiy-statistika",
        "Tibbiy statistika",
        "https://assets.openstax.org/oscms-prodcms/media/documents/introductory-statistics-2e_-_WEB.pdf",
    ),
    BookSeed(
        "Business Ethics",
        "openstax-business-ethics",
        "Professional muhit, mas'uliyat, manfaatlar to'qnashuvi, etika va tashkilot madaniyati bo'yicha umumiy qo'llanma.",
        2018,
        "menejment-etika",
        "Menejment va etika",
        "menejment-professional-amaliyot",
        "Menejment va professional amaliyot",
        "https://assets.openstax.org/oscms-prodcms/media/documents/business-ethics_-_WEB.pdf",
    ),
]


class Command(BaseCommand):
    help = "Seed 20 additional open textbooks from OpenStax and optionally upload their PDFs."

    def add_arguments(self, parser):
        parser.add_argument("--upload-pdfs", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        upload_pdfs = options["upload_pdfs"]
        storage = None if dry_run or not upload_pdfs else get_saqlagich()

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: database and storage will not be changed."))

        for seed in BOOKS:
            if dry_run:
                self.stdout.write(f"Would seed OpenStax book: {seed.nomi}")
                continue

            author = self._author()
            form = self._form(seed)
            subject = self._subject(seed)
            book = self._book(seed, author, form, subject)
            if upload_pdfs:
                self._ensure_pdf(book, seed, storage)

        self.stdout.write(self.style.SUCCESS("Additional OpenStax seed complete."))

    def _author(self):
        author, _ = Author.objects.get_or_create(
            ism=AUTHOR_NAME,
            defaults={"tavsif": "Rice University huzuridagi OpenStax ochiq darsliklar loyihasi."},
        )
        return author

    def _form(self, seed):
        translations = {
            "darslik": ("Darslik", "Учебник", "Textbook"),
            "amaliy-konikmalar": ("Amaliy ko'nikmalar qo'llanmasi", "Практическое пособие", "Practical skills guide"),
            "klinik-parvarish": ("Klinik parvarish qo'llanmasi", "Руководство по клиническому уходу", "Clinical care guide"),
            "farmakologiya-qollanmasi": ("Farmakologiya qo'llanmasi", "Пособие по фармакологии", "Pharmacology guide"),
            "sogliqni-targib": ("Sog'liqni targ'ib qilish", "Укрепление здоровья", "Health promotion"),
            "ruhiy-salomatlik": ("Ruhiy salomatlik", "Психическое здоровье", "Mental health"),
            "menejment-etika": ("Menejment va etika", "Менеджмент и этика", "Management and ethics"),
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

    def _book(self, seed, author, form, subject):
        book, created = Book.objects.update_or_create(
            slug=seed.slug,
            defaults={
                "nomi": seed.nomi,
                "tavsif": f"{seed.tavsif}\n\n{LICENSE_NOTE}",
                "nashriyot": "OpenStax / Rice University",
                "yil": seed.yil,
                "til": "en",
                "turi": form,
            },
        )
        book.mualliflar.set([author])
        book.yonalishlar.set([subject])
        self.stdout.write(("Created" if created else "Updated") + f" OpenStax book: {book.nomi}")
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
                timeout=180,
                headers={
                    "User-Agent": "KutubxonaOpenStaxSeeder/1.0 (+https://kutubxona-three.vercel.app)",
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
