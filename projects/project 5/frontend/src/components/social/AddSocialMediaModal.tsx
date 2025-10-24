import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import {
  Instagram,
  Youtube,
  Lock,
  Shield,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  AtSign,
  KeyRound,
  Info,
} from "lucide-react";

interface AddSocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: { username: string; password: string }) => void;
  platform?: "instagram" | "youtube";
}

export const AddSocialMediaModal = ({
  isOpen,
  onClose,
  onAdd,
  platform: initialPlatform,
}: AddSocialMediaModalProps) => {
  const { t } = useLanguage();
  const [selectedPlatform, setSelectedPlatform] = useState<
    "instagram" | "youtube" | ""
  >(initialPlatform || "");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPlatform) {
      setError(t("selectPlatform"));
      return;
    }

    if (!formData.username || !formData.password) {
      setError(t("fillAllFields"));
      return;
    }

    try {
      setIsLoading(true);
      await onAdd({
        username: formData.username,
        password: formData.password,
      });

      // Reset form
      setSelectedPlatform("");
      setFormData({ username: "", password: "" });
      onClose();
    } catch (err) {
      setError(t("connectionFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("connectAccount")}>
      <div className='space-y-6'>
        {/* Platform Selection */}
        <div>
          <h3 className='text-sm font-medium text-gray-700 mb-3'>
            {t("selectPlatform")}
          </h3>
          <div className='grid grid-cols-2 gap-4'>
            <button
              type='button'
              onClick={() => setSelectedPlatform("instagram")}
              className={`group relative p-6 rounded-xl border-2 transition-all ${
                selectedPlatform === "instagram"
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 hover:border-pink-200"
              }`}>
              <div className='absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl' />
              <Instagram
                className={`w-8 h-8 mx-auto mb-3 ${
                  selectedPlatform === "instagram"
                    ? "text-pink-500"
                    : "text-gray-400 group-hover:text-pink-400"
                }`}
              />
              <h4
                className={`text-center font-medium ${
                  selectedPlatform === "instagram"
                    ? "text-pink-500"
                    : "text-gray-600"
                }`}>
                {t("instagramAccount")}
              </h4>
            </button>

            <button
              type='button'
              onClick={() => setSelectedPlatform("youtube")}
              className={`group relative p-6 rounded-xl border-2 transition-all ${
                selectedPlatform === "youtube"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-red-200"
              }`}>
              <div className='absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl' />
              <Youtube
                className={`w-8 h-8 mx-auto mb-3 ${
                  selectedPlatform === "youtube"
                    ? "text-red-500"
                    : "text-gray-400 group-hover:text-red-400"
                }`}
              />
              <h4
                className={`text-center font-medium ${
                  selectedPlatform === "youtube"
                    ? "text-red-500"
                    : "text-gray-600"
                }`}>
                {t("youtubeChannel")}
              </h4>
            </button>
          </div>
        </div>

        {selectedPlatform && (
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  {t("username")}
                </label>
                <div className='relative'>
                  <AtSign className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='text'
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    placeholder={t("enterUsername")}
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  {t("password")}
                </label>
                <div className='relative'>
                  <KeyRound className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                  <input
                    type='password'
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    placeholder={t("enterPassword")}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className='flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg'>
                <AlertCircle className='w-5 h-5 flex-shrink-0' />
                <p className='text-sm'>{error}</p>
              </div>
            )}

            {/* Security Features */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
                <Shield className='w-5 h-5 text-blue-600' />
                <span className='text-sm font-medium text-gray-600'>
                  {t("secure")}
                </span>
              </div>
              <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
                <Zap className='w-5 h-5 text-amber-600' />
                <span className='text-sm font-medium text-gray-600'>
                  {t("fast")}
                </span>
              </div>
              <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
                <Lock className='w-5 h-5 text-green-600' />
                <span className='text-sm font-medium text-gray-600'>
                  {t("private")}
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className='flex items-start gap-2 p-4 bg-blue-50 rounded-lg'>
              <Info className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
              <div className='text-sm text-blue-600'>
                <p className='font-medium'>{t("connectionProcess")}</p>
                <p>{t("securityNote")}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isLoading}>
                {t("cancel")}
              </Button>
              <Button
                type='submit'
                disabled={isLoading}
                className={`${
                  selectedPlatform === "instagram"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                } text-white`}>
                {isLoading ? (
                  <>
                    <span className='animate-spin mr-2'>
                      <svg className='w-5 h-5' viewBox='0 0 24 24'>
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                          fill='none'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                    </span>
                    {t("connecting")}
                  </>
                ) : (
                  <>
                    {t("connectAccount")}
                    <ArrowRight className='w-4 h-4 ml-2' />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
