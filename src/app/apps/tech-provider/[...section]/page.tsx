import { notFound } from "next/navigation";
import { TechProviderScreen } from "@/components/tech-provider/screens";
import { previewRoutes, resolveDetailRoute } from "@/components/tech-provider/navigation";
import { TechProviderDetailScreen } from "@/components/tech-provider/detail-screens";

export default function TechProviderFeaturePage({ params, searchParams }: {
  params: { section: string[] };
  searchParams: { tab?: string };
}) {
  const page = params.section.join("/");
  const detail = resolveDetailRoute(params.section);
  if (detail) return <TechProviderDetailScreen key={page} kind={detail.kind} id={detail.id} />;
  if (!previewRoutes.includes(page)) notFound();
  return <TechProviderScreen key={`${page}:${searchParams.tab || ""}`} page={page} initialTab={searchParams.tab} />;
}
