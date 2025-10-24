export interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  fee: string;
}

export interface PaymentSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  amount: number;
  onPaymentComplete: () => void;
  isSubmitting?: boolean;
  selectedServices?: Array<{
    name: string;
    price: number;
  }>;
  balance: number; // Add balance prop
}

export interface PaymentData {
  method: string;
  amount: number;
  [key: string]: any;
}
