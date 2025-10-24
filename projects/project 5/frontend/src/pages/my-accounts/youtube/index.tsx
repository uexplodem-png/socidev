import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { AccountSettingsModal } from "../../../components/social/AccountSettingsModal";
import { AddSocialMediaModal } from "../../../components/social/AddSocialMediaModal";
import { useLanguage } from "../../../context/LanguageContext";
import {
  Youtube,
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
} from "lucide-react";

interface YoutubeAccount {
  id: string;
  username: string;
  status: "active" | "inactive" | "limited";
  lastChecked: string;
  subscribers: number;
  tasks: number;
  profileImage?: string;
  earnings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}

const mockAccounts: YoutubeAccount[] = [
  {
    id: "ACC-002",
    username: "JohnDoeVlogs",
    status: "active",
    lastChecked: "2024-03-10T12:30:00Z",
    subscribers: 12500,
    tasks: 15,
    profileImage:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop",
    earnings: {
      total: 1250.0,
      thisMonth: 225.5,
      lastMonth: 198.75,
    },
  },
];

export const YoutubeAccountsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<YoutubeAccount[]>(mockAccounts);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<YoutubeAccount | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddAccount = (account: any) => {
    const newAccount: YoutubeAccount = {
      id: `ACC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      username: account.email.split("@")[0],
      status: "active",
      lastChecked: new Date().toISOString(),
      subscribers: 0,
      tasks: 0,
      profileImage: `https://images.unsplash.com/photo-${Math.random()
        .toString(36)
        .substr(2, 9)}?w=200&h=200&fit=crop`,
      earnings: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
      },
    };
    setAccounts((prev) => [...prev, newAccount]);
  };

  const handleSettingsClick = (account: YoutubeAccount) => {
    setSelectedAccount(account);
    setShowSettings(true);
    setShowActions(null);
  };

  const handleDeleteAccount = () => {
    if (selectedAccount) {
      setAccounts((prev) => prev.filter((a) => a.id !== selectedAccount.id));
      setSelectedAccount(null);
      setShowSettings(false);
    }
  };

  const handleSaveSettings = () => {
    // Save settings
  };

  // Handle account refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
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

  // Calculate statistics
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const totalAccounts = accounts.length;
  const totalEarnings = accounts.reduce(
    (sum, acc) => sum + acc.earnings.total,
    0
  );
  const monthlyEarnings = accounts.reduce(
    (sum, acc) => sum + acc.earnings.thisMonth,
    0
  );
  const totalCompletedTasks = accounts.reduce((sum, acc) => sum + acc.tasks, 0);

  return (
    <div className='py-8'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>
          {t("youtubeChannels")}
        </h1>
        <p className='mt-2 text-gray-600'>{t("manageYoutubeChannels")}</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center'>
              <Users className='w-6 h-6 text-red-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +12.5%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalSubscribers")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {accounts
              .reduce((sum, acc) => sum + acc.subscribers, 0)
              .toLocaleString()}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center'>
              <BarChart2 className='w-6 h-6 text-purple-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +8.3%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("avgEngagement")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>4.8%</p>
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
              <Clock className='w-6 h-6 text-blue-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("activeChannels")}
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
            className='w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            {t("addChannel")}
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
                placeholder={t("searchChannels")}
                className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-red-200'
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
                className='pr-8 py-2 rounded-lg border border-gray-200 focus:border-red-500 focus:ring-red-200'>
                <option value='all'>{t("allChannels")}</option>
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

      {/* Accounts Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredAccounts.map((account) => (
          <Card key={account.id} className='p-6 hover:shadow-lg transition-all'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-4'>
                <img
                  src={account.profileImage}
                  alt={account.username}
                  className='w-12 h-12 rounded-xl object-cover ring-2 ring-red-100'
                />
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {account.username}
                  </h3>
                  <div className='flex items-center gap-2 mt-1'>
                    <Youtube className='w-4 h-4 text-red-500' />
                    <span className='text-sm text-gray-500'>{account.id}</span>
                  </div>
                </div>
              </div>
              <div className='relative'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    setShowActions(
                      showActions === account.id ? null : account.id
                    )
                  }
                  className='text-gray-600'>
                  <MoreHorizontal className='w-5 h-5' />
                </Button>
                {showActions === account.id && (
                  <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10'>
                    <button
                      onClick={() => handleSettingsClick(account)}
                      className='flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                      <Settings className='w-4 h-4' />
                      {t("channelSettings")}
                    </button>
                    <button
                      onClick={() => {
                        setAccounts((prev) =>
                          prev.filter((a) => a.id !== account.id)
                        );
                        setShowActions(null);
                      }}
                      className='flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50'>
                      <Trash2 className='w-4 h-4' />
                      {t("removeChannel")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className='mt-4'>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${account.status === "active"
                    ? "text-green-700 bg-green-50"
                    : account.status === "inactive"
                      ? "text-red-700 bg-red-50"
                      : "text-yellow-700 bg-yellow-50"
                  }`}>
                {account.status === "active" && (
                  <CheckCircle className='w-4 h-4' />
                )}
                {account.status === "inactive" && (
                  <AlertCircle className='w-4 h-4' />
                )}
                {account.status === "limited" && (
                  <AlertCircle className='w-4 h-4' />
                )}
                {t(account.status)}
              </span>
              <p className='text-xs text-gray-500 mt-2'>
                {t("lastChecked")}:{" "}
                {new Date(account.lastChecked).toLocaleString()}
              </p>
            </div>

            {/* Earnings Section */}
            <div className='mt-6 p-4 bg-green-50 rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <span className='text-sm font-medium text-green-700'>
                  {t("totalEarnings")}
                </span>
                <span className='text-lg font-bold text-green-700'>
                  ₺{account.earnings.total.toFixed(2)}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <span className='text-xs text-green-600'>
                    {t("thisMonth")}
                  </span>
                  <p className='text-sm font-medium text-green-700'>
                    ₺{account.earnings.thisMonth.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className='text-xs text-green-600'>
                    {t("lastMonth")}
                  </span>
                  <p className='text-sm font-medium text-green-700'>
                    ₺{account.earnings.lastMonth.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className='mt-6 grid grid-cols-2 gap-4 text-center'>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {account.subscribers.toLocaleString()}
                </p>
                <p className='text-xs text-gray-500'>{t("subscribers")}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  {account.tasks}
                </p>
                <p className='text-xs text-gray-500'>{t("tasks")}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-4 mt-6'>
              <Button
                variant='outline'
                onClick={() =>
                  window.open(
                    `https://youtube.com/channel/${account.id}`,
                    "_blank"
                  )
                }
                className='w-full'>
                <ExternalLink className='w-4 h-4 mr-2' />
                {t("viewChannel")}
              </Button>
              <Button
                onClick={() => navigate(`/youtube/channels/${account.id}`)}
                className='w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'>
                {t("viewDetails")}
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>
            </div>

            {/* Security Badge */}
            <div className='mt-6'>
              <div className='flex items-center gap-2 text-xs text-gray-500'>
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
          <div className='w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Youtube className='w-8 h-8 text-red-500' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            {t("noChannels")}
          </h3>
          <p className='text-gray-500 mb-6'>{t("noChannelsDescription")}</p>
          <Button
            onClick={() => setShowAddModal(true)}
            className='bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            {t("addFirstChannel")}
          </Button>
        </Card>
      )}

      {/* Modals */}
      {selectedAccount && (
        <AccountSettingsModal
          isOpen={showSettings}
          onClose={() => {
            setShowSettings(false);
            setSelectedAccount(null);
          }}
          onSave={handleSaveSettings}
          onDelete={handleDeleteAccount}
          platform='youtube'
          account={{
            id: selectedAccount.id,
            username: selectedAccount.username,
          }}
        />
      )}

      <AddSocialMediaModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
        platform='youtube'
      />
    </div>
  );
};
