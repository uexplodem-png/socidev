import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { useBalance } from "../../context/BalanceContext";
import { balanceApi } from "../../lib/api/balance";
import { toast } from "react-hot-toast";
import {
  Building,
  Wallet,
  Bitcoin,
  ArrowRight,
  AlertCircle,
  Clock,
  Info,
  Lock,
  Shield,
  DollarSign,
} from "lucide-react";

export const AddBalancePage = () => {
  const { t } = useLanguage();
  const { balance, refreshBalance } = useBalance();
  const [selectedMethod, setSelectedMethod] = useState("bank_transfer");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await balanceApi.getTransactions(token, {
        type: "deposit",
        limit: 5,
      });

      setTransactions((response as any).transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setError("");
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!amount || parseFloat(amount) < 10) {
        setError(t("minimumAmount", { amount: "₺10" }));
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await balanceApi.deposit(token, {
        amount: parseFloat(amount),
        method: selectedMethod as "bank_transfer" | "credit_card" | "crypto",
        details: {},
      });

      if ((response as any).status === "completed") {
        await refreshBalance(); // Refresh balance after successful deposit
        toast.success(t("balanceAddedSuccess"));
        setAmount("");
      } else {
        toast.success(t("balanceAddedPending"));
      }

      fetchTransactions(); // Refresh transaction history
    } catch (error) {
      toast.error(t("balanceAddError"));
      console.error("Failed to add balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen py-12 bg-gradient-to-br from-slate-50 to-gray-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header Section */}
        <div className='mb-12'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {t("addBalance")}
          </h1>
          <p className='mt-3 text-lg text-gray-600'>
            {t("addBalanceDescription")}
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content Area */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Current Balance */}
            <Card className='overflow-hidden'>
              <div className='p-8 bg-white border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center'>
                      <Wallet className='w-6 h-6 text-blue-600' />
                    </div>
                    <div>
                      <h2 className='text-xl font-semibold text-gray-900'>
                        {t("currentBalance")}
                      </h2>
                      <p className='text-3xl font-bold text-gray-900 mt-1'>
                        ₺{balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className='bg-green-50 px-4 py-2 rounded-lg'>
                    <span className='text-sm font-medium text-green-700'>
                      {t("availableForWithdrawal")}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Methods */}
            <Card className='divide-y divide-gray-100'>
              <div className='p-6'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {t("selectPaymentMethod")}
                </h2>
                <p className='mt-1 text-sm text-gray-500'>
                  {t("choosePaymentMethod")}
                </p>
              </div>

              <div className='p-6'>
                {/* Bank Transfer Method */}
                <button
                  type='button'
                  onClick={() => setSelectedMethod("bank_transfer")}
                  className={`w-full group p-6 rounded-xl border-2 text-left transition-all mb-4 ${selectedMethod === "bank_transfer"
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                    }`}>
                  <div className='flex items-center gap-4'>
                    <div
                      className={`p-3 rounded-lg ${selectedMethod === "bank_transfer"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                        }`}>
                      <Building
                        className={`w-6 h-6 ${selectedMethod === "bank_transfer"
                            ? "text-blue-600"
                            : "text-gray-500"
                          }`}
                      />
                    </div>
                    <div className='flex-1'>
                      <p className='font-semibold text-gray-900'>
                        {t("bankTransfer")}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {t("bankTransferDescription")}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-gray-600'>
                        ₺5.00
                      </span>
                    </div>
                  </div>
                </button>

                {/* Crypto Method - Disabled */}
                <div className='relative'>
                  <div className='absolute inset-0 bg-white/5 backdrop-blur-[0.5px] rounded-xl z-10'>
                    <div className='absolute inset-0 flex items-center justify-end p-6'>
                      <div className='bg-gray-900/90 px-4 py-2 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <Lock className='w-4 h-4 text-white' />
                          <span className='text-sm font-medium text-white'>
                            {t("comingSoon")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='p-6 rounded-xl border-2 border-gray-200'>
                    <div className='flex items-center gap-4'>
                      <div className='p-3 rounded-lg bg-gray-100'>
                        <Bitcoin className='w-6 h-6 text-gray-400' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-semibold text-gray-400'>
                          {t("crypto")}
                        </p>
                        <p className='text-sm text-gray-400'>
                          {t("cryptoDescription")}
                        </p>
                      </div>
                      <span className='text-sm font-medium text-gray-400'>
                        1%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Amount Input */}
            <Card className='divide-y divide-gray-100'>
              <div className='p-6'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {t("amount")}
                </h2>
                <p className='mt-1 text-sm text-gray-500'>{t("enterAmount")}</p>
              </div>

              <div className='p-6'>
                <div className='space-y-6'>
                  <div>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <span className='text-gray-500 text-lg'>₺</span>
                      </div>
                      <input
                        type='text'
                        value={amount}
                        onChange={handleAmountChange}
                        className={`w-full pl-8 pr-4 py-4 text-lg rounded-lg border ${error ? "border-red-300" : "border-gray-300"
                          } focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all`}
                        placeholder={t("amountPlaceholder")}
                      />
                    </div>
                    {error && (
                      <div className='mt-2 text-sm text-red-600 flex items-center gap-1'>
                        <AlertCircle className='w-4 h-4' />
                        {error}
                      </div>
                    )}
                  </div>

                  <div className='grid grid-cols-3 gap-3'>
                    {[100, 250, 500, 1000, 2500, 5000].map((preset) => (
                      <button
                        key={preset}
                        type='button'
                        onClick={() => setAmount(preset.toString())}
                        className={`p-4 rounded-lg border transition-all ${amount === preset.toString()
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                          }`}>
                        ₺{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Transactions */}
            {transactions.length > 0 && (
              <Card className='divide-y divide-gray-100'>
                <div className='p-6'>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    {t("recentTransactions")}
                  </h2>
                </div>
                <div className='divide-y divide-gray-100'>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className='p-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4 flex-1'>
                          <div
                            className={`p-2 rounded-lg ${transaction.status === "completed"
                                ? "bg-green-50"
                                : transaction.status === "rejected"
                                  ? "bg-red-50"
                                  : "bg-yellow-50"
                              }`}>
                            {transaction.status === "completed" ? (
                              <DollarSign className='w-5 h-5 text-green-600' />
                            ) : transaction.status === "rejected" ? (
                              <AlertCircle className='w-5 h-5 text-red-600' />
                            ) : (
                              <Clock className='w-5 h-5 text-yellow-600' />
                            )}
                          </div>
                          <div className='flex-1'>
                            <p className='font-medium text-gray-900'>
                              {t("deposit")} - {transaction.method}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                            {transaction.notes && (
                              <p className='text-sm text-gray-600 mt-1 italic'>
                                Note: {transaction.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium text-gray-900'>
                            ₺{Number(transaction.amount).toFixed(2)}
                          </p>
                          <p
                            className={`text-sm ${transaction.status === "completed"
                                ? "text-green-600"
                                : transaction.status === "rejected"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}>
                            {t(transaction.status)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Summary */}
          <div className='lg:col-span-1'>
            <Card className='sticky top-8 divide-y divide-gray-100'>
              <div className='p-6'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {t("summary")}
                </h2>
                <p className='mt-1 text-sm text-gray-500'>
                  {t("reviewTransaction")}
                </p>
              </div>

              <div className='p-6 space-y-6'>
                <div className='space-y-4'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>{t("amount")}</span>
                    <span className='font-medium text-gray-900'>
                      ₺{amount ? parseFloat(amount).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>{t("serviceFee")}</span>
                    <span className='font-medium text-gray-900'>₺5.00</span>
                  </div>
                  <div className='pt-4 border-t border-gray-100'>
                    <div className='flex justify-between items-center'>
                      <span className='font-medium text-gray-900'>
                        {t("total")}
                      </span>
                      <span className='text-2xl font-bold text-gray-900'>
                        ₺{amount ? (parseFloat(amount) + 5).toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='bg-blue-50 rounded-lg p-4'>
                  <div className='flex gap-3'>
                    <Info className='w-5 h-5 text-blue-600 flex-shrink-0' />
                    <div>
                      <p className='font-medium text-blue-900'>
                        {t("instantProcessing")}
                      </p>
                      <p className='text-sm text-blue-600 mt-1'>
                        {t("balanceUpdateInstantly")}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!amount || parseFloat(amount) < 10 || isLoading}
                  className='w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors'>
                  {isLoading ? (
                    <div className='flex items-center justify-center'>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                      {t("processing")}
                    </div>
                  ) : (
                    <>
                      {t("addBalance")} ₺
                      {amount ? parseFloat(amount).toFixed(2) : "0.00"}
                      <ArrowRight className='w-5 h-5 ml-2' />
                    </>
                  )}
                </Button>

                <div className='flex items-start gap-2 p-4 bg-gray-50 rounded-lg'>
                  <Shield className='w-5 h-5 text-gray-400 flex-shrink-0' />
                  <p className='text-sm text-gray-500'>
                    {t("securePaymentNote")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
