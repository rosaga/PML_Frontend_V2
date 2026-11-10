import { ShoppingBag } from "lucide-react";
import { formatOrderAmount, type CatalogueOrder } from "@/lib/whatsapp/catalogue-order";

export function CatalogueOrderCard({ order }: { order: CatalogueOrder }) {
  return (
    <section aria-label="Catalogue order" className="w-80 max-w-full px-4 py-3">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <ShoppingBag aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-500" />
        <div>
          <h3 className="text-sm font-semibold">Catalogue order</h3>
          <p className="text-xs text-gray-500">
            {order.items.length} product{order.items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-gray-100">
        {order.items.map((item, index) => {
          const lineTotal = item.quantity !== null && item.unitPrice !== null
            ? item.quantity * item.unitPrice
            : null;
          return (
            <li key={`${item.productCode}-${index}`} className="space-y-1 py-3">
              <p className="break-words text-sm font-medium">{item.productCode}</p>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-500">Quantity: {item.quantity ?? "Unavailable"}</span>
                <span>
                  {item.unitPrice !== null
                    ? `${formatOrderAmount(item.unitPrice, item.currency)} each`
                    : "Price unavailable"}
                </span>
              </div>
              {lineTotal !== null && Number.isFinite(lineTotal) && (
                <p className="text-right text-sm font-medium tabular-nums">
                  {formatOrderAmount(lineTotal, item.currency)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {order.subtotals.length > 0 && (
        <div className="space-y-1 border-t border-gray-200 pt-3">
          {order.subtotals.map(({ currency, amount }) => (
            <div key={currency} className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm font-semibold">
              <span>Items subtotal</span>
              <span className="tabular-nums">{formatOrderAmount(amount, currency)}</span>
            </div>
          ))}
        </div>
      )}

      {order.note && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="text-xs font-medium text-gray-500">Order note</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{order.note}</p>
        </div>
      )}
    </section>
  );
}
