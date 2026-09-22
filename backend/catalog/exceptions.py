"""Kutubxona maxsus xatoliklar ishlovchisi."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """ARCHITECTURE.md 7.6 shartnomasiga mos xatolik formati."""
    response = exception_handler(exc, context)

    if response is not None:
        if response.status_code == status.HTTP_404_NOT_FOUND:
            response.data = {"xato": "Ma'lumot topilmadi"}

        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            wait_time = getattr(exc, "wait", 3600) or 3600
            response.data = {
                "xato": "Juda ko'p so'rov",
                "keyin": int(wait_time),
            }

        elif response.status_code == status.HTTP_400_BAD_REQUEST:
            if isinstance(response.data, dict):
                first_key = next(iter(response.data.keys()))
                first_val = response.data[first_key]
                if isinstance(first_val, list):
                    first_val = str(first_val[0])
                response.data = {
                    "xato": str(first_val),
                    "maydon": str(first_key),
                }
            else:
                response.data = {"xato": str(response.data)}

        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            response.data = {"xato": "Ushbu amalga ruxsat berilmagan (faqat GET)"}

    return response
