"""Generate simple catalog covers and upload them to the public cover bucket."""

from io import BytesIO
from pathlib import Path
import textwrap

from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFont

from catalog.models import Book
from catalog.storage import get_saqlagich


PALETTES = [
    ((14, 63, 88), (20, 184, 166), (255, 255, 255)),
    ((88, 28, 135), (59, 130, 246), (255, 255, 255)),
    ((30, 64, 175), (16, 185, 129), (255, 255, 255)),
    ((127, 29, 29), (245, 158, 11), (255, 255, 255)),
    ((20, 83, 45), (132, 204, 22), (255, 255, 255)),
    ((51, 65, 85), (14, 165, 233), (255, 255, 255)),
]


def font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


class Command(BaseCommand):
    help = "Create generated PNG covers for books without a cover."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Regenerate covers even when muqova_key exists.")
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        force = options["force"]
        dry_run = options["dry_run"]
        storage = None if dry_run else get_saqlagich()

        qs = Book.objects.select_related("turi").prefetch_related("mualliflar", "yonalishlar").order_by("slug")
        if not force:
            qs = qs.filter(muqova_key="")

        count = 0
        for book in qs:
            key = f"covers/{book.slug}.png"
            if dry_run:
                self.stdout.write(f"Would generate cover: {book.nomi} -> {key}")
                count += 1
                continue

            image = self._render_cover(book)
            buffer = BytesIO()
            image.save(buffer, format="PNG", optimize=True)
            buffer.seek(0)
            storage.muqova_yuklash(key, buffer, content_type="image/png")
            book.muqova_key = key
            book.save(update_fields=["muqova_key"])
            self.stdout.write(f"Generated cover: {book.nomi} -> {key}")
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Generated {count} cover(s)."))

    def _render_cover(self, book: Book) -> Image.Image:
        width, height = 900, 1200
        primary, accent, text = PALETTES[sum(ord(c) for c in book.slug) % len(PALETTES)]
        image = Image.new("RGB", (width, height), primary)
        draw = ImageDraw.Draw(image)

        for y in range(height):
            blend = y / height
            color = tuple(int(primary[i] * (1 - blend) + accent[i] * blend * 0.75) for i in range(3))
            draw.line((0, y, width, y), fill=color)

        draw.rounded_rectangle((58, 58, width - 58, height - 58), radius=36, outline=(255, 255, 255), width=3)
        draw.rectangle((0, height - 230, width, height), fill=(0, 0, 0))
        draw.rectangle((0, 0, width, 170), fill=(255, 255, 255))

        badge_font = font(34, bold=True)
        title_font = font(64, bold=True)
        author_font = font(34)
        small_font = font(28, bold=True)

        turi = book.turi.nomi_uz.upper() if book.turi_id else "KITOB"
        draw.text((80, 72), "KUTUBXONA", font=badge_font, fill=primary)
        draw.text((80, 118), turi[:34], font=small_font, fill=accent)

        title_lines = self._wrap_text(book.nomi, title_font, max_width=740, max_lines=7)
        y = 285
        for line in title_lines:
            draw.text((80, y), line, font=title_font, fill=text)
            y += 78

        authors = ", ".join(a.ism for a in book.mualliflar.all()) or "Muallif ko'rsatilmagan"
        author_lines = self._wrap_text(authors, author_font, max_width=740, max_lines=3)
        y = min(y + 45, 855)
        for line in author_lines:
            draw.text((80, y), line, font=author_font, fill=(230, 247, 255))
            y += 46

        subject = book.yonalishlar.first()
        subject_name = subject.nomi_uz if subject else "Elektron kutubxona"
        draw.text((80, height - 175), subject_name[:44], font=small_font, fill=(255, 255, 255))
        meta = "PDF"
        if book.yil:
            meta += f"  |  {book.yil}"
        if book.til:
            meta += f"  |  {book.til.upper()}"
        draw.text((80, height - 118), meta, font=small_font, fill=(180, 235, 230))

        return image

    def _wrap_text(self, text: str, draw_font, max_width: int, max_lines: int) -> list[str]:
        words = text.split()
        lines: list[str] = []
        current: list[str] = []
        probe = Image.new("RGB", (10, 10))
        draw = ImageDraw.Draw(probe)

        for word in words:
            candidate = " ".join(current + [word])
            bbox = draw.textbbox((0, 0), candidate, font=draw_font)
            if bbox[2] <= max_width:
                current.append(word)
                continue
            if current:
                lines.append(" ".join(current))
            current = [word]
            if len(lines) >= max_lines:
                break

        if current and len(lines) < max_lines:
            lines.append(" ".join(current))

        if len(lines) == max_lines and len(" ".join(words)) > len(" ".join(lines)):
            lines[-1] = textwrap.shorten(lines[-1], width=max(8, len(lines[-1]) - 3), placeholder="...")
        return lines or [text[:24]]
