import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing, Locale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import ClientShell from "@/components/ClientShell";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { Manrope, Literata } from "next/font/google";
import "../globals.css";

// Interfeys shrifti — kirill va lotin alifbolarini qo'llab-quvvatlaydi.
const manrope = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
});

// Sarlavhalar va kitob nomlari uchun — o'qish uchun mo'ljallangan serif.
const literata = Literata({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-literata",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
    icons: { icon: "/logo.png", apple: "/logo.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  const messages = await getMessages();
  const cookieStore = await cookies();
  const isDark = cookieStore.get("theme")?.value === "dark";

  return (
    <html lang={locale} className={isDark ? "dark" : ""} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (!saved) {
                    var match = document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);
                    if (match) saved = match[1];
                  }
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (saved === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${literata.variable} font-sans min-h-screen flex flex-col bg-paper text-ink`}
      >
        <NextIntlClientProvider messages={messages}>
          <ClientShell initialTheme={isDark ? "dark" : "light"}>{children}</ClientShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
