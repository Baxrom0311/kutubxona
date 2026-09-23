import { Link } from "@/i18n/routing";
import { kitobniOlish, oqishUrlOlish } from "@/lib/api";
import { notFound } from "next/navigation";
import PdfOquvchi from "@/components/PdfOquvchi";
import EpubOquvchi from "@/components/EpubOquvchi";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

interface OqishPageProps {
  params: Promise<{ slug: string; id: string; locale: string }>;
}

export default async function OqishPage({ params }: OqishPageProps) {
  const { slug, id, locale } = await params;
  const faylId = parseInt(id, 10);

  const t = await getTranslations({ locale, namespace: "oquvchi" });

  const [kitob, oqishData] = await Promise.all([
    kitobniOlish(slug),
    oqishUrlOlish(slug, faylId),
  ]);

  // Bosma nusxa kitoblar uchun API o'qish havolasini bermaydi.
  if (!kitob || !oqishData || !kitob.oqish_mumkin) {
    notFound();
  }

  const fayl = kitob.fayllar?.find((f) => f.id === faylId);

  return (
    // O'quvchi doim qorong'u: sahifa oq bo'lib ajralib tursin.
    <div className="fixed inset-0 h-[100dvh] z-50 bg-[#15181f] flex flex-col">
      <header className="h-14 px-3 sm:px-5 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
        <Link
          href={`/kitob/${kitob.slug}`}
          className="w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label={t("kitobgaQaytish")}
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <h1 className="font-display text-[15px] text-white truncate">{kitob.nomi}</h1>
      </header>

      <main className="flex-1 min-h-0">
        {oqishData.format === "pdf" ? (
          <PdfOquvchi url={oqishData.url} sahifalarSoni={fayl?.sahifalar_soni ?? null} />
        ) : (
          <EpubOquvchi url={oqishData.url} />
        )}
      </main>
    </div>
  );
}
