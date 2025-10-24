import React from "react";
import { Card } from "../../ui/Card";
import { useLanguage } from "../../../context/LanguageContext";
import { Zap, Receipt, Clock, AlertCircle } from "lucide-react";

interface OrderOptionsProps {
  selectedSpeed: "normal" | "fast" | "express";
  onSpeedChange: (speed: "normal" | "fast" | "express") => void;
  needsInvoice: boolean;
  onInvoiceChange: (needs: boolean) => void;
  companyName: string;
  onCompanyNameChange: (name: string) => void;
  taxId: string;
  onTaxIdChange: (id: string) => void;
}

const speeds = [
  {
    id: "normal",
    icon: Clock,
  },
  {
    id: "fast",
    icon: Zap,
  },
  {
    id: "express",
    icon: Zap,
  },
] as const;

export const OrderOptions: React.FC<OrderOptionsProps> = ({
  selectedSpeed,
  onSpeedChange,
  needsInvoice,
  onInvoiceChange,
  companyName,
  onCompanyNameChange,
  taxId,
  onTaxIdChange,
}) => {
  const { t } = useLanguage();

  return (
    <Card className='p-6'>
      <div className='space-y-8'>
        {/* Speed Selection */}
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            {t("deliverySpeed")}
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {speeds.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type='button'
                onClick={(e) => {
                  e.preventDefault();
                  onSpeedChange(id);
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedSpeed === id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}>
                <div className='flex items-center gap-3 mb-2'>
                  <div
                    className={`p-2 rounded-lg ${
                      selectedSpeed === id ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                    <Icon
                      className={`w-5 h-5 ${
                        selectedSpeed === id ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        selectedSpeed === id ? "text-blue-600" : "text-gray-900"
                      }`}>
                      {t(`${id}Speed`)}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {t(`${id}SpeedDescription`)}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  {id === "normal" ? (
                    <span className='text-sm font-medium text-green-600'>
                      {t("free")}
                    </span>
                  ) : (
                    <span className='text-sm font-medium text-gray-900'>
                      +₺{id === "express" ? "10.00" : "5.00"}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Options */}
        <div>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            {t("invoiceOptions")}
          </h3>
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <input
                type='checkbox'
                id='needsInvoice'
                checked={needsInvoice}
                onChange={(e) => onInvoiceChange(e.target.checked)}
                className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
              />
              <label htmlFor='needsInvoice' className='flex items-center gap-2'>
                <Receipt className='w-5 h-5 text-gray-400' />
                <span className='font-medium text-gray-900'>
                  {t("needInvoice")}
                </span>
              </label>
            </div>

            {needsInvoice && (
              <div className='pl-7 space-y-4'>
                <div className='space-y-2'>
                  <label
                    htmlFor='companyName'
                    className='block text-sm font-medium text-gray-700'>
                    {t("companyName")}
                  </label>
                  <input
                    type='text'
                    id='companyName'
                    value={companyName}
                    onChange={(e) => onCompanyNameChange(e.target.value)}
                    className='w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    placeholder={t("companyName")}
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='taxId'
                    className='block text-sm font-medium text-gray-700'>
                    {t("taxId")}
                  </label>
                  <input
                    type='text'
                    id='taxId'
                    value={taxId}
                    onChange={(e) => onTaxIdChange(e.target.value)}
                    className='w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    placeholder={t("taxId")}
                  />
                </div>

                <div className='flex items-start gap-2 text-sm text-gray-500'>
                  <AlertCircle className='w-4 h-4 mt-0.5 flex-shrink-0' />
                  <p>{t("invoiceNote")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
