export const MENU_IMAGE_PLACEHOLDER = "/menu/placeholder.svg";

export function isAllowedImageUrl(
  value: string | null | undefined,
): value is string {
  if (!value) {
    return false;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "supabase.co" || url.hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}

export function resolveImageUrl(
  value: string | null | undefined,
  fallback: string = MENU_IMAGE_PLACEHOLDER,
): string {
  return isAllowedImageUrl(value) ? value : fallback;
}
