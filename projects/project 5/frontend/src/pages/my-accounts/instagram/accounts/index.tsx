import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { AccountSettingsModal } from "../../../../components/social/AccountSettingsModal";
import { AddSocialMediaModal } from "../../../../components/social/AddSocialMediaModal";
import { useLanguage } from "../../../../context/LanguageContext";
import { useInstagramAccounts } from "../../../../hooks/useInstagramAccounts";
import {
  Instagram,
  Settings,
  Trash2,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Search,
  Filter,
  TrendingUp,
  Clock,
  BarChart2,
  Plus,
  RefreshCw,
  MoreHorizontal,
  ExternalLink,
  Shield,
  ChevronRight,
  Star,
  Activity,
} from "lucide-react";

interface InstagramAccount {
  id: string;
  username: string;
  status: "active" | "inactive" | "limited";
  totalFollowed: number;
  totalLikes: number;
  totalComments: number;
  totalEarnings: string | number;
  stats?: {
    recentFollowed: number;
    totalFollowed: number;
    recentEarnings: number;
  };
}

export const InstagramAccountsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    accounts = [] as InstagramAccount[],
    loading,
    error,
    addAccount,
    updateSettings,
    deleteAccount,
    fetchAccounts,
  } = useInstagramAccounts();

  const [showActions, setShowActions] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] =
    useState<InstagramAccount | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddAccount = async (accountData: any) => {
    try {
      await addAccount(accountData.username, accountData.password);
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  };

  const handleSettingsClick = (account: InstagramAccount) => {
    setSelectedAccount(account);
    setShowSettings(true);
    setShowActions(null);
  };

  const handleDeleteAccount = async () => {
    if (selectedAccount) {
      try {
        await deleteAccount(selectedAccount.id);
        setSelectedAccount(null);
        setShowSettings(false);
      } catch (error) {
        console.error("Failed to delete account:", error);
      }
    }
  };

  const handleSaveSettings = async (settings: any) => {
    if (selectedAccount) {
      try {
        await updateSettings(selectedAccount.id, settings);
        setShowSettings(false);
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAccounts();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      searchQuery.toLowerCase().trim() === "" ||
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedPlatform === "all" || account.status === selectedPlatform;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics with safe defaults and proper type conversion
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const totalAccounts = accounts.length;
  const totalEarnings = accounts.reduce((sum, acc) => {
    const earnings =
      typeof acc.totalEarnings === "string"
        ? parseFloat(acc.totalEarnings)
        : acc.totalEarnings || 0;
    return sum + earnings;
  }, 0);
  const monthlyEarnings = accounts.reduce(
    (sum, acc) => sum + (acc.stats?.recentEarnings || 0),
    0
  );
  const totalFollowers = accounts.reduce(
    (sum, acc) => sum + (acc.totalFollowed || 0),
    0
  );

  if (loading) {
    return (
      <div className='py-8'>
        <div className='animate-pulse space-y-8'>
          <div className='h-8 bg-gray-200 w-1/4 rounded'></div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-64 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='py-8'>
        <Card className='p-6 text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {t("errorLoadingAccounts")}
          </h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <Button onClick={handleRefresh} className='bg-blue-600 text-white'>
            <RefreshCw className='w-4 h-4 mr-2' />
            {t("tryAgain")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className='py-8'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>
          {t("instagramAccounts")}
        </h1>
        <p className='mt-2 text-gray-600'>{t("manageInstagramAccounts")}</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center'>
              <Users className='w-6 h-6 text-pink-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +12.5%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalFollowed")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {totalFollowers.toLocaleString()}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center'>
              <Activity className='w-6 h-6 text-purple-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +8.3%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalLikes")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {accounts
              .reduce((sum, acc) => sum + (acc.totalLikes || 0), 0)
              .toLocaleString()}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center'>
              <DollarSign className='w-6 h-6 text-green-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +15.2%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("monthlyEarnings")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            ₺{monthlyEarnings.toFixed(2)}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
              <Star className='w-6 h-6 text-blue-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("activeAccounts")}
          </h3>
          <div className='mt-2 flex items-baseline'>
            <p className='text-2xl font-bold text-gray-900'>{activeAccounts}</p>
            <p className='ml-2 text-sm text-gray-500'>
              {t("of")} {totalAccounts}
            </p>
          </div>
        </Card>

        <Card className='p-6 flex items-center justify-center'>
          <Button
            onClick={() => setShowAddModal(true)}
            className='w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            {t("addAccount")}
          </Button>
        </Card>
      </div>

      {/* Filters */}
      <Card className='p-6 mb-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchAccounts")}
                className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-pink-200'
              />
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Filter className='w-5 h-5 text-gray-400' />
              <select
                value={selectedPlatform}
                onChange={(e) =>
                  setSelectedPlatform(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className='pr-8 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-pink-200'>
                <option value='all'>{t("allAccounts")}</option>
                <option value='active'>{t("activeOnly")}</option>
                <option value='inactive'>{t("inactiveOnly")}</option>
              </select>
            </div>
            <Button
              variant='outline'
              onClick={handleRefresh}
              className={`transition-all ${isRefreshing ? "opacity-50" : ""}`}
              disabled={isRefreshing}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {t("refresh")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredAccounts.map((account) => (
          <Card
            key={account.id}
            className='group hover:shadow-lg transition-all duration-300'>
            <div className='p-6'>
              {/* Account Header */}
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative'>
                    <img
                      src={`https://ui-avatars.com/api/?name=${account.username}&background=pink&color=fff`}
                      alt={account.username}
                      className='w-12 h-12 rounded-xl object-cover ring-2 ring-pink-100'
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        account.status === "active"
                          ? "bg-green-500"
                          : account.status === "inactive"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      {account.username}
                    </h3>
                    <div className='flex items-center gap-2 mt-1'>
                      <Instagram className='w-4 h-4 text-pink-500' />
                      <span className='text-sm text-gray-500'>
                        {account.id}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleSettingsClick(account)}
                  className='opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Settings className='w-5 h-5 text-gray-500' />
                </Button>
              </div>

              {/* Performance Metrics */}
              <div className='mt-6 grid grid-cols-3 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-gray-900'>
                    {(account.totalFollowed || 0).toLocaleString()}
                  </div>
                  <p className='text-sm text-gray-500'>{t("totalFollowed")}</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-gray-900'>
                    {(account.totalLikes || 0).toLocaleString()}
                  </div>
                  <p className='text-sm text-gray-500'>{t("totalLikes")}</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-gray-900'>
                    {(
                      (account.totalLikes || 0) + (account.totalComments || 0)
                    ).toLocaleString()}
                  </div>
                  <p className='text-sm text-gray-500'>{t("tasks")}</p>
                </div>
              </div>

              {/* Earnings Section */}
              <div className='mt-6 p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-pink-900'>
                    {t("monthlyEarnings")}
                  </span>
                  <span className='text-lg font-bold text-pink-700'>
                    ₺{(account.stats?.recentEarnings || 0).toFixed(2)}
                  </span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-pink-700'>{t("totalEarnings")}</span>
                  <span className='font-medium text-pink-900'>
                    ₺
                    {(typeof account.totalEarnings === "string"
                      ? parseFloat(account.totalEarnings)
                      : account.totalEarnings || 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='mt-6 grid grid-cols-2 gap-4'>
                <Button
                  variant='outline'
                  onClick={() =>
                    window.open(
                      `https://instagram.com/${account.username}`,
                      "_blank"
                    )
                  }
                  className='w-full'>
                  <ExternalLink className='w-4 h-4 mr-2' />
                  {t("viewProfile")}
                </Button>
                <Button
                  onClick={() =>
                    navigate(`/my-accounts/instagram/${account.id}`)
                  }
                  className='w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'>
                  {t("viewDetails")}
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
              </div>

              {/* Security Badge */}
              <div className='mt-6 flex items-center gap-2 text-xs text-gray-500'>
                <Shield className='w-4 h-4' />
                <span>{t("accountSecured")}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <Card className='p-12 text-center'>
          <div className='w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Instagram className='w-8 h-8 text-pink-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            {t("noAccounts")}
          </h3>
          <p className='text-gray-500 mb-6'>{t("noAccountsDescription")}</p>
          <Button
            onClick={() => setShowAddModal(true)}
            className='bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            {t("addFirstAccount")}
          </Button>
        </Card>
      )}

      {/* Settings Modal */}
      {selectedAccount && (
        <AccountSettingsModal
          isOpen={showSettings}
          onClose={() => {
            setShowSettings(false);
            setSelectedAccount(null);
          }}
          onSave={handleSaveSettings}
          onDelete={handleDeleteAccount}
          platform='instagram'
          account={{
            id: selectedAccount.id,
            username: selectedAccount.username,
          }}
        />
      )}

      {/* Add Account Modal */}
      <AddSocialMediaModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
        platform='instagram'
      />
    </div>
  );
};
