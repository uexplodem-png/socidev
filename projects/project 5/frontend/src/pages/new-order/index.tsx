import React, { useState } from "react";
import { InstagramOrderForm } from "../../components/new-order/forms/InstagramOrderForm";
import { YoutubeOrderForm } from "../../components/new-order/forms/YoutubeOrderForm";
import { Instagram, Youtube } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { useLanguage } from "../../context/LanguageContext";

type Platform = "instagram" | "youtube";

export const NewOrderPage = () => {
  const [selectedPlatform, setSelectedPlatform] =
    useState<Platform>("instagram");
  const { t } = useLanguage();

  return (
    <div className='py-12'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>{t("newOrder")}</h1>
        <p className='mt-2 text-gray-600'>{t("selectPlatformAndServices")}</p>
      </div>

      <Card className='p-6 mb-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          {t("selectPlatform")}
        </h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <button
            onClick={() => setSelectedPlatform("instagram")}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedPlatform === "instagram"
                ? "border-pink-500 bg-pink-50"
                : "border-gray-200 hover:border-pink-200"
            }`}>
            <Instagram
              className={`w-8 h-8 mx-auto mb-3 ${
                selectedPlatform === "instagram"
                  ? "text-pink-500"
                  : "text-gray-400"
              }`}
            />
            <span
              className={`block text-lg font-medium ${
                selectedPlatform === "instagram"
                  ? "text-pink-500"
                  : "text-gray-500"
              }`}>
              {t("instagramServices")}
            </span>
            <p className='text-sm text-gray-500 mt-2'>
              {t("instagramServicesDescription")}
            </p>
          </button>

          <button
            onClick={() => setSelectedPlatform("youtube")}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedPlatform === "youtube"
                ? "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-red-200"
            }`}>
            <Youtube
              className={`w-8 h-8 mx-auto mb-3 ${
                selectedPlatform === "youtube"
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            />
            <span
              className={`block text-lg font-medium ${
                selectedPlatform === "youtube"
                  ? "text-red-500"
                  : "text-gray-500"
              }`}>
              {t("youtubeServices")}
            </span>
            <p className='text-sm text-gray-500 mt-2'>
              {t("youtubeServicesDescription")}
            </p>
          </button>
        </div>
      </Card>

      {selectedPlatform === "instagram" ? (
        <InstagramOrderForm />
      ) : (
        <YoutubeOrderForm />
      )}
    </div>
  );
};
