import { useState, useEffect } from "react";
import { InstagramOrderForm } from "../../components/new-order/forms/InstagramOrderForm";
import { YoutubeOrderForm } from "../../components/new-order/forms/YoutubeOrderForm";
import { TiktokOrderForm } from "../../components/new-order/forms/TiktokOrderForm";
import { FacebookOrderForm } from "../../components/new-order/forms/FacebookOrderForm";
import { XOrderForm } from "../../components/new-order/forms/XOrderForm";
import { Instagram, Youtube, AlertCircle, Music, Facebook, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { useLanguage } from "../../context/LanguageContext";
import { getPlatforms, Platform } from "../../lib/api/platforms";

const getPlatformIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName === "instagram") return Instagram;
  if (lowerName === "youtube") return Youtube;
  if (lowerName === "tiktok") return Music;
  if (lowerName === "facebook") return Facebook;
  if (lowerName === "x") return X;
  return null;
};

export const NewOrderPage = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPlatforms();

        // Sort platforms by displayOrder
        const sortedPlatforms = (response.platforms || []).sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );

        setPlatforms(sortedPlatforms);

        // Set the first active platform as default if available
        const activePlatform = sortedPlatforms.find(p => p.isActive !== false);
        if (activePlatform) {
          setSelectedPlatform(activePlatform.name.toLowerCase());
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch platforms"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">{t("error")}</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className="py-12">
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">
                {t("noPlatformsAvailable")}
              </h3>
              <p className="text-yellow-700">
                {t("pleaseCheckBackLater")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("newOrder")}</h1>
        <p className="mt-2 text-gray-600">{t("selectPlatformAndServices")}</p>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("selectPlatform")}
        </h2>
        <div
          className={`grid gap-4 ${platforms.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
          {platforms.map((platform) => {
            const platformId = platform.name.toLowerCase();
            const Icon = getPlatformIcon(platform.name);
            const isSelected = selectedPlatform === platformId;

            const accentColor =
              platformId === "instagram"
                ? { border: "pink-500", bg: "pink-50", text: "pink-500" }
                : platformId === "youtube"
                  ? { border: "red-500", bg: "red-50", text: "red-500" }
                  : platformId === "tiktok"
                    ? { border: "black", bg: "gray-50", text: "black" }
                    : platformId === "facebook"
                      ? { border: "blue-500", bg: "blue-50", text: "blue-500" }
                      : platformId === "x"
                        ? { border: "gray-900", bg: "gray-50", text: "gray-900" }
                        : { border: "blue-500", bg: "blue-50", text: "blue-500" };

            const isInactive = platform.isActive === false;

            return (
              <button
                key={platform.id}
                onClick={() => !isInactive && setSelectedPlatform(platformId)}
                disabled={isInactive}
                className={`p-6 rounded-xl border-2 transition-all ${isInactive
                  ? "border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed"
                  : isSelected
                    ? `border-${accentColor.border} bg-${accentColor.bg}`
                    : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}>
                {Icon && (
                  <Icon
                    className={`w-8 h-8 mx-auto mb-3 ${isInactive
                      ? "text-gray-300"
                      : isSelected
                        ? `text-${accentColor.text}`
                        : "text-gray-400"
                      }`}
                  />
                )}
                <span
                  className={`block text-lg font-medium ${isInactive
                    ? "text-gray-400"
                    : isSelected
                      ? `text-${accentColor.text}`
                      : "text-gray-500"
                    }`}>
                  {platform.nameEn || platform.name}
                  {isInactive && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({t("inactive") || "Inactive"})
                    </span>
                  )}
                </span>
                <p className={`text-sm mt-2 ${isInactive ? "text-gray-300" : "text-gray-500"}`}>
                  {platform.descriptionEn || platform.description || ""}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedPlatform === "instagram" ? (
        <InstagramOrderForm />
      ) : selectedPlatform === "youtube" ? (
        <YoutubeOrderForm />
      ) : selectedPlatform === "tiktok" ? (
        <TiktokOrderForm />
      ) : selectedPlatform === "facebook" ? (
        <FacebookOrderForm />
      ) : selectedPlatform === "x" ? (
        <XOrderForm />
      ) : null}
    </div>
  );
};
