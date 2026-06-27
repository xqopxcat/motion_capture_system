import { createBrowserRouter, Navigate } from "react-router-dom";
import { routes } from "../routes/routes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  ...routes,
]);
