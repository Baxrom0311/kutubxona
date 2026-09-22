from django.urls import path
from rest_framework.routers import DefaultRouter

from catalog.api import (
    BookViewSet,
    ChatBotView,
    ChatSessionView,
    FormViewSet,
    SubjectViewSet,
)

router = DefaultRouter()
router.register(r"kitoblar", BookViewSet, basename="kitob")
router.register(r"turlar", FormViewSet, basename="tur")
router.register(r"yonalishlar", SubjectViewSet, basename="yonalish")

urlpatterns = [
    path("chat/", ChatBotView.as_view(), name="ai-chat"),
    path("chat/sessiya/<uuid:session_id>/", ChatSessionView.as_view(), name="ai-chat-session"),
] + router.urls

