"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { MetaFlowSubmissions } from "@/components/whatsapp/meta-flows/meta-flow-submissions";

function MetaFlowSubmissionsContent({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  const { flowId } = use(params);
  const searchParams = useSearchParams();
  const flowName = searchParams.get("flowName") || undefined;
  const metaFlowId = searchParams.get("flowId") || undefined;

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <Header
          title="Meta Flow Submissions"
          description="Review submitted responses for this WhatsApp Flow"
        />
        <div className="p-6">
          <MetaFlowSubmissions flowId={flowId} flowName={flowName} metaFlowId={metaFlowId} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function MetaFlowSubmissionsPage({
  params,
}: {
  params: Promise<{ flowId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <MetaFlowSubmissionsContent params={params} />
    </Suspense>
  );
}
