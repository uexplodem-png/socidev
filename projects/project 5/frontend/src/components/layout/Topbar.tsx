import React, { useState } from "react";
import {
  User,
  Settings,
  LogOut,
  Wallet,
  Bell,
  Activity,
  SwitchCamera,
  Menu,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserMode } from "../../context/UserModeContext";
import { useBalance } from "../../context/BalanceContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sidebar } from "./Sidebar";
import { Button } from "../ui/Button";

export const Topbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { userMode, toggleUserMode } = useUserMode();
  const { balance } = useBalance();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className='bg-white border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Left Side */}
          <div className='flex items-center gap-4'>
            <button
              className='md:hidden p-2 rounded-lg hover:bg-gray-100'
              onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className='w-6 h-6 text-gray-600' />
            </button>

            {/* Mobile Mode Toggle */}
            <button
              onClick={toggleUserMode}
              className='md:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100'
              title={t(
                userMode === "taskDoer"
                  ? "switchToTaskGiver"
                  : "switchToTaskDoer"
              )}>
              <div className='relative'>
                <div
                  className={`w-8 h-4 bg-gray-200 rounded-full transition-colors ${
                    userMode === "taskGiver" ? "bg-blue-500" : ""
                  }`}>
                  <div
                    className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                      userMode === "taskGiver" ? "translate-x-4" : ""
                    }`}
                  />
                </div>
              </div>
              <span className='text-xs font-medium text-gray-700'>
                {userMode === "taskDoer" ? t("taskDoer") : t("taskGiver")}
              </span>
            </button>
          </div>

          {/* Right Side */}
          <div className='flex items-center gap-4'>
            {/* Desktop Mode Toggle */}
            <div className='hidden md:flex items-center gap-3'>
              <button
                onClick={toggleUserMode}
                className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100'
                title={t(
                  userMode === "taskDoer"
                    ? "switchToTaskGiver"
                    : "switchToTaskDoer"
                )}>
                <div className='relative'>
                  <div
                    className={`w-12 h-6 bg-gray-200 rounded-full transition-colors ${
                      userMode === "taskGiver" ? "bg-blue-500" : ""
                    }`}>
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        userMode === "taskGiver" ? "translate-x-6" : ""
                      }`}
                    />
                  </div>
                </div>
                <span className='text-sm font-medium text-gray-700'>
                  {userMode === "taskDoer"
                    ? t("taskDoerMode")
                    : t("taskGiverMode")}
                </span>
                <SwitchCamera className='w-4 h-4 text-gray-500' />
              </button>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Balance */}
            <div className='hidden md:flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-lg'>
              <Wallet className='w-5 h-5 text-emerald-600' />
              <span className='font-medium text-gray-900'>{t("balance")}:</span>
              <span className='text-emerald-600 font-bold'>
                ₺{balance.toFixed(2)}
              </span>
            </div>

            {/* Profile Menu */}
            <div className='relative'>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className='flex items-center gap-3 focus:outline-none'>
                <div className='relative'>
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt='Profile'
                      className='w-10 h-10 rounded-full object-cover border-2 border-gray-200'
                    />
                  ) : (
                    <div className='w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center'>
                      <span className='text-white font-medium'>
                        {user?.firstName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></div>
                </div>
                <div className='text-left hidden sm:block'>
                  <p className='text-sm font-medium text-gray-900'>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className='text-xs text-gray-500'>{user?.email}</p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50'>
                  <a
                    href='/profile'
                    className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                    <User className='w-4 h-4' />
                    {t("profile")}
                  </a>
                  <a
                    href='/settings'
                    className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                    <Settings className='w-4 h-4' />
                    {t("settings")}
                  </a>
                  <hr className='my-1' />
                  <button
                    onClick={logout}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left'>
                    <LogOut className='w-4 h-4' />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <Sidebar
          isMobile={true}
          onClose={() => setIsMobileMenuOpen(false)}
          className='md:hidden'
        />
      )}
    </div>
  );
};
