export interface CatalogueOrderItem {
  productCode: string;
  quantity: number | null;
  unitPrice: number | null;
  currency: string;
}

export interface CatalogueOrder {
  items: CatalogueOrderItem[];
  note: string;
  subtotals: { currency: string; amount: number }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function getCatalogueOrder(metadata: unknown): CatalogueOrder | null {
  if (!isRecord(metadata) || !Array.isArray(metadata.order_product_items)) return null;
  if (metadata.order_product_items.length === 0) return null;

  const items = metadata.order_product_items.map((value): CatalogueOrderItem => {
    const item = isRecord(value) ? value : {};
    const quantity = nonNegativeNumber(item.quantity);
    return {
      productCode: typeof item.product_retailer_id === "string" && item.product_retailer_id.trim()
        ? item.product_retailer_id.trim()
        : "Unknown product",
      quantity: quantity !== null && Number.isInteger(quantity) && quantity > 0 ? quantity : null,
      unitPrice: nonNegativeNumber(item.item_price),
      currency: typeof item.currency === "string" ? item.currency.trim().toUpperCase() : "",
    };
  });

  // Only show subtotals when every line has enough data to calculate them.
  const amounts = new Map<string, number>();
  const complete = items.every((item) => {
    if (item.quantity === null || item.unitPrice === null || !item.currency) return false;
    const amount = (amounts.get(item.currency) ?? 0) + item.quantity * item.unitPrice;
    if (!Number.isFinite(amount)) return false;
    amounts.set(item.currency, amount);
    return true;
  });

  return {
    items,
    note: typeof metadata.order_text === "string" ? metadata.order_text.trim() : "",
    subtotals: complete
      ? Array.from(amounts, ([currency, amount]) => ({ currency, amount }))
      : [],
  };
}

export function formatOrderAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}
