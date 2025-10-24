import React from 'react';
import { Card } from '../../../ui/Card';
import { Wallet, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../ui/Button';

interface BalanceFormProps {
  balance: number;
  amount: number;
  onSubmit: () => void;
  onAddBalance: () => void;
}

export const BalanceForm = ({ balance, amount, onSubmit, onAddBalance }: BalanceFormProps) => {
  const hasEnoughBalance = balance >= amount;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Current Balance */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-lg font-semibold">₺{balance.toFixed(2)}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onAddBalance}
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Add Balance
          </Button>
        </div>

        {/* Order Amount */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Order Amount</span>
            <span className="font-medium">₺{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Remaining Balance</span>
            <span className={`font-medium ${hasEnoughBalance ? 'text-green-600' : 'text-red-600'}`}>
              ₺{(balance - amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Status Message */}
        {!hasEnoughBalance && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Insufficient Balance</p>
              <p className="text-sm mt-1">
                You need ₺{(amount - balance).toFixed(2)} more to complete this order.
                Please add funds to your balance.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={onAddBalance}
            variant="outline"
            className="flex-1"
          >
            Add Balance
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!hasEnoughBalance}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {hasEnoughBalance ? (
              <>
                Pay with Balance
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              'Insufficient Balance'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};