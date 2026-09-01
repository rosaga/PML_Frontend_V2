import { useState, useEffect } from "react";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "./flowbot-api";

export interface Flow {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  start_node_id?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  organization_id: string;
}

export function useFlows(organizationId: string | null) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    const fetchFlows = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${FLOWBOT_BASE_URL}/flows?eq__organization_id=${organizationId}&eq__is_active=true&page=1&size=100&orderby=updated_at%20desc`,
          { headers: flowbotHeaders }
        );
        if (!response.ok) throw new Error("Failed to fetch flows");
        const data = await response.json();
        setFlows(data.results || data.data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load flows";
        setError(message);
        console.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlows();
  }, [organizationId]);

  return { flows, loading, error, setFlows };
}
