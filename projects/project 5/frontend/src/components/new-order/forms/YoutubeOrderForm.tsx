import { useState } from "react";
import { ServiceSelector } from "../service/ServiceSelector";
import { PaymentSelector } from "../payment/PaymentSelector";
import { OrderOptions } from "../service/OrderOptions";
import { Play, Eye, Users, ThumbsUp, Clock } from "lucide-react";
import { Service } from "../service/types";
import { useLanguage } from "../../../context/LanguageContext";
import { useBalance } from "../../../context/BalanceContext";
import { orderApi } from "../../../lib/api/order";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const YoutubeOrderForm = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { balance, refreshBalance } = useBalance();
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>(
    {}
  );
  const [targetUrls, setTargetUrls] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState("balance");
  const [selectedSpeed, setSelectedSpeed] = useState<
    "normal" | "fast" | "express"
  >("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const services: Service[] = [
    {
      id: "views",
      name: t("views"),
      icon: Eye,
      basePrice: 0.01,
      minQuantity: 1000,
      maxQuantity: 100000,
      features: [
        t("highRetention"),
        t("fastDelivery"),
        t("worldwideViews"),
        t("support"),
      ],
      urlExample: "https://youtube.com/watch?v=example",
    },
    {
      id: "subscribers",
      name: t("subscribers"),
      icon: Users,
      basePrice: 0.05,
      minQuantity: 100,
      maxQuantity: 10000,
      features: [
        t("realSubscribers"),
        t("activeProfiles"),
        t("naturalGrowth"),
        t("noDrop"),
      ],
      urlExample: "https://youtube.com/channel/example",
    },
    {
      id: "likes",
      name: t("likes"),
      icon: ThumbsUp,
      basePrice: 0.02,
      minQuantity: 100,
      maxQuantity: 25000,
      features: [
        t("highQuality"),
        t("fastDelivery"),
        t("permanentLikes"),
        t("safeProcess"),
      ],
      urlExample: "https://youtube.com/watch?v=example",
    },
    {
      id: "watchTime",
      name: t("watchTime"),
      icon: Clock,
      basePrice: 0.5,
      minQuantity: 10,
      maxQuantity: 4000,
      features: [
        t("realWatchTime"),
        t("boostRankings"),
        t("monetizationHelp"),
        t("analyticsFriendly"),
      ],
      urlExample: "https://youtube.com/watch?v=example",
    },
  ];

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

  const handleQuantityValidation = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const value = quantities[serviceId];
    if (value < service.minQuantity) {
      setQuantities((prev) => ({
        ...prev,
        [serviceId]: service.minQuantity,
      }));
      setQuantityErrors((prev) => ({
        ...prev,
        [serviceId]: `Minimum quantity is ${service.minQuantity.toLocaleString()}`,
      }));
      setTimeout(() => {
        setQuantityErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[serviceId];
          return newErrors;
        });
      }, 1500);
    } else if (value > service.maxQuantity) {
      setQuantities((prev) => ({
        ...prev,
        [serviceId]: service.maxQuantity,
      }));
      setQuantityErrors((prev) => ({
        ...prev,
        [serviceId]: `Maximum quantity is ${service.maxQuantity.toLocaleString()}`,
      }));
      setTimeout(() => {
        setQuantityErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[serviceId];
          return newErrors;
        });
      }, 1500);
    }
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
        quantityErrors={quantityErrors}
        accentColor='red'
        platform='youtube'
        targetUrls={targetUrls}
        onTargetUrlChange={handleTargetUrlChange}
        onServiceToggle={handleServiceToggle}
        onQuantityChange={handleQuantityChange}
        onQuantityBlur={handleQuantityValidation}
        hideTargetUrl={false}
      />

      {hasSelectedServices && (
        <>
          <OrderOptions
            selectedSpeed={selectedSpeed}
            onSpeedChange={setSelectedSpeed}
            needsInvoice={false}
            onInvoiceChange={() => {}}
            companyName=''
            onCompanyNameChange={() => {}}
            taxId=''
            onTaxIdChange={() => {}}
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
