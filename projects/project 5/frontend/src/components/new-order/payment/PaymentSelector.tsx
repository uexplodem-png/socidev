import React from "react";
import { Card } from "../../ui/Card";
import { useLanguage } from "../../../context/LanguageContext";
import { CreditCard, Wallet, Bitcoin, Receipt, Shield } from "lucide-react";
import { CreditCardForm } from "./forms/CreditCardForm";
import { CryptoForm } from "./forms/CryptoForm";
import { BalanceForm } from "./forms/BalanceForm";
import { PaymentMethod, PaymentSelectorProps } from "./types";

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  amount,
  onPaymentComplete,
  selectedServices = [],
  balance,
}) => {
  const { t } = useLanguage();

  const paymentMethods: PaymentMethod[] = [
    {
      id: "credit-card",
      name: t("creditCard"),
      icon: CreditCard,
      description: t("creditCardDescription"),
      fee: "3%",
    },
    {
      id: "balance",
      name: t("accountBalance"),
      icon: Wallet,
      description: t("accountBalanceDescription"),
      fee: "0%",
    },
    {
      id: "crypto",
      name: t("cryptocurrency"),
      icon: Bitcoin,
      description: t("cryptocurrencyDescription"),
      fee: "1%",
    },
  ];

  return (
    <Card className='p-6'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center'>
          <Receipt className='w-5 h-5 text-blue-600' />
        </div>
        <div>
          <h3 className='font-medium text-gray-900'>{t("orderSummary")}</h3>
          <p className='text-sm text-gray-500'>{t("reviewOrder")}</p>
        </div>
      </div>

      <div className='space-y-6'>
        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <div className='bg-gray-50 rounded-lg p-4'>
            <h4 className='text-sm font-medium text-gray-700 mb-3'>
              {t("selectedServices")}
            </h4>
            <div className='space-y-2'>
              {selectedServices.map((service, index) => (
                <div key={index} className='flex justify-between text-sm'>
                  <span className='text-gray-600'>{service.name}</span>
                  <span className='font-medium'>
                    ₺{service.price.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className='pt-2 mt-2 border-t border-gray-200'>
                <div className='flex justify-between text-sm font-medium'>
                  <span className='text-gray-900'>{t("total")}</span>
                  <span className='text-gray-900'>₺{amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type='button'
              onClick={() => onMethodChange(method.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedMethod === method.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-200"
              }`}>
              <div className='flex items-center gap-2'>
                <method.icon
                  className={`w-5 h-5 ${
                    selectedMethod === method.id
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                />
                <span className='font-medium'>{method.name}</span>
              </div>
              <p className='text-sm text-gray-500 mt-1'>{method.description}</p>
              <p className='text-sm font-medium text-gray-600 mt-2'>
                {t("fee")}: {method.fee}
              </p>
            </button>
          ))}
        </div>

        {/* Payment Forms */}
        <div className='pt-4'>
          {selectedMethod === "credit-card" && (
            <CreditCardForm onSubmit={onPaymentComplete} />
          )}
          {selectedMethod === "crypto" && (
            <CryptoForm amount={amount} onSubmit={onPaymentComplete} />
          )}
          {selectedMethod === "balance" && (
            <BalanceForm
              balance={balance}
              amount={amount}
              onSubmit={onPaymentComplete}
              onAddBalance={() => (window.location.href = "/add-balance")}
            />
          )}
        </div>

        {/* Security Note */}
        <div className='flex items-start gap-2 text-sm text-gray-500'>
          <Shield className='w-4 h-4 mt-0.5' />
          <p>{t("securityNote")}</p>
        </div>
      </div>
    </Card>
  );
};
