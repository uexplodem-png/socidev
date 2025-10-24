import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { useLanguage } from "../../../../context/LanguageContext";
import { useInstagramAccounts } from "../../../../hooks/useInstagramAccounts";
import { AccountSettingsModal } from "../../../../components/social/AccountSettingsModal";
import {
  ArrowLeft,
  Instagram,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  Eye,
  MessageCircle,
  Calendar,
  Link2,
  TrendingUp,
  BarChart2,
  Activity,
  Settings,
  Shield,
  ExternalLink,
} from "lucide-react";

export const InstagramAccountDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    selectedAccount: account,
    loadingDetails: loading,
    error,
    fetchAccountDetails,
    updateSettings,
    deleteAccount,
  } = useInstagramAccounts();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccountDetails(id).catch(console.error);
    }
  }, [id, fetchAccountDetails]);

  if (loading) {
    return (
      <div className='py-8'>
        <div className='animate-pulse space-y-8'>
          <div className='h-20 bg-gray-200 rounded-lg'></div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className='py-8'>
        <Card className='p-6 text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            {t("accountNotFound")}
          </h2>
          <p className='text-gray-600 mb-6'>{error || t("accountLoadError")}</p>
          <Button
            onClick={() => navigate("/my-accounts/instagram/accounts")}
            className='bg-blue-600 text-white'>
            {t("backToAccounts")}
          </Button>
        </Card>
      </div>
    );
  }

  const handleSettingsSave = async (settings: any) => {
    try {
      await updateSettings(account.id, settings);
      setShowSettings(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(account.id);
      navigate("/my-accounts/instagram/accounts");
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const totalEarnings =
    typeof account.totalEarnings === "string"
      ? parseFloat(account.totalEarnings)
      : account.totalEarnings || 0;

  return (
    <div className='py-8'>
      {/* Header */}
      <div className='mb-8'>
        <Button variant='outline' onClick={() => navigate(-1)} className='mb-6'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          {t("backToAccounts")}
        </Button>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            <div className='relative'>
              <img
                src={`https://ui-avatars.com/api/?name=${account.username}&background=pink&color=fff`}
                alt={account.username}
                className='w-20 h-20 rounded-xl object-cover ring-4 ring-pink-100'
              />
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${
                  account.status === "active"
                    ? "bg-green-500"
                    : account.status === "inactive"
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {account.username}
              </h1>
              <div className='flex items-center gap-2 mt-1'>
                <Instagram className='w-5 h-5 text-pink-500' />
                <span className='text-gray-500'>{account.id}</span>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              onClick={() =>
                window.open(
                  `https://instagram.com/${account.username}`,
                  "_blank"
                )
              }
              className='flex items-center gap-2'>
              <ExternalLink className='w-4 h-4' />
              {t("viewProfile")}
            </Button>
            <Button
              onClick={() => setShowSettings(true)}
              className='bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'>
              <Settings className='w-4 h-4 mr-2' />
              {t("accountSettings")}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center'>
              <Users className='w-6 h-6 text-pink-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />+
              {(
                ((account.stats?.recentFollowed || 0) /
                  (account.stats?.totalFollowed || 1)) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalFollowed")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {(account.totalFollowed || 0).toLocaleString()}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center'>
              <Activity className='w-6 h-6 text-purple-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalLikes")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {(account.totalLikes || 0).toLocaleString()}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center'>
              <DollarSign className='w-6 h-6 text-green-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalEarnings")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            ₺{totalEarnings.toFixed(2)}
          </p>
        </Card>

        <Card className='p-6 hover:shadow-lg transition-all duration-200'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
              <BarChart2 className='w-6 h-6 text-blue-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("successRate")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {(
              ((account.totalLikes || 0) /
                ((account.totalLikes || 0) + (account.totalComments || 0))) *
              100
            ).toFixed(1)}
            %
          </p>
        </Card>
      </div>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
        onDelete={handleDelete}
        platform='instagram'
        account={{
          id: account.id,
          username: account.username,
        }}
      />

      {/* Security Info */}
      <div className='mt-8 flex items-center gap-2 text-sm text-gray-500'>
        <Shield className='w-4 h-4' />
        <span>{t("accountSecured")}</span>
      </div>
    </div>
  );
};
