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

interface CartItem extends CartItemPayload {
  maxStock: number
}

interface PosTerminalProps {
  businessId: string
  businessName: string
  currency: string
  initialProducts: ProductItem[]
  categories: CategoryItem[]
}

export function PosTerminal({
  businessId,
  businessName,
  currency,
  initialProducts,
  categories,
}: PosTerminalProps) {
  const [products] = useState<ProductItem[]>(initialProducts)
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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "debit_card" | "credit_card">("cash")
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
    timestamp: string
  } | null>(null)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  // Keep barcode input autofocused
  useEffect(() => {
    barcodeInputRef.current?.focus()
  }, [completedSale, checkoutOpen])

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
    setCheckoutError(null)
    setCheckoutOpen(true)
  }

  const handleConfirmSale = () => {
    if (cart.length === 0) return
    if (paymentMethod === "cash" && amountTendered < total) {
      setCheckoutError("El monto recibido no puede ser menor al total.")
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
      })

      if (res.error) {
        setCheckoutError(res.error)
        return
      }

      // Success
      setCompletedSale({
        saleId: (res.data as { sale_id: string })?.sale_id || "TICKET-001",
        total,
        changeDue: (res.data as { change_due: number })?.change_due ?? changeDue,
        items: [...cart],
        paymentMethod,
        timestamp: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      })

      setCheckoutOpen(false)
      clearCart()
    })
  }

  const handleNewSale = () => {
    setCompletedSale(null)
    clearCart()
    setTimeout(() => {
      barcodeInputRef.current?.focus()
    }, 100)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xl text-[#1F1F1F] space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="font-bold text-[#1F1F1F] text-base">Descuento Global</h4>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`py-2 rounded-lg font-bold text-xs border ${
                  discountType === "percentage"
                    ? "bg-amber-500 text-neutral-950 border-amber-500"
                    : "bg-neutral-950 text-neutral-400 border-neutral-800"
                }`}
              >
                Porcentaje (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`py-2 rounded-lg font-bold text-xs border ${
                  discountType === "fixed"
                    ? "bg-amber-500 text-neutral-950 border-amber-500"
                    : "bg-neutral-950 text-neutral-400 border-neutral-800"
                }`}
              >
                Monto fijo ($)
              </button>
            </div>

            <div>
              <label className="text-xs text-neutral-400 mb-1 block">
                {discountType === "percentage" ? "Porcentaje de descuento" : "Importe de descuento en pesos"}
              </label>
              <input
                type="number"
                min="0"
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder={discountType === "percentage" ? "Ej. 10%" : "Ej. 500"}
                className="w-full p-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-bold text-lg outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDiscountModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-sm shadow-md"
            >
              Aplicar Descuento
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout & Payment Modal ("Cobrar") */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl text-[#1F1F1F] space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-extrabold text-[#1F1F1F] text-xl">Confirmar Cobro</h3>
                <p className="text-xs text-neutral-400">Seleccioná el método de pago</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
                {checkoutError}
              </div>
            )}

            {/* Total Highlight */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-[#FE9820]/30 flex items-center justify-between">
              <span className="text-sm text-neutral-400 font-medium">Total de la venta:</span>
              <span className="text-3xl font-black text-amber-400">
                ${total.toLocaleString("es-AR")} <span className="text-xs text-neutral-500">{currency}</span>
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "cash", label: "Efectivo", icon: Banknote },
                { id: "transfer", label: "Transferencia / QR", icon: QrCode },
                { id: "debit_card", label: "Tarjeta Débito", icon: CreditCard },
                { id: "credit_card", label: "Tarjeta Crédito", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon
                const isSelected = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as typeof paymentMethod)}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold text-xs transition-all ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-neutral-400"}`} />
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Cash Mode: Tendered Amount & Change Calculation */}
            {paymentMethod === "cash" && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    Monto recibido en efectivo
                  </label>
                  <span className="text-xs text-neutral-400">
                    Mínimo: ${total.toLocaleString("es-AR")}
                  </span>
                </div>

                <input
                  type="number"
                  min={total}
                  value={amountTendered || ""}
                  onChange={(e) => setAmountTendered(Number(e.target.value))}
                  placeholder="Ingrese el monto recibido"
                  className="w-full p-3 rounded-xl bg-white border border-neutral-300 font-black text-2xl text-[#1F1F1F] outline-none focus:border-amber-500"
                />

                {/* Quick Bill Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAmountTendered(total)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 hover:border-amber-500"
                  >
                    Exacto
                  </button>
                  {[1000, 2000, 5000, 10000, 20000].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setAmountTendered((prev) => prev + bill)}
                      className="text-xs px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-[#FE9820] font-mono hover:border-amber-500"
                    >
                      +${bill.toLocaleString("es-AR")}
                    </button>
                  ))}
                </div>

                {/* Dynamic Change Banner */}
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">VUELTO A ENTREGAR:</span>
                  <span
                    className={`text-xl font-black ${
                      changeDue > 0 ? "text-emerald-400" : "text-neutral-400"
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
                className="flex-1 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmSale}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl text-[#1F1F1F] space-y-5 text-center">
            {/* Printable Ticket Area */}
            <div id="thermal-receipt" className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
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

              {/* Vuelto Highlight */}
              {completedSale.changeDue > 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                  <div className="text-[11px] font-medium">Vuelto a entregar:</div>
                  <div className="text-2xl font-black">
                    ${completedSale.changeDue.toLocaleString("es-AR")}
                  </div>
                </div>
              )}

              {/* Items Summary */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-left text-xs space-y-1.5 max-h-36 overflow-y-auto">
                {completedSale.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-neutral-300">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.product_name}
                    </span>
                    <span className="font-mono shrink-0">
                      ${(item.quantity * item.unit_price).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-white text-sm">
                  <span>TOTAL:</span>
                  <span className="text-amber-400">
                    ${completedSale.total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Print & Next Sale */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-neutral-200"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>

              <button
                type="button"
                onClick={handleNewSale}
                className="w-full py-3.5 rounded-xl bg-[#FE9820] hover:bg-[#FE9820]/90 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
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
