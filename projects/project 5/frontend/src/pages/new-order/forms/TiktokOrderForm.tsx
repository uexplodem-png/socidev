import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../context/LanguageContext';
import { getServicesByPlatform } from '../../../lib/api/platforms';
import {
  ThumbsUp,
  Eye,
  Users,
  MessageCircle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  basePrice: number;
  minQuantity: number;
  maxQuantity: number;
  features: string[];
  urlExample?: string;
  displayOrder?: number;
  pricePerUnit?: number;
  minOrder?: number;
  maxOrder?: number;
}

const getServiceIcon = (serviceName: string): React.ElementType => {
  const lower = serviceName.toLowerCase();
  if (lower.includes('like')) return ThumbsUp;
  if (lower.includes('follow')) return Users;
  if (lower.includes('view')) return Eye;
  if (lower.includes('comment')) return MessageCircle;
  return Shield;
};

export const TiktokOrderForm = () => {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSpeed, setSelectedSpeed] = useState<'normal' | 'fast' | 'express'>('normal');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await getServicesByPlatform('tiktok');

        // Transform database services to include UI data
        const transformedServices: Service[] = (response.services || []).map((dbService: any) => ({
          ...dbService,
          icon: getServiceIcon(dbService.name),
          basePrice: dbService.pricePerUnit,
          minQuantity: dbService.minOrder,
          maxQuantity: dbService.maxOrder,
        }));

        // Sort by displayOrder
        const sortedServices = transformedServices.sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );

        setServices(sortedServices);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [t]);

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
      const newQuantities = { ...quantities };
      delete newQuantities[serviceId];
      setQuantities(newQuantities);
    } else {
      newSelected.add(serviceId);
      const service = services.find(s => s.id === serviceId);
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
    const service = services.find(s => s.id === serviceId);
    if (service) {
      if (value >= service.minQuantity && value <= service.maxQuantity) {
        setQuantities((prev) => ({
          ...prev,
          [serviceId]: value,
        }));
      }
    }
  };

  const calculatePrice = (): number => {
    let total = 0;
    selectedServices.forEach((serviceId) => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const quantity = quantities[serviceId] || service.minQuantity;
        const discount = calculateDiscount(quantity);
        total += service.basePrice * quantity * (1 - discount);
      }
    });

    const speedCost = selectedSpeed === 'express' ? 10 : selectedSpeed === 'fast' ? 5 : 0;
    total += speedCost;

    return total;
  };

  const calculateDiscount = (quantity: number): number => {
    if (quantity >= 50000) return 0.15;
    if (quantity >= 10000) return 0.1;
    if (quantity >= 5000) return 0.05;
    return 0;
  };

  const handleSubmit = () => {
    // Implement order submission
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (error || services.length === 0) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="text-yellow-600">
          <p className="font-semibold">No services available</p>
          <p className="text-sm">TikTok services are not yet configured.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Services */}
      <Card className='p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-6'>
          {t("selectServices")}
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedServices.has(service.id);
            const quantity = quantities[service.id] || service.minQuantity;
            const discount = calculateDiscount(quantity);
            const price = service.basePrice * quantity * (1 - discount);

            return (
              <div
                key={service.id}
                onClick={() => handleServiceToggle(service.id)}
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                  ? "border-gray-500 bg-gray-50"
                  : "border-gray-200 hover:border-gray-200"
                }`}>
                <div className='flex items-start gap-4'>
                  <div
                    className={`p-3 rounded-lg ${isSelected ? "bg-gray-100" : "bg-gray-100"
                    }`}>
                    <Icon
                      className={`w-6 h-6 ${isSelected ? "text-gray-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-medium text-gray-900'>
                      {service.name}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1'>
                      {service.description}
                    </p>
                    <p className='text-sm font-medium text-gray-900 mt-2'>
                      {t("startingFrom")} ₺{service.basePrice.toFixed(2)}/
                      {t("each")}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className='w-5 h-5 text-gray-500' />
                  )}
                </div>

                {isSelected && (
                  <div className='mt-6 space-y-4 border-t pt-4'>
                    <div>
                      <label className='text-sm font-medium text-gray-700'>
                        {t("quantity")}: {quantity}
                      </label>
                      <input
                        type='range'
                        min={service.minQuantity}
                        max={service.maxQuantity}
                        step={Math.max(1, Math.floor((service.maxQuantity - service.minQuantity) / 100))}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(service.id, parseInt(e.target.value))}
                        className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        {t("min")}: {service.minQuantity} | {t("max")}: {service.maxQuantity}
                      </p>
                    </div>

                    <div className='flex justify-between items-center'>
                      <div>
                        <p className='text-xs text-gray-500'>{t("discount")}</p>
                        <p className='text-sm font-medium text-green-600'>
                          {(calculateDiscount(quantity) * 100).toFixed(0)}% {t("off")}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs text-gray-500'>{t("total")}</p>
                        <p className='text-lg font-bold text-gray-900'>
                          ₺{price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Speed Options */}
      <Card className='p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-6'>
          {t("deliverySpeed")}
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[
            { id: 'normal', name: 'Normal', icon: Clock, price: 0 },
            { id: 'fast', name: 'Fast', icon: Zap, price: 5 },
            { id: 'express', name: 'Express', icon: Zap, price: 10 },
          ].map((speed) => {
            const SpeedIcon = speed.icon as React.ElementType;
            const isSelected = selectedSpeed === speed.id;
            return (
              <button
                key={speed.id}
                onClick={() => setSelectedSpeed(speed.id as any)}
                className={`p-4 rounded-lg border-2 transition-all ${isSelected
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
                }`}>
                <SpeedIcon className='w-6 h-6 mx-auto mb-2 text-gray-600' />
                <p className='font-medium text-gray-900'>{speed.name}</p>
                <p className='text-sm text-gray-500'>+₺{speed.price}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Order Summary */}
      <Card className='p-6 bg-gradient-to-r from-gray-50 to-gray-100'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>{t("orderSummary")}</h2>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-gray-700'>{t("selectedServices")}:</span>
            <span className='font-medium text-gray-900'>{selectedServices.size}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-gray-700'>{t("deliverySpeed")}:</span>
            <span className='font-medium text-gray-900 capitalize'>{selectedSpeed}</span>
          </div>
          <div className='border-t pt-3 flex justify-between'>
            <span className='text-lg font-semibold text-gray-900'>{t("totalPrice")}:</span>
            <span className='text-2xl font-bold text-gray-900'>₺{calculatePrice().toFixed(2)}</span>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={selectedServices.size === 0}
          className='w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition-colors'>
          {t("placeOrder")}
        </Button>
      </Card>
    </div>
  );
};
