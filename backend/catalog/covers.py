"""Generated book cover rendering utilities."""

from io import BytesIO
from pathlib import Path
import random
import textwrap

from PIL import Image, ImageDraw, ImageFont

from catalog.models import Book


PALETTES = [
    ((14, 63, 88), (20, 184, 166), (255, 255, 255)),
    ((88, 28, 135), (59, 130, 246), (255, 255, 255)),
    ((30, 64, 175), (16, 185, 129), (255, 255, 255)),
    ((127, 29, 29), (245, 158, 11), (255, 255, 255)),
    ((20, 83, 45), (132, 204, 22), (255, 255, 255)),
    ((51, 65, 85), (14, 165, 233), (255, 255, 255)),
    ((63, 48, 18), (217, 119, 6), (255, 255, 255)),
]
_palette_bag: list[int] = []

LIBRARY_LABELS = {
    "uz": "KUTUBXONA",
    "ru": "БИБЛИОТЕКА",
    "en": "LIBRARY",
}

DEFAULT_TYPE_LABELS = {
    "uz": "KITOB",
    "ru": "КНИГА",
    "en": "BOOK",
}

DEFAULT_AUTHOR_LABELS = {
    "uz": "Muallif ko'rsatilmagan",
    "ru": "Автор не указан",
    "en": "Author not specified",
}

DEFAULT_SUBJECT_LABELS = {
    "uz": "Elektron kutubxona",
    "ru": "Электронная библиотека",
    "en": "Digital library",
}

PRINT_LABELS = {
    "uz": "BOSMA",
    "ru": "ПЕЧАТЬ",
    "en": "PRINT",
}


def cover_key(book: Book) -> str:
    return f"covers/{book.slug}.png"


def render_cover_png(book: Book) -> BytesIO:
    image = render_cover(book)
    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    buffer.seek(0)
    return buffer


def render_cover(book: Book) -> Image.Image:
    width, height = 900, 1200
    primary, accent, text = _next_palette()
    image = Image.new("RGB", (width, height), primary)
    draw = ImageDraw.Draw(image)

    for y in range(height):
        blend = y / height
        color = tuple(int(primary[i] * (1 - blend) + accent[i] * blend * 0.75) for i in range(3))
        draw.line((0, y, width, y), fill=color)

    draw.rounded_rectangle((58, 58, width - 58, height - 58), radius=36, outline=(255, 255, 255), width=3)
    draw.rectangle((0, height - 230, width, height), fill=(0, 0, 0))
    draw.rectangle((0, 0, width, 170), fill=(255, 255, 255))

    badge_font = _font(34, bold=True)
    title_font = _font(64, bold=True)
    author_font = _font(34)
    small_font = _font(28, bold=True)

    lang = book.til if book.til in LIBRARY_LABELS else "uz"
    turi = book.turi.nomi(lang).upper() if book.turi_id else DEFAULT_TYPE_LABELS[lang]
    draw.text((80, 72), LIBRARY_LABELS[lang], font=badge_font, fill=primary)
    draw.text((80, 118), turi[:34], font=small_font, fill=accent)

    y = 285
    for line in _wrap_text(book.nomi, title_font, max_width=740, max_lines=7):
        draw.text((80, y), line, font=title_font, fill=text)
        y += 78

    authors = ", ".join(a.ism for a in book.mualliflar.all()) or DEFAULT_AUTHOR_LABELS[lang]
    y = min(y + 45, 855)
    for line in _wrap_text(authors, author_font, max_width=740, max_lines=3):
        draw.text((80, y), line, font=author_font, fill=(230, 247, 255))
        y += 46

    subject = book.yonalishlar.first()
    subject_name = subject.nomi(lang) if subject else DEFAULT_SUBJECT_LABELS[lang]
    draw.text((80, height - 175), subject_name[:44], font=small_font, fill=(255, 255, 255))

    meta = "PDF" if book.mavjudlik == "raqamli" else PRINT_LABELS[lang]
    if book.yil:
        meta += f"  |  {book.yil}"
    if book.til:
        meta += f"  |  {book.til.upper()}"
    draw.text((80, height - 118), meta, font=small_font, fill=(180, 235, 230))

    return image


def _next_palette():
    if not _palette_bag:
        _palette_bag.extend(range(len(PALETTES)))
        random.shuffle(_palette_bag)
    return PALETTES[_palette_bag.pop()]


def _font(size: int, bold: bool = False):
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


def _wrap_text(text: str, draw_font, max_width: int, max_lines: int) -> list[str]:
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
