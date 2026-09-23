"""Generate catalog covers and upload them to the public cover bucket."""

from django.core.management.base import BaseCommand

from catalog.covers import cover_key, render_cover_png
from catalog.models import Book
from catalog.storage import get_saqlagich


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
            key = cover_key(book)
            if dry_run:
                self.stdout.write(f"Would generate cover: {book.nomi} -> {key}")
                count += 1
                continue

            buffer = render_cover_png(book)
            storage.muqova_yuklash(key, buffer, content_type="image/png")
            book.muqova_key = key
            book.save(update_fields=["muqova_key"])
            self.stdout.write(f"Generated cover: {book.nomi} -> {key}")
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Generated {count} cover(s)."))
