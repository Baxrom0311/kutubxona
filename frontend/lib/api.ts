import {
  KatalogFiltri,
  Kitob,
  KitobToliq,
  OqishJavobi,
  Sahifa,
  Turi,
  Yonalish,
} from "./types";

const ASOS = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

export async function kitoblarniOlish(
  params: KatalogFiltri = {}
): Promise<Sahifa<Kitob>> {
  const query = new URLSearchParams();
  if (params.turi) query.set("turi", params.turi);
  if (params.yonalish) query.set("yonalish", params.yonalish);
  if (params.til) query.set("til", params.til);
  if (params.mavjudlik) query.set("mavjudlik", params.mavjudlik);
  if (params.yil_dan) query.set("yil_dan", params.yil_dan.toString());
  if (params.yil_gacha) query.set("yil_gacha", params.yil_gacha.toString());
  if (params.q) query.set("q", params.q);
  if (params.saralash) query.set("saralash", params.saralash);
  if (params.sahifa) query.set("sahifa", params.sahifa.toString());

  try {
    const res = await fetch(`${ASOS}/kitoblar/?${query.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { soni: 0, keyingi: null, oldingi: null, natijalar: [] };
    }
    return await res.json();
  } catch {
    return { soni: 0, keyingi: null, oldingi: null, natijalar: [] };
  }
}

export async function kitobniOlish(slug: string): Promise<KitobToliq | null> {
  try {
    const res = await fetch(`${ASOS}/kitoblar/${encodeURIComponent(slug)}/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function oqishUrlOlish(
  slug: string,
  faylId: number
): Promise<OqishJavobi | null> {
  try {
    const res = await fetch(
      `${ASOS}/kitoblar/${encodeURIComponent(slug)}/oqish/${faylId}/`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function turlarniOlish(): Promise<Turi[]> {
  try {
    const res = await fetch(`${ASOS}/turlar/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function yonalishlarniOlish(): Promise<Yonalish[]> {
  try {
    const res = await fetch(`${ASOS}/yonalishlar/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
