import React, { useState } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

interface CreditCardFormProps {
  onSubmit: (data: any) => void;
}

export const CreditCardForm = ({ onSubmit }: CreditCardFormProps) => {
  const { t } = useLanguage();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + (cleaned.length > 2 ? '/' + cleaned.slice(2, 4) : '');
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(formatExpiryDate(value));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const validateExpiryDate = (value: string) => {
    const [month, year] = value.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (!month || !year) return false;
    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  };

  const handleSubmit = () => {
    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setError(t('invalidCardNumber'));
      return;
    }

    if (!expiryDate || !validateExpiryDate(expiryDate)) {
      setError(t('invalidExpiryDate'));
      return;
    }

    if (!cvv || cvv.length < 3) {
      setError(t('invalidCvv'));
      return;
    }

    if (!cardholderName.trim()) {
      setError(t('enterCardholderName'));
      return;
    }

    // Submit payment data
    onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardholderName,
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('creditCardPayment')}</h3>
            <p className="text-sm text-gray-500">{t('enterCardDetails')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('cardNumber')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder={t('cardNumberPlaceholder')}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              />
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('expiryDate')}
              </label>
              <input
                type="text"
                value={expiryDate}
                onChange={handleExpiryDateChange}
                placeholder={t('expiryDatePlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('cvv')}
              </label>
              <input
                type="password"
                value={cvv}
                onChange={handleCvvChange}
                placeholder={t('cvvPlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('cardholderName')}
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder={t('cardholderNamePlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {t('payNow')}
        </Button>
      </div>
    </Card>
  );
};