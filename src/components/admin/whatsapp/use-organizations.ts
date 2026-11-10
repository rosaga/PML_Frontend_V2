"use client";

import { useEffect, useState } from "react";
import { getAllWhatsAppOrganizations, isOrganizationExternalId, licenseErrorMessage, type WhatsAppOrganization } from "@/app/api/actions/admin/whatsapp-licenses";

export function useWhatsAppOrganizations() {
  const [organizations, setOrganizations] = useState<WhatsAppOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    async function load() {
      try {
        const data = await getAllWhatsAppOrganizations({}, controller.signal);
        if (!controller.signal.aborted) setOrganizations(data.filter((organization) => isOrganizationExternalId(organization.organization_external_id)));
      } catch (err) {
        if (!controller.signal.aborted) setError(licenseErrorMessage(err, "Failed to load WhatsApp organizations."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [revision]);
  return { organizations, loading, error, refresh: () => setRevision((value) => value + 1) };
}
