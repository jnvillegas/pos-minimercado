"use client"

import React, { useState, useTransition } from "react"
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Clock,
  Sparkles,
} from "lucide-react"
import {
  PlatformAdminUser,
  PlatformAdminInvitation,
  addPlatformAdminAction,
  removePlatformAdminAction,
} from "./actions"

interface TeamViewProps {
  initialAdmins: PlatformAdminUser[]
  initialInvitations: PlatformAdminInvitation[]
  currentUserId: string
}

export function TeamView({
  initialAdmins,
  initialInvitations,
  currentUserId,
}: TeamViewProps) {
  const [admins, setAdmins] = useState<PlatformAdminUser[]>(initialAdmins)
  const [invitations, setInvitations] =
    useState<PlatformAdminInvitation[]>(initialInvitations)

  // Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [roleInput, setRoleInput] = useState<"superadmin" | "support">("support")

  // Transitions & Feedback
  const [isPending, startTransition] = useTransition()
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

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    startTransition(async () => {
      const res = await addPlatformAdminAction(emailInput, roleInput)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        const msg =
          res.result?.message || "Acceso de administrador otorgado con éxito."
        showNotification(msg, false)
        setEmailInput("")
        setIsInviteOpen(false)
        // Refresh page data
        window.location.reload()
      }
    })
  }

  const handleRemove = (admin: PlatformAdminUser) => {
    if (admin.user_id === currentUserId) {
      showNotification("No podés remover tu propio acceso de Superadmin", true)
      return
    }

    if (
      !confirm(
        `¿Estás seguro de que deseás revocar el acceso a ${admin.email}? Ya no podrá ingresar a la consola de Superadmin.`
      )
    ) {
      return
    }

    startTransition(async () => {
      const res = await removePlatformAdminAction(admin.id)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
        showNotification(`Acceso revocado a ${admin.email}`, false)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="p-1 hover:bg-red-100 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Equipo de Superadministradores
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Usuarios con credenciales para acceder a la consola global de la plataforma y soporte técnico
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Invitar Administrador</span>
        </button>
      </div>

      {/* Security Roles Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#1F1F1F]">
                Rol Superadmin
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                Acceso Total
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Control absoluto de la plataforma: métricas de facturación, alta/baja de comercios, configuración de planes SaaS y gestión de otros administradores.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#1F1F1F]">
                Rol Soporte Técnico
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                Operativo
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Permite ingresar a las tiendas de los clientes en modo impersonación para resolver dudas de stock, turnos o cajas sin acceso a las métricas financieras de la red.
            </p>
          </div>
        </div>
      </div>

      {/* Active Admins Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Administradores Activos ({admins.length})
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Personal autorizado con bypass RLS a nivel de plataforma
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Administrador</th>
                <th className="px-4 py-3.5">Rol de Acceso</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5">Fecha de Alta</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {admins.map((adm) => {
                const isMe = adm.user_id === currentUserId
                const isSuper = adm.role === "superadmin"

                return (
                  <tr
                    key={adm.id}
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ${
                            isSuper
                              ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                              : "bg-gradient-to-br from-blue-500 to-cyan-600"
                          }`}
                        >
                          {isSuper ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[#1F1F1F] text-sm">
                              {adm.email}
                            </p>
                            {isMe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                                Tu cuenta actual
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            ID: {adm.user_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                          <span>Superadmin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Soporte Técnico</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Activo
                      </span>
                    </td>

                    <td className="px-5 py-4 text-neutral-500">
                      {new Date(adm.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => handleRemove(adm)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Revocar acceso de administrador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table (if any) */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1F1F1F]">
                Invitaciones Pendientes ({invitations.length})
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Usuarios invitados que aún no se han registrado en la plataforma
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Correo Invitado</th>
                  <th className="px-4 py-3">Rol Asignado</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-5 py-3">Expira en</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50/70 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-[#1F1F1F]">
                      {inv.email}
                    </td>
                    <td className="px-4 py-3.5 capitalize font-medium text-neutral-600">
                      {inv.role}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pendiente de Registro
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400">
                      {new Date(inv.expires_at).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsInviteOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 sm:p-7 space-y-5 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F1F1F]">
                    Invitar Administrador
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Acceso a la consola de plataforma
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-700">
                  Correo electrónico del colaborador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-700">
                  Rol y nivel de permisos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleInput("support")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      roleInput === "support"
                        ? "border-blue-500 bg-blue-50/50 text-blue-900 font-semibold"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span className="font-bold">Soporte</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Solo impersonación y ayuda técnica a clientes
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleInput("superadmin")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      roleInput === "superadmin"
                        ? "border-purple-500 bg-purple-50/50 text-purple-900 font-semibold"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <span className="font-bold">Superadmin</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Control total, métricas y finanzas
                    </p>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar Administrador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
