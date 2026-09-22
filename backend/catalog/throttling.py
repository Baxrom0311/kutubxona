"""Kutubxona API uchun so'rovlar chastotasini cheklash (throttling)."""

from rest_framework.throttling import AnonRateThrottle


class OqishRateThrottle(AnonRateThrottle):
    """Kitobni ochish (presigned URL olish) uchun soatiga 60 ta so'rovlik cheklov."""

    scope = "oqish"
    rate = "60/hour"
