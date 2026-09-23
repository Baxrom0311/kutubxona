import type { ReactNode } from "react";

/**
 * AI javoblari Markdown ko'rinishida keladi: qalin matn, ro'yxat, sarlavha
 * va havola. To'liq Markdown kutubxonasi o'rniga aynan shu qismi qo'lda
 * ishlanadi — qo'shimcha bog'liqlik qo'shilmaydi va HTML hech qachon xom
 * holda kiritilmaydi (React elementlari yasaladi), ya'ni XSS xavfi yo'q.
 */

const SARLAVHA = /^\s*(#{1,4})\s+(.*)$/;
const BELGILI_BAND = /^\s*[-*•]\s+(.*)$/;
const RAQAMLI_BAND = /^\s*\d+[.)]\s+(.*)$/;

// Ichki belgilar. `**qalin**` `*qiya*` dan oldin turishi shart, aks holda
// yulduzchalar noto'g'ri bo'linadi.
const ICHKI =
  /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;

type Blok =
  | { tur: "paragraf"; matn: string }
  | { tur: "sarlavha"; daraja: number; matn: string }
  | { tur: "royxat"; raqamli: boolean; bandlar: string[] };

/** Faqat xavfsiz protokollarga ruxsat beriladi. */
function xavfsizHavola(url: string): string | null {
  const t = url.trim();
  return /^(https?:\/\/|mailto:)/i.test(t) ? t : null;
}

function ichkiBelgilar(matn: string): ReactNode[] {
  return matn
    .split(ICHKI)
    .filter((bolak) => bolak !== "" && bolak !== undefined)
    .map((bolak, i) => {
      if (bolak.startsWith("**") && bolak.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {bolak.slice(2, -2)}
          </strong>
        );
      }
      if (bolak.startsWith("__") && bolak.endsWith("__")) {
        return (
          <strong key={i} className="font-semibold">
            {bolak.slice(2, -2)}
          </strong>
        );
      }
      if (bolak.startsWith("`") && bolak.endsWith("`")) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[13px]">
            {bolak.slice(1, -1)}
          </code>
        );
      }
      if (bolak.startsWith("[")) {
        const mos = bolak.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        const url = mos ? xavfsizHavola(mos[2]) : null;
        if (mos && url) {
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {mos[1]}
            </a>
          );
        }
        return <span key={i}>{bolak}</span>;
      }
      if (
        (bolak.startsWith("*") && bolak.endsWith("*")) ||
        (bolak.startsWith("_") && bolak.endsWith("_"))
      ) {
        return <em key={i}>{bolak.slice(1, -1)}</em>;
      }
      return <span key={i}>{bolak}</span>;
    });
}

function bloklarga(manba: string): Blok[] {
  const bloklar: Blok[] = [];
  let paragraf: string[] = [];

  const paragrafniYopish = () => {
    if (paragraf.length) {
      bloklar.push({ tur: "paragraf", matn: paragraf.join("\n") });
      paragraf = [];
    }
  };

  for (const qator of manba.split("\n")) {
    if (!qator.trim()) {
      paragrafniYopish();
      continue;
    }

    const sarlavha = qator.match(SARLAVHA);
    if (sarlavha) {
      paragrafniYopish();
      bloklar.push({
        tur: "sarlavha",
        daraja: sarlavha[1].length,
        matn: sarlavha[2],
      });
      continue;
    }

    const belgili = qator.match(BELGILI_BAND);
    const raqamli = belgili ? null : qator.match(RAQAMLI_BAND);
    if (belgili || raqamli) {
      const raqamliMi = Boolean(raqamli);
      const band = (belgili ?? raqamli)![1];
      paragrafniYopish();

      const oxirgi = bloklar[bloklar.length - 1];
      // Ketma-ket kelgan bir xil turdagi bandlar bitta ro'yxatga yig'iladi.
      if (oxirgi && oxirgi.tur === "royxat" && oxirgi.raqamli === raqamliMi) {
        oxirgi.bandlar.push(band);
      } else {
        bloklar.push({ tur: "royxat", raqamli: raqamliMi, bandlar: [band] });
      }
      continue;
    }

    paragraf.push(qator);
  }

  paragrafniYopish();
  return bloklar;
}

export default function Matn({ manba }: { manba: string }) {
  const bloklar = bloklarga(manba);

  return (
    <div className="space-y-2">
      {bloklar.map((blok, i) => {
        if (blok.tur === "sarlavha") {
          return (
            <p
              key={i}
              className={`font-semibold ${blok.daraja <= 2 ? "text-[15px]" : "text-[14px]"}`}
            >
              {ichkiBelgilar(blok.matn)}
            </p>
          );
        }

        if (blok.tur === "royxat") {
          const Teg = blok.raqamli ? "ol" : "ul";
          return (
            <Teg
              key={i}
              className={`space-y-1 ps-5 ${blok.raqamli ? "list-decimal" : "list-disc"}`}
            >
              {blok.bandlar.map((band, j) => (
                <li key={j} className="ps-0.5">
                  {ichkiBelgilar(band)}
                </li>
              ))}
            </Teg>
          );
        }

        return (
          <p key={i} className="whitespace-pre-line">
            {ichkiBelgilar(blok.matn)}
          </p>
        );
      })}
    </div>
  );
}
