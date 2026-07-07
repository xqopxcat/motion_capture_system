const MAX_REDIRECT_LENGTH = 240;

export function getSafeRedirectTo(searchParams: URLSearchParams): string | null {
  const redirectTo = searchParams.get("redirectTo")?.trim();

  if (!redirectTo) {
    return null;
  }

  if (redirectTo.length > MAX_REDIRECT_LENGTH) {
    return null;
  }

  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return null;
  }

  if (redirectTo.includes("\\") || /[\u0000-\u001f\u007f]/.test(redirectTo)) {
    return null;
  }

  return redirectTo;
}
