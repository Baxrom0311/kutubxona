"""Elektron kutubxona — asosiy URL marshrutlari."""

from django.conf import settings
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path
from django.views.static import serve

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

# DiskSaqlagich ishlatilganda yuklangan muqova va kitob fayllari shu yerdan
# beriladi. R2 ga o'tilganda bu marshrut ishlatilmaydi (kalitlar to'liq
# URL qaytaradi), shuning uchun uni yoqish xavfsiz.
if settings.SAQLAGICH.endswith("DiskSaqlagich"):
    urlpatterns += [
        path(
            f"{str(settings.MEDIA_URL).strip('/')}/<path:path>",
            serve,
            {"document_root": settings.MEDIA_ROOT},
            name="media",
        ),
    ]
