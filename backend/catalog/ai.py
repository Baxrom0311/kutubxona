"""DeepSeek AI LLM integratsiyasi va kutubxona aqlli chat boti."""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import requests
from django.conf import settings
from django.db.models import Count, Q

from catalog.models import AiBotConfig, Book, ChatMessage, ChatSession

logger = logging.getLogger(__name__)

# AI promptiga sig'adigan kitoblar soni. Juda katta bo'lsa prompt uzayib
# ketadi, juda kichik bo'lsa AI mavjud kitobni "yo'q" deb aytadi.
KATALOG_KONTEKSTI_LIMITI = 200


class DeepSeekService:
    """DeepSeek AI chat xizmati."""

    def __init__(self):
        self.api_key = getattr(settings, "DEEPSEEK_API_KEY", "")
        self.base_url = getattr(settings, "DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
        self.default_model = getattr(settings, "DEEPSEEK_MODEL", "deepseek-chat")

    def _katalog_kontekstini_yaratish(self) -> str:
        """Kutubxonadagi kitoblar haqida qisqacha ma'lumotlar bazasini prompt uchun yig'adi."""
        # Qaytarilmagan qarzlar bitta so'rovda hisoblanadi (N+1 bo'lmasligi uchun).
        kitoblar = (
            Book.objects.select_related("turi")
            .prefetch_related("mualliflar", "yonalishlar")
            .annotate(
                band_nusxalar=Count(
                    "qarzlar",
                    filter=Q(qarzlar__qaytarilgan_sana__isnull=True),
                    distinct=True,
                )
            )[:KATALOG_KONTEKSTI_LIMITI]
        )
        if not kitoblar:
            return "Hozirda kutubxonada kitoblar mavjud emas."

        jami = Book.objects.count()
        satrlar = ["Kutubxonadagi adabiyotlar ro'yxati:"]
        for k in kitoblar:
            mualliflar = ", ".join(m.ism for m in k.mualliflar.all()) or "Muallif ko'rsatilmagan"
            yonalishlar = ", ".join(y.nomi_uz for y in k.yonalishlar.all()) or "Umumiy"

            # AI bosma kitobni "onlayn o'qing" deb tavsiya qilmasligi uchun
            # holat aniq yoziladi.
            if k.mavjudlik == "raqamli":
                holat = "Saytda onlayn o'qiladi"
            elif k.bosh_nusxalar_soni > 0:
                holat = (
                    f"Faqat bosma nusxa, kutubxonadan olinadi "
                    f"(hozir {k.bosh_nusxalar_soni} ta bo'sh, jami {k.nusxalar_soni or 1} ta)"
                )
            else:
                holat = "Faqat bosma nusxa, hozir barcha nusxalar qarzga berilgan"

            satrlar.append(
                f"- Kitob: \"{k.nomi}\" | Slug: {k.slug} | Muallif: {mualliflar}"
                f" | Turi: {k.turi.nomi_uz} | Yo'nalish: {yonalishlar} | Tili: {k.til}"
                f" | Holati: {holat}"
            )

        if jami > len(satrlar) - 1:
            satrlar.append(
                f"(Ro'yxatda eng yangi {len(satrlar) - 1} ta kitob ko'rsatildi, "
                f"kutubxonada jami {jami} ta kitob bor. Ro'yxatda yo'q mavzu so'ralsa, "
                f"kitob umuman yo'q demang — katalogdan qidirishni taklif qiling.)"
            )
        return "\n".join(satrlar)

    def _tavsiya_etilgan_kitoblarni_aniqlash(self, matn: str) -> List[Dict[str, str]]:
        """AI javobida yoki foydalanuvchi so'rovida tilga olingan kitoblarni aniqlaydi."""
        topilganlar = []
        barcha_kitoblar = Book.objects.values("slug", "nomi")
        for k in barcha_kitoblar:
            # Nomining asosiy so'zlari matnda uchrasa
            nom_sozlar = [s.lower() for s in k["nomi"].split() if len(s) > 3]
            if any(soz in matn.lower() for soz in nom_sozlar) or k["slug"] in matn.lower():
                topilganlar.append({"slug": k["slug"], "nomi": k["nomi"]})
                if len(topilganlar) >= 5:
                    break
        return topilganlar

    def javob_olish(
        self,
        xabar: str,
        session_id: Optional[str] = None,
        tarix: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, ChatSession, List[Dict[str, str]]]:
        """DeepSeek API orqali javob oladi va suhbat tarixini saqlaydi."""
        # 1. Faol konfiguratsiyani olish (Admin orqali o'zgartiriladigan prompt)
        config = AiBotConfig.get_active_config()

        # 2. Sessiyani topish yoki yaratish
        session = None
        if session_id:
            session = ChatSession.objects.filter(id=session_id).first()
        if not session:
            session = ChatSession.objects.create()

        # Foydalanuvchi xabarini saqlash
        ChatMessage.objects.create(session=session, rol="user", matn=xabar)

        # 3. Tizim promptini shakllantirish
        tizim_prompti = config.tizim_prompti
        if config.katalog_konteksti_yoqilgan:
            katalog_malumoti = self._katalog_kontekstini_yaratish()
            tizim_prompti += f"\n\n[KATALOG KONTEKSTI]:\n{katalog_malumoti}\nFoydalanuvchi kitob so'rasa, faqat yoki ustuvor ravishda kutubxonadagi ushbu kitoblarni tavsiya qiling."

        # 4. Xabarlar zanjirini yig'ish
        messages = [{"role": "system", "content": tizim_prompti}]

        # Avvalgi suhbat tarixidan oxirgi 6 ta xabarni qo'shish
        otgan_xabarlar = session.xabarlar.exclude(pk__isnull=True).order_by("-yaratilgan_sana")[:6]
        for m in reversed(list(otgan_xabarlar)):
            messages.append({"role": m.rol, "content": m.matn})

        # Agar frontenddan qo'shimcha tarix uzatilgan bo'lsa va sessiyada bo'lmasa
        if tarix and len(messages) <= 2:
            for h in tarix[-4:]:
                messages.append({"role": h.get("rol", "user"), "content": h.get("matn", "")})

        javob_matni = ""

        # 5. DeepSeek API ga so'rov yuborish
        if not self.api_key or self.api_key in ["test", "dummy", ""]:
            # Mock / Fallback rejim (API kalit kiritilmagan yoki test muhitida)
            tavsiyalar = self._tavsiya_etilgan_kitoblarni_aniqlash(xabar)
            if tavsiyalar:
                kitob_nomlari = ", ".join(f"'{t['nomi']}'" for t in tavsiyalar)
                javob_matni = (
                    f"Assalomu alaykum! Sizning so'rovingiz bo'yicha kutubxonamizdan {kitob_nomlari} "
                    "kabi foydali manbalarni tavsiya qila olaman. "
                    "Kitob sahifasiga o'tib, uni bevosita brauzerda o'qishingiz mumkin."
                )
            else:
                javob_matni = (
                    "Assalomu alaykum! Men kutubxonaning AI maslahatchisiman. "
                    "Sizga kerakli adabiyotni topish yoki yo'nalishlar bo'yicha tavsiyalar berishim mumkin. "
                    "Qaysi fan yoki mavzu bo'yicha kitob qidiryapsiz?"
                )
        else:
            try:
                endpoint = f"{self.base_url}/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": config.model_nomi or self.default_model,
                    "messages": messages,
                    "temperature": config.harorat,
                    "max_tokens": config.max_tokens,
                }
                response = requests.post(
                    endpoint,
                    headers=headers,
                    json=payload,
                    timeout=30,
                )
                if response.status_code == 200:
                    data = response.json()
                    javob_matni = data["choices"][0]["message"]["content"]
                else:
                    logger.error(f"DeepSeek API xatosi: {response.status_code} - {response.text}")
                    javob_matni = "Kechirasiz, sun'iy intellekt xizmati bilan vaqtincha aloqa o'rnatib bo'lmadi. Iltimos, birozdan so'ng qayta urinib ko'ring."
            except Exception as e:
                logger.error(f"DeepSeek ulanishida nosozlik: {e}")
                javob_matni = "Kechirasiz, xizmatda vaqtinchalik texnik uzilish yuz berdi."

        # 6. AI javobini bazada saqlash
        ChatMessage.objects.create(session=session, rol="assistant", matn=javob_matni)

        # 7. Tavsiya etilgan kitoblarni ajratib olish
        tavsiyalar = self._tavsiya_etilgan_kitoblarni_aniqlash(javob_matni + " " + xabar)

        return javob_matni, session, tavsiyalar
