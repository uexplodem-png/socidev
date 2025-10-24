import React from "react";
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { Order } from "./types";

export const getStatusColor = (status: Order["status"]) => {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50";
    case "processing":
      return "text-blue-600 bg-blue-50";
    case "pending":
      return "text-yellow-600 bg-yellow-50";
    case "failed":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const getStatusIcon = (status: Order["status"]): React.ReactNode => {
  switch (status) {
    case "completed":
      return <CheckCircle className='w-4 h-4' />;
    case "processing":
      return <Clock className='w-4 h-4' />;
    case "pending":
      return <AlertTriangle className='w-4 h-4' />;
    case "failed":
      return <XCircle className='w-4 h-4' />;
    default:
      return null;
  }
};
