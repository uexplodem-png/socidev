import { InstagramAccountsPage } from "../pages/my-accounts/accounts/instagram";
import { InstagramAccountDetailsPage } from "../pages/my-accounts/accounts/instagram/[id]";
import { YoutubeAccountsPage } from "../pages/my-accounts/youtube/accounts";
import { YoutubeAccountDetailsPage } from "../pages/my-accounts/youtube/accounts/[id]";
import { YoutubeTasksPage } from "../pages/my-accounts/youtube/tasks";
import { YoutubeVideoListPage } from "../pages/my-accounts/youtube/tasks/videos";
import { YoutubeWatchPage } from "../pages/my-accounts/youtube/tasks/watch/[id]";

export const routes = [
  {
    path: "/my-accounts/instagram1",
    element: <InstagramAccountsPage />,
  },
  {
    path: "/my-accounts/instagram/accounts/:id",
    element: <InstagramAccountDetailsPage />,
  },
  {
    path: "/my-accounts/youtube/channels",
    element: <YoutubeAccountsPage />,
  },
  {
    path: "/my-accounts/youtube/channels/:id",
    element: <YoutubeAccountDetailsPage />,
  },
  {
    path: "/my-accounts/youtube/tasks",
    element: <YoutubeTasksPage />,
  },
  {
    path: "/my-accounts/youtube/tasks/videos",
    element: <YoutubeVideoListPage />,
  },
  {
    path: "/my-accounts/youtube/tasks/watch/:id",
    element: <YoutubeWatchPage />,
  },
];
