export function getSiteUrl(): URL {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (value) {
    try {
      return new URL(value);
    } catch {
      return new URL("http://localhost:3000");
    }
  }

  return new URL("http://localhost:3000");
}
