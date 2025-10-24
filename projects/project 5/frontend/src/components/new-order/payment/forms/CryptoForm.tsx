import React, { useState } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { AlertCircle, Bitcoin, ArrowRight } from 'lucide-react';

interface CryptoFormProps {
  amount: number;
  onSubmit: (data: any) => void;
}

export const CryptoForm = ({ amount, onSubmit }: CryptoFormProps) => {
  const [selectedCrypto, setSelectedCrypto] = useState('btc');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const cryptoOptions = [
    { id: 'btc', name: 'Bitcoin', rate: 45000 },
    { id: 'eth', name: 'Ethereum', rate: 3000 },
    { id: 'usdt', name: 'USDT', rate: 1 },
  ];

  const selectedOption = cryptoOptions.find(c => c.id === selectedCrypto);
  const cryptoAmount = selectedOption ? amount / selectedOption.rate : 0;

  const handleSubmit = () => {
    if (!txHash) {
      setError('Please enter the transaction hash');
      return;
    }

    onSubmit({
      crypto: selectedCrypto,
      amount: cryptoAmount,
      txHash,
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Cryptocurrency Payment</h3>
            <p className="text-sm text-gray-500">Pay with your preferred cryptocurrency</p>
          </div>
        </div>

        {/* Crypto Selection */}
        <div className="grid grid-cols-3 gap-4">
          {cryptoOptions.map((crypto) => (
            <button
              key={crypto.id}
              type="button"
              onClick={() => setSelectedCrypto(crypto.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedCrypto === crypto.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-200'
              }`}
            >
              <p className="font-medium">{crypto.name}</p>
              <p className="text-sm text-gray-500">
                1 {crypto.name} = ${crypto.rate}
              </p>
            </button>
          ))}
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount (USD)</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Amount ({selectedOption?.name})
              </span>
              <span className="font-medium">
                {cryptoAmount.toFixed(8)} {selectedOption?.name}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Transaction Hash
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="Enter your transaction hash"
              className={`w-full px-3 py-2 rounded-lg border ${
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
            />
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
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            Verify Transaction
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
};