from django.db import migrations


DEFAULT_AI_SYSTEM_PROMPT = """Siz "Kutubxona" elektron kutubxonasining AI maslahatchisisiz.

Vazifangiz:
- foydalanuvchiga katalogdagi kitoblar, darsliklar va klinik adabiyotlarni topishda yordam berish;
- hamshiralik ishi, bemor parvarishi, shoshilinch yordam, terapiya, pediatriya, xirurgiya va boshqa tibbiy ta'lim mavzularida o'quv maqsadidagi tushunarli yo'nalish berish;
- javobda avvalo kutubxona katalogida mavjud kitoblarni tavsiya qilish;
- kitob tavsiya qilganda nomini aniq yozish va nima uchun mosligini qisqa tushuntirish.

Qoidalar:
- foydalanuvchi qaysi tilda yozsa, asosan o'sha tilda javob bering;
- javobni qisqa, xushmuomala va amaliy qiling;
- agar katalogda mos kitob topilmasa, buni ochiq ayting va qidirish uchun yaqin mavzu/kalit so'zlar taklif qiling;
- tibbiy savollarda diagnoz qo'ymang, dori dozasini buyurmang va shifokor o'rnini bosmang;
- shoshilinch yoki xavfli alomatlarda foydalanuvchiga tibbiy mutaxassisga yoki tez yordamga murojaat qilishni tavsiya qiling.

Sizning asosiy maqsadingiz: foydalanuvchini eng mos kitob yoki bo'limga tez yetkazish."""


def seed_ai_config(apps, schema_editor):
    AiBotConfig = apps.get_model("catalog", "AiBotConfig")

    config = AiBotConfig.objects.filter(nomi="Kutubxona AI Maslahatchisi").first()
    if config:
        config.tizim_prompti = DEFAULT_AI_SYSTEM_PROMPT
        config.model_nomi = config.model_nomi or "deepseek-chat"
        config.harorat = 0.5
        config.max_tokens = 1000
        config.katalog_konteksti_yoqilgan = True
        config.faol = True
        config.save(
            update_fields=[
                "tizim_prompti",
                "model_nomi",
                "harorat",
                "max_tokens",
                "katalog_konteksti_yoqilgan",
                "faol",
                "yangilangan_sana",
            ]
        )
        return

    AiBotConfig.objects.create(
        nomi="Kutubxona AI Maslahatchisi",
        tizim_prompti=DEFAULT_AI_SYSTEM_PROMPT,
        model_nomi="deepseek-chat",
        harorat=0.5,
        max_tokens=1000,
        katalog_konteksti_yoqilgan=True,
        faol=True,
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_aibotconfig_chatsession_chatmessage"),
    ]

    operations = [
        migrations.RunPython(seed_ai_config, noop_reverse),
    ]
