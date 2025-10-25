import { useState, useEffect } from "react";
import { InstagramOrderForm } from "../../components/new-order/forms/InstagramOrderForm";
import { Card } from "../../components/ui/Card";
import { useLanguage } from "../../context/LanguageContext";
import { getPlatforms, type Platform } from "../../lib/api/platforms";
import toast from "react-hot-toast";

export const NewOrderPage = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  // Fetch platforms on mount
  useEffect(() => {
    const fetchPlatformsData = async () => {
      try {
        setIsLoading(true);
        const response = await getPlatforms({
          isActive: true,
          limit: 50,
        });
        
        if (response.platforms && response.platforms.length > 0) {
          setPlatforms(response.platforms);
          setSelectedPlatformId(response.platforms[0].id);
        }
      } catch (error) {
        console.error("Error fetching platforms:", error);
        toast.error(t("errorLoadingPlatforms") || "Error loading platforms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatformsData();
  }, [t]);

  const selectedPlatform = platforms.find(p => p.id === selectedPlatformId);

  if (isLoading) {
    return (
      <div className='py-12 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>{t("loading") || "Loading platforms..."}</p>
        </div>
      </div>
    );
  }

  if (platforms.length === 0) {
    return (
      <div className='py-12'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900'>{t("newOrder")}</h1>
          <p className='mt-2 text-gray-600'>{t("selectPlatformAndServices")}</p>
        </div>
        <Card className='p-6 text-center'>
          <p className='text-gray-600'>{t("noPlatformsAvailable") || "No platforms available"}</p>
        </Card>
      </div>
    );
  }

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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {platforms.map((platform) => {
            const isSelected = selectedPlatformId === platform.id;
            const platformIcon = platform.icon || "📱";
            
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatformId(platform.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200"
                }`}>
                <div className='text-4xl mb-3'>{platformIcon}</div>
                <h3 className={`text-lg font-medium ${
                  isSelected ? "text-blue-600" : "text-gray-900"
                }`}>
                  {platform.nameEn || platform.name}
                </h3>
                <p className='text-sm text-gray-500 mt-2'>
                  {platform.descriptionEn || platform.description || "Social media platform"}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedPlatform && (
        <InstagramOrderForm platform={selectedPlatform} />
      )}
    </div>
  );
};
