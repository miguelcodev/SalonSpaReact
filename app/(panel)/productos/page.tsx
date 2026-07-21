import { Suspense } from "react";
import { getProductsWithCategory, getProductCategories } from "@/lib/productos/queries";
import { ProductosTabs } from "./_components/productos-tabs";
import { ProductTable } from "./_components/product-table";
import { NewProductModal } from "./_components/new-product-modal";

interface ProductosPageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const params = await searchParams;

  const [products, categories] = await Promise.all([
    getProductsWithCategory(),
    getProductCategories(),
  ]);

  const counts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {});

  const filtered = params.cat
    ? products.filter((p) => p.category_id === params.cat)
    : products;

  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Productos
          </h1>
          <p className="text-color-ink-soft mt-2">
            Catálogo de venta (tintes, shampús, accesorios) y control de stock
            {lowStockCount > 0 && (
              <span className="text-red-600 font-semibold">
                {" "}
                — {lowStockCount} con bajo stock
              </span>
            )}
          </p>
        </div>
        <NewProductModal />
      </div>

      {/* Category tabs */}
      <Suspense fallback={null}>
        <ProductosTabs
          categories={categories}
          activeCategoryId={params.cat}
          counts={counts}
          totalCount={products.length}
        />
      </Suspense>

      {/* Products table */}
      <ProductTable products={filtered} />
    </div>
  );
}
