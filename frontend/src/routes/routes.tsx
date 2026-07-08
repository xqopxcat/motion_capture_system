import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute/ProtectedRoute";
import { CapturePage } from "../pages/CapturePage/CapturePage";
import { ComparePage } from "../pages/ComparePage/ComparePage";
import { DashboardPage } from "../pages/DashboardPage/DashboardPage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { RecordViewerPage } from "../pages/RecordViewerPage/RecordViewerPage";
import { RecordsPage } from "../pages/RecordsPage/RecordsPage";

export const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/capture",
        element: <CapturePage />,
      },
      {
        path: "/records",
        element: <RecordsPage />,
      },
      {
        path: "/records/:recordId",
        element: <RecordViewerPage />,
      },
      {
        path: "/compare",
        element: <ComparePage />,
      },
    ],
  },
];
