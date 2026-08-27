import { useEffect, useState } from "react";
import type { Product } from "@oneix/shared";
import { listProducts } from "../lib/api";

// The catalog is five items and never changes at runtime -- a module-level
// cache is enough, no need for a fetching library.
let cache: Product[] | null = null;

export function useProducts() {
  const [products, setProducts] = useState<Product[] | null>(cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    listProducts()
      .then((data) => {
        cache = data;
        setProducts(data);
      })
      .catch(() => setError("Couldn't reach the catalog."));
  }, []);

  return { products, loading: !products && !error, error };
}

export function useProduct(id: string | undefined) {
  const { products, loading, error } = useProducts();
  const product = id ? products?.find((p) => p.id === id) ?? null : null;
  return { product, loading, error };
}
