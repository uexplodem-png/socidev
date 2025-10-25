import React from "react";
import { Card } from "../../ui/Card";
import { QuantityInput } from "../../ui/QuantityInput";
import { CheckCircle, Link2, AlertCircle } from "lucide-react";
import { Service, Platform, AccentColor } from "./types";
import { Button } from "../../ui/Button";
import { useLanguage } from "../../../context/LanguageContext";

interface ServiceSelectorProps {
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

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServices,
  quantities,
  quantityErrors,
  accentColor,
  platform,
  targetUrls = {},
  targetUrl,
  onTargetUrlChange,
  onServiceToggle,
  onQuantityChange,
  hideTargetUrl = false,
  isBulkOrder = false,
  onToggleBulkOrder,
}) => {
  const { t } = useLanguage();

  const calculateDiscount = (quantity: number): number => {
    if (quantity >= 50000) return 0.15;
    if (quantity >= 10000) return 0.1;
    if (quantity >= 5000) return 0.05;
    return 0;
  };

  const colors = {
    pink: {
      border: "border-pink-500",
      bg: "bg-pink-50",
      hoverBorder: "hover:border-pink-200",
      iconBg: "bg-pink-100",
      iconText: "text-pink-600",
      focus: "focus:border-pink-500 focus:ring-pink-200",
    },
    red: {
      border: "border-red-500",
      bg: "bg-red-50",
      hoverBorder: "hover:border-red-200",
      iconBg: "bg-red-100",
      iconText: "text-red-600",
      focus: "focus:border-red-500 focus:ring-red-200",
    },
  };

  const color = colors[accentColor];

  const validateUrl = (url: string, service: Service): boolean => {
    if (!url) return true; // Empty is valid (will be caught by required field validation)
    if (!service.urlPattern) return true; // No pattern = no validation needed

    try {
      // Try to use pattern as regex first
      const regex = new RegExp(service.urlPattern, 'i'); // case-insensitive
      return regex.test(url);
    } catch (error) {
      // If it's not a valid regex, fall back to string matching
      const lowerUrl = url.toLowerCase();
      const lowerPattern = service.urlPattern.toLowerCase();
      return lowerUrl.includes(lowerPattern);
    }
  };

  const getUrlPlaceholder = (service: Service): string => {
    if (service.urlPattern) {
      return `e.g., ${service.urlPattern}`;
    }
    return `https://${platform}.com/...`;
  };

  const getUrlLabel = (service: Service): string => {
    // If custom label is provided, use it with pattern in parentheses
    if (service.urlLabel && service.urlPattern) {
      return `${service.urlLabel} (Pattern: ${service.urlPattern})`;
    }
    // If only custom label provided
    if (service.urlLabel) {
      return service.urlLabel;
    }
    // If only pattern provided
    if (service.urlPattern) {
      return `Target URL (Pattern: ${service.urlPattern})`;
    }
    return t("targetUrl");
  };

  const getValidationErrorMessage = (service: Service): string => {
    return `${t("invalidUrl") || "Invalid URL"} (Expected to match: ${service.urlPattern})`;
  };

  const handleUrlChange = (serviceId: string, url: string) => {
    if (onTargetUrlChange) {
      if (platform === "instagram" || platform === "youtube") {
        (onTargetUrlChange as (serviceId: string, url: string) => void)(
          serviceId,
          url
        );
      } else {
        (onTargetUrlChange as (url: string) => void)(url);
      }
    }
  };

  const getCurrentUrl = (serviceId: string): string => {
    if (platform === "instagram" || platform === "youtube") {
      return targetUrls[serviceId] || "";
    }
    return targetUrl || "";
  };

  return (
    <Card className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-lg font-semibold text-gray-900'>
          {t("selectServices")}
        </h2>
        {onToggleBulkOrder && (
          <Button
            variant='outline'
            onClick={onToggleBulkOrder}
            className={`${color.focus} border-${accentColor}-200`}>
            {isBulkOrder
              ? t("switchToSingleOrder")
              : t("enableMultipleServices")}
          </Button>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedServices.has(service.id);
          const quantity = quantities[service.id] || service.minQuantity;
          const discount = calculateDiscount(quantity);
          const price = service.basePrice * quantity * (1 - discount);

          return (
            <div
              key={service.id}
              onClick={() => onServiceToggle(service.id)}
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? `${color.border} ${color.bg}`
                  : `border-gray-200 ${color.hoverBorder}`
              }`}>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? color.iconBg : "bg-gray-100"
                    }`}>
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected ? color.iconText : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      {service.name}
                    </h3>
                    <p className='text-sm text-gray-500'>
                      ₺{service.basePrice.toFixed(3)}/each
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? `${color.border} ${color.bg} text-white`
                      : "border-gray-300"
                  }`}>
                  {isSelected && <CheckCircle className='w-4 h-4' />}
                </div>
              </div>

              {isSelected && (
                <div className='space-y-3' onClick={(e) => e.stopPropagation()}>
                  <QuantityInput
                    value={quantity}
                    onChange={(value) => onQuantityChange(service.id, value)}
                    min={service.minQuantity}
                    max={service.maxQuantity}
                    error={quantityErrors[service.id]}
                  />

                  {/* Target URL - Only for Instagram or YouTube and when not hidden */}
                  {(platform === "instagram" || platform === "youtube") &&
                    !hideTargetUrl &&
                    onTargetUrlChange && (
                      <div className='space-y-2'>
                        <label className='block text-sm font-medium text-gray-700'>
                          {getUrlLabel(service)}
                        </label>
                        <div className='relative'>
                          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <Link2
                              className={`w-4 h-4 ${
                                validateUrl(getCurrentUrl(service.id), service)
                                  ? color.iconText
                                  : "text-red-500"
                              }`}
                            />
                          </div>
                          <input
                            type='url'
                            value={getCurrentUrl(service.id)}
                            onChange={(e) =>
                              handleUrlChange(service.id, e.target.value)
                            }
                            placeholder={getUrlPlaceholder(service)}
                            className={`w-full pl-9 pr-3 py-2 rounded-lg border ${
                              !validateUrl(getCurrentUrl(service.id), service) && getCurrentUrl(service.id)
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                : `border-gray-300 ${color.focus}`
                            }`}
                          />
                        </div>
                        {!validateUrl(getCurrentUrl(service.id), service) && getCurrentUrl(service.id) && (
                          <div className='text-sm text-red-600 flex items-center gap-1'>
                            <AlertCircle className='w-4 h-4' />
                            {getValidationErrorMessage(service)}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Service Features */}
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <h4 className='text-sm font-medium text-gray-900 mb-2'>
                      {t("serviceFeatures")}
                    </h4>
                    <ul className='space-y-2'>
                      {service.features.map((feature, index) => (
                        <li
                          key={index}
                          className='flex items-center gap-2 text-sm text-gray-600'>
                          <CheckCircle className='w-4 h-4 text-green-500' />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {discount > 0 && (
                    <div className='text-sm text-green-600 flex items-center gap-1'>
                      <CheckCircle className='w-4 h-4' />
                      {t("bulkDiscount", {
                        discount: (discount * 100).toFixed(0),
                      })}
                    </div>
                  )}

                  <div className='text-right font-medium'>
                    {t("total")}: ₺{price.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
