import type { SlipCategory, SlipPaymentMethod } from "@prisma/client";

export const slipCategoryLabels: Record<SlipCategory, string> = {
  GROCERIES: "Groceries",
  FUEL: "Fuel",
  HARDWARE: "Hardware",
  PET_FOOD: "Pet Food",
  HOUSEHOLD: "Household",
  MEDICAL: "Medical",
  SCHOOL_KIDS: "School / Kids",
  EATING_OUT: "Eating Out",
  CLOTHING: "Clothing",
  SUBSCRIPTIONS: "Subscriptions",
  VEHICLE: "Vehicle",
  CASH_SPEND: "Cash Spend",
  PERSONAL: "Personal",
  OTHER: "Other",
};

export const slipPaymentMethodLabels: Record<SlipPaymentMethod, string> = {
  CARD: "Card",
  CASH: "Cash",
  EFT: "EFT",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  OTHER: "Other",
};

export const slipExtractionPrompt = `You are helping me extract personal expense receipt data from receipt/slip photos.

Please read the attached receipt images and return ONLY clean CSV data.

Use this exact CSV header:
date,merchant,category,paymentMethod,totalAmount,vatAmount,notes,items

Rules:
- One receipt must be one CSV row.
- Use date format YYYY-MM-DD.
- Use South African Rand amounts as numbers only, with no R symbol.
- If VAT is not visible, leave vatAmount blank.
- If the merchant/shop is unclear, use the best visible name.
- Put individual bought items inside the items column, separated by semicolons.
- Do not add markdown, explanations, code blocks or extra text.
- Do not invent values. If something is unknown, leave it blank except category and paymentMethod.

Allowed category values:
GROCERIES
FUEL
HARDWARE
PET_FOOD
HOUSEHOLD
MEDICAL
SCHOOL_KIDS
EATING_OUT
CLOTHING
SUBSCRIPTIONS
VEHICLE
CASH_SPEND
PERSONAL
OTHER

Allowed paymentMethod values:
CARD
CASH
EFT
BANK_TRANSFER
CREDIT_CARD
DEBIT_CARD
OTHER

Choose the best category for the main purpose of the receipt.

Example output:
date,merchant,category,paymentMethod,totalAmount,vatAmount,notes,items
2026-05-31,Checkers,GROCERIES,CARD,842.50,109.89,Monthly groceries,"Milk; Bread; Chicken; Vegetables"
2026-05-31,Engen,FUEL,CARD,950.00,,Fuel spend,"Unleaded petrol"

Now extract the attached receipt images into this exact CSV format.`;

export function monthKey(date: Date | string) {
  const parsed = new Date(date);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export function currentMonthKey() {
  return monthKey(new Date());
}

export function monthDateRange(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}
