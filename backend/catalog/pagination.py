"""Elektron kutubxona DRF sahifalash klassi."""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class KutubxonaPagination(PageNumberPagination):
    """Kutubxona spetsifikatsiyasiga mos sahifalash."""

    page_size = 24
    page_query_param = "sahifa"
    page_size_query_param = None
    max_page_size = 24

    def get_paginated_response(self, data):
        return Response(
            {
                "soni": self.page.paginator.count,
                "keyingi": self.get_next_link(),
                "oldingi": self.get_previous_link(),
                "natijalar": data,
            }
        )
