"""O'zbek va kirill matnlari uchun transliteratsiya va unikal slug generatori."""

from django.utils.text import slugify

TRANSLIT = {
    "'": "", "ʻ": "", "ʼ": "", "‘": "", "’": "",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e",
    "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x", "ц": "ts",
    "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "", "ы": "i", "ь": "",
    "э": "e", "ю": "yu", "я": "ya", "ў": "o", "қ": "q", "ғ": "g",
    "ҳ": "h",
}


def translit_uz(matn: str) -> str:
    """Kirill va maxsus apostroflarni lotin alifbosiga o'giradi."""
    matn = matn.lower()
    natija = []
    for harf in matn:
        natija.append(TRANSLIT.get(harf, harf))
    return "".join(natija)


def generate_unique_slug(model_instance, base_text: str, slug_field: str = "slug", max_length: int = 300) -> str:
    """Model uchun unikal slug yaratadi (takrorlansa -2, -3 qo'shadi)."""
    translit_text = translit_uz(base_text)
    base_slug = slugify(translit_text) or "kitob"
    base_slug = base_slug[: max_length - 10]

    model_class = model_instance.__class__
    slug = base_slug
    counter = 2

    qs = model_class.objects.all()
    if model_instance.pk:
        qs = qs.exclude(pk=model_instance.pk)

    while qs.filter(**{slug_field: slug}).exists():
        suffix = f"-{counter}"
        slug = f"{base_slug[: max_length - len(suffix)]}{suffix}"
        counter += 1

    return slug
