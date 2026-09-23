import { Link } from "@/i18n/routing";
import { kitobniOlish, oqishUrlOlish } from "@/lib/api";
import { notFound } from "next/navigation";
import PdfViewerClient from "@/components/PdfViewerClient";
import { getTranslations } from "next-intl/server";

interface OqishPageProps {
  params: Promise<{
    slug: string;
    id: string;
    locale: string;
  }>;
}

export default async function OqishPage({ params }: OqishPageProps) {
  const { slug, id, locale } = await params;
  const faylId = parseInt(id, 10);

  const t = await getTranslations({ locale, namespace: "oquvchi" });

  const [kitob, oqishData] = await Promise.all([
    kitobniOlish(slug),
    oqishUrlOlish(slug, faylId),
  ]);

  if (!kitob || !oqishData) {
    notFound();
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full z-50 bg-slate-900 text-white flex flex-col">
      {/* Top Controls Toolbar */}
      <header className="h-14 sm:h-16 px-3 sm:px-6 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between gap-2.5 sm:gap-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <Link
            href={`/kitob/${kitob.slug}`}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            <span className="hidden sm:inline">{t("kitobgaQaytish")}</span>
          </Link>

          <div className="truncate min-w-0">
            <h1 className="font-bold text-xs sm:text-base text-white truncate leading-tight">
              {kitob.nomi}
            </h1>
            <span className="text-[10px] sm:text-[11px] text-teal-400 font-mono uppercase">
              {oqishData.format} format
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={oqishData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
              open_in_new
            </span>
            <span className="hidden md:inline">{t("yangiOynada")}</span>
          </a>
        </div>
      </header>

      {/* Main Document Canvas */}
      <main className="flex-1 w-full h-full overflow-hidden bg-slate-800 flex items-center justify-center relative">
        <PdfViewerClient url={oqishData.url} format={oqishData.format} />
      </main>
    </div>
  );
}
