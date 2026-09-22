"""Kutubxona API uchun so'rovlar chastotasini cheklash (throttling)."""

from rest_framework.throttling import AnonRateThrottle


class OqishRateThrottle(AnonRateThrottle):
    """Kitobni ochish (presigned URL olish) uchun soatiga 60 ta so'rovlik cheklov."""

    scope = "oqish"
    rate = "60/hour"


class ChatRateThrottle(AnonRateThrottle):
    """AI bot bilan suhbat uchun cheklov (daqiqasiga 30 ta so'rov)."""

    scope = "chat"
    rate = "30/minute"

