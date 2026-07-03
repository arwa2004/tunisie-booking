export function getImageUrl(path: string | null): string {
  if (!path) return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://127.0.0.1:8000";
  return `${base}${path}`;
}