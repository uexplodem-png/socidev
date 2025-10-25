import { useState, useEffect } from "react";
import { ServiceSelector } from "../service/ServiceSelector";
import { PaymentSelector } from "../payment/PaymentSelector";
import { OrderOptions } from "../service/OrderOptions";
import { Service as ComponentService } from "../service/types";
import { useLanguage } from "../../../context/LanguageContext";
import { useBalance } from "../../../context/BalanceContext";
import { orderApi } from "../../../lib/api/order";
import { getServicesByPlatform, type Service as ApiService } from "../../../lib/api/platforms";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ThumbsUp, Eye, Users, MessageCircle, Play } from "lucide-react";

export const InstagramOrderForm = () => {
  const { t } = useLanguage();
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

  // Fetch Instagram services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Fetch Instagram platform services
        const response = await getServicesByPlatform("instagram");
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

  // Map API services to component services
  const mapIconForService = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("like")) return ThumbsUp;
    if (name.includes("view")) return Eye;
    if (name.includes("follower")) return Users;
    if (name.includes("comment")) return MessageCircle;
    if (name.includes("play") || name.includes("watch")) return Play;
    return Eye;
  };

  const componentServices: ComponentService[] = apiServices.map(service => ({
    id: service.id,
    name: service.nameEn || service.name,
    description: service.descriptionEn || service.description,
    icon: mapIconForService(service.name),
    basePrice: service.pricePerUnit,
    minQuantity: service.minOrder,
    maxQuantity: service.maxOrder,
    features: service.featuresEn || service.features || [],
    urlExample: service.sampleUrl,
    urlPattern: service.urlPattern,
  }));

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
      const newQuantities = { ...quantities };
      delete newQuantities[serviceId];
      setQuantities(newQuantities);
    } else {
      newSelected.add(serviceId);
      const service = componentServices.find((s) => s.id === serviceId);
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
    const service = componentServices.find((s) => s.id === serviceId);
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
      const service = componentServices.find((s) => s.id === serviceId);
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

      // Validate all selected services have target URLs and quantities
      for (const serviceId of selectedServices) {
        if (!targetUrls[serviceId] || targetUrls[serviceId].trim() === "") {
          toast.error(
            t("targetUrlRequired") || `Target URL required for this service`
          );
          setIsSubmitting(false);
          return;
        }
        if (!quantities[serviceId] || quantities[serviceId] < 1) {
          toast.error(
            t("invalidQuantity") || `Invalid quantity for this service`
          );
          setIsSubmitting(false);
          return;
        }
      }

      const orderData = Array.from(selectedServices).map((serviceId) => ({
        platform: "instagram" as const,
        service: serviceId,
        targetUrl: targetUrls[serviceId].trim(),
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
      console.error("Order creation failed:", error);
      
      // Handle validation errors from backend
      if (error instanceof Error && error.message.includes("Validation Error")) {
        toast.error(t("validationError") || "Please fill in all required fields (Target URL, Quantity)");
      } else {
        toast.error(t("orderError") || "Failed to create order. Please try again.");
      }
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
        services={componentServices}
        selectedServices={selectedServices}
        quantities={quantities}
        quantityErrors={{}}
        accentColor='pink'
        platform='instagram'
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
