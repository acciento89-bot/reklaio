export function publicUrl(pathname: string) {
  const baseUrl = process.env.BASE_URL ?? "https://reklaio.de";
  return new URL(pathname, baseUrl);
}
