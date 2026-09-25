"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { MetaFlowSubmissions } from "@/components/whatsapp/meta-flows/meta-flow-submissions";

function MetaFlowSubmissionsContent({
  params,
}: {
  params: { flowId: string };
}) {
  const { flowId } = params;
  const searchParams = useSearchParams();
  const flowName = searchParams.get("flowName") || undefined;
  const metaFlowId = searchParams.get("flowId") || undefined;

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <Header
          title="Submissions"
          description="Review submitted responses for this Meta Flow or catalogue"
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
  params: { flowId: string };
}) {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <MetaFlowSubmissionsContent params={params} />
    </Suspense>
  );
}
