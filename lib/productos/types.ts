export interface ProductCategory {
  id: string;
  salon_id: string;
  name: string;
  color_hex: string | null;
}

export interface Product {
  id: string;
  salon_id: string;
  category_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price_cents: number;
  stock_quantity: number;
  low_stock_threshold: number;
  status: "activo" | "pausado";
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category: ProductCategory;
}

export interface StockMovementEntry {
  id: string;
  type: "entrada" | "salida";
  quantity: number;
  reason: string | null;
  reference_sale_id: string | null;
  created_at: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  price_cents: number;
  stock_quantity: number;
}
