"use client"

import React, { useState, useTransition } from "react"
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react"
import { deleteOwnBusinessAction } from "./actions"

export function DeleteBusinessCard({
  businessId,
  businessName,
}: {
  businessId: string
  businessName: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const res = await deleteOwnBusinessAction(businessId)
      if (res?.error) {
        setError(res.error)
      }
    })
  }

  return (
    <>
      <div className="p-6 rounded-2xl bg-red-50/40 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Eliminar este comercio
          </h2>
          <p className="text-xs text-red-700/80 max-w-xl">
            Esta acción elimina de forma permanente el comercio <strong>{businessName}</strong> junto con sus productos, ventas, turnos de caja y clientes. No se puede deshacer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setConfirmText("")
            setError(null)
            setIsModalOpen(true)
          }}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar Comercio</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1F1F1F]">
                ¿Eliminar &ldquo;{businessName}&rdquo;?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Se borrarán todos los datos del comercio de forma definitiva. Escribí{" "}
                <strong className="text-red-600 font-mono">ELIMINAR</strong> para confirmar.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Escribí ELIMINAR"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-mono uppercase focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending || confirmText.trim().toUpperCase() !== "ELIMINAR"}
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Borrado</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
