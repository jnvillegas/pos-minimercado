"use client"

import React, { useState, useRef, useEffect, useTransition } from "react"
import { processSaleAction, CartItemPayload } from "./actions"
import { CameraScannerModal } from "@/components/pos/camera-scanner-modal"
import {
  Barcode,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Percent,
  X,
  Loader2,
  Wallet,
  Users,
  MessageSquare,
} from "lucide-react"

export interface ProductItem {
  id: string
  name: string
  barcode: string | null
  sale_price: number
  cost_price: number
  stock: number
  category_id: string | null
  category_name?: string
}

export interface CategoryItem {
  id: string
  name: string
}

export interface CustomerPosItem {
  id: string
  name: string
  phone: string
  dni_cuil: string
  current_debt: number
  credit_limit: number
}

interface CartItem extends CartItemPayload {
  maxStock: number
}

interface PosTerminalProps {
  businessId: string
  businessName: string
  currency: string
  initialProducts: ProductItem[]
  categories: CategoryItem[]
  initialCustomers?: CustomerPosItem[]
}

export function PosTerminal({
  businessId,
  businessName,
  currency,
  initialProducts,
  categories,
  initialCustomers = [],
}: PosTerminalProps) {
  const [products] = useState<ProductItem[]>(initialProducts)
  const [customers] = useState<CustomerPosItem[]>(initialCustomers)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [barcodeAlert, setBarcodeAlert] = useState<string | null>(null)
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false)

  // Discounts
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [showDiscountModal, setShowDiscountModal] = useState(false)

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "debit_card" | "credit_card" | "credit">("cash")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("")
  const [amountTendered, setAmountTendered] = useState<number>(0)
  const [isPending, startTransition] = useTransition()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Receipt modal
  const [completedSale, setCompletedSale] = useState<{
    saleId: string
    total: number
    changeDue: number
    items: CartItem[]
    paymentMethod: string
    customerName?: string
    customerPhone?: string
    newDebt?: number
    timestamp: string
  } | null>(null)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Filter customers for credit / fiado search
  const filteredCustomers = customers.filter((c) => {
    const q = customerSearchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.dni_cuil && c.dni_cuil.toLowerCase().includes(q))
    )
  })

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.category_id === selectedCategory
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      query === "" ||
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))

    return matchesCategory && matchesSearch
  })

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          unit_price: Number(product.sale_price),
          unit_cost: Number(product.cost_price),
          quantity: 1,
          maxStock: Number(product.stock),
        },
      ]
    })
    setBarcodeAlert(null)
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setDiscountValue(0)
    setBarcodeAlert(null)
    setCheckoutError(null)
  }

  // Web Audio synthesizer beep for barcode scan feedback
  const playBeepSound = (success: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Unified barcode processor (used by USB pistol, Camera scanner, and Manual enter)
  const processBarcode = (code: string): boolean => {
    const trimmed = code.trim()
    if (!trimmed) return false

    // Match exact barcode or barcode stripping leading zeroes (common in EAN/UPC barcodes)
    const cleanScanned = trimmed.replace(/^0+/, "")
    const matched = products.find(
      (p) =>
        p.barcode === trimmed ||
        (p.barcode && p.barcode.replace(/^0+/, "") === cleanScanned)
    )

    if (matched) {
      addToCart(matched)
      setBarcodeInput("")
      setBarcodeAlert(null)
      playBeepSound(true)
      return true
    } else {
      setBarcodeAlert(`No se encontró ningún producto con el código: ${trimmed}`)
      setBarcodeInput("")
      playBeepSound(false)
      return false
    }
  }

  // Global keydown listener for USB & Bluetooth barcode scanners (works even without focus)
  useEffect(() => {
    let buffer = ""
    let lastKeyTime = 0

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing in modals, note inputs, or other text controls
      const target = e.target as HTMLElement | null
      const isOtherInput =
        target &&
        target !== barcodeInputRef.current &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)

      if (isOtherInput) return

      const now = Date.now()

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          e.preventDefault()
          const scannedCode = buffer.trim()
          buffer = ""
          processBarcode(scannedCode)
        } else {
          buffer = ""
        }
        return
      }

      // Barcode guns send rapid character bursts (< 80ms between keystrokes)
      if (e.key.length === 1) {
        if (now - lastKeyTime > 120) {
          buffer = "" // Reset if slow human typing
        }
        buffer += e.key
        lastKeyTime = now
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [products])

  // Handle USB barcode scanner Enter key
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processBarcode(barcodeInput)
  }

  // Financial calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unit_price, 0)
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * Math.min(100, Math.max(0, discountValue))) / 100
      : Math.min(subtotal, Math.max(0, discountValue))

  const total = Math.max(0, subtotal - discountAmount)
  const changeDue = paymentMethod === "cash" ? Math.max(0, amountTendered - total) : 0

  const handleOpenCheckout = () => {
    setAmountTendered(total)
    setSelectedCustomerId("")
    setCustomerSearchQuery("")
    setCheckoutError(null)
    setCheckoutOpen(true)
  }

  const handleConfirmSale = () => {
    if (cart.length === 0) return
    if (paymentMethod === "cash" && amountTendered < total) {
      setCheckoutError("El monto recibido no puede ser menor al total.")
      return
    }
    if (paymentMethod === "credit" && !selectedCustomerId) {
      setCheckoutError("Debe seleccionar un cliente para registrar la venta a cuenta corriente (fiado).")
      return
    }

    startTransition(async () => {
      const res = await processSaleAction({
        businessId,
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          barcode: item.barcode,
          unit_price: item.unit_price,
          unit_cost: item.unit_cost,
          quantity: item.quantity,
        })),
        paymentMethod,
        discountAmount,
        discountType: discountAmount > 0 ? discountType : null,
        amountTendered: paymentMethod === "cash" ? amountTendered : null,
        customerId: paymentMethod === "credit" ? selectedCustomerId : null,
      })

      if (res.error) {
        setCheckoutError(res.error)
        return
      }

      // Success
      const selCustomer = customers.find((c) => c.id === selectedCustomerId)
      setCompletedSale({
        saleId: (res.data as { sale_id: string })?.sale_id || "TICKET-001",
        total,
        changeDue: (res.data as { change_due: number })?.change_due ?? changeDue,
        items: [...cart],
        paymentMethod,
        customerName: paymentMethod === "credit" ? selCustomer?.name : undefined,
        customerPhone: paymentMethod === "credit" ? selCustomer?.phone : undefined,
        newDebt:
          paymentMethod === "credit"
            ? Number((res.data as any)?.new_debt) || Number(selCustomer?.current_debt || 0) + total
            : undefined,
        timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      })

      setCheckoutOpen(false)
      clearCart()
    })
  }

  const handleNewSale = () => {
    setCompletedSale(null)
    clearCart()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* LEFT COLUMN: Barcode Scanner, Search & Catalog Grid */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        {/* Barcode Scanner Inputs: USB Hardware Pistol + Mobile/Webcam Camera */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#FE9820]">
                <Barcode className="w-5 h-5" />
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Escanear con pistola USB / Bluetooth (o tipear código + Enter)..."
                className="w-full pl-11 pr-24 py-3 bg-white border-2 border-neutral-200 focus:border-[#FE9820] rounded-xl text-[#1F1F1F] placeholder:text-[#9E9E9E] text-sm outline-none transition-all shadow-inner"
              />
              <div className="absolute inset-y-0 right-1.5 flex items-center">
                <span className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-2 py-1 rounded border border-neutral-200">
                  Pistola USB
                </span>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
              title="Abrir cámara para escanear con el celular o notebook"
            >
              <Camera className="w-4 h-4 text-[#FE9820]" />
              <span className="hidden sm:inline">Cámara</span>
            </button>
          </div>

          {barcodeAlert && (
            <div className="mt-2 p-3 text-xs rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{barcodeAlert}</span>
              </div>
              <button
                type="button"
                onClick={() => setBarcodeAlert(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o código de barras..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 focus:border-[#FE9820] rounded-xl text-sm text-[#1F1F1F] placeholder:text-[#9E9E9E] outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`text-xs px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#FE9820] text-white font-bold border-[#FE9820]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-[#1F1F1F]"
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-2 rounded-xl border whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#FE9820] text-white font-bold border-[#FE9820]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-[#1F1F1F]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-sm">
              <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
              <span>No se encontraron productos coincidentes</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart.find((item) => item.product_id === p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="group relative p-3.5 rounded-2xl bg-white border border-neutral-200 hover:border-[#FE9820] hover:shadow-md text-left transition-all flex flex-col justify-between shadow-sm"
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FE9820] text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-amber-500/30">
                        {inCart.quantity}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                        <span className="font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded text-[10px]">
                          {p.barcode || "Sin código"}
                        </span>
                        <span className="text-emerald-400 font-medium">Stock: {p.stock}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1F1F1F] group-hover:text-[#FE9820] line-clamp-2 transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-base font-extrabold text-[#FE9820]">
                        ${Number(p.sale_price).toLocaleString("es-AR")}
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-neutral-100 group-hover:bg-[#FE9820] group-hover:text-white text-neutral-700 flex items-center justify-center text-xs transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Cart & Checkout Panel */}
      <div className="w-full lg:w-96 flex flex-col bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FE9820]" />
            <h3 className="font-bold text-[#1F1F1F] text-base">Carrito de Venta</h3>
            <span className="text-xs font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
              {cart.reduce((acc, i) => acc + i.quantity, 0)} ítems
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-neutral-400 hover:text-red-400 transition-colors"
            >
              Vaciar
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[220px] max-h-[420px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 text-sm">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
              <p>El carrito está vacío</p>
              <p className="text-xs text-neutral-400 mt-1">
                Escaneá un código de barras o tocá un producto para agregarlo
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product_id}
                className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-medium text-[#1F1F1F] truncate text-xs" title={item.product_name}>
                    {item.product_name}
                  </h5>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    ${item.unit_price.toLocaleString("es-AR")} c/u
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="p-1 rounded text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs text-[#1F1F1F]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="p-1 rounded text-neutral-500 hover:text-[#1F1F1F] hover:bg-neutral-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Total & Delete */}
                <div className="text-right shrink-0">
                  <div className="font-bold text-[#1F1F1F] text-xs">
                    ${(item.quantity * item.unit_price).toLocaleString("es-AR")}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product_id)}
                    className="text-neutral-400 hover:text-red-400 p-0.5 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout Action */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/80 space-y-3">
          {/* Discount Trigger */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowDiscountModal(true)}
              className="text-[#FE9820] hover:text-[#FE9820]/80 font-medium inline-flex items-center gap-1"
            >
              <Percent className="w-3.5 h-3.5" />
              {discountAmount > 0
                ? `Descuento aplicado: -$${discountAmount.toLocaleString("es-AR")}`
                : "Aplicar descuento global"}
            </button>
            {discountAmount > 0 && (
              <button
                type="button"
                onClick={() => setDiscountValue(0)}
                className="text-neutral-400 hover:text-neutral-200 text-[10px]"
              >
                Quitar
              </button>
            )}
          </div>

          {/* Subtotal & Discount rows */}
          {discountAmount > 0 && (
            <div className="space-y-1 text-xs text-neutral-400 border-t border-neutral-800/60 pt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Descuento:</span>
                <span>-${discountAmount.toLocaleString("es-AR")}</span>
              </div>
            </div>
          )}

          {/* TOTAL BANNER */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-neutral-600">Total a Pagar</span>
            <span className="text-2xl font-black text-[#FE9820]">
              ${total.toLocaleString("es-AR")} <span className="text-xs text-neutral-400 font-normal">{currency}</span>
            </span>
          </div>

          {/* Big Action Button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Banknote className="w-5 h-5" />
            <span>COBRAR (${total.toLocaleString("es-AR")})</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Discount Dialog */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl text-[#1F1F1F] space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h4 className="font-bold text-[#1F1F1F] text-base">Descuento Global</h4>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                  discountType === "percentage"
                    ? "bg-[#FE9820]/15 text-[#1F1F1F] border-[#FE9820] ring-1 ring-[#FE9820]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Porcentaje (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                  discountType === "fixed"
                    ? "bg-[#FE9820]/15 text-[#1F1F1F] border-[#FE9820] ring-1 ring-[#FE9820]"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Monto fijo ($)
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 block">
                {discountType === "percentage" ? "Porcentaje de descuento" : "Importe de descuento en pesos"}
              </label>
              <input
                type="number"
                min="0"
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder={discountType === "percentage" ? "Ej. 10%" : "Ej. 500"}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-[#FE9820] rounded-xl text-[#1F1F1F] font-bold text-lg outline-none transition-all"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDiscountModal(false)}
              className="w-full py-3 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 text-white font-bold text-sm shadow-xs transition-colors"
            >
              Aplicar Descuento
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout & Payment Modal ("Cobrar") */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-3xl p-6 sm:p-7 shadow-2xl text-[#1F1F1F] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-extrabold text-[#1F1F1F] text-xl">Confirmar Cobro</h3>
                <p className="text-xs text-neutral-400">Seleccioná el método de pago</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Total Highlight */}
            <div className="p-4 rounded-2xl bg-neutral-50/80 border border-[#FE9820]/30 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-neutral-500 font-semibold">Total de la venta:</span>
              <span className="text-3xl font-black text-[#FE9820]">
                ${total.toLocaleString("es-AR")} <span className="text-xs text-neutral-500 font-bold">{currency}</span>
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "cash", label: "Efectivo", icon: Banknote },
                { id: "transfer", label: "Transferencia / QR", icon: QrCode },
                { id: "debit_card", label: "Tarjeta Débito", icon: CreditCard },
                { id: "credit_card", label: "Tarjeta Crédito", icon: CreditCard },
                { id: "credit", label: "Fiado / Cta. Cte.", icon: Wallet, isCredit: true },
              ].map((m) => {
                const Icon = m.icon
                const isSelected = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as typeof paymentMethod)
                      setCheckoutError(null)
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-bold text-xs transition-all ${
                      isSelected
                        ? m.isCredit
                          ? "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500 shadow-xs"
                          : "bg-[#FE9820]/10 border-[#FE9820] text-[#1F1F1F] ring-1 ring-[#FE9820] shadow-xs"
                        : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
                    } ${m.isCredit ? "col-span-2 sm:col-span-1" : ""}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected
                          ? m.isCredit
                            ? "text-purple-600"
                            : "text-[#FE9820]"
                          : "text-neutral-400"
                      }`}
                    />
                    <span className="truncate">{m.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Credit / Fiado Mode: Select Customer */}
            {paymentMethod === "credit" && (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-700" />
                    <label className="text-xs font-bold text-purple-950">
                      Cliente de Cuenta Corriente (Fiado)
                    </label>
                  </div>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId("")}
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      Cambiar cliente
                    </button>
                  )}
                </div>

                {!selectedCustomerId ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, teléfono o DNI..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-[#1F1F1F] placeholder:text-neutral-400 outline-none focus:border-purple-500 shadow-2xs"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-purple-100">
                      {filteredCustomers.length === 0 ? (
                        <div className="py-4 text-center text-xs text-neutral-500">
                          {customers.length === 0 ? (
                            <div className="space-y-1">
                              <p className="font-semibold text-neutral-700">No hay clientes dados de alta</p>
                              <a
                                href="/dashboard/customers"
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
                              >
                                Crear clientes en el módulo Clientes →
                              </a>
                            </div>
                          ) : (
                            <p>No se encontraron clientes con "{customerSearchQuery}"</p>
                          )}
                        </div>
                      ) : (
                        filteredCustomers.map((c) => {
                          const hasDebt = c.current_debt > 0
                          const exceedsLimit =
                            c.credit_limit > 0 && c.current_debt + total > c.credit_limit

                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id)
                                setCheckoutError(null)
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-white/80 transition-colors flex items-center justify-between gap-2 group border border-transparent hover:border-purple-200 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-neutral-800 group-hover:text-purple-900 truncate">
                                  {c.name}
                                </div>
                                <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                                  {c.phone && <span>📞 {c.phone}</span>}
                                  {c.dni_cuil && <span>DNI: {c.dni_cuil}</span>}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-[9px] font-medium text-neutral-500">Deuda actual:</div>
                                <div
                                  className={`text-xs font-black ${
                                    hasDebt ? "text-amber-700" : "text-emerald-700"
                                  }`}
                                >
                                  ${c.current_debt.toLocaleString("es-AR")}
                                </div>
                                {exceedsLimit && (
                                  <span className="text-[9px] font-bold text-red-600 uppercase">
                                    Excede límite
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  (() => {
                    const sel = customers.find((c) => c.id === selectedCustomerId)
                    if (!sel) return null
                    const newDebt = sel.current_debt + total
                    const exceeds = sel.credit_limit > 0 && newDebt > sel.credit_limit

                    return (
                      <div className="space-y-2">
                        <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                                {sel.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-black text-xs text-neutral-900">{sel.name}</h4>
                                <p className="text-[10px] text-neutral-500">
                                  {sel.phone || "Sin teléfono"} {sel.dni_cuil ? `• DNI ${sel.dni_cuil}` : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              Seleccionado
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 text-[11px]">
                            <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                              <span className="text-neutral-500 block text-[10px]">Deuda actual</span>
                              <span className="font-bold text-neutral-800">
                                ${sel.current_debt.toLocaleString("es-AR")}
                              </span>
                            </div>
                            <div className="p-2 rounded-lg bg-purple-100/60 border border-purple-200">
                              <span className="text-purple-900 block text-[10px] font-semibold">
                                Nueva deuda tras venta
                              </span>
                              <span className="font-black text-purple-900 text-xs">
                                ${newDebt.toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>

                          {sel.credit_limit > 0 && (
                            <div className="flex items-center justify-between text-[10px] pt-1 text-neutral-500 font-medium">
                              <span>Límite de crédito asignado:</span>
                              <span className="font-bold text-neutral-700">
                                ${sel.credit_limit.toLocaleString("es-AR")}
                              </span>
                            </div>
                          )}
                        </div>

                        {exceeds && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-semibold flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                            <span>
                              Aviso: La nueva deuda (${newDebt.toLocaleString("es-AR")}) superará el límite de crédito (${sel.credit_limit.toLocaleString("es-AR")}).
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })()
                )}
              </div>
            )}

            {/* Cash Mode: Tendered Amount & Change Calculation */}
            {paymentMethod === "cash" && (
              <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700">
                    Monto recibido en efectivo
                  </label>
                  <span className="text-xs text-neutral-400 font-medium">
                    Mínimo: ${total.toLocaleString("es-AR")}
                  </span>
                </div>

                <input
                  type="number"
                  min={total}
                  value={amountTendered || ""}
                  onChange={(e) => setAmountTendered(Number(e.target.value))}
                  placeholder="Ingrese el monto recibido"
                  className="w-full p-3 rounded-xl bg-white border border-neutral-200 focus:border-[#FE9820] font-black text-2xl text-[#1F1F1F] outline-none shadow-inner transition-colors"
                />

                {/* Quick Bill Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAmountTendered(total)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:border-[#FE9820] shadow-2xs"
                  >
                    Exacto
                  </button>
                  {[1000, 2000, 5000, 10000, 20000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setAmountTendered((prev) => prev + bill)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[#FE9820] hover:border-[#FE9820] shadow-2xs"
                    >
                      +${bill.toLocaleString("es-AR")}
                    </button>
                  ))}
                </div>

                {/* Dynamic Change Banner */}
                <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Vuelto a entregar:</span>
                  <span
                    className={`text-xl font-black ${
                      changeDue > 0 ? "text-emerald-600" : "text-neutral-500"
                    }`}
                  >
                    ${changeDue.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setCheckoutOpen(false)}
                className="flex-1 py-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmSale}
                className="flex-1 py-3.5 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando venta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Venta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Post-Sale Receipt & Ticket Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl text-[#1F1F1F] space-y-5 text-center animate-fadeIn">
            {/* Printable Ticket Area */}
            <div id="thermal-receipt" className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-extrabold text-[#1F1F1F] text-xl">¡Venta Exitosa!</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {businessName} • {completedSale.timestamp}
                </p>
                <span className="text-[10px] font-mono text-neutral-400">
                  ID: {completedSale.saleId.slice(0, 8)}
                </span>
              </div>

              {/* Credit / Fiado Pill */}
              {completedSale.paymentMethod === "credit" && (
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs text-left space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-purple-700" />
                      Cuenta Corriente (Fiado)
                    </span>
                    <span className="text-[10px] bg-purple-200/70 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                      Pendiente
                    </span>
                  </div>
                  <p className="text-purple-800 text-[11px]">
                    Cliente: <strong className="font-extrabold">{completedSale.customerName}</strong>
                  </p>
                  {completedSale.newDebt !== undefined && (
                    <p className="text-[10px] text-purple-700 font-semibold">
                      Deuda acumulada: ${completedSale.newDebt.toLocaleString("es-AR")}
                    </p>
                  )}
                </div>
              )}

              {/* Vuelto Highlight */}
              {completedSale.changeDue > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <div className="text-[11px] font-semibold text-emerald-700">Vuelto a entregar:</div>
                  <div className="text-2xl font-black text-emerald-700">
                    ${completedSale.changeDue.toLocaleString("es-AR")}
                  </div>
                </div>
              )}

              {/* Items Summary */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-left text-xs space-y-2 max-h-36 overflow-y-auto">
                {completedSale.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-neutral-700">
                    <span className="truncate pr-2 font-medium">
                      {item.quantity}x {item.product_name}
                    </span>
                    <span className="font-mono font-semibold shrink-0">
                      ${(item.quantity * item.unit_price).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-[#1F1F1F] text-sm">
                  <span>TOTAL:</span>
                  <span className="text-[#FE9820]">
                    ${completedSale.total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Print & Next Sale */}
            <div className="space-y-2">
              {completedSale.paymentMethod === "credit" && completedSale.customerPhone && (
                <a
                  href={`https://wa.me/${completedSale.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `¡Hola ${completedSale.customerName || ""}! Te enviamos el comprobante de tu compra fiada por $${completedSale.total.toLocaleString("es-AR")} en ${businessName}.\nTicket #${completedSale.saleId.slice(0, 8)}.\n¡Muchas gracias!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Ticket por WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-neutral-200 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>

              <button
                type="button"
                onClick={handleNewSale}
                className="w-full py-3.5 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nueva Venta (Enter / Espacio)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={processBarcode}
      />
    </div>
  )
}
