import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { OrderList } from "../../components/my-order/OrderList";
import { OrderFilters } from "../../components/my-order/OrderFilters";
import { ReportModal } from "../../components/report/ReportModal";
import { useLanguage } from "../../context/LanguageContext";
import { orderApi } from "../../lib/api/order";
import { toast } from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  DollarSign,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Order, OrderStats } from "../../components/my-order/types";

const initialStats: OrderStats = {
  activeOrders: { value: 0, growth: 0 },
  completedOrders: { value: 0, growth: 0 },
  totalOrders: { value: 0, growth: 0 },
  totalSpent: { value: 0, growth: 0 },
};

export const MyOrdersPage = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [stats, setStats] = useState<OrderStats>(initialStats);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setOrders([]);
        return;
      }

      const filters = {
        page: currentPage,
        limit: 10,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        sortBy: "createdAt",
        sortOrder: "desc" as const,
      };

      const response = await orderApi.getOrders(token, filters);
      // Ensure completedCount exists (backend may not return it for old orders)
      const ordersWithProgress = response.orders.map((order: any) => ({
        ...order,
        completedCount: order.completedCount || 0,
      }));
      setOrders(ordersWithProgress);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      toast.error(t("errorFetchingOrders"));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setStats(initialStats);
        return;
      }

      const [instagramStats, youtubeStats] = await Promise.all([
        orderApi.getOrderStats(token, "instagram"),
        orderApi.getOrderStats(token, "youtube"),
      ]);

      // Combine stats from both platforms
      const combinedStats = {
        activeOrders: {
          value:
            (instagramStats?.activeOrders?.value || 0) +
            (youtubeStats?.activeOrders?.value || 0),
          growth: Math.max(
            instagramStats?.activeOrders?.growth || 0,
            youtubeStats?.activeOrders?.growth || 0
          ),
        },
        completedOrders: {
          value:
            (instagramStats?.completedOrders?.value || 0) +
            (youtubeStats?.completedOrders?.value || 0),
          growth: Math.max(
            instagramStats?.completedOrders?.growth || 0,
            youtubeStats?.completedOrders?.growth || 0
          ),
        },
        totalOrders: {
          value:
            (instagramStats?.totalOrders?.value || 0) +
            (youtubeStats?.totalOrders?.value || 0),
          growth: Math.max(
            instagramStats?.totalOrders?.growth || 0,
            youtubeStats?.totalOrders?.growth || 0
          ),
        },
        totalSpent: {
          value:
            (instagramStats?.totalSpent?.value || 0) +
            (youtubeStats?.totalSpent?.value || 0),
          growth: Math.max(
            instagramStats?.totalSpent?.growth || 0,
            youtubeStats?.totalSpent?.growth || 0
          ),
        },
      };

      setStats(combinedStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(initialStats);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedStatus]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Poll for order progress updates every 20 seconds for active orders
  useEffect(() => {
    const hasActiveOrders = orders.some(
      (order) => order.status === "processing" || order.status === "pending"
    );

    if (!hasActiveOrders) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 20000); // Poll every 20 seconds

    return () => clearInterval(intervalId);
  }, [orders, currentPage, selectedStatus]);

  const handleReport = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReportModalOpen(true);
  };

  const handleRepeat = async (order: Order) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await orderApi.repeatOrder(token, order.id);
      toast.success(t("orderRepeatedSuccess"));

      // Refresh orders and stats
      await Promise.all([fetchOrders(), fetchStats()]);
    } catch (error) {
      toast.error(t("errorRepeatOrder"));
    }
  };

  return (
    <div className='py-8'>
      {/* Header with Stats */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>
          {t("myOrders")}
        </h1>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center'>
                <BarChart2 className='w-5 h-5 text-purple-600' />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${stats.totalOrders.growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  }`}>
                {stats.totalOrders.growth >= 0 ? (
                  <ArrowUpRight className='w-4 h-4 mr-1' />
                ) : (
                  <ArrowDownRight className='w-4 h-4 mr-1' />
                )}
                {Math.abs(stats.totalOrders.growth).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {t("totalOrders")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              {stats.totalOrders.value}
            </p>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center'>
                <Clock className='w-5 h-5 text-blue-600' />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${stats.activeOrders.growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  }`}>
                {stats.activeOrders.growth >= 0 ? (
                  <ArrowUpRight className='w-4 h-4 mr-1' />
                ) : (
                  <ArrowDownRight className='w-4 h-4 mr-1' />
                )}
                {Math.abs(stats.activeOrders.growth).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {t("activeOrders")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              {stats.activeOrders.value}
            </p>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 text-green-600' />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${stats.completedOrders.growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  }`}>
                {stats.completedOrders.growth >= 0 ? (
                  <ArrowUpRight className='w-4 h-4 mr-1' />
                ) : (
                  <ArrowDownRight className='w-4 h-4 mr-1' />
                )}
                {Math.abs(stats.completedOrders.growth).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {t("completedOrders")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              {stats.completedOrders.value}
            </p>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center'>
                <DollarSign className='w-5 h-5 text-amber-600' />
              </div>
              <span
                className={`flex items-center text-sm font-medium ${stats.totalSpent.growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                  }`}>
                {stats.totalSpent.growth >= 0 ? (
                  <ArrowUpRight className='w-4 h-4 mr-1' />
                ) : (
                  <ArrowDownRight className='w-4 h-4 mr-1' />
                )}
                {Math.abs(stats.totalSpent.growth).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {t("totalSpent")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              ₺{stats.totalSpent.value.toFixed(2)}
            </p>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Orders List */}
      <OrderList
        orders={orders}
        onReport={handleReport}
        onRepeat={handleRepeat}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={loading}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        orderId={selectedOrderId}
      />
    </div>
  );
};
