const MAX_REDIRECT_LENGTH = 240;

export function getSafeInternalPath(value: string | null | undefined): string | null {
  const path = value?.trim();

  if (!path || path.length > MAX_REDIRECT_LENGTH) {
    return null;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  if (path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path)) {
    return null;
  }

  return path;
}

export function getSafeRedirectTo(searchParams: URLSearchParams): string | null {
  return getSafeInternalPath(searchParams.get("redirectTo"));
}
