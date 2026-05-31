export function thumbnailUrl(url: string | null, width: number = 320): string | null {
  if (!url) return null;
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${width},q_auto,f_auto/`);
}
