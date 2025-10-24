import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Link2, AlertOctagon, RepeatIcon } from "lucide-react";
import { getStatusColor, getStatusIcon } from "./utils";
import { Order } from "./types";
import { formatDate } from "../../utils/formatDate";
import { useLanguage } from "../../context/LanguageContext";

interface OrderListProps {
  orders: Order[];
  onReport: (orderId: string) => void;
  onRepeat: (order: Order) => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onReport,
  onRepeat,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);

  const handleRepeat = async (order: Order) => {
    setRepeatingOrderId(order.id);
    try {
      await onRepeat(order);
    } finally {
      setRepeatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className='p-6 space-y-4'>
          <div className='animate-pulse space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-16 bg-gray-100 rounded-lg' />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("orderId")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("service")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("quantity")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("startCount")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("remaining")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("speed")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("status")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("totalCost")}
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("date")}
              </th>
              <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {orders.map((order) => (
              <tr key={order.id} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                  {order.id}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {order.service}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {order.quantity.toLocaleString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {order.startCount.toLocaleString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {order.remainingCount.toLocaleString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.speed === "express"
                        ? "bg-purple-100 text-purple-800"
                        : order.speed === "fast"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                    {t(order.speed)}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}>
                    {getStatusIcon(order.status)}
                    {t(order.status)}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                  ₺{Number(order.amount).toFixed(2)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                  {formatDate(order.createdAt)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => window.open(order.targetUrl, "_blank")}
                      className='text-gray-600'
                      title={t("openTargetUrl")}>
                      <Link2 className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => onReport(order.id)}
                      className='text-red-600 hover:text-red-700'
                      title={t("reportIssue")}>
                      <AlertOctagon className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRepeat(order)}
                      disabled={repeatingOrderId === order.id}
                      className='text-blue-600 hover:text-blue-700'
                      title={t("repeatOrder")}>
                      {repeatingOrderId === order.id ? (
                        <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <RepeatIcon className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='px-6 py-4 bg-gray-50 border-t border-gray-200'>
          <div className='flex items-center justify-between'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}>
              {t("previous")}
            </Button>
            <span className='text-sm text-gray-700'>
              {t("page")} {currentPage} {t("of")} {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}>
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
