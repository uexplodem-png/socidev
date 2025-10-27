import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { taskApi, Task } from "../../lib/api/task";
import { toast } from "react-hot-toast";
import {
  Clock,
  Filter,
  Search,
  RefreshCw,
  Play,
  CheckCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  Users,
  ExternalLink,
  Upload,
  XCircle,
  Image as ImageIcon,
  Loader,
} from "lucide-react";

interface TaskFilters {
  platform?: string;
  type?: string;
  search?: string;
}

type TabType = "available" | "in_progress" | "completed";

export const TasksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("available");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadComment, setUploadComment] = useState("");

  // Fetch tasks based on active tab
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", activeTab, filters],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      if (activeTab === "available") {
        return taskApi.getAvailableTasks(token, filters);
      } else {
        return taskApi.getTasksByStatus(token, activeTab, filters);
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      return taskApi.startTask(token, taskId);
    },
    onSuccess: () => {
      toast.success("Task started successfully! You can now complete it and upload a screenshot.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to start task");
    },
  });

  // Submit screenshot mutation
  const submitScreenshotMutation = useMutation({
    mutationFn: async ({ taskId, file, comment }: { taskId: string; file: File; comment?: string }) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");
      return taskApi.submitScreenshot(token, taskId, file, comment);
    },
    onSuccess: () => {
      toast.success("Screenshot submitted successfully! Waiting for admin approval.");
      setShowUploadModal(false);
      setSelectedTask(null);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      setUploadComment("");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit screenshot");
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    setScreenshotFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle screenshot submission
  const handleSubmitScreenshot = () => {
    if (!selectedTask || !screenshotFile) return;
    submitScreenshotMutation.mutate({
      taskId: selectedTask.id,
      file: screenshotFile,
      comment: uploadComment,
    });
  };

  // Get task icon
  const getTaskIcon = (type: string) => {
    switch (type) {
      case "like":
        return ThumbsUp;
      case "follow":
      case "subscribe":
        return Users;
      case "view":
        return Eye;
      default:
        return ThumbsUp;
    }
  };

  // Get status badge
  const getStatusBadge = (task: Task) => {
    // Check for userStatus if available (new per-user system)
    const status = (task as any).userStatus || task.status;
    const screenshotStatus = (task as any).userScreenshotStatus || task.screenshotStatus;

    if (status === "pending" && !screenshotStatus) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
    }
    if (screenshotStatus === "pending") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Pending Review</span>;
    }
    if (screenshotStatus === "rejected") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected - Re-upload Required</span>;
    }
    if (status === "completed" && screenshotStatus === "approved") {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Available</span>;
  };

  return (
    <div className='py-8'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Tasks</h1>
        <p className='mt-2 text-gray-600'>Browse, claim, and complete tasks to earn money</p>
      </div>

      {/* Tabs */}
      <div className='mb-6 border-b border-gray-200'>
        <div className='flex gap-8'>
          <button
            onClick={() => setActiveTab("available")}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === "available"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Available Tasks
          </button>
          <button
            onClick={() => setActiveTab("in_progress")}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === "in_progress"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            My In Progress
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 ${activeTab === "completed"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            My Completed
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8'>
        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
              <Play className='w-6 h-6 text-blue-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>Available Tasks</h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>{activeTab === "available" ? tasks.length : "-"}</p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center'>
              <Clock className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>In Progress</h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>{activeTab === "in_progress" ? tasks.length : "-"}</p>
        </Card>

        <Card className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <div className='w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 text-green-600' />
            </div>
          </div>
          <h3 className='text-sm font-medium text-gray-500'>Completed</h3>
          <p className='text-2xl font-bold text-gray-900 mt-1'>{activeTab === "completed" ? tasks.length : "-"}</p>
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
                placeholder='Search tasks...'
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
                <option value=''>All Platforms</option>
                <option value='instagram'>Instagram</option>
                <option value='youtube'>YouTube</option>
                <option value='twitter'>Twitter</option>
                <option value='tiktok'>TikTok</option>
              </select>
            </div>
            <Button
              variant='outline'
              onClick={() => refetch()}
              className='flex items-center gap-2'>
              <RefreshCw className='w-4 h-4' />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Tasks List */}
      <div className='space-y-4'>
        {tasks.map((task) => {
          const TaskIcon = getTaskIcon(task.type);

          return (
            <Card key={task.id} className='p-6'>
              <div className='flex flex-col lg:flex-row lg:items-center gap-6'>
                {/* Task Info */}
                <div className='flex-1'>
                  <div className='flex items-start gap-4'>
                    <div
                      className={`p-2 rounded-lg ${task.platform === "instagram"
                        ? "bg-pink-50"
                        : task.platform === "youtube"
                          ? "bg-red-50"
                          : task.platform === "twitter"
                            ? "bg-blue-50"
                            : "bg-purple-50"
                        }`}>
                      <TaskIcon
                        className={`w-5 h-5 ${task.platform === "instagram"
                          ? "text-pink-600"
                          : task.platform === "youtube"
                            ? "text-red-600"
                            : task.platform === "twitter"
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='text-lg font-medium text-gray-900 capitalize'>
                          {task.type} on {task.platform}
                        </h3>
                        {getStatusBadge(task)}
                      </div>
                      {task.title && <p className="text-sm text-gray-600 mb-1">{task.title}</p>}
                      <a
                        href={task.targetUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'>
                        {task.targetUrl.length > 60 ? task.targetUrl.substring(0, 60) + "..." : task.targetUrl}
                        <ExternalLink className='w-3 h-3' />
                      </a>
                      {(() => {
                        const rejectionReason = (task as any).rejectionReason;
                        const screenshotStatus = (task as any).userScreenshotStatus || task.screenshotStatus;
                        return rejectionReason && screenshotStatus === "rejected" ? (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-600">{rejectionReason}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Task Stats */}
                <div className='grid grid-cols-2 gap-4 lg:w-1/4'>
                  <div>
                    <p className='text-sm text-gray-500'>Quantity</p>
                    <p className='text-lg font-medium text-gray-900'>
                      {task.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Reward</p>
                    <p className='text-lg font-medium text-green-600'>
                      ₺{task.rate.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className='flex flex-col gap-2 lg:w-40'>
                  {activeTab === "available" && (
                    <Button
                      onClick={() => startTaskMutation.mutate(task.id)}
                      disabled={startTaskMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700">
                      {startTaskMutation.isPending ? (
                        <><Loader className="w-4 h-4 animate-spin mr-2" /> Starting...</>
                      ) : (
                        <><Play className="w-4 h-4 mr-2" /> Start Task</>
                      )}
                    </Button>
                  )}

                  {activeTab === "in_progress" && (
                    <>
                      {(() => {
                        const screenshotStatus = (task as any).userScreenshotStatus || task.screenshotStatus;

                        // If screenshot was rejected or no screenshot submitted yet
                        if (!screenshotStatus || screenshotStatus === "rejected") {
                          return (
                            <Button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowUploadModal(true);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700">
                              <Upload className="w-4 h-4 mr-2" />
                              {screenshotStatus === "rejected" ? "Re-upload" : "Upload"} Screenshot
                            </Button>
                          );
                        } else if (screenshotStatus === "pending") {
                          // Screenshot submitted, awaiting review
                          return (
                            <div className="text-center">
                              <p className="text-sm text-blue-600 font-medium">Awaiting Review</p>
                              {task.screenshotSubmittedAt && (
                                <p className="text-xs text-gray-500">
                                  Submitted {formatDistanceToNow(new Date(task.screenshotSubmittedAt))} ago
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}

                  {activeTab === "completed" && (() => {
                    const screenshotUrl = (task as any).userScreenshotUrl || task.screenshotUrl;
                    return screenshotUrl ? (
                      <a
                        href={`http://localhost:3000${screenshotUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 justify-center">
                        <ImageIcon className="w-4 h-4" />
                        View Screenshot
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Timestamps */}
              <div className='mt-4 pt-4 border-t border-gray-200 flex gap-4 text-sm text-gray-500'>
                {task.startedAt && (
                  <span>Started: {formatDistanceToNow(new Date(task.startedAt))} ago</span>
                )}
                {task.completedAt && (
                  <span>Completed: {formatDistanceToNow(new Date(task.completedAt))} ago</span>
                )}
              </div>
            </Card>
          );
        })}

        {/* Empty State */}
        {!isLoading && tasks.length === 0 && (
          <Card className='p-12 text-center'>
            <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              {activeTab === "available" ? "No tasks available" :
                activeTab === "in_progress" ? "No tasks in progress" :
                  "No completed tasks"}
            </h3>
            <p className='text-gray-500'>
              {activeTab === "available" ? "Check back later for new tasks" :
                activeTab === "in_progress" ? "Start a task to see it here" :
                  "Complete tasks to build your history"}
            </p>
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
              <p>Error loading tasks. Please try again.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Upload Screenshot Modal */}
      {showUploadModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Screenshot</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedTask(null);
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                    setUploadComment("");
                  }}
                  className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1 capitalize">Task: {selectedTask.type} on {selectedTask.platform}</p>
                <a href={selectedTask.targetUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  {selectedTask.targetUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-sm text-gray-600 mt-2">Please complete the task and upload a screenshot as proof.</p>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screenshot (JPEG, PNG, WebP - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Preview */}
              {screenshotPreview && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img src={screenshotPreview} alt="Screenshot preview" className="w-full rounded-lg border border-gray-200" />
                </div>
              )}

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={uploadComment}
                  onChange={(e) => setUploadComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                  placeholder="Add any notes about the task completion..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedTask(null);
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                    setUploadComment("");
                  }}
                  variant="outline"
                  className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitScreenshot}
                  disabled={!screenshotFile || submitScreenshotMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700">
                  {submitScreenshotMutation.isPending ? (
                    <><Loader className="w-4 h-4 animate-spin mr-2" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Submit Screenshot</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
