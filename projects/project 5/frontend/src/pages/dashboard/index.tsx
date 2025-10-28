import { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useUserMode } from "../../context/UserModeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { userApi, type DashboardStats } from "../../lib/api/user";
import {
  DollarSign,
  CheckCircle,
  Activity,
  ArrowUpRight,
  Wallet,
  Target,
  Zap,
  Youtube,
  Instagram,
  PlayCircle,
  Star,
  Settings,
  ArrowRight,
  RefreshCw,
  Laptop,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { userMode } = useUserMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTaskDoer = userMode === "taskDoer";

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const stats = (await userApi.getDashboardStats(token, "30d")) as DashboardStats;
        setDashboardStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userMode, refreshKey]);

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  // Get platform-specific stats
  const instagramStats = dashboardStats?.platformStats?.find(
    (p) => p.platform === "instagram"
  );
  const youtubeStats = dashboardStats?.platformStats?.find(
    (p) => p.platform === "youtube"
  );

  // Calculate combined stats based on user mode
  const combinedStats = isTaskDoer
    ? {
        activeDevices: dashboardStats?.activeDevices?.value || 0,
        completedTasks: dashboardStats?.completedTasks?.value || 0,
        totalEarned: dashboardStats?.totalEarned?.value || 0,
        totalTasks: dashboardStats?.completedTasks?.total || 0,
        activeDevicesGrowth: dashboardStats?.activeDevices?.growth || 0,
        completedTasksGrowth: dashboardStats?.completedTasks?.growth || 0,
        totalEarnedGrowth: dashboardStats?.totalEarned?.growth || 0,
      }
    : {
        activeOrders: dashboardStats?.activeOrders?.value || 0,
        completedOrders: dashboardStats?.completedOrders?.value || 0,
        totalOrders: dashboardStats?.totalOrders?.value || 0,
        totalSpent: dashboardStats?.totalSpent?.value || 0,
        activeOrdersGrowth: dashboardStats?.activeOrders?.growth || 0,
        completedOrdersGrowth: dashboardStats?.completedOrders?.growth || 0,
        totalOrdersGrowth: dashboardStats?.totalOrders?.growth || 0,
        totalSpentGrowth: dashboardStats?.totalSpent?.growth || 0,
      };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header Section */}
        <header className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {t(isTaskDoer ? "welcomeTaskDoer" : "welcomeTaskGiver")}
              </h1>
              <p className='mt-1 text-gray-600'>
                {t(
                  isTaskDoer
                    ? "taskDoerDashboardDesc"
                    : "taskGiverDashboardDesc"
                )}
              </p>
            </div>
            <div className='flex items-center gap-4'>
              <Button 
                variant='outline' 
                className='flex items-center gap-2'
                onClick={handleRefresh}
                disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t("refresh")}
              </Button>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card className='p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
                <Activity className='w-6 h-6 text-blue-600' />
              </div>
              <span className='flex items-center text-sm font-medium text-green-600'>
                <ArrowUpRight className='w-4 h-4 mr-1' />
                {isTaskDoer
                  ? (combinedStats.activeDevicesGrowth || 0).toFixed(1)
                  : (combinedStats.activeOrdersGrowth || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {isTaskDoer ? t("activeDevices") : t("activeOrders")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              {isTaskDoer
                ? combinedStats.activeDevices || 0
                : combinedStats.activeOrders || 0}
            </p>
          </Card>

          <Card className='p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-green-600' />
              </div>
              <span className='flex items-center text-sm font-medium text-green-600'>
                <ArrowUpRight className='w-4 h-4 mr-1' />
                {isTaskDoer
                  ? (combinedStats.totalEarnedGrowth || 0).toFixed(1)
                  : (combinedStats.totalSpentGrowth || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {isTaskDoer ? t("totalEarned") : t("totalSpent")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              ₺{isTaskDoer
                ? (combinedStats.totalEarned || 0).toFixed(2)
                : (combinedStats.totalSpent || 0).toFixed(2)}
            </p>
          </Card>

          <Card className='p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-purple-600' />
              </div>
              <span className='flex items-center text-sm font-medium text-green-600'>
                <ArrowUpRight className='w-4 h-4 mr-1' />
                {isTaskDoer
                  ? (combinedStats.completedTasksGrowth || 0).toFixed(1)
                  : (combinedStats.completedOrdersGrowth || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {isTaskDoer ? t("completedTasks") : t("completedOrders")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              {isTaskDoer
                ? combinedStats.completedTasks || 0
                : combinedStats.completedOrders || 0}
            </p>
          </Card>

          <Card className='p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-2'>
              <div className='w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center'>
                <Star className='w-6 h-6 text-amber-600' />
              </div>
              <span className='flex items-center text-sm font-medium text-green-600'>
                <ArrowUpRight className='w-4 h-4 mr-1' />
                {isTaskDoer
                  ? '0.0'
                  : (combinedStats.totalOrdersGrowth || 0).toFixed(1)}%
              </span>
            </div>
            <h3 className='text-sm font-medium text-gray-500'>
              {isTaskDoer ? t("successRate") : t("totalOrders")}
            </h3>
            <p className='text-2xl font-bold text-gray-900 mt-1'>
              {isTaskDoer
                ? '100%'
                : combinedStats.totalOrders || 0}
            </p>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content Area */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Platform Performance */}
            <Card className='p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-6'>
                {t("platforms")}
              </h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                {[
                  {
                    id: "youtube",
                    name: "YouTube",
                    icon: Youtube,
                    stats: youtubeStats,
                    color: "from-red-500 to-rose-500",
                    hoverColor: "hover:from-red-600 hover:to-rose-600",
                    path: isTaskDoer ? "/tasks/youtube" : "/youtube/channels",
                  },
                  {
                    id: "instagram",
                    name: "Instagram",
                    icon: Instagram,
                    stats: instagramStats,
                    color: "from-pink-500 to-purple-500",
                    hoverColor: "hover:from-pink-600 hover:to-purple-600",
                    path: isTaskDoer
                      ? "/tasks/instagram"
                      : "/instagram/accounts",
                  },
                ].map((platform) => (
                  <div key={platform.id} className='relative'>
                    <div
                      className={`bg-gradient-to-br ${platform.color} p-6 rounded-xl text-white`}>
                      <div className='flex items-center gap-4 mb-4'>
                        <platform.icon className='w-8 h-8' />
                        <div>
                          <h3 className='font-semibold'>{platform.name}</h3>
                          <p className='text-white/80'>
                            {isTaskDoer
                              ? `${platform.stats?.completedTasks || 0} ${t("completedTasks")}`
                              : `${platform.stats?.activeOrders || 0} ${t("activeOrders")}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(platform.path)}
                        className='w-full bg-white/10 text-white border-white/20'>
                        {isTaskDoer
                          ? t("viewTasks")
                          : platform.id === "youtube"
                          ? t("manageChannels")
                          : t("manageAccounts")}
                        <ArrowRight className='w-4 h-4 ml-2' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Performance - Only for Task Givers */}
            {!isTaskDoer && (
              <Card className='p-6'>
                <h2 className='text-lg font-semibold text-gray-900 mb-6'>
                  {t("systemPerformance")}
                </h2>
                <div className='space-y-6'>
                  {/* CPU Usage */}
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-gray-600'>
                        {t("averageCpuUsage")}
                      </span>
                      <span className='font-medium text-gray-900'>45%</span>
                    </div>
                    <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-blue-500 rounded-full'
                        style={{ width: "45%" }}
                      />
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-gray-600'>
                        {t("averageMemoryUsage")}
                      </span>
                      <span className='font-medium text-gray-900'>60%</span>
                    </div>
                    <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-green-500 rounded-full'
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>

                  {/* Network Usage */}
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span className='text-gray-600'>
                        {t("averageNetworkUsage")}
                      </span>
                      <span className='font-medium text-gray-900'>25%</span>
                    </div>
                    <div className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-purple-500 rounded-full'
                        style={{ width: "25%" }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className='space-y-8'>
            {/* Quick Actions */}
            <Card className='p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-6'>
                {t("quickActions")}
              </h2>
              <div className='space-y-4'>
                {isTaskDoer ? (
                  <>
                    <Button
                      variant='outline'
                      onClick={() => navigate("/my-devices")}
                      className='w-full justify-start'>
                      <Settings className='w-4 h-4 mr-2' />
                      {t("manageDevices")}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => navigate("/withdraw-balance")}
                      className='w-full justify-start'>
                      <Wallet className='w-4 h-4 mr-2' />
                      {t("withdrawBalance")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant='outline'
                      onClick={() => navigate("/new-order")}
                      className='w-full justify-start'>
                      <PlayCircle className='w-4 h-4 mr-2' />
                      {t("createNewOrder")}
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => navigate("/add-balance")}
                      className='w-full justify-start'>
                      <Wallet className='w-4 h-4 mr-2' />
                      {t("addBalance")}
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Balance Card */}
            <Card className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center'>
                    <Wallet className='w-5 h-5 text-emerald-600' />
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>
                      {t("balance")}
                    </h2>
                    <p className='text-2xl font-bold text-emerald-600'>
                      ₺{user?.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    navigate(isTaskDoer ? "/withdraw-balance" : "/add-balance")
                  }
                  className='bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'>
                  {isTaskDoer ? t("withdraw") : t("addFunds")}
                </Button>
              </div>
            </Card>

            {/* System Status - Only for Task Givers */}
            {!isTaskDoer && (
              <Card className='p-6'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center'>
                    <Activity className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold text-gray-900'>
                      {t("systemStatus")}
                    </h2>
                    <p className='text-sm text-gray-500'>
                      {t("allSystemsOperating")}
                    </p>
                  </div>
                </div>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Laptop className='w-4 h-4 text-gray-500' />
                      <span className='text-sm font-medium text-gray-700'>
                        {t("devices")}
                      </span>
                    </div>
                    <span className='text-sm font-medium text-green-600'>
                      {t("operational")}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Target className='w-4 h-4 text-gray-500' />
                      <span className='text-sm font-medium text-gray-700'>
                        {t("tasks")}
                      </span>
                    </div>
                    <span className='text-sm font-medium text-green-600'>
                      {t("operational")}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Zap className='w-4 h-4 text-gray-500' />
                      <span className='text-sm font-medium text-gray-700'>
                        {t("automation")}
                      </span>
                    </div>
                    <span className='text-sm font-medium text-green-600'>
                      {t("operational")}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
