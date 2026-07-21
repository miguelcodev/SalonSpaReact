import { getCategoryColor } from "@/lib/agenda/category-colors";
import { ProductStatusToggle, ProductDeleteButton } from "./product-row-actions";
import { StockMovementControl } from "./stock-movement-control";
import type { ProductWithCategory } from "@/lib/productos/types";

interface ProductTableProps {
  products: ProductWithCategory[];
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-color-surface border border-color-line rounded-2xl shadow-card p-8 text-center text-sm text-color-ink-faint">
        No hay productos en esta categoría todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-color-surface border border-color-line rounded-2xl shadow-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-color-bg border-b border-color-line">
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Producto
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Precio
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Stock
            </th>
            <th className="text-left text-[10.5px] uppercase tracking-wide text-color-ink-soft px-4 py-3.5">
              Estado
            </th>
            <th className="px-4 py-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const categoryColor = getCategoryColor(product.category);
            const isLowStock = product.stock_quantity <= product.low_stock_threshold;

            return (
              <tr
                key={product.id}
                className="border-b border-color-line-soft last:border-b-0 hover:bg-color-bg"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-1.5 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColor }}
                    ></div>
                    <div>
                      <div className="font-bold text-sm text-color-ink">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-color-ink-soft mt-0.5">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-sm font-bold text-color-ink">
                  S/ {(product.price_cents / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`font-mono text-xs px-2.5 py-1 rounded-full font-bold ${
                      isLowStock
                        ? "bg-red-50 text-red-600"
                        : "bg-color-line-soft text-color-ink-soft"
                    }`}
                  >
                    {product.stock_quantity} un.
                    {isLowStock && " ⚠"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <ProductStatusToggle productId={product.id} status={product.status} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex justify-end gap-1.5">
                    <StockMovementControl
                      productId={product.id}
                      productName={product.name}
                      currentStock={product.stock_quantity}
                    />
                    <ProductDeleteButton productId={product.id} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
