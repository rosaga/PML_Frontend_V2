import FailedDispatches from "@/components/admin/whatsapp/failed-dispatches";

const products = ["All", "SMS", "Data", "WhatsApp"] as const;

export default function FailedDispatchesPage({ searchParams }: { searchParams?: { product?: string } }) {
  const initialProduct = products.find((product) => product === searchParams?.product) || "All";
  return <FailedDispatches key={initialProduct} initialProduct={initialProduct} />;
}
