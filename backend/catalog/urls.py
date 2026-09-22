"""Katalog ilovasi URL marshrutlari."""

from rest_framework.routers import DefaultRouter

from catalog.api import BookViewSet, FormViewSet, SubjectViewSet

router = DefaultRouter()
router.register(r"kitoblar", BookViewSet, basename="kitob")
router.register(r"turlar", FormViewSet, basename="tur")
router.register(r"yonalishlar", SubjectViewSet, basename="yonalish")

urlpatterns = router.urls
