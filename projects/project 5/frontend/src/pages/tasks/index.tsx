import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, addHours, isPast } from "date-fns";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { taskApi } from "../../lib/api/task";
import { toast } from "react-hot-toast";
import {
  Clock,
  Filter,
  Search,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  Users,
  ExternalLink,
  BarChart2,
  TrendingUp,
} from "lucide-react";

interface Task {
  id: string;
  userId: string;
  type: "like" | "follow" | "view" | "subscribe";
  platform: "instagram" | "youtube";
  targetUrl: string;
  quantity: number;
  remainingQuantity: number;
  status: "available" | "completed" | "cooldown";
  lastExecutedAt?: string;
  cooldownEndsAt?: string;
  rate: number;
  lastUpdatedAt: string;
}

interface TaskFilters {
  platform?: string;
  type?: string;
  status?: string;
  search?: string;
}

export const TasksPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tasks with React Query
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      return taskApi.getAvailableTasks(token, filters);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Task execution handler
  const handleExecuteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      await taskApi.startTask(token, taskId);
      toast.success(t("taskStartedSuccessfully"));
      refetch(); // Refresh task list
    } catch (error) {
      toast.error(t("failedToStartTask"));
      console.error("Failed to start task:", error);
    }
  };

  // Check if a task is available for execution
  const isTaskAvailable = (task: Task): boolean => {
    if (task.userId === user?.id) return false; // Can't execute own tasks
    if (task.status === "completed") {
      if (task.type === "follow" || task.type === "subscribe") return false;
      if (task.cooldownEndsAt && !isPast(new Date(task.cooldownEndsAt)))
        return false;
    }
    return true;
  };

  // Get task status text and color
  const getTaskStatus = (task: Task) => {
    if (task.status === "completed") {
      return {
        text: t("completed"),
        color: "text-green-600 bg-green-50",
        icon: CheckCircle,
      };
    }
    if (task.status === "cooldown") {
      return {
        text: t("cooldown"),
        color: "text-yellow-600 bg-yellow-50",
        icon: Clock,
      };
    }
    return {
      text: t("available"),
      color: "text-blue-600 bg-blue-50",
      icon: Play,
    };
  };

  return (
    <div className='py-8'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>
          {t("availableTasks")}
        </h1>
        <p className='mt-2 text-gray-600'>{t("availableTasksDescription")}</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
              <Play className='w-6 h-6 text-blue-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +12.5%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("availableTasks")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {tasks.filter((t) => t.status === "available").length}
          </p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 text-green-600' />
            </div>
            <span className='flex items-center text-sm font-medium text-green-600'>
              <TrendingUp className='w-4 h-4 mr-1' />
              +8.3%
            </span>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("completedToday")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>
            {tasks.filter((t) => t.status === "completed").length}
          </p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center'>
              <BarChart2 className='w-6 h-6 text-purple-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("successRate")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>98.5%</p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center'>
              <Clock className='w-6 h-6 text-pink-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>
            {t("avgCompletionTime")}
          </h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>2.5m</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className='p-6 mb-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchTasks")}
                className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200'
              />
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Filter className='w-5 h-5 text-gray-400' />
              <select
                value={filters.platform}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, platform: e.target.value }))
                }
                className='pr-8 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200'>
                <option value=''>{t("allPlatforms")}</option>
                <option value='instagram'>Instagram</option>
                <option value='youtube'>YouTube</option>
              </select>
            </div>
            <div className='flex items-center gap-2'>
              <Filter className='w-5 h-5 text-gray-400' />
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, type: e.target.value }))
                }
                className='pr-8 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200'>
                <option value=''>{t("allTypes")}</option>
                <option value='like'>{t("likes")}</option>
                <option value='follow'>{t("follows")}</option>
                <option value='view'>{t("views")}</option>
                <option value='subscribe'>{t("subscribes")}</option>
              </select>
            </div>
            <Button
              variant='outline'
              onClick={() => refetch()}
              className='flex items-center gap-2'>
              <RefreshCw className='w-4 h-4' />
              {t("refresh")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className='space-y-4'>
        {tasks.map((task) => {
          const status = getTaskStatus(task);
          const isAvailable = isTaskAvailable(task);
          const TaskIcon =
            task.type === "like"
              ? ThumbsUp
              : task.type === "follow"
              ? Users
              : task.type === "view"
              ? Eye
              : Users;

          return (
            <Card key={task.id} className='p-6'>
              <div className='flex flex-col lg:flex-row lg:items-center gap-6'>
                {/* Task Info */}
                <div className='flex-1'>
                  <div className='flex items-start gap-4'>
                    <div
                      className={`p-2 rounded-lg ${
                        task.platform === "instagram"
                          ? "bg-pink-50"
                          : "bg-red-50"
                      }`}>
                      <TaskIcon
                        className={`w-5 h-5 ${
                          task.platform === "instagram"
                            ? "text-pink-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h3 className='text-lg font-medium text-gray-900'>
                          {t(task.type)}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <a
                        href={task.targetUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1'>
                        {task.targetUrl}
                        <ExternalLink className='w-3 h-3' />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Task Stats */}
                <div className='grid grid-cols-3 gap-4 lg:w-1/3'>
                  <div>
                    <p className='text-sm text-gray-500'>{t("quantity")}</p>
                    <p className='text-lg font-medium text-gray-900'>
                      {task.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>{t("remaining")}</p>
                    <p className='text-lg font-medium text-gray-900'>
                      {task.remainingQuantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>{t("rate")}</p>
                    <p className='text-lg font-medium text-green-600'>
                      ₺{task.rate.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className='flex items-center gap-4'>
                  {task.status === "cooldown" ? (
                    <div className='text-sm text-yellow-600'>
                      {t("availableIn", {
                        time: formatDistanceToNow(
                          new Date(task.cooldownEndsAt!)
                        ),
                      })}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleExecuteTask(task.id)}
                      disabled={!isAvailable}
                      className={`w-32 ${
                        isAvailable
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}>
                      {isAvailable ? t("execute") : t("unavailable")}
                    </Button>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <p className='text-sm text-gray-500'>
                  {t("lastUpdated")}:{" "}
                  {formatDistanceToNow(new Date(task.lastUpdatedAt))} {t("ago")}
                </p>
              </div>
            </Card>
          );
        })}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <Card className='p-12 text-center'>
            <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {t("noTasksAvailable")}
            </h3>
            <p className='text-gray-500'>{t("checkBackLater")}</p>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className='p-6'>
                <div className='animate-pulse flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gray-200 rounded-lg' />
                  <div className='flex-1 space-y-4'>
                    <div className='h-4 bg-gray-200 rounded w-1/4' />
                    <div className='h-4 bg-gray-200 rounded w-1/2' />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className='p-6 bg-red-50'>
            <div className='flex items-center gap-3 text-red-600'>
              <AlertCircle className='w-5 h-5' />
              <p>{t("errorLoadingTasks")}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
