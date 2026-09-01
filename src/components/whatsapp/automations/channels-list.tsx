"use client";

import React, { useState } from "react";
import { useConfig } from "@/lib/whatsapp/config-context";
import { useChannels } from "@/lib/whatsapp/use-channels";
import { Button } from "@/components/whatsapp/ui/button";
import { Card } from "@/components/whatsapp/ui/card";
import { Badge } from "@/components/whatsapp/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/whatsapp/ui/table";
import { Copy, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/whatsapp/ui/alert-dialog";

interface ChannelsListProps {
  onCreateChannel: () => void;
}

export function ChannelsList({ onCreateChannel }: ChannelsListProps) {
  const { organizationExternalId } = useConfig();
  const { channels, loading, error } = useChannels(organizationExternalId);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<number | null>(null);

  const handleCopyShortcode = (shortcode: string) => {
    navigator.clipboard.writeText(shortcode);
    setCopiedId(parseInt(shortcode));
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Channels</h3>
          <p className="text-sm text-muted-foreground">
            Manage your WhatsApp channels and phone numbers
          </p>
        </div>
        <Button onClick={onCreateChannel} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Channel
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 text-red-900 border-red-200">
          {error}
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center">Loading channels...</Card>
      ) : channels.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No channels found. Create one to get started.
          </p>
          <Button onClick={onCreateChannel}>Create Channel</Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel: any) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {channel.shortcode}
                    <button
                      onClick={() => handleCopyShortcode(channel.shortcode)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy phone number"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </TableCell>
                  <TableCell>{channel.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        channel.status === "LIVE" ? "default" : "secondary"
                      }
                    >
                      {channel.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(channel.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteChannelId(channel.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog
        open={deleteChannelId !== null}
        onOpenChange={(open) => !open && setDeleteChannelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this channel? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // TODO: Implement delete API call
                setDeleteChannelId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
