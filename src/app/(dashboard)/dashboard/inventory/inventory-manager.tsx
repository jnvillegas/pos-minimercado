"use client"

import React, { useState, useMemo, useTransition } from "react"
import {
  Package,
  Plus,
  Search,
  Upload,
  Download,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Edit2,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  Barcode,
  RefreshCw,
  Tag,
  Sparkles,
} from "lucide-react"
import * as XLSX from "xlsx"
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  createCategoryAction,
  adjustStockAction,
  importProductsAction,
} from "./actions"
import { ProductInput, SpreadsheetProductRow } from "@/lib/validations/product"

export interface ProductRecord {
  id: string
  name: string
  barcode: string | null
  category_id: string | null
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
  image_url: string | null
  is_active: boolean
}

export interface CategoryRecord {
  id: string
  name: string
}

interface InventoryManagerProps {
  initialProducts: ProductRecord[]
  initialCategories: CategoryRecord[]
  businessId: string
  currency: string
}

export function InventoryManager({
  initialProducts,
  initialCategories,
  businessId,
  currency,
}: InventoryManagerProps) {
  const [products, setProducts] = useState<ProductRecord[]>(initialProducts)
  const [categories, setCategories] = useState<CategoryRecord[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<ProductRecord | null>(null)

  // State transitions
  const [, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    } else {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  // Currency Formatter
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Category mapping
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  // KPIs
  const totalProducts = products.length
  const totalValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.cost_price, 0)
  }, [products])
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= p.min_stock).length
  }, [products])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
        return false
      }
      // Low stock filter
      if (showLowStockOnly && p.stock > p.min_stock) {
        return false
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false
        return matchesName || matchesBarcode
      }
      return true
    })
  }, [products, selectedCategory, showLowStockOnly, searchQuery])

  // Handlers for Products
  const handleOpenCreateModal = () => {
    setEditingProduct(null)
    setIsProductModalOpen(true)
  }

  const handleOpenEditModal = (product: ProductRecord) => {
    setEditingProduct(product)
    setIsProductModalOpen(true)
  }

  const handleDeleteProduct = async (product: ProductRecord) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return

    startTransition(async () => {
      const res = await deleteProductAction(product.id, businessId)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== product.id))
        showNotification(`Producto "${product.name}" eliminado correctamente`)
      }
    })
  }

  // Quick Stock Adjustment
  const handleApplyStockAdjustment = async (
    product: ProductRecord,
    delta: number,
    reason: string
  ) => {
    startTransition(async () => {
      const res = await adjustStockAction(product.id, delta, reason)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        const updated = res.data
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, stock: Number(updated.stock) } : p
          )
        )
        setQuickAdjustProduct(null)
        showNotification(`Stock de "${product.name}" actualizado a ${updated.stock}`)
      }
    })
  }

  // Template Download
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Nombre: "Detergente Magistral 500ml",
        CodigoDeBarras: "7791290001015",
        Categoria: "Lavandería y Limpieza",
        PrecioCosto: 1400,
        PrecioVenta: 2200,
        Stock: 25,
        StockMinimo: 5,
      },
      {
        Nombre: "Galletitas Oreo 118g",
        CodigoDeBarras: "7791290002029",
        Categoria: "Almacén y Galletitas",
        PrecioCosto: 950,
        PrecioVenta: 1500,
        Stock: 18,
        StockMinimo: 6,
      },
      {
        Nombre: "Coca-Cola 2.25L",
        CodigoDeBarras: "7791290003019",
        Categoria: "Bebidas",
        PrecioCosto: 2100,
        PrecioVenta: 3200,
        Stock: 12,
        StockMinimo: 4,
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla_Productos")
    XLSX.writeFile(workbook, "plantilla_importacion_productos.xlsx")
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:text-[#1F1F1F]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-[#1F1F1F]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Products */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Total Productos
            </p>
            <h3 className="text-2xl font-bold text-[#1F1F1F] mt-1">{totalProducts}</h3>
            <p className="text-xs text-neutral-500 mt-1">Activos en catálogo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FE9820]/10 border border-[#FE9820]/20 flex items-center justify-center text-[#FE9820]">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Valuation at Cost */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Valor del Inventario (Costo)
            </p>
            <h3 className="text-2xl font-bold text-[#1F1F1F] mt-1">
              {formatMoney(totalValuation)}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Capital en mercadería</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Low Stock Warning */}
        <div
          onClick={() => setShowLowStockOnly((prev) => !prev)}
          className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            showLowStockOnly
              ? "bg-red-500/15 border-red-500/50 ring-2 ring-red-500/30"
              : lowStockCount > 0
              ? "bg-white border-red-500/30 hover:border-red-500/50"
              : "bg-white border-neutral-200"
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Stock Bajo / Reposición
              </p>
              {lowStockCount > 0 && (
                <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  ALERTA
                </span>
              )}
            </div>
            <h3
              className={`text-2xl font-bold mt-1 ${
                lowStockCount > 0 ? "text-red-400" : "text-[#1F1F1F]"
              }`}
            >
              {lowStockCount}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {showLowStockOnly ? "Filtrado activo (clic para quitar)" : "Productos bajo el mínimo"}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              lowStockCount > 0
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-neutral-800 border-neutral-300 text-neutral-400"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Toolbar & Actions */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o código de barras (ej: Ariel, 7791290...)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#1F1F1F] text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría"
              className="px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:border-[#FE9820] cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Quick Low Stock Toggle */}
            <button
              onClick={() => setShowLowStockOnly((prev) => !prev)}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                showLowStockOnly
                  ? "bg-red-500/20 border-red-500/50 text-red-300"
                  : "bg-neutral-50 border-neutral-200 text-neutral-400 hover:text-[#1F1F1F] hover:border-neutral-300"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Solo Stock Bajo</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-200/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-700 hover:text-[#1F1F1F] hover:border-neutral-300 transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Nueva Categoría</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              title="Descargar plantilla Excel para importación"
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-neutral-700 hover:text-[#1F1F1F] hover:border-neutral-300 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla Excel</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#FE9820] hover:border-[#FE9820]/40 transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Excel / CSV</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/60 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4 text-right">Costo</th>
                <th className="py-3.5 px-4 text-right">Venta</th>
                <th className="py-3.5 px-4 text-right">Margen %</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-neutral-400">
                      No se encontraron productos
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {searchQuery || selectedCategory !== "all" || showLowStockOnly
                        ? "Probá ajustando los filtros de búsqueda"
                        : "Agregá tu primer producto o importá desde un Excel"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.min_stock
                  const marginPct =
                    p.sale_price > 0
                      ? Math.round(
                          ((p.sale_price - p.cost_price) / p.sale_price) * 100
                        )
                      : 0

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-neutral-100/40 transition-colors group"
                    >
                      {/* Product Name & Barcode */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-300/80 flex items-center justify-center text-[#FE9820] flex-shrink-0">
                            {p.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Package className="w-5 h-5 opacity-70" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1F1F1F] group-hover:text-[#FE9820] transition-colors">
                              {p.name}
                            </p>
                            {p.barcode ? (
                              <p className="text-xs text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                                <Barcode className="w-3 h-3 text-neutral-500" />
                                <span>{p.barcode}</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-neutral-600 italic">
                                Sin código
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        {p.category_id && categoryMap.has(p.category_id) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-700 border border-neutral-300">
                            <Tag className="w-3 h-3 text-amber-500" />
                            {categoryMap.get(p.category_id)}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-600">General</span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-neutral-400">
                        {formatMoney(p.cost_price)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1F1F1F]">
                        {formatMoney(p.sale_price)}
                      </td>

                      {/* Margin % */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                            marginPct >= 40
                              ? "bg-emerald-500/10 text-emerald-400"
                              : marginPct >= 20
                              ? "bg-[#FE9820]/10 text-[#FE9820]"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {marginPct}%
                        </span>
                      </td>

                      {/* Stock & Quick Adjustment */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleApplyStockAdjustment(p, -1, "shrinkage")}
                            title="Restar 1 unidad"
                            className="w-6 h-6 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-[#1F1F1F] flex items-center justify-center text-xs font-bold transition-colors"
                          >
                            -
                          </button>

                          <button
                            onClick={() => setQuickAdjustProduct(p)}
                            title="Ajuste rápido de stock"
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border transition-all ${
                              isLowStock
                                ? "bg-red-500/15 text-red-400 border-red-500/30 hover:border-red-500"
                                : "bg-neutral-800 text-neutral-800 border-neutral-300 hover:border-neutral-600"
                            }`}
                          >
                            {p.stock}
                            {isLowStock && (
                              <span className="ml-1 text-[10px] text-red-400">⚠️</span>
                            )}
                          </button>

                          <button
                            onClick={() => handleApplyStockAdjustment(p, 1, "intake")}
                            title="Sumar 1 unidad"
                            className="w-6 h-6 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-[#1F1F1F] flex items-center justify-center text-xs font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                        {isLowStock && (
                          <p className="text-[10px] text-red-400 mt-0.5">
                            Mín: {p.min_stock}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Editar producto"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#FE9820] hover:bg-neutral-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Eliminar producto"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create & Edit Product */}
      {isProductModalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          businessId={businessId}
          onClose={() => setIsProductModalOpen(false)}
          onSaved={(savedProduct, isNew) => {
            if (isNew) {
              setProducts((prev) => [savedProduct, ...prev])
              showNotification(`Producto "${savedProduct.name}" creado con éxito`)
            } else {
              setProducts((prev) =>
                prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
              )
              showNotification(`Producto "${savedProduct.name}" actualizado`)
            }
            setIsProductModalOpen(false)
          }}
          onOpenNewCategory={() => setIsCategoryModalOpen(true)}
        />
      )}

      {/* Modal: New Category */}
      {isCategoryModalOpen && (
        <CategoryModal
          businessId={businessId}
          onClose={() => setIsCategoryModalOpen(false)}
          onCreated={(newCat) => {
            setCategories((prev) => [...prev, newCat])
            showNotification(`Categoría "${newCat.name}" creada`)
            setIsCategoryModalOpen(false)
          }}
        />
      )}

      {/* Modal: Quick Stock Adjustment */}
      {quickAdjustProduct && (
        <QuickStockModal
          product={quickAdjustProduct}
          onClose={() => setQuickAdjustProduct(null)}
          onApply={(delta, reason) => {
            handleApplyStockAdjustment(quickAdjustProduct, delta, reason)
          }}
        />
      )}

      {/* Modal: Bulk Excel / CSV Import */}
      {isImportModalOpen && (
        <BulkImportModal
          businessId={businessId}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={(summary) => {
            showNotification(summary)
            setIsImportModalOpen(false)
            // Reload page data by soft refreshing
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Product Form Modal (Create & Edit)
// -------------------------------------------------------------
function ProductFormModal({
  product,
  categories,
  businessId,
  onClose,
  onSaved,
  onOpenNewCategory,
}: {
  product: ProductRecord | null
  categories: CategoryRecord[]
  businessId: string
  onClose: () => void
  onSaved: (product: ProductRecord, isNew: boolean) => void
  onOpenNewCategory: () => void
}) {
  const isEditing = Boolean(product)

  const [name, setName] = useState(product?.name || "")
  const [barcode, setBarcode] = useState(product?.barcode || "")
  const [categoryId, setCategoryId] = useState(product?.category_id || "")
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() || "0")
  const [salePrice, setSalePrice] = useState(product?.sale_price?.toString() || "")
  const [stock, setStock] = useState(product?.stock?.toString() || "0")
  const [minStock, setMinStock] = useState(product?.min_stock?.toString() || "5")
  const [imageUrl, setImageUrl] = useState(product?.image_url || "")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Real-time Margin & Markup calculations
  const numCost = parseFloat(costPrice) || 0
  const numSale = parseFloat(salePrice) || 0
  const grossProfit = numSale - numCost
  const marginPct = numSale > 0 ? Math.round((grossProfit / numSale) * 100) : 0
  const markupPct = numCost > 0 ? Math.round((grossProfit / numCost) * 100) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("El nombre del producto es obligatorio")
      return
    }
    if (numSale <= 0) {
      setError("El precio de venta debe ser mayor a cero")
      return
    }

    setLoading(true)
    setError(null)

    const payload: ProductInput = {
      name: name.trim(),
      barcode: barcode.trim() || null,
      category_id: categoryId || null,
      cost_price: numCost,
      sale_price: numSale,
      stock: parseFloat(stock) || 0,
      min_stock: parseFloat(minStock) || 5,
      image_url: imageUrl.trim() || null,
      is_active: true,
    }

    try {
      if (isEditing && product) {
        const res = await updateProductAction(product.id, payload, businessId)
        if (res.error) {
          setError(res.error)
        } else {
          onSaved(
            {
              ...product,
              ...payload,
              cost_price: numCost,
              sale_price: numSale,
              stock: payload.stock,
              min_stock: payload.min_stock,
            },
            false
          )
        }
      } else {
        const res = await createProductAction(payload, businessId)
        if (res.error) {
          setError(res.error)
        } else if (res.data) {
          onSaved(
            {
              id: res.data.id,
              name: res.data.name,
              barcode: res.data.barcode,
              category_id: res.data.category_id,
              cost_price: Number(res.data.cost_price),
              sale_price: Number(res.data.sale_price),
              stock: Number(res.data.stock),
              min_stock: Number(res.data.min_stock),
              image_url: res.data.image_url,
              is_active: res.data.is_active,
            },
            true
          )
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error al guardar"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Generate random barcode
  const handleGenerateBarcode = () => {
    const randomBarcode = "779" + Math.floor(1000000000 + Math.random() * 9000000000).toString()
    setBarcode(randomBarcode)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FE9820]/10 border border-[#FE9820]/30 flex items-center justify-center text-[#FE9820]">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-[#1F1F1F] text-base">
              {isEditing ? "Editar Producto" : "Nuevo Producto"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-[#1F1F1F] p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Jabón Líquido Ariel 3L"
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
            />
          </div>

          {/* Barcode & Auto-generator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-700">
                Código de Barras (EAN / UPC)
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[11px] text-[#FE9820] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Generar código aleatorio
              </button>
            </div>
            <div className="relative">
              <Barcode className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Escaneá con el lector o ingresá número..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
              />
            </div>
          </div>

          {/* Category with Inline Add Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-700">Categoría</label>
              <button
                type="button"
                onClick={onOpenNewCategory}
                className="text-[11px] text-[#FE9820] hover:underline flex items-center gap-1"
              >
                + Crear categoría
              </button>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:border-[#FE9820]"
            >
              <option value="">Sin Categoría (General)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Row: Cost & Sale Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Precio de Costo ($)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Precio de Venta ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono font-bold text-[#FE9820] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
              />
            </div>
          </div>

          {/* Profit Margin live calculator widget */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
            <div>
              <p className="text-neutral-400">Margen comercial bruto</p>
              <p
                className={`font-bold text-sm ${
                  marginPct >= 35
                    ? "text-emerald-400"
                    : marginPct > 0
                    ? "text-[#FE9820]"
                    : "text-neutral-400"
                }`}
              >
                {marginPct}% de margen ({markupPct}% markup)
              </p>
            </div>
            <div className="text-right">
              <p className="text-neutral-400">Ganancia neta / unidad</p>
              <p className="font-bold font-mono text-sm text-[#1F1F1F]">
                ${grossProfit > 0 ? grossProfit.toLocaleString("es-AR") : "0.00"}
              </p>
            </div>
          </div>

          {/* Stock & Minimum Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono text-[#1F1F1F] focus:outline-none focus:border-[#FE9820]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono text-[#1F1F1F] focus:outline-none focus:border-[#FE9820]"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              URL de Imagen (Opcional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/foto-producto.jpg"
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-400 hover:text-[#1F1F1F] text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>{isEditing ? "Guardar Cambios" : "Crear Producto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: New Category Modal
// -------------------------------------------------------------
function CategoryModal({
  businessId,
  onClose,
  onCreated,
}: {
  businessId: string
  onClose: () => void
  onCreated: (cat: CategoryRecord) => void
}) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const res = await createCategoryAction(name.trim(), businessId)
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      onCreated(res.data)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-neutral-200 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FE9820]" />
            <h3 className="font-bold text-[#1F1F1F] text-sm">Nueva Categoría</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-[#1F1F1F]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nombre de la categoría
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Lácteos, Fiambres, Limpieza..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm text-[#1F1F1F] placeholder-neutral-500 focus:outline-none focus:border-[#FE9820]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs text-neutral-400 hover:text-[#1F1F1F]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-1.5 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 text-neutral-950 font-bold text-xs disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Quick Stock Modal
// -------------------------------------------------------------
function QuickStockModal({
  product,
  onClose,
  onApply,
}: {
  product: ProductRecord
  onClose: () => void
  onApply: (delta: number, reason: string) => void
}) {
  const [delta, setDelta] = useState<string>("1")
  const [reason, setReason] = useState<string>("intake")

  const handleQuickAdd = (amount: number) => {
    setDelta(amount.toString())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(delta)
    if (!num || num === 0) return
    onApply(num, reason)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-neutral-200 shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-[#1F1F1F] text-sm">Ajuste de Stock</h3>
            <p className="text-xs text-neutral-400 truncate max-w-[240px]">
              {product.name}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-[#1F1F1F]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 mb-4 flex items-center justify-between text-xs">
          <span className="text-neutral-400">Stock Actual:</span>
          <span className="font-bold font-mono text-[#1F1F1F] text-sm">
            {product.stock} unidades
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Preset Buttons */}
          <div>
            <p className="text-xs text-neutral-400 mb-2">Ingreso rápido:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[+1, +5, +10, +25].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    handleQuickAdd(amt)
                    setReason("intake")
                  }}
                  className="py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-bold text-neutral-800 transition-colors"
                >
                  +{amt}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {[-1, -2, -5, -10].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    handleQuickAdd(amt)
                    setReason("shrinkage")
                  }}
                  className="py-1 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-xs font-mono font-bold text-red-400 transition-colors"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Delta Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Ajuste (número positivo para sumar, negativo para restar)
            </label>
            <input
              type="number"
              step="any"
              required
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-sm font-mono text-[#1F1F1F] focus:outline-none focus:border-[#FE9820]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Motivo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#FE9820]"
            >
              <option value="intake">Ingreso de mercadería / Compra</option>
              <option value="shrinkage">Merma / Producto roto / Vencido</option>
              <option value="audit_correction">Corrección por inventario físico</option>
              <option value="manual_adjustment">Ajuste manual</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs text-neutral-400 hover:text-[#1F1F1F]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// Sub-component: Bulk Excel / CSV Import Modal
// -------------------------------------------------------------
function BulkImportModal({
  businessId,
  onClose,
  onSuccess,
}: {
  businessId: string
  onClose: () => void
  onSuccess: (summary: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<SpreadsheetProductRow[]>([])
  const [parsingError, setParsingError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setParsingError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

        if (rawJson.length === 0) {
          setParsingError("El archivo no contiene filas con datos.")
          return
        }

        // Map flexible column names to standard keys
        const rows: SpreadsheetProductRow[] = rawJson
          .map((row) => {
            const name = String(
              row.Nombre || row.nombre || row.Producto || row.name || ""
            ).trim()
            const rawBarcode =
              row.CodigoDeBarras ||
              row.codigo ||
              row.barcode ||
              row.Barcode ||
              row["Código de Barras"]
            const barcode = rawBarcode ? String(rawBarcode).trim() : null
            const rawCategory =
              row.Categoria || row.categoria || row.category
            const category = rawCategory ? String(rawCategory).trim() : null
            const cost_price =
              parseFloat(String(row.PrecioCosto || row.costo || row.cost_price || 0)) || 0
            const sale_price =
              parseFloat(String(row.PrecioVenta || row.venta || row.sale_price || 0)) || 0
            const stock = parseFloat(String(row.Stock || row.stock || 0)) || 0
            const min_stock =
              parseFloat(
                String(row.StockMinimo || row.min_stock || row["Stock Mínimo"] || 5)
              ) || 5

            return {
              name,
              barcode,
              category,
              cost_price,
              sale_price,
              stock,
              min_stock,
            }
          })
          .filter((r) => r.name !== "")

        if (rows.length === 0) {
          setParsingError(
            "No se encontraron productos válidos con la columna 'Nombre'."
          )
        } else {
          setParsedRows(rows)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al leer el archivo"
        setParsingError("Error al leer el archivo: " + msg)
      }
    }
    reader.readAsBinaryString(uploadedFile)
  }

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return

    setLoading(true)
    setParsingError(null)

    try {
      const res = await importProductsAction(businessId, parsedRows)
      if (res.error) {
        setParsingError(res.error)
      } else {
        const stats = res.data as {
          inserted?: number
          updated?: number
          categories_created?: number
        } | null
        const msg = `Importación completada: ${stats?.inserted || 0} nuevos productos creados, ${
          stats?.updated || 0
        } actualizados, ${stats?.categories_created || 0} nuevas categorías.`
        onSuccess(msg)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la importación"
      setParsingError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#FE9820]" />
            <h3 className="font-bold text-[#1F1F1F] text-base">
              Importación Masiva de Productos (Excel / CSV)
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-[#1F1F1F]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {parsingError && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              {parsingError}
            </div>
          )}

          {/* Dropzone */}
          <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 text-center hover:border-[#FE9820]/50 transition-colors bg-neutral-50">
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-[#1F1F1F]">
              {file ? file.name : "Seleccioná un archivo .xlsx o .csv"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Las columnas admitidas son: Nombre, CodigoDeBarras, Categoria, PrecioCosto,
              PrecioVenta, Stock, StockMinimo
            </p>
            <label className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-semibold text-neutral-800 hover:text-[#1F1F1F] hover:border-neutral-600 cursor-pointer transition-all">
              <span>Examinar archivo</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-700">
                  Previsualización ({parsedRows.length} productos detectados)
                </p>
                <span className="text-[11px] text-[#FE9820]">
                  Categorías nuevas se crearán automáticamente
                </span>
              </div>
              <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-neutral-50 text-neutral-400 sticky top-0 border-b border-neutral-200">
                    <tr>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Código</th>
                      <th className="p-2">Categoría</th>
                      <th className="p-2 text-right">Costo</th>
                      <th className="p-2 text-right">Venta</th>
                      <th className="p-2 text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-700">
                    {parsedRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-100/30">
                        <td className="p-2 font-medium text-[#1F1F1F]">{row.name}</td>
                        <td className="p-2 font-mono text-neutral-400">
                          {row.barcode || "-"}
                        </td>
                        <td className="p-2">{row.category || "-"}</td>
                        <td className="p-2 text-right font-mono">
                          ${row.cost_price}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-[#FE9820]">
                          ${row.sale_price}
                        </td>
                        <td className="p-2 text-center font-mono">{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <p className="text-[11px] text-neutral-500 italic text-right">
                  ... y {parsedRows.length - 10} filas más.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-400 hover:text-[#1F1F1F]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || parsedRows.length === 0}
            onClick={handleImportSubmit}
            className="px-5 py-2 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
            <span>Confirmar e Importar ({parsedRows.length})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
