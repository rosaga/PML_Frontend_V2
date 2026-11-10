"use client";

import { Fragment } from "react";
import { useActiveOrganization } from "@/lib/airtime/useOrganizationQuery";

export default function AirtimeOrganizationScope({ children }) {
  const orgId = useActiveOrganization();
  return <Fragment key={orgId || "no-organization"}>{children}</Fragment>;
}
