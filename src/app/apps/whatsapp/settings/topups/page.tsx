"use client";

import { useState, useEffect } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/whatsapp/ui/dialog";
import { Wallet, TrendingUp, CheckCircle2, Plus, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { Badge } from "@/components/whatsapp/ui/badge";

interface TopUp {
  id: number;
  amount: number;
  status: string;
  transaction_id: string;
  MSISDN: string;
  created_at: string;
}

interface Stats {
  marketing: number;
  utility: number;
  authentication: number;
}

const CATEGORY_COLORS = {
  MARKETING: "bg-amber-50 border-amber-200",
  UTILITY: "bg-green-50 border-green-200",
  AUTHENTICATION: "bg-red-50 border-red-200",
};

const CATEGORY_BADGE_COLORS = {
  MARKETING: "bg-amber-100 text-amber-800",
  UTILITY: "bg-green-100 text-green-800",
  AUTHENTICATION: "bg-red-100 text-red-800",
};

export default function TopUpsPage() {
  const { organizationExternalId, config, displayPhoneNumber, isLoading: contextLoading } = useConfig();
  const [balance, setBalance] = useState<string | null>(null);
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [stats, setStats] = useState<Stats>({ marketing: 0, utility: 0, authentication: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contextLoading) {
      fetchBalance();
      fetchTopUps();
      fetchStats();
    }
  }, [contextLoading, organizationExternalId, displayPhoneNumber, config.apiKey]);

  const fetchBalance = async () => {
    try {
      if (!displayPhoneNumber || !config.apiKey) return;

      const response = await fetch("/api/balance", {
        headers: {
          "x-display-phone-number": displayPhoneNumber,
          "x-api-key": config.apiKey,
        },
      });
      const data = await response.json();

      if (data.data && data.data[0]) {
        setBalance(data.data[0].balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const fetchTopUps = async () => {
    try {
      if (!organizationExternalId || !config.apiKey) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://peakdata-jja4kcvvdq-ez.a.run.app/api/v1/whatsapp/payment/${organizationExternalId}/list?eq__service=WHATSAPP&eq__status=SUCCESS`,
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch top ups");

      const data = await response.json();
      setTopups(data.data || []);
    } catch (err) {
      console.error("Failed to fetch top ups:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!organizationExternalId || !config.apiKey) return;

      // Fetch successfully sent messages by category
      const categories = ["MARKETING", "UTILITY", "AUTHENTICATION"];
      const statsData: Stats = { marketing: 0, utility: 0, authentication: 0 };

      for (const category of categories) {
        const response = await fetch(
          `https://peakdata-jja4kcvvdq-ez.a.run.app/organization/${organizationExternalId}/wa_message/list?eq__category=${category}&in__status=SENT,DELIVERED,READ&eq__direction=OUTBOUND`,
          {
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const count = data.count || 0;
          const key = category.toLowerCase() as keyof Stats;
          statsData[key] = count;
        }
      }

      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || !msisdn || !organizationExternalId) {
      setError("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `https://peakdata-jja4kcvvdq-ez.a.run.app/api/v1/payment/${organizationExternalId}/whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            Amount: parseFloat(amount),
            MSISDN: msisdn,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate top up");
      }

      // Success - refresh data and close dialog
      setAmount("");
      setMsisdn("");
      setDialogOpen(false);
      await fetchTopUps();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryCards = [
    {
      name: "Marketing",
      value: stats.marketing,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: CATEGORY_COLORS.MARKETING,
    },
    {
      name: "Utility",
      value: stats.utility,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: CATEGORY_COLORS.UTILITY,
    },
    {
      name: "Authentication",
      value: stats.authentication,
      icon: CheckCircle2,
      color: "text-red-600",
      bgColor: CATEGORY_COLORS.AUTHENTICATION,
    },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <Header
          title="Top Ups"
          description="Manage your account balance and top up history"
        />

        <div className="p-6 space-y-6">
          {/* Balance and Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Balance Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Account Balance</CardTitle>
                  <CardDescription>Current credit</CardDescription>
                </div>
                <Wallet className="h-6 w-6 text-blue-500" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  <span className="text-sm text-gray-600">KES </span>
                  {balance ? (parseFloat(balance) * 1.41).toFixed(2) : "0.00"}
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Top Up Account</DialogTitle>
                      <DialogDescription>
                        Enter the amount and phone number to receive an STK push
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleTopUp} className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Amount (KES)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="10"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="msisdn">Phone Number</Label>
                        <Input
                          id="msisdn"
                          type="tel"
                          placeholder="254711438911"
                          value={msisdn}
                          onChange={(e) => setMsisdn(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                          {error}
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {submitting ? "Processing..." : "Send STK Push"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Category Cards */}
            {categoryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.name} className={`border ${card.bgColor}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">Successfully Sent</CardTitle>
                      <CardDescription>{card.name}</CardDescription>
                    </div>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Top Ups History */}
          <Card>
            <CardHeader>
              <CardTitle>Top Up History</CardTitle>
              <CardDescription>Recent successful top ups</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : topups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No top ups yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topups.map((topup) => (
                      <TableRow key={topup.id}>
                        <TableCell className="text-sm">
                          {new Date(topup.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{topup.MSISDN}</TableCell>
                        <TableCell className="font-bold">KES {topup.amount}</TableCell>
                        <TableCell className="font-mono text-sm">{topup.transaction_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {topup.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
