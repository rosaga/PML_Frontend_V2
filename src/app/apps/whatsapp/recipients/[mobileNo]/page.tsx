"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Card } from "@/components/whatsapp/ui/card";
import { Input } from "@/components/whatsapp/ui/input";
import { Button } from "@/components/whatsapp/ui/button";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Textarea } from "@/components/whatsapp/ui/textarea";
import { ArrowLeft, Send, Phone, CheckCheck, Check, Search } from "lucide-react";
import { useToast } from "@/hooks/whatsapp/use-toast";

interface Message {
  id: string;
  mobile_no: string;
  direction: string;
  type: string;
  category: string;
  status: string;
  template_name?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

interface Recipient {
  mobile_no: string;
  message_count: number;
  last_message_date: string;
  last_message?: string;
}

export default function RecipientChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const mobileNo = decodeURIComponent(params.mobileNo as string);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [config, setConfig] = useState({ apiKey: "", wabaId: "", phoneNumberId: "" });

  useEffect(() => {
    // Load config from localStorage
    const stored = localStorage.getItem("whatsapp-api-config");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.phoneNumberId) {
          setConfig(parsed);
        }
      } catch (error) {
        console.error("Failed to parse config:", error);
      }
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchRecipients();
  }, [mobileNo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  }, [searchQuery, recipients]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchRecipients = async () => {
    try {
      const response = await fetch("/api/whatsapp/whatsapp-internal/messages/list?page=1&size=500");
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        const messages = data.data as any[];
        const recipientMap = new Map<string, Recipient>();
        
        messages.forEach((msg: any) => {
          const mobile = msg.mobile_no;
          if (!mobile) return;
          
          if (!recipientMap.has(mobile)) {
            recipientMap.set(mobile, {
              mobile_no: mobile,
              message_count: 1,
              last_message_date: msg.created_at || msg.updated_at || "",
              last_message: msg.content || `[${msg.type}]`,
            });
          } else {
            const existing = recipientMap.get(mobile)!;
            existing.message_count++;
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
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/whatsapp/whatsapp-internal/messages/list?eq__mobile_no=${encodeURIComponent(mobileNo)}&page=1&size=1000`
      );
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        const sortedMessages = (data.data as Message[]).sort(
          (a, b) =>
            new Date(a.created_at || a.updated_at || "").getTime() -
            new Date(b.created_at || b.updated_at || "").getTime()
        );
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/whatsapp-internal/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "x-phone-number-id": config.phoneNumberId,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          preview_url: false,
          recipient_type: "individual",
          to: mobileNo,
          type: "text",
          text: { body: messageText },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully",
        });
        setMessageText("");
        setTimeout(() => {
          fetchMessages();
          fetchRecipients();
        }, 1000);
      } else {
        throw new Error(data.error?.message || "Failed to send message");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-gray-500" />;
      case "SENT":
        return <Check className="h-3 w-3 text-gray-500" />;
      default:
        return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = formatDate(msg.created_at || msg.updated_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const truncateMessage = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-2rem)] flex">
        {/* Recipients Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">Recipients</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          
          {/* Recipients List */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecipients.map((recipient) => (
              <div
                key={recipient.mobile_no}
                onClick={() => router.push(`/recipients/${encodeURIComponent(recipient.mobile_no)}`)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  recipient.mobile_no === mobileNo ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                    <span className="text-white font-medium text-sm">
                      {recipient.mobile_no.slice(-2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {recipient.mobile_no}
                      </p>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {recipient.message_count}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {recipient.last_message ? truncateMessage(recipient.last_message) : "No messages"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {mobileNo.slice(-2)}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{mobileNo}</h2>
                <p className="text-xs text-gray-500">{messages.length} messages</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center my-4">
                    <Badge variant="secondary" className="text-xs">
                      {date}
                    </Badge>
                  </div>

                  {/* Messages */}
                  {msgs.map((message) => {
                    const isOutgoing = message.direction === "OUTBOUND";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOutgoing ? "justify-end" : "justify-start"} mb-2`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOutgoing
                              ? "bg-[#D9FDD3] text-gray-900"
                              : "bg-white text-gray-900 shadow-sm"
                          }`}
                        >
                          {message.template_name && (
                            <p className="text-xs text-gray-500 mb-1">
                              Template: {message.template_name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content || `[${message.type}]`}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatTime(message.created_at || message.updated_at)}
                            </span>
                            {isOutgoing && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1 resize-none min-h-[44px] max-h-[120px]"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={sending || !messageText.trim()}
                className="bg-[#001F3D] hover:bg-[#003366] h-[44px] px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
