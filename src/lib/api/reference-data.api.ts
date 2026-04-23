export type CountryOption = {
  code: string;
  name: string;
  currencies: string[];
};

export type InstitutionOption = {
  id: string;
  name: string;
  logoUrl?: string;
};

type RestCountry = {
  cca2?: string;
  name?: { common?: string };
  currencies?: Record<string, unknown>;
};

const BANKS_REPO_RAW_BASE =
  "https://raw.githubusercontent.com/abdalrhman-alajlouni/BanksDataWorldWide/main";

const CARD_NETWORKS: InstitutionOption[] = [
  { id: "visa", name: "Visa", logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/visa.svg" },
  {
    id: "mastercard",
    name: "Mastercard",
    logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/mastercard.svg",
  },
  {
    id: "amex",
    name: "American Express",
    logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/amex.svg",
  },
  {
    id: "discover",
    name: "Discover",
    logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/discover.svg",
  },
  { id: "jcb", name: "JCB", logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/jcb.svg" },
  {
    id: "diners",
    name: "Diners Club",
    logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/diners.svg",
  },
  {
    id: "unionpay",
    name: "UnionPay",
    logoUrl: "https://cdn.jsdelivr.net/npm/credit-card-logos@1.0.5/img/unionpay.svg",
  },
];

const COUNTRY_BANK_FALLBACKS: Record<string, InstitutionOption[]> = {
  pk: [
    {
      id: "meezan_bank",
      name: "Meezan Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=meezanbank.com&sz=128",
    },
    {
      id: "hbl",
      name: "HBL",
      logoUrl: "https://www.google.com/s2/favicons?domain=hbl.com&sz=128",
    },
    {
      id: "ubl",
      name: "UBL",
      logoUrl: "https://www.google.com/s2/favicons?domain=ubl.com.pk&sz=128",
    },
    {
      id: "mcb_bank",
      name: "MCB Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=mcb.com.pk&sz=128",
    },
    {
      id: "allied_bank",
      name: "Allied Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=abl.com&sz=128",
    },
    {
      id: "bank_alfalah",
      name: "Bank Alfalah",
      logoUrl: "https://www.google.com/s2/favicons?domain=bankalfalah.com&sz=128",
    },
    {
      id: "faysal_bank",
      name: "Faysal Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=faysalbank.com&sz=128",
    },
    {
      id: "askari_bank",
      name: "Askari Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=askaribank.com.pk&sz=128",
    },
    {
      id: "bank_al_habib",
      name: "Bank AL Habib",
      logoUrl: "https://www.google.com/s2/favicons?domain=bankalhabib.com&sz=128",
    },
    {
      id: "habibmetro",
      name: "HabibMetro Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=habibmetro.com&sz=128",
    },
    {
      id: "silkbank",
      name: "Silkbank",
      logoUrl: "https://www.google.com/s2/favicons?domain=silkbank.com.pk&sz=128",
    },
    {
      id: "bankislami",
      name: "BankIslami",
      logoUrl: "https://www.google.com/s2/favicons?domain=bankislami.com.pk&sz=128",
    },
    {
      id: "standard_chartered_pk",
      name: "Standard Chartered Pakistan",
      logoUrl: "https://www.google.com/s2/favicons?domain=sc.com/pk&sz=128",
    },
    {
      id: "js_bank",
      name: "JS Bank",
      logoUrl: "https://www.google.com/s2/favicons?domain=jsbl.com&sz=128",
    },
  ],
};

export const referenceDataApi = {
  async getCountries(): Promise<CountryOption[]> {
    const res = await fetch("https://restcountries.com/v3.1/all?fields=cca2,name,currencies");
    if (!res.ok) throw new Error("Could not load countries.");
    const data = (await res.json()) as RestCountry[];
    return data
      .map((c) => ({
        code: (c.cca2 || "").toUpperCase(),
        name: c.name?.common || "",
        currencies: Object.keys(c.currencies || {}).map((cur) => cur.toUpperCase()),
      }))
      .filter((c) => c.code && c.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getBanksByCountry(countryCode: string): Promise<InstitutionOption[]> {
    const normalized = countryCode.trim().toLowerCase();
    if (!normalized) return [];
    const res = await fetch(`${BANKS_REPO_RAW_BASE}/banks-data/banks-json/${normalized}.json`);
    if (!res.ok) return [];
    const payload = (await res.json()) as Record<
      string,
      Record<string, { info?: { ToShowName?: string; official_name?: string }; brand?: { logo?: string } }>
    >;
    const countryBanks = payload[normalized] || payload[normalized.toUpperCase()] || {};
    const banks = Object.entries(countryBanks)
      .map(([officialName, bank]) => {
        const logoPath = bank.brand?.logo;
        return {
          id: officialName,
          name: bank.info?.ToShowName || bank.info?.official_name || officialName,
          logoUrl: logoPath ? `${BANKS_REPO_RAW_BASE}/banks-data/banks-images/${logoPath}` : undefined,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (banks.length > 0) return banks;
    return COUNTRY_BANK_FALLBACKS[normalized] || [];
  },

  getCardNetworks(): InstitutionOption[] {
    return CARD_NETWORKS;
  },
};
