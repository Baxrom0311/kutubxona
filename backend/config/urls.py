"""Elektron kutubxona — asosiy URL marshrutlari."""

from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path


def healthz(request):
    """Northflank healthcheck uchun yengil endpoint (bazaga tegmaydi)."""
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = [
    path("healthz", healthz, name="healthz"),
    path("api/", include("catalog.urls")),
    path("admin/", admin.site.urls),
]
