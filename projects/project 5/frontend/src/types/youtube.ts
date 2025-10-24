export interface YoutubeTask {
  id: string;
  type: 'likes' | 'subscribers' | 'views' | 'comments';
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  targetUrl: string;
  targetCount: number;
  completedCount: number;
  errorCount: number;
  thumbnail: string;
  title: string;
  username: string;
}