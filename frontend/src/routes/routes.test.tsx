import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { ProtectedRoute } from "../components/ProtectedRoute/ProtectedRoute";
import { routes } from "./routes";

describe("application routes", () => {
  it("keeps login public", () => {
    const loginRoute = routes.find((route) => route.path === "/login");

    expect(loginRoute).toBeDefined();
  });

  it("protects every private application route with ProtectedRoute", () => {
    const protectedGroup = routes.find(
      (route) =>
        isValidElement(route.element) && route.element.type === ProtectedRoute,
    );
    const protectedPaths = protectedGroup?.children?.map((route) => route.path);

    expect(protectedPaths).toEqual([
      "/dashboard",
      "/capture",
      "/records",
      "/records/:recordId",
      "/compare",
    ]);
  });
});
