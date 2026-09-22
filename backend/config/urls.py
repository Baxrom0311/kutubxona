"""Elektron kutubxona — asosiy URL marshrutlari."""

from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def healthz(request):
    """Northflank healthcheck uchun yengil endpoint (bazaga tegmaydi)."""
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = [
    path("healthz", healthz, name="healthz"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/", include("catalog.urls")),
    path("admin/", admin.site.urls),
]
