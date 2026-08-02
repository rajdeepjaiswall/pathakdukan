export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getProductUrl(product: { id: number | string; name?: string }): string {
  if (!product.name) {
    return `/products/${product.id}`;
  }
  const slug = slugify(product.name);
  if (!slug) {
    return `/products/${product.id}`;
  }
  return `/products/${product.id}-${slug}`;
}

export function getProductIdFromSlug(param: string): string {
  // Extract numeric ID from "123" or "123-product-name"
  const match = param.match(/^(\d+)/);
  return match ? match[1] : param;
}
