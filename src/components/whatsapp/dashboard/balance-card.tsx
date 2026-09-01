"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { useConfig } from "@/lib/whatsapp/config-context";
import { Wallet, Plus } from "lucide-react";

interface BalanceData {
  balance: string;
}

export function BalanceCard() {
  const router = useRouter();
  const { config, displayPhoneNumber, isLoading: contextLoading } = useConfig();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (contextLoading || !displayPhoneNumber || !config.apiKey) {
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch("/api/balance", {
          headers: {
            "x-display-phone-number": displayPhoneNumber,
            "x-api-key": config.apiKey,
          },
        });
        const data = await response.json();

        if (data.data && data.data[0]) {
          setBalance(data.data[0].balance);
          setError(null);
        } else {
          setError("Unable to fetch balance");
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        setError("Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    };

    if (!contextLoading) {
      fetchBalance();
    }
  }, [displayPhoneNumber, config.apiKey, contextLoading]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Account Balance</CardTitle>
          <CardDescription>Current WhatsApp credit balance</CardDescription>
        </div>
        <Wallet className="h-6 w-6 text-blue-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold">
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : error ? (
            <span className="text-red-500 text-base">{error}</span>
          ) : (
            <>
              <span className="text-sm text-gray-600">KES </span>
              {balance ? (parseFloat(balance) * 1.41).toFixed(2) : "0.00"}
            </>
          )}
        </div>
        <Button
          onClick={() => router.push("/apps/whatsapp/settings/topups")}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      </CardContent>
    </Card>
  );
}
