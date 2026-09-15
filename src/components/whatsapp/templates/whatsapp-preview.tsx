"use client";

import { type Template, type TemplateComponent } from "@/lib/whatsapp/whatsapp-api";
import { ImageIcon, FileText, Video, MapPin } from "lucide-react";

interface WhatsAppPreviewProps {
  template: Template;
  headerParams?: string[];
  bodyParams?: string[];
  compact?: boolean;
  chatOnly?: boolean; // Landscape chat bubble only, no phone frame
}

export function WhatsAppPreview({ template, headerParams = [], bodyParams = [], compact = false, chatOnly = false }: WhatsAppPreviewProps) {
  const header = template.components?.find((c) => c.type === "HEADER");
  const body = template.components?.find((c) => c.type === "BODY");
  const footer = template.components?.find((c) => c.type === "FOOTER");
  const buttons = template.components?.find((c) => c.type === "BUTTONS");

  const replaceVariables = (text: string | undefined, params: string[]): string => {
    if (!text) return "";
    let result = text;
    params.forEach((param, index) => {
      const placeholder = `{{${index + 1}}}`;
      result = result.replace(placeholder, param || placeholder);
    });
    return result;
  };

  const getHeaderMediaUrl = (headerComponent: TemplateComponent): string | null => {
    return headerComponent.example?.header_handle?.[0] || null;
  };

  const renderHeader = (headerComponent: TemplateComponent) => {
    const mediaUrl = getHeaderMediaUrl(headerComponent);

    switch (headerComponent.format) {
      case "IMAGE":
        return mediaUrl ? (
          <div className="aspect-video w-full bg-gray-200 rounded-t-lg overflow-hidden">
            <img
              src={mediaUrl}
              alt="Template header"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.currentTarget;
                target.style.display = "none";
                target.parentElement?.classList.add("flex", "items-center", "justify-center");
                const icon = document.createElement("div");
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                target.parentElement?.appendChild(icon);
              }}
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-gray-200 flex items-center justify-center rounded-t-lg">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
        );
      case "VIDEO":
        return mediaUrl ? (
          <div className="aspect-video w-full bg-gray-900 rounded-t-lg overflow-hidden relative flex items-center justify-center">
            <video src={mediaUrl} className="w-full h-full object-cover" muted />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                <Video className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full bg-gray-200 flex items-center justify-center rounded-t-lg">
            <Video className="h-12 w-12 text-gray-400" />
          </div>
        );
      case "DOCUMENT":
        return (
          <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-t-lg border-b">
            <FileText className="h-8 w-8 text-red-500" />
            <span className="text-sm text-gray-600">Document</span>
          </div>
        );
      case "LOCATION":
        return (
          <div className="aspect-video w-full bg-gray-200 flex items-center justify-center rounded-t-lg">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
        );
      case "TEXT":
      default:
        return headerComponent.text ? (
          <div className="font-semibold text-gray-900 mb-1">
            {replaceVariables(headerComponent.text, headerParams)}
          </div>
        ) : null;
    }
  };

  // Chat-only mode - just the message bubble, landscape friendly
  if (chatOnly) {
    return (
      <div className="w-full max-w-md rounded-lg bg-[#efeae2] p-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fillRule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc4\' fillOpacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden max-w-[90%]">
          {/* Header */}
          {header && header.format !== "TEXT" && renderHeader(header)}
          
          {/* Body */}
          <div className="p-3">
            {header?.format === "TEXT" && header.text && (
              <div className="font-semibold text-gray-900 mb-2 text-sm">
                {replaceVariables(header.text, headerParams)}
              </div>
            )}
            
            {body?.text && (
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {replaceVariables(body.text, bodyParams)}
              </div>
            )}
            
            {footer?.text && (
              <div className="text-xs text-gray-500 mt-2">
                {footer.text}
              </div>
            )}
            
            {/* Timestamp */}
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-gray-400">12:00 PM</span>
            </div>
          </div>
          
          {/* Buttons */}
          {buttons?.buttons && buttons.buttons.length > 0 && (
            <div className="border-t border-gray-100">
              {buttons.buttons.map((btn, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 text-center text-[#00a884] text-sm font-medium border-b border-gray-100 last:border-b-0"
                >
                  {btn.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact sizes for inline preview, full sizes for detail view
  const phoneWidth = compact ? "w-[180px]" : "w-[300px]";
  const phoneHeight = compact ? "h-[320px]" : "h-[600px]";
  const phoneRounding = compact ? "rounded-[24px]" : "rounded-[40px]";
  const screenRounding = compact ? "rounded-[20px]" : "rounded-[32px]";
  const notchWidth = compact ? "w-20" : "w-32";
  const headerPadding = compact ? "px-2 py-1.5 pt-5" : "px-4 py-3 pt-8";
  const avatarSize = compact ? "w-6 h-6" : "w-10 h-10";
  const textSize = compact ? "text-[10px]" : "text-sm";
  const smallTextSize = compact ? "text-[8px]" : "text-xs";

  return (
    <div className="flex flex-col items-center">
      {/* Phone Frame */}
      <div className={`relative ${phoneWidth} ${phoneHeight} bg-black ${phoneRounding} p-1.5 shadow-xl`}>
        {/* Phone Notch */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${notchWidth} h-4 bg-black rounded-b-xl z-10`} />
        
        {/* Phone Screen */}
        <div className={`w-full h-full bg-[#efeae2] ${screenRounding} overflow-hidden flex flex-col`}>
          {/* WhatsApp Header */}
          <div className={`bg-[#075e54] text-white ${headerPadding} flex items-center gap-2`}>
            <div className={`${avatarSize} rounded-full bg-gray-300 flex items-center justify-center shrink-0`}>
              <span className={`text-gray-500 ${compact ? "text-xs" : "text-lg"} font-medium`}>B</span>
            </div>
            <div className="min-w-0">
              <div className={`font-medium ${textSize} truncate`}>Business</div>
              <div className={`${smallTextSize} text-green-200`}>online</div>
            </div>
          </div>
          
          {/* Chat Background Pattern */}
          <div className={`flex-1 ${compact ? "p-2" : "p-3"} overflow-y-auto`} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fillRule=\'evenodd\'%3E%3Cg fill=\'%23d4cfc4\' fillOpacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
            {/* Message Bubble */}
            <div className={`${compact ? "max-w-full" : "max-w-[85%]"} bg-white rounded-lg shadow-sm overflow-hidden`}>
              {/* Header */}
              {header && renderHeader(header)}
              
              {/* Body */}
              <div className={compact ? "p-2" : "p-3"}>
                {header?.format === "TEXT" && header.text && (
                  <div className={`font-semibold text-gray-900 ${compact ? "mb-1 text-[10px]" : "mb-2"}`}>
                    {replaceVariables(header.text, headerParams)}
                  </div>
                )}
                
                {body?.text && (
                  <div className={`text-gray-800 whitespace-pre-wrap ${compact ? "text-[9px] leading-tight" : "text-sm"}`}>
                    {replaceVariables(body.text, bodyParams)}
                  </div>
                )}
                
                {footer?.text && (
                  <div className={`text-gray-500 ${compact ? "mt-1 text-[8px]" : "mt-2 text-xs"}`}>
                    {footer.text}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="flex justify-end mt-1">
                  <span className={`text-gray-400 ${compact ? "text-[7px]" : "text-[10px]"}`}>12:00 PM</span>
                </div>
              </div>
              
              {/* Buttons */}
              {buttons?.buttons && buttons.buttons.length > 0 && (
                <div className="border-t border-gray-100">
                  {buttons.buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className={`text-center text-[#00a884] font-medium border-b border-gray-100 last:border-b-0 ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-sm"}`}
                    >
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Input Area - hidden in compact mode */}
          {!compact && (
            <div className="bg-[#f0f0f0] p-2 flex items-center gap-2">
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-400">
                Type a message
              </div>
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Template Info - smaller in compact mode */}
      {!compact && (
        <div className="mt-4 text-center">
          <div className="text-sm font-medium text-foreground">{template.name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {template.category} • {template.language || "en_US"}
          </div>
        </div>
      )}
    </div>
  );
}
