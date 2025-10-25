import { useState, useEffect, useMemo } from "react";
import { ServiceSelector } from "../service/ServiceSelector";
import { PaymentSelector } from "../payment/PaymentSelector";
import { OrderOptions } from "../service/OrderOptions";
import { Play, Eye, Users, ThumbsUp, Clock } from "lucide-react";
import { Service as ComponentService } from "../service/types";
import { useLanguage } from "../../../context/LanguageContext";
import { useBalance } from "../../../context/BalanceContext";
import { orderApi } from "../../../lib/api/order";
import { getServicesByPlatform, type Service as ApiService } from "../../../lib/api/platforms";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const YoutubeOrderForm = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { balance, refreshBalance } = useBalance();
  const [apiServices, setApiServices] = useState<ApiService[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [targetUrls, setTargetUrls] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("balance");
  const [selectedSpeed, setSelectedSpeed] = useState<
    "normal" | "fast" | "express"
  >("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch YouTube services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Fetch YouTube platform services
        const response = await getServicesByPlatform("youtube");
        if (response.services && response.services.length > 0) {
          setApiServices(response.services);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error(t("errorLoadingServices") || "Error loading services");
      }
    };

    fetchServices();
  }, [t]);

  // Map API services to component services - includes language dependency
  const mapIconForService = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("like")) return ThumbsUp;
    if (name.includes("view")) return Eye;
    if (name.includes("subscriber")) return Users;
    if (name.includes("watch")) return Clock;
    if (name.includes("play")) return Play;
    return Eye;
  };

  // Get the correct name and description based on current language
  const getServiceName = (service: ApiService): string => {
    if (language === "tr" && service.nameTr) return service.nameTr;
    if (service.nameEn) return service.nameEn;
    return service.name;
  };

  const getServiceDescription = (service: ApiService): string | undefined => {
    if (language === "tr" && service.descriptionTr) return service.descriptionTr;
    if (service.descriptionEn) return service.descriptionEn;
    return service.description;
  };

  const getServiceFeatures = (service: ApiService): string[] => {
    if (language === "tr" && service.featuresTr) return service.featuresTr;
    if (service.featuresEn) return service.featuresEn;
    return service.features || [];
  };

  const services: ComponentService[] = useMemo(() =>
    apiServices.map(service => ({
      id: service.id,
      name: getServiceName(service),
      description: getServiceDescription(service),
      icon: mapIconForService(service.name),
      basePrice: service.pricePerUnit,
      minQuantity: service.minOrder,
      maxQuantity: service.maxOrder,
      features: getServiceFeatures(service),
      urlExample: service.sampleUrl,
      urlPattern: service.urlPattern,
      urlLabel: service.urlLabel,
    })),
    [apiServices, language]
  );

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
      const newQuantities = { ...quantities };
      delete newQuantities[serviceId];
      setQuantities(newQuantities);
    } else {
      newSelected.add(serviceId);
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setQuantities((prev) => ({
          ...prev,
          [serviceId]: service.minQuantity,
        }));
      }
    }
    setSelectedServices(newSelected);
  };

  const handleQuantityChange = (serviceId: string, value: number) => {
    // Allow any value to be entered
    setQuantities((prev) => ({
      ...prev,
      [serviceId]: value,
    }));
  };

  const handleTargetUrlChange = (serviceId: string, url: string) => {
    setTargetUrls((prev) => ({
      ...prev,
      [serviceId]: url,
    }));
  };

  const calculateServicePrice = (serviceId: string): number => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return 0;

    const quantity = quantities[serviceId] || service.minQuantity;
    const discount = calculateDiscount(quantity);
    const basePrice = service.basePrice * quantity;
    return basePrice * (1 - discount);
  };

  const calculatePrice = (): number => {
    let total = 0;
    selectedServices.forEach((serviceId) => {
      total += calculateServicePrice(serviceId);
    });

    const speedCost =
      selectedSpeed === "express" ? 10 : selectedSpeed === "fast" ? 5 : 0;
    total += speedCost;

    return total;
  };

  const calculateDiscount = (quantity: number): number => {
    if (quantity >= 50000) return 0.15;
    if (quantity >= 10000) return 0.1;
    if (quantity >= 5000) return 0.05;
    return 0;
  };

  const getSelectedServicesDetails = () => {
    return Array.from(selectedServices).map((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return {
        name: service?.name || serviceId,
        price: calculateServicePrice(serviceId),
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const orderData = Array.from(selectedServices).map((serviceId) => ({
        platform: "youtube" as const,
        service: serviceId,
        targetUrl: targetUrls[serviceId],
        quantity: quantities[serviceId],
        speed: selectedSpeed,
      }));

      if (selectedServices.size > 1) {
        await orderApi.createBulkOrders(token, { orders: orderData });
        toast.success(t("bulkOrderSuccess"));
      } else {
        await orderApi.createOrder(token, orderData[0]);
        toast.success(t("orderSuccess"));
      }

      // Refresh balance after successful order
      await refreshBalance();

      // Reset form
      setSelectedServices(new Set());
      setQuantities({});
      setTargetUrls({});
      setSelectedSpeed("normal");

      // Navigate to orders page after short delay
      setTimeout(() => {
        navigate("/my-orders");
      }, 2000);
    } catch (error) {
      toast.error(t("orderError"));
      console.error("Order creation failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSelectedServices = selectedServices.size > 0;

  return (
    <form
      className='space-y-8'
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>
      <ServiceSelector
        services={services}
        selectedServices={selectedServices}
        quantities={quantities}
        quantityErrors={{}}
        accentColor='red'
        platform='youtube'
        targetUrls={targetUrls}
        onTargetUrlChange={handleTargetUrlChange}
        onServiceToggle={handleServiceToggle}
        onQuantityChange={handleQuantityChange}
        hideTargetUrl={false}
      />

      {hasSelectedServices && (
        <>
          <OrderOptions
            selectedSpeed={selectedSpeed}
            onSpeedChange={setSelectedSpeed}
            needsInvoice={false}
            onInvoiceChange={() => { }}
            companyName=''
            onCompanyNameChange={() => { }}
            taxId=''
            onTaxIdChange={() => { }}
          />

          <PaymentSelector
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            amount={calculatePrice()}
            onPaymentComplete={handleSubmit}
            isSubmitting={isSubmitting}
            selectedServices={getSelectedServicesDetails()}
            balance={balance}
          />
        </>
      )}
    </form>
  );
};
