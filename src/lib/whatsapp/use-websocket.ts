'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/whatsapp/use-toast';
import { useConfig } from '@/lib/whatsapp/config-context';
import { useMessageNotification } from '@/lib/whatsapp/message-context';

interface WebSocketPayload {
  data: {
    id: number;
    mobile_no: string;
    content: string;
    direction: string;
    created_at: string;
    status?: string;
    organization_id: number;
  };
  event: string;
}

export function useWebSocket() {
  const { organizationId } = useConfig();
  const { toast } = useToast();
  const { setHasNewMessage } = useMessageNotification();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!organizationId) return;

    const connectWebSocket = () => {
      try {
        const wsUrl = `wss://peakdata-1048592730476.europe-west4.run.app/whatsapp/websocket?org_id=${organizationId}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const payload: WebSocketPayload = JSON.parse(event.data);
            const message = payload.data;

            // Show notification only for incoming messages
            if (message.direction === 'INBOUND') {
              setHasNewMessage(true);
              const preview = message.content?.substring(0, 50) || '';
              const suffix = message.content && message.content.length > 50 ? '...' : '';

              toast({
                title: 'New Message',
                description: `From ${message.mobile_no}: ${preview}${suffix}`,
                duration: 5000,
              });
            }
          } catch (error) {
            // Silent error handling
          }
        };

        ws.onerror = () => {
          // Silent error handling
        };

        ws.onclose = () => {
          wsRef.current = null;
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            const delay = 3000 * Math.pow(2, reconnectAttempts.current - 1);
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        // Silent error handling
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [organizationId, toast, setHasNewMessage]);
}
