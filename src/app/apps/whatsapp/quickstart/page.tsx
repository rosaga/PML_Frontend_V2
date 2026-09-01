"use client";

import { DashboardLayout } from "@/components/whatsapp/dashboard/layout";
import { Header } from "@/components/whatsapp/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/whatsapp/ui/card";
import { useConfig } from "@/lib/whatsapp/config-context";
import { ApiConfigSettings } from "@/components/whatsapp/settings/api-config";
import Link from "next/link";
import {
  FileText,
  Send,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Settings,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/whatsapp/ui/accordion";

const FACEBOOK_SIGNUP_URL = "https://www.facebook.com/v23.0/dialog/oauth?app_id=510280054876878&cbt=1769840138369&channel_url=https%3A%2F%2Fstaticxx.facebook.com%2Fx%2Fconnect%2Fxd_arbiter%2F%3Fversion%3D46%23cb%3Df3ebb8a444d88c0ac%26domain%3Dpinnacle.in%26is_canvas%3Dfalse%26origin%3Dhttps%253A%252F%252Fpinnacle.in%252Ff4f0582640571b3a0%26relation%3Dopener&client_id=510280054876878&config_id=1655013918467875&display=popup&domain=pinnacle.in&e2e=%7B%7D&extras=%7B%22features%22%3A[%7B%22name%22%3A%22marketing_messages_lite%22%7D]%2C%22featureType%22%3A%22%22%2C%22sessionInfoVersion%22%3A3%2C%22version%22%3A%22v3%22%2C%22setup%22%3A%7B%22solutionID%22%3A%22682126398255116%22%7D%7D&fallback_redirect_uri=https%3A%2F%2Fpinnacle.in%2Fembedded-signup%2Ffb-signup.php%3Ftoken%3DRDmkTF1gjSZwWt3HOz4ovXc0pkmuESd8YPbRswIlQ8wwjmT5TpTUaJFU1qNQWB4o%26app_id%3DN5xBmxUchvMn%252FUmWSnMcuw%253D%253D%26config_id%3D9fwuNgyna0yaKv37A9XbzJtHTlYLYCcnfoIr2nQy9IE%253D%26solution_id%3DqXJUczXcUrdu%252BxupKJx0IQ%253D%253D%26mode%3DsyY6PAgG1PR5fAG1p89cCw%253D%253D%26themecolor%3D001d4c%26app_secret%3DmlFcuR6zu%252FiphoAGOX5O4jpul6Tu%252Bg4%252FmvzQdf1m3WKbR05WC2AnJ36CK9p0MvSB&locale=en_US&logger_id=f66dc2c10f4af1ca6&origin=1&override_default_response_type=true&redirect_uri=https%3A%2F%2Fstaticxx.facebook.com%2Fx%2Fconnect%2Fxd_arbiter%2F%3Fversion%3D46%23cb%3Df71d729e5641852fe%26domain%3Dpinnacle.in%26is_canvas%3Dfalse%26origin%3Dhttps%253A%252F%252Fpinnacle.in%252Ff4f0582640571b3a0%26relation%3Dopener%26frame%3Df6582c5caf71a2b01&response_type=code&sdk=joey&version=v23.0";

const features = [
  {
    name: "WABA Application",
    description: "Connect your WhatsApp Business Account",
    href: FACEBOOK_SIGNUP_URL,
    icon: ExternalLink,
    color: "bg-blue-500/10 text-blue-600",
    external: true,
  },
  {
    name: "Templates",
    description: "Create and manage WhatsApp message templates",
    href: "/apps/whatsapp/templates",
    icon: FileText,
    color: "bg-chart-1/10 text-chart-1",
  },
  {
    name: "Bulk Message",
    description: "Send messages to multiple recipients at once",
    href: "/apps/whatsapp/send?tab=bulk",
    icon: MessageSquare,
    color: "bg-chart-3/10 text-chart-3",
  },
];

function DashboardContent() {
  const { isConfigured } = useConfig();

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" description="WhatsApp Business Messaging Platform" />

      <div className="p-6 space-y-6">
        {!isConfigured && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                <Settings className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">Configuration Required</h3>
                <p className="text-sm text-muted-foreground">
                  Please configure your API settings to start using the platform.
                </p>
              </div>
              <Link
                href="/apps/whatsapp/settings"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Configure Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const card = (
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                <CardHeader>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">{feature.name}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="flex items-center text-sm text-primary">
                    {feature.external ? "Connect" : "Open"}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            );

            if (feature.external) {
              return (
                <a
                  key={feature.name}
                  href={feature.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(feature.href, "Facebook Signup", "width=600,height=700,scrollbars=yes");
                  }}
                >
                  {card}
                </a>
              );
            }

            return (
              <Link key={feature.name} href={feature.href}>
                {card}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Get started with WhatsApp Business API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-2">
                <h4 className="font-semibold text-blue-900">Prerequisites</h4>
                <ul className="space-y-1 text-blue-800 list-disc list-inside">
                  <li>You must have admin access to your Meta Business Manager</li>
                  <li>You must have a phone number that does not have a WhatsApp Account</li>
                </ul>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</span>
                  <span className="text-muted-foreground">Configure your API credentials in the Settings page</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">2</span>
                  <span className="text-muted-foreground">Create message templates for your campaigns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">3</span>
                  <span className="text-muted-foreground">Wait for template approval from WhatsApp</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">4</span>
                  <span className="text-muted-foreground">Start sending messages to your audience</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Information</CardTitle>
              <CardDescription>Peak API Integration Details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Base URL</span>
                  <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">partnersv1.pinbot.ai/v3</code>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">API Version</span>
                  <span className="font-medium">v3</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-muted-foreground">Authentication</span>
                  <span className="font-medium">API Key Header</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Protocol</span>
                  <span className="font-medium">HTTPS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Common questions about WhatsApp Business API setup and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  What is a WhatsApp Business Account (WABA)?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  A WhatsApp Business Account (WABA) is a special account type that allows businesses to send messages at scale. It requires verification with Meta and provides access to the WhatsApp Business API for programmatic message sending and management.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  How long does template approval take?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Template approval typically takes 15 minutes to a few hours, depending on template complexity and content. Simple transactional templates are usually approved faster than marketing templates. You&apos;ll receive a notification once your template is approved or rejected.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  What types of messages can I send?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  You can send text, images, documents, audio, video, and location messages. Messages must comply with WhatsApp policies - no spam, adult content, or misleading information. Use approved templates for best practices and higher delivery rates.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  Can I send messages to anyone on WhatsApp?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  You can only send messages to users who have opted in to receive messages from your business. WhatsApp enforces a 24-hour message window rule - users can only reply to your messages within 24 hours. After that, you need to send a template message to re-engage them.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  How are messages billed?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Billing depends on message type and direction. Business-initiated messages (like templates) are charged at standard rates. Customer-initiated messages (replies) are often free or charged at lower rates. Exact pricing depends on your business plan and messaging volume.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QuickstartPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
