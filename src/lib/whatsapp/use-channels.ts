import { useState, useEffect } from "react";
import { FLOWBOT_BASE_URL, flowbotHeaders } from "./flowbot-api";

export interface Channel {
  id: number;
  type: string;
  shortcode: string;
  language?: string;
  status: string;
  status_description?: string;
  created_at?: string;
  updated_at?: string;
  organization_id: string;
  created_by?: string;
  updated_by?: string;
}

export function useChannels(organizationId: string | null) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    const fetchChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${FLOWBOT_BASE_URL}/channels?eq__organization_id=${organizationId}`,
          { headers: flowbotHeaders }
        );
        if (!response.ok) throw new Error("Failed to fetch channels");
        const data = await response.json();
        setChannels(data.results || data.data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load channels";
        setError(message);
        console.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [organizationId]);

  return { channels, loading, error, setChannels };
}
