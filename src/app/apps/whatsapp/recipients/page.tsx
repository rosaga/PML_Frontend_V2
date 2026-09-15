"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card, CardContent } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Button } from "@/components/whatsapp/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { Search, MessageSquare, Phone, ChevronLeft, ChevronRight } from "lucide-react";

interface Recipient {
  mobile_no: string;
  message_count: number;
  last_message_date: string;
  last_message?: string;
}

function RecipientsContent() {
  const router = useRouter();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredRecipients(
        recipients.filter((r) =>
          r.mobile_no.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredRecipients(recipients);
    }
    setPage(1); // Reset to first page on search
  }, [searchQuery, recipients]);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      // Fetch messages and extract unique recipients (fetch more messages to get more recipients)
      const response = await fetch("/api/whatsapp/whatsapp-internal/messages/list?page=1&size=500");
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        const messages = data.data as any[];
        
        // Group by mobile_no
        const recipientMap = new Map<string, Recipient>();
        
        messages.forEach((msg: any) => {
          const mobileNo = msg.mobile_no;
          if (!mobileNo) return;
          
          if (!recipientMap.has(mobileNo)) {
            recipientMap.set(mobileNo, {
              mobile_no: mobileNo,
              message_count: 1,
              last_message_date: msg.created_at || msg.updated_at || "",
              last_message: msg.content || `[${msg.type}]`,
            });
          } else {
            const existing = recipientMap.get(mobileNo)!;
            existing.message_count++;
            // Update last message date if newer
            if (msg.created_at && msg.created_at > existing.last_message_date) {
              existing.last_message_date = msg.created_at;
              existing.last_message = msg.content || `[${msg.type}]`;
            }
          }
        });

        const uniqueRecipients = Array.from(recipientMap.values()).sort(
          (a, b) => new Date(b.last_message_date).getTime() - new Date(a.last_message_date).getTime()
        );
        
        setRecipients(uniqueRecipients);
        setFilteredRecipients(uniqueRecipients);
      }
    } catch (error) {
      console.error("Failed to fetch recipients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientClick = (mobileNo: string) => {
    router.push(`/recipients/${encodeURIComponent(mobileNo)}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Recipients"
        description="View and chat with all your WhatsApp recipients"
      />

      <div className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Recipients Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading recipients...</div>
        ) : filteredRecipients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No recipients found
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead className="text-center">Messages</TableHead>
                    <TableHead>Last Message</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients
                    .slice((page - 1) * pageSize, page * pageSize)
                    .map((recipient) => (
                      <TableRow
                        key={recipient.mobile_no}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRecipientClick(recipient.mobile_no)}
                      >
                        <TableCell>
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {recipient.mobile_no.slice(-2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {recipient.mobile_no}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {recipient.message_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                          {recipient.last_message || "No messages"}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {formatDate(recipient.last_message_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <MessageSquare className="h-4 w-4 text-gray-400 inline-block" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>

            {/* Pagination */}
            {filteredRecipients.length > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, filteredRecipients.length)} of{" "}
                  {filteredRecipients.length} recipients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(filteredRecipients.length / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(Math.ceil(filteredRecipients.length / pageSize), p + 1))
                    }
                    disabled={page === Math.ceil(filteredRecipients.length / pageSize)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RecipientsPage() {
  return (
    <DashboardLayout>
      <RecipientsContent />
    </DashboardLayout>
  );
}
