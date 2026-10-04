export interface MultilingualName {
  uz: string;
  ru: string;
  en: string;
}

export interface Turi {
  slug: string;
  nomi: MultilingualName;
  kitoblar_soni?: number;
}

export interface Yonalish {
  slug: string;
  nomi: MultilingualName;
  kitoblar_soni: number;
  bolalar: Yonalish[];
}

export interface KitobFayl {
  id: number;
  format: "pdf" | "epub";
  hajm: number;
  sahifalar_soni: number | null;
}

export interface Kitob {
  slug: string;
  nomi: string;
  mualliflar: string[];
  turi: {
    slug: string;
    nomi: MultilingualName;
  };
  yonalishlar: {
    slug: string;
    nomi: MultilingualName;
  }[];
  yil: number | null;
  til: "uz" | "ru" | "en";
  muqova: string;
  formatlar: ("pdf" | "epub")[];
  /** "raqamli" — saytda o'qiladi; "bosma" — faqat kutubxonadagi nusxa. */
  mavjudlik: "raqamli" | "bosma";
  /** Kutubxonadagi jami bosma nusxalar (raqamlida null). */
  nusxalar_soni?: number | null;
  /** Hozir bo'sh turgan nusxalar — qarzga berilganlari ayirilgan. */
  bosh_nusxalar_soni?: number | null;
  /** Raqamli va fayli biriktirilgan bo'lsagina rost. */
  oqish_mumkin: boolean;
  korishlar_soni: number;
}

export interface KitobToliq extends Kitob {
  tavsif: string;
  nashriyot: string;
  qoshilgan_sana: string;
  fayllar: KitobFayl[];
}

export interface Sahifa<T> {
  soni: number;
  keyingi: string | null;
  oldingi: string | null;
  natijalar: T[];
}

export interface KatalogFiltri {
  turi?: string;
  yonalish?: string;
  til?: string;
  mavjudlik?: string;
  yil_dan?: number;
  yil_gacha?: number;
  q?: string;
  saralash?: string;
  sahifa?: number;
}

export interface OqishJavobi {
  url: string;
  format: "pdf" | "epub";
  amal_qiladi: string;
}

export interface KioskAsosiy {
  jami_kitoblar: number;
  raqamli_kitoblar: number;
  bosma_kitoblar: number;
  jami_nusxalar: number;
  bosh_nusxalar: number;
  band_nusxalar: number;
  kitobxonlar_soni: number;
  faol_kitobxonlar: number;
  jami_korishlar: number;
  yonalishlar_soni: number;
  turlar_soni: number;
}

export interface KioskOylikDinamika {
  oy: string;
  oy_raqami: number;
  yil: number;
  kitobxonlar: number;
  olingan_kitoblar: number;
}

export interface KioskKitobReytingi {
  orin: number;
  slug: string;
  nomi: string;
  mualliflar: string[];
  turi: string;
  yonalish: string;
  korishlar_soni: number;
  olingan_soni: number;
  mavjudlik: "raqamli" | "bosma";
  muqova: string;
}

export interface KioskYonalishStat {
  slug: string;
  nomi: string;
  kitoblar_soni: number;
}

export interface KioskTilStat {
  kod: string;
  nomi: string;
  soni: number;
  foiz: number;
}

export interface KioskStatistika {
  asosiy: KioskAsosiy;
  oylik_dinamika: KioskOylikDinamika[];
  kitoblar_reytingi: KioskKitobReytingi[];
  yonalishlar: KioskYonalishStat[];
  tillar: KioskTilStat[];
}

