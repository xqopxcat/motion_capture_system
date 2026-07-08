import { getSafeInternalPath } from "./redirectIntent";

export type ProtectedRouteState = "authenticated" | "loading" | "unauthenticated";

export function getProtectedRouteState(
  hasCurrentUser: boolean,
  isLoading: boolean,
): ProtectedRouteState {
  if (isLoading) {
    return "loading";
  }

  return hasCurrentUser ? "authenticated" : "unauthenticated";
}

export function getLoginRedirect(pathname: string, search: string): string {
  const redirectTo = getSafeInternalPath(`${pathname}${search}`) ?? "/dashboard";
  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
}
