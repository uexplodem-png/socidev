import { LucideIcon } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  icon: LucideIcon;
  description?: string;
  basePrice: number;
  minQuantity: number;
  maxQuantity: number;
  features: string[];
  urlExample?: string;
}

export type Platform = "instagram" | "youtube";
export type AccentColor = "pink" | "red";

export interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Set<string>;
  quantities: Record<string, number>;
  quantityErrors: Record<string, string>;
  accentColor: AccentColor;
  platform: Platform;
  targetUrls?: Record<string, string>;
  targetUrl?: string;
  onTargetUrlChange?:
    | ((serviceId: string, url: string) => void)
    | ((url: string) => void);
  onServiceToggle: (serviceId: string) => void;
  onQuantityChange: (serviceId: string, value: number) => void;
  hideTargetUrl?: boolean;
  isBulkOrder?: boolean;
  onToggleBulkOrder?: () => void;
}

export interface OrderOptionsProps {
  selectedSpeed: "normal" | "fast" | "express";
  onSpeedChange: (speed: "normal" | "fast" | "express") => void;
  needsInvoice?: boolean;
  onInvoiceChange?: (needs: boolean) => void;
  companyName?: string;
  onCompanyNameChange?: (name: string) => void;
  taxId?: string;
  onTaxIdChange?: (id: string) => void;
}
