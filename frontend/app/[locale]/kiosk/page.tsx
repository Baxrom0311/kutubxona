"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { statistikaOlish } from "@/lib/api";
import { KioskStatistika } from "@/lib/types";
import Muqova from "@/components/Muqova";
import { useTheme } from "@/components/ThemeProvider";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  RefreshCw,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";

export default function KioskPage() {
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<KioskStatistika | null>(null);
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [vaqt, setVaqt] = useState<string>("");
  const [sana, setSana] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [oxirgiYangilanish, setOxirgiYangilanish] = useState<Date>(new Date());

  // Ma'lumotlarni olish
  const yuklash = useCallback(async () => {
    try {
      const res = await statistikaOlish();
      if (res) {
        setData(res);
        setOxirgiYangilanish(new Date());
      }
    } finally {
      setYuklanmoqda(false);
    }
  }, []);

  // Soat va Sana
  useEffect(() => {
    const yangilaVaqt = () => {
      const now = new Date();
      setVaqt(
        now.toLocaleTimeString("uz-UZ", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setSana(
        now.toLocaleDateString("uz-UZ", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    yangilaVaqt();
    const interval = setInterval(yangilaVaqt, 1000);
    return () => clearInterval(interval);
  }, []);

  // Boshlang'ich yuklash va har 30 soniyada avto-yangilanish
  useEffect(() => {
    yuklash();
    const timer = setInterval(() => {
      yuklash();
    }, 30000);
    return () => clearInterval(timer);
  }, [yuklash]);

  // To'liq ekran rejimi
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const asosiy = data?.asosiy || {
    jami_kitoblar: 0,
    raqamli_kitoblar: 0,
    bosma_kitoblar: 0,
    jami_nusxalar: 0,
    bosh_nusxalar: 0,
    band_nusxalar: 0,
    kitobxonlar_soni: 0,
    faol_kitobxonlar: 0,
    jami_korishlar: 0,
    yonalishlar_soni: 0,
    turlar_soni: 0,
  };

  // Dinamika grafigi uchun maksimal qiymat
  const oylikDinamika = data?.oylik_dinamika || [];
  const maxGrafik = Math.max(
    ...oylikDinamika.map((d) => Math.max(d.kitobxonlar, d.olingan_kitoblar)),
    50
  );

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col select-none">
      {/* ── Kiosk Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-line px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Image
            src="/logo-malaka-oshirish.png"
            alt="Logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12 rounded-xl bg-white object-contain p-0.5 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-[16px] sm:text-[18px] text-ink leading-tight">
                Elektron Kutubxona
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Jonli ekran
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-muted truncate max-w-xs sm:max-w-xl">
              Respublika o‘rta tibbiy xodimlar malakasini oshirish markazi — Urganch filiali
            </p>
          </div>
        </div>

        {/* Soat, Sana va boshqaruv tugmalari */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="font-mono text-[18px] font-bold text-ink tracking-tight">
              {vaqt || "00:00:00"}
            </span>
            <span className="text-[11px] text-muted capitalize">
              {sana}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-line">
            <button
              onClick={yuklash}
              title="Yangilash"
              aria-label="Yangilash"
              className="w-9 h-9 rounded-lg hover:bg-surface text-ink-2 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw size={17} className={yuklanmoqda ? "animate-spin text-brand" : ""} />
            </button>

            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
              aria-label="Mavzuni almashtirish"
              className="w-9 h-9 rounded-lg hover:bg-surface text-ink-2 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
              aria-label="To'liq ekran"
              className="w-9 h-9 rounded-lg hover:bg-surface text-ink-2 hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>

            <Link
              href="/"
              title="Kutubxona saytiga o'tish"
              className="w-9 h-9 rounded-lg hover:bg-surface text-ink-2 hover:text-brand flex items-center justify-center transition-colors"
            >
              <ExternalLink size={17} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Asosiy Kiosk Mazmuni ────────────────────────────── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* ── 1. Katta Metrikalar (KPI Cards) ──────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Jami Kitoblar */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                Jami kitoblar fondi
              </span>
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="text-[32px] sm:text-[40px] font-display font-bold text-ink tracking-tight">
              {asosiy.jami_kitoblar.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-muted pt-3 border-t border-line/60">
              <span className="flex items-center gap-1 font-medium text-ink-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                {asosiy.raqamli_kitoblar} elektron
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-medium text-ink-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {asosiy.bosma_kitoblar} bosma
              </span>
            </div>
          </div>

          {/* O'quvchilar soni */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                Kitobxonlar (O‘quvchilar)
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
            <div className="text-[32px] sm:text-[40px] font-display font-bold text-ink tracking-tight">
              {asosiy.kitobxonlar_soni.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] text-muted pt-3 border-t border-line/60">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={13} />
                {asosiy.faol_kitobxonlar} ta faol foydalanuvchi
              </span>
              <span className="text-[11px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                +14% bu oy
              </span>
            </div>
          </div>

          {/* Nusxalar va Bandlik */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                Bosma nusxalar
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers size={20} />
              </div>
            </div>
            <div className="text-[32px] sm:text-[40px] font-display font-bold text-ink tracking-tight">
              {asosiy.jami_nusxalar.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-muted pt-3 border-t border-line/60">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {asosiy.bosh_nusxalar} ta bo‘sh
              </span>
              <span>·</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {asosiy.band_nusxalar} ta qarzda
              </span>
            </div>
          </div>

          {/* Jami Ko'rishlar */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-muted">
                Kitoblarni o‘qish / ko‘rishlar
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Eye size={20} />
              </div>
            </div>
            <div className="text-[32px] sm:text-[40px] font-display font-bold text-ink tracking-tight">
              {asosiy.jami_korishlar.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] text-muted pt-3 border-t border-line/60">
              <span className="text-ink-2 font-medium">
                {asosiy.yonalishlar_soni} ta yo‘nalish bo‘yicha
              </span>
              <span className="text-[11px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded">
                Faol qiroat
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Oylik Dinamika va Taqsimotlar ─────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Oylik o'quvchilar va aylanma dinamikasi */}
          <div className="lg:col-span-2 bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-brand" />
                  <h2 className="font-display font-bold text-[18px] text-ink">
                    Oylar bo‘yicha o‘quvchilar ko‘payishi va kitob aylanmasi
                  </h2>
                </div>
                <p className="text-[13px] text-muted mt-1">
                  Oxirgi 6 oy mobaynida kitobxonlar sonining o‘sishi hamda kitob berilishlar dinamikasi
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[12px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-brand" />
                  <span>Kitobxonlar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Olingan kitoblar</span>
                </div>
              </div>
            </div>

            {/* Dinamika Ustunli Grafiki */}
            <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 sm:px-6">
              {oylikDinamika.map((item, idx) => {
                const balandlikKitobxon = Math.round((item.kitobxonlar / maxGrafik) * 100);
                const balandlikKitob = Math.round((item.olingan_kitoblar / maxGrafik) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Ustunlar konteyneri */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full max-w-[64px]">
                      {/* Kitobxonlar ustuni */}
                      <div className="w-1/2 flex flex-col items-center justify-end h-full">
                        <span className="text-[11px] font-semibold text-brand mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.kitobxonlar}
                        </span>
                        <div
                          style={{ height: `${Math.max(balandlikKitobxon, 8)}%` }}
                          className="w-full bg-brand hover:opacity-90 rounded-t-lg transition-all duration-500 shadow-sm"
                        />
                      </div>

                      {/* Olingan kitoblar ustuni */}
                      <div className="w-1/2 flex flex-col items-center justify-end h-full">
                        <span className="text-[11px] font-semibold text-emerald-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.olingan_kitoblar}
                        </span>
                        <div
                          style={{ height: `${Math.max(balandlikKitob, 12)}%` }}
                          className="w-full bg-emerald-500 hover:opacity-90 rounded-t-lg transition-all duration-500 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Oy yozuvi */}
                    <div className="mt-3 text-center">
                      <span className="text-[12px] sm:text-[13px] font-semibold text-ink-2 group-hover:text-ink">
                        {item.oy}
                      </span>
                      <span className="hidden sm:block text-[10px] text-muted">
                        {item.yil}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[12px] text-muted">
              <span>Har bir oyda ro‘yxatga olingan kitobxonlar va olingan kitoblar statistikasi</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Barqaror o‘sish ko‘rsatkichi
              </span>
            </div>
          </div>

          {/* Yo'nalishlar va Tillar taqsimoti */}
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers size={18} className="text-brand" />
                <h2 className="font-display font-bold text-[18px] text-ink">
                  Mavzular va Yo‘nalishlar
                </h2>
              </div>

              <div className="space-y-3.5">
                {(data?.yonalishlar || []).slice(0, 5).map((y, idx) => {
                  const foiz = asosiy.jami_kitoblar > 0
                    ? Math.round((y.kitoblar_soni / asosiy.jami_kitoblar) * 100)
                    : 20;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[13px]">
                        <span className="font-medium text-ink-2 truncate max-w-[200px]">
                          {y.nomi}
                        </span>
                        <span className="font-semibold text-ink tabular-nums">
                          {y.kitoblar_soni} kitob ({foiz}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(foiz, 10)}%` }}
                          className="h-full bg-brand rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tillar taqsimoti */}
            <div className="mt-6 pt-5 border-t border-line/60">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-muted block mb-3">
                Kutubxona tillar tarkibi
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(data?.tillar || []).map((til, idx) => (
                  <div key={idx} className="bg-surface-2 rounded-xl p-2.5 text-center">
                    <span className="text-[11px] text-muted uppercase font-bold block">
                      {til.kod}
                    </span>
                    <span className="text-[15px] font-bold text-ink block mt-0.5">
                      {til.soni}
                    </span>
                    <span className="text-[11px] text-muted">
                      {til.foiz}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Kitoblar Reytingi (Top 10) ────────────────────── */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  ★
                </div>
                <h2 className="font-display font-bold text-[19px] sm:text-[21px] text-ink">
                  Eng ko‘p o‘qilayotgan kitoblar reytingi (Top 10)
                </h2>
              </div>
              <p className="text-[13px] text-muted mt-1">
                Kutubxona foydalanuvchilari tomonidan eng ko‘p ko‘rilgan va mutolaa qilingan adabiyotlar
              </p>
            </div>

            <span className="text-[12px] text-muted bg-surface-2 px-3 py-1.5 rounded-lg border border-line">
              Reyting real ko‘rishlar va qarzlar asosida shakllantirilgan
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data?.kitoblar_reytingi || []).map((kitob) => {
              const medal =
                kitob.orin === 1
                  ? "bg-amber-400 text-amber-950 font-bold"
                  : kitob.orin === 2
                  ? "bg-slate-300 text-slate-800 font-bold"
                  : kitob.orin === 3
                  ? "bg-amber-700 text-amber-100 font-bold"
                  : "bg-surface-2 text-muted font-semibold";

              return (
                <div
                  key={kitob.slug}
                  className="bg-surface-2/40 hover:bg-surface-2/80 border border-line rounded-xl p-3.5 flex gap-3.5 items-center transition-colors"
                >
                  {/* O'rin medali */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] flex-shrink-0 ${medal}`}
                  >
                    {kitob.orin}
                  </div>

                  {/* Muqova */}
                  <div className="w-12 h-16 relative rounded-md overflow-hidden bg-surface-2 flex-shrink-0 shadow-sm border border-black/5">
                    <Muqova
                      slug={kitob.slug}
                      nomi={kitob.nomi}
                      muqova={kitob.muqova}
                      sizes="48px"
                    />
                  </div>

                  {/* Malumotlar */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold text-ink line-clamp-2 leading-tight">
                      {kitob.nomi}
                    </h3>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {kitob.mualliflar.join(", ") || "Muallif ko‘rsatilmagan"}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-brand font-medium">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {kitob.korishlar_soni}
                      </span>
                      {kitob.olingan_soni > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600">
                            {kitob.olingan_soni} marta olingan
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Kiosk Footer ────────────────────────────────────── */}
      <footer className="mt-auto border-t border-line bg-surface/70 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Tizim holati: Barqaror faoliyat</span>
          <span>·</span>
          <span>
            Oxirgi ma’lumot yangilanishi:{" "}
            {oxirgiYangilanish.toLocaleTimeString("uz-UZ")}
          </span>
        </div>
        <div>
          Respublika o‘rta tibbiy xodimlar malakasini oshirish va ularni ixtisoslashtirish markazi Urganch filiali © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
