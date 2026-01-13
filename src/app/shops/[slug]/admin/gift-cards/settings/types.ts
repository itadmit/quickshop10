// Gift Card Settings Types and Defaults
// Separated from actions.ts to avoid "use server" restrictions

export interface GiftCardSettings {
  enabled: boolean;
  amounts: number[];
  allowCustomAmount: boolean;
  minAmount: number;
  maxAmount: number;
  defaultExpiryMonths: number | null; // null = no expiry
  cardImage: string | null;
  pageTitle: string;
  pageDescription: string;
}

export const defaultGiftCardSettings: GiftCardSettings = {
  enabled: false,
  amounts: [50, 100, 200, 500],
  allowCustomAmount: true,
  minAmount: 25,
  maxAmount: 2000,
  defaultExpiryMonths: 12,
  cardImage: null,
  pageTitle: 'גיפט קארד',
  pageDescription: 'הפתעה מושלמת לאנשים שאתם אוהבים',
};

