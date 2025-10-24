import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useLanguage } from "../../../context/LanguageContext";
import {
  ArrowLeft,
  Youtube,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  Eye,
  MessageCircle,
  Calendar,
  Link2,
} from "lucide-react";

interface CompletedTask {
  id: string;
  type: "likes" | "subscribers" | "views" | "comments";
  targetUrl: string;
  quantity: number;
  completedAt: string;
  success: number;
  earnings: number;
}

const mockAccount = {
  id: "ACC-002",
  platform: "youtube",
  username: "JohnDoeVlogs",
  status: "active",
  lastChecked: "2024-03-10T12:30:00Z",
  subscribers: 12500,
  tasks: 15,
  profileImage:
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&h=200&fit=crop",
  totalEarnings: 1250.0,
  taskStats: {
    likes: { completed: 120, earnings: 480.0, rate: "₺0.50 per like" },
    subscribers: {
      completed: 45,
      earnings: 450.0,
      rate: "₺1.00 per subscriber",
    },
    views: { completed: 180, earnings: 270.0, rate: "₺0.15 per view" },
    comments: { completed: 25, earnings: 50.0, rate: "₺2.00 per comment" },
  },
  completedTasks: [
    {
      id: "TASK-001",
      type: "views",
      targetUrl: "https://youtube.com/watch?v=abc123",
      quantity: 1000,
      completedAt: "2024-03-09T15:30:00Z",
      success: 98.5,
      earnings: 150.0,
    },
    {
      id: "TASK-002",
      type: "subscribers",
      targetUrl: "https://youtube.com/channel/xyz789",
      quantity: 100,
      completedAt: "2024-03-08T12:45:00Z",
      success: 100,
      earnings: 100.0,
    },
    {
      id: "TASK-003",
      type: "likes",
      targetUrl: "https://youtube.com/watch?v=def456",
      quantity: 500,
      completedAt: "2024-03-07T18:20:00Z",
      success: 99.2,
      earnings: 250.0,
    },
  ],
};

const getTaskIcon = (type: CompletedTask["type"]) => {
  switch (type) {
    case "likes":
      return ThumbsUp;
    case "subscribers":
      return Users;
    case "views":
      return Eye;
    case "comments":
      return MessageCircle;
    default:
      return CheckCircle;
  }
};

export const YoutubeAccountDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const account = mockAccount; // In real app, fetch account by id

  return (
    <div className='py-8'>
      {/* Header */}
      <div className='mb-8'>
        <Button variant='outline' onClick={() => navigate(-1)} className='mb-6'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          {t("backToChannels")}
        </Button>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            <img
              src={account.profileImage}
              alt={account.username}
              className='w-20 h-20 rounded-xl object-cover ring-4 ring-red-100'
            />
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {account.username}
              </h1>
              <div className='flex items-center gap-2 mt-1'>
                <Youtube className='w-5 h-5 text-red-500' />
                <span className='text-gray-500'>{account.id}</span>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                account.status === "active"
                  ? "text-green-600 bg-green-50"
                  : account.status === "inactive"
                  ? "text-red-600 bg-red-50"
                  : "text-yellow-600 bg-yellow-50"
              }`}>
              <CheckCircle className='w-4 h-4' />
              {t(account.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'>
        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("subscribers")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {account.subscribers.toLocaleString()}
          </p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center'>
              <DollarSign className='w-6 h-6 text-green-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalEarnings")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            ₺{account.totalEarnings.toFixed(2)}
          </p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 text-purple-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("totalCompletedTasks")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {Object.values(account.taskStats).reduce(
              (sum, stat) => sum + stat.completed,
              0
            )}
          </p>
        </Card>
      </div>

      {/* Task Type Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {Object.entries(account.taskStats).map(([type, stats]) => {
          const TaskIcon = getTaskIcon(type as CompletedTask["type"]);
          return (
            <Card key={type} className='p-6'>
              <div className='flex items-center gap-3 mb-4'>
                <div
                  className={`p-2 rounded-lg ${
                    type === "likes"
                      ? "bg-pink-50"
                      : type === "subscribers"
                      ? "bg-blue-50"
                      : type === "views"
                      ? "bg-purple-50"
                      : "bg-green-50"
                  }`}>
                  <TaskIcon
                    className={`w-5 h-5 ${
                      type === "likes"
                        ? "text-pink-500"
                        : type === "subscribers"
                        ? "text-blue-500"
                        : type === "views"
                        ? "text-purple-500"
                        : "text-green-500"
                    }`}
                  />
                </div>
                <h3 className='font-medium text-gray-900 capitalize'>
                  {t(type)}
                </h3>
              </div>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm text-gray-500'>{t("completedTasks")}</p>
                  <p className='text-lg font-semibold text-gray-900'>
                    {stats.completed}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>{t("totalEarnings")}</p>
                  <p className='text-lg font-semibold text-green-600'>
                    ₺{stats.earnings.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-gray-500'>{t("rate")}</p>
                  <p className='text-sm font-medium text-gray-600'>
                    {stats.rate}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Completed Tasks */}
      <Card className='overflow-hidden'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            {t("completedTasks")}
          </h2>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {t("task")}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {t("targetUrl")}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {t("quantity")}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {t("successRate")}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {t("earnings")}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  {t("completedAt")}
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {account.completedTasks.map((task) => {
                const TaskIcon = getTaskIcon(task.type);
                return (
                  <tr key={task.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div
                          className={`p-1.5 rounded-lg ${
                            task.type === "likes"
                              ? "bg-pink-50"
                              : task.type === "subscribers"
                              ? "bg-blue-50"
                              : task.type === "views"
                              ? "bg-purple-50"
                              : "bg-green-50"
                          }`}>
                          <TaskIcon
                            className={`w-4 h-4 ${
                              task.type === "likes"
                                ? "text-pink-500"
                                : task.type === "subscribers"
                                ? "text-blue-500"
                                : task.type === "views"
                                ? "text-purple-500"
                                : "text-green-500"
                            }`}
                          />
                        </div>
                        <span className='ml-2 text-sm font-medium text-gray-900 capitalize'>
                          {t(task.type)}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <a
                        href={task.targetUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'>
                        {task.targetUrl}
                        <Link2 className='w-3 h-3' />
                      </a>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {task.quantity.toLocaleString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='w-16 h-2 bg-gray-100 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-green-500 rounded-full'
                            style={{ width: `${task.success}%` }}
                          />
                        </div>
                        <span className='ml-2 text-sm text-gray-900'>
                          {task.success}%
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600'>
                      ₺{task.earnings.toFixed(2)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(task.completedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
