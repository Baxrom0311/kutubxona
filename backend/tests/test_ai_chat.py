from unittest.mock import MagicMock, patch
import pytest
from django.contrib.admin.sites import site
from django.urls import reverse
from rest_framework.test import APIClient

from catalog.admin import AiBotConfigAdmin, ChatSessionAdmin
from catalog.ai import DeepSeekService
from catalog.models import AiBotConfig, Book, ChatMessage, ChatSession, Form

pytestmark = pytest.mark.django_db


@pytest.fixture
def api_client():
    return APIClient()


def test_aibotconfig_default_yaratiladi():
    config = AiBotConfig.get_active_config()
    assert config is not None
    assert config.faol is True
    assert "maslahatchisi" in config.tizim_prompti.lower()


def test_aibotconfig_admin_prompt_ozgartirish(db):
    config = AiBotConfig.get_active_config()
    yangi_prompt = "Faqat tibbiyot va anatomiya bo'yicha javob bering."
    config.tizim_prompti = yangi_prompt
    config.save()

    active = AiBotConfig.get_active_config()
    assert active.tizim_prompti == yangi_prompt


def test_deepseek_service_fallback_kitob_tavsiya_qiladi(kitob):
    service = DeepSeekService()
    javob, session, tavsiyalar = service.javob_olish(
        xabar="Menga yurak kasalliklari haqida kitob bormi?"
    )

    assert javob is not None
    assert session is not None
    assert len(tavsiyalar) >= 1
    assert tavsiyalar[0]["slug"] == kitob.slug
    assert ChatMessage.objects.filter(session=session).count() == 2


@patch("requests.post")
def test_deepseek_service_api_chaqiruvi(mock_post, kitob):
    # DeepSeek API dan muvaffaqiyatli javob kelishi
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": "Albatta! Abu Ali ibn Sinoning 'Yurak kasalliklari asoslari' darsligini o'qishni tavsiya qilaman.",
                }
            }
        ]
    }
    mock_post.return_value = mock_response

    # Maxsus prompt o'rnatamiz
    config = AiBotConfig.get_active_config()
    config.tizim_prompti = "Maxsus tibbiy yordamchi yo'riqnomasi"
    config.save()

    service = DeepSeekService()
    service.api_key = "sk-test-deepseek-key-12345"

    javob, session, tavsiyalar = service.javob_olish(xabar="Kardiologiya kitobi bormi?")

    assert "Yurak kasalliklari asoslari" in javob
    assert len(tavsiyalar) >= 1
    assert tavsiyalar[0]["slug"] == kitob.slug

    # DeepSeek ga yuborilgan so'rovni tekshirish
    mock_post.assert_called_once()
    args, kwargs = mock_post.call_args
    assert "https://api.deepseek.com/chat/completions" in args[0]
    assert kwargs["headers"]["Authorization"] == "Bearer sk-test-deepseek-key-12345"

    payload = kwargs["json"]
    assert payload["model"] == "deepseek-chat"
    # Tizim prompti admin o'rnatgan matnni o'z ichiga olganligini tekshirish
    assert "Maxsus tibbiy yordamchi yo'riqnomasi" in payload["messages"][0]["content"]
    assert "[KATALOG KONTEKSTI]" in payload["messages"][0]["content"]


def test_chat_api_endpoint(api_client, kitob):
    # POST /api/chat/
    response = api_client.post(
        "/api/chat/",
        {"xabar": "Yurak haqida qanday kitob bor?"},
        format="json",
    )
    assert response.status_code == 200
    data = response.json()
    assert "javob" in data
    assert "session_id" in data
    assert "tavsiya_etilgan_kitoblar" in data
    assert len(data["tavsiya_etilgan_kitoblar"]) >= 1

    session_id = data["session_id"]

    # Ikkinchi xabar shu sessiya bilan yuboriladi
    response2 = api_client.post(
        "/api/chat/",
        {
            "xabar": "Muallifi kim?",
            "session_id": session_id,
        },
        format="json",
    )
    assert response2.status_code == 200
    assert response2.json()["session_id"] == session_id

    # Sessiya tarixini olish GET /api/chat/sessiya/<session_id>/
    history_res = api_client.get(f"/api/chat/sessiya/{session_id}/")
    assert history_res.status_code == 200
    xabarlar = history_res.json()
    assert len(xabarlar) == 4  # 2 ta user, 2 ta assistant


def test_chat_api_bosh_xabar_xatolik(api_client):
    response = api_client.post("/api/chat/", {}, format="json")
    assert response.status_code == 400


def test_chat_admin_paneli(admin_client, kutubxonachi):
    # Admin orqali AiBotConfig va ChatSession mavjudligi
    config = AiBotConfig.get_active_config()
    res = admin_client.get("/admin/catalog/aibotconfig/")
    assert res.status_code == 200

    session = ChatSession.objects.create()
    ChatMessage.objects.create(session=session, rol="user", matn="Salom bot")
    res_session = admin_client.get(f"/admin/catalog/chatsession/{session.id}/change/")
    assert res_session.status_code == 200
    assert "Salom bot" in res_session.content.decode("utf-8")
