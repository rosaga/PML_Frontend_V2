"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/whatsapp/use-toast";
import { Button } from "@/components/whatsapp/ui/button";
import { Input } from "@/components/whatsapp/ui/input";
import { Label } from "@/components/whatsapp/ui/label";
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/whatsapp/ui/select";

interface Channel {
  id: number;
  name: string;
  type: string;
}

interface ChannelKeyword {
  channel_id: number;
  keyword: string;
  flow_id?: number;
}

interface ChannelLinkerProps {
  flowId: number;
  channels: Channel[];
  onSave?: (keywords: ChannelKeyword[]) => void;
  loading?: boolean;
}

export function ChannelLinker({
  flowId,
  channels,
  onSave,
  loading,
}: ChannelLinkerProps) {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<ChannelKeyword[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddKeyword = () => {
    if (!selectedChannelId || !keyword.trim()) {
      alert("Please select a channel and enter a keyword");
      return;
    }

    const newKeyword: ChannelKeyword = {
      channel_id: selectedChannelId,
      keyword: keyword.trim(),
      flow_id: flowId,
    };

    setKeywords([...keywords, newKeyword]);
    setKeyword("");
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all keywords
      for (const kw of keywords) {
        await fetch("/api/flowbot/channel-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(kw),
        });
      }
      onSave?.(keywords);
      toast({
        title: "Success",
        description: "Triggers connected to flow successfully",
      });
    } catch (error) {
      console.error("Failed to save keywords:", error);
      toast({
        title: "Error",
        description: "Failed to connect triggers to flow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-4">Channel Triggers</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect channels and add keywords to trigger this flow
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="channel-select">Channel</Label>
          <Select value={selectedChannelId?.toString() || ""}>
            <SelectTrigger id="channel-select">
              <SelectValue placeholder="Select a channel" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id.toString()}>
                  {channel.name} ({channel.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keyword-input">Keyword</Label>
          <div className="flex gap-2">
            <Input
              id="keyword-input"
              placeholder="e.g., TRACK, SUPPORT, APPLY"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button onClick={handleAddKeyword} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Added Keywords</Label>
          {keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No keywords added yet
            </p>
          ) : (
            <div className="space-y-2">
              {keywords.map((kw, index) => {
                const channel = channels.find((c) => c.id === kw.channel_id);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{kw.keyword}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {channel?.name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveKeyword(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || keywords.length === 0}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Keywords"}
        </Button>
      </div>
    </Card>
  );
}
