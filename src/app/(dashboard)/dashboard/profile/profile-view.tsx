"use client"

import React, { useState, useTransition } from "react"
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Hash,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Building2,
  Calendar,
  Sparkles,
  Receipt,
  ExternalLink,
  Crown,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react"
import {
  updateProfileAction,
  updatePasswordAction,
  updateBusinessBillingAction,
  deleteOwnAccountAction,
} from "./actions"

export interface UserProfileData {
  id: string
  email: string
  full_name: string
  phone: string
  dni_cuil: string
  alias: string
  avatar_url: string
  created_at: string
  is_platform_admin: boolean
  platform_role: "superadmin" | "support" | null
  business_id?: string
  business_role?: "owner" | "manager" | "cashier" | null
  business_name?: string
  business_cuit?: string
  subscription_plan?: string
  subscription_status?: string
  subscription_price?: number
  subscription_renewal_at?: string
}

interface ProfileViewProps {
  initialProfile: UserProfileData
}

export function ProfileView({ initialProfile }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfileData>(initialProfile)

  // Personal form state
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [phone, setPhone] = useState(profile.phone || "")
  const [dniCuil, setDniCuil] = useState(profile.dni_cuil || "")
  const [alias, setAlias] = useState(profile.alias || "")

  // Password state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Business billing state (for SaaS clients)
  const [businessCuit, setBusinessCuit] = useState(profile.business_cuit || "")

  // Notification states
  const [isPending, startTransition] = useTransition()
  const [isPassPending, startPassTransition] = useTransition()
  const [isBillingPending, startBillingTransition] = useTransition()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeletePending, startDeleteTransition] = useTransition()

  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const showToast = (message: string, isError = false) => {
    setNotification({
      type: isError ? "error" : "success",
      message,
    })
    setTimeout(() => {
      setNotification(null)
    }, 4500)
  }

  // Handle Personal Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      showToast("El nombre completo es requerido", true)
      return
    }

    startTransition(async () => {
      const res = await updateProfileAction({
        fullName,
        phone,
        dniCuil,
        alias,
        avatarUrl: profile.avatar_url,
      })

      if (res.error) {
        showToast(res.error, true)
      } else {
        setProfile((prev) => ({
          ...prev,
          full_name: fullName,
          phone,
          dni_cuil: dniCuil,
          alias,
        }))
        showToast("Perfil personal actualizado exitosamente")
      }
    })
  }

  // Handle Password Update
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", true)
      return
    }
    if (newPassword !== confirmPassword) {
      showToast("Las contraseñas no coinciden", true)
      return
    }

    startPassTransition(async () => {
      const res = await updatePasswordAction(newPassword)
      if (res.error) {
        showToast(res.error, true)
      } else {
        setNewPassword("")
        setConfirmPassword("")
        showToast("Contraseña modificada correctamente")
      }
    })
  }

  // Handle Business CUIT Update
  const handleSaveBusinessBilling = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.business_id) return

    startBillingTransition(async () => {
      const res = await updateBusinessBillingAction({
        businessId: profile.business_id!,
        cuit: businessCuit,
      })
      if (res.error) {
        showToast(res.error, true)
      } else {
        setProfile((prev) => ({
          ...prev,
          business_cuit: businessCuit,
        }))
        showToast("Datos fiscales del comercio guardados")
      }
    })
  }

  // Initials for avatar
  const getInitials = (name: string, email: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(" ")
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Feedback */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1F1F1F] tracking-tight">
          Mi Perfil y Cuenta
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Administrá tus datos personales, información de contacto, credencial de rol y suscripción SaaS.
        </p>
      </div>

      {/* Identity Hero Card */}
      <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FBDAA9] to-[#FE9820] text-neutral-950 font-black text-xl flex items-center justify-center shrink-0 shadow-sm ring-4 ring-amber-50">
            {getInitials(profile.full_name, profile.email)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1F1F1F]">
                {profile.full_name || profile.email.split("@")[0]}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              <span>{profile.email}</span>
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Miembro desde {new Date(profile.created_at).toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Role & Scope Credential Badge */}
        <div className="p-4 rounded-2xl border bg-neutral-50/70 border-neutral-200/80 flex items-center gap-3 md:min-w-[280px]">
          {profile.platform_role === "superadmin" ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  Nivel Plataforma
                </div>
                <div className="text-xs font-black text-[#1F1F1F]">Superadministrador Global</div>
                <div className="text-[10px] text-neutral-500">Acceso total a la red SaaS</div>
              </div>
            </>
          ) : profile.platform_role === "support" ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Nivel Plataforma
                </div>
                <div className="text-xs font-black text-[#1F1F1F]">Soporte Técnico Oficial</div>
                <div className="text-[10px] text-neutral-500">Auditoría e impersonación</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Comercio Asociado
                </div>
                <div className="text-xs font-black text-[#1F1F1F] capitalize">
                  {profile.business_role === "owner"
                    ? "Dueño de Negocio"
                    : profile.business_role === "manager"
                    ? "Encargado de Local"
                    : "Cajero Operador"}
                </div>
                <div className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                  {profile.business_name || "Comercio"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Form Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Data Form (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#FE9820]" />
                <h3 className="text-sm font-bold text-[#1F1F1F]">
                  Datos de Identidad y Contacto
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                Esenciales
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Nicolás Villegas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  Correo Electrónico (Acceso)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 border border-neutral-200 text-xs font-medium text-neutral-500 cursor-not-allowed"
                />
              </div>

              {/* Phone / WhatsApp */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                />
              </div>

              {/* DNI / CUIL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                  DNI / CUIL
                </label>
                <input
                  type="text"
                  value={dniCuil}
                  onChange={(e) => setDniCuil(e.target.value)}
                  placeholder="Ej: 20-38491823-7"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                />
              </div>

              {/* Alias */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-neutral-400" />
                  Alias de Cobro / Transferencia Personal
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Ej: nico.tienda.pos o mi-alias-personal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                />
                <p className="text-[11px] text-neutral-400">
                  Útil para registrar transferencias rápidas y asignación de operaciones.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-[#FE9820] hover:bg-[#e08416] text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>

          {/* Security & Password Form */}
          <form
            onSubmit={handleSavePassword}
            className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-bold text-[#1F1F1F]">Seguridad de la Cuenta</h3>
              </div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                Contraseña
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Repetir Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPassPending}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isPassPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>Actualizar Contraseña</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: SaaS Subscription & Fiscal Data (for SaaS Clients) or Security Card */}
        <div className="space-y-6">
          {profile.business_id ? (
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FE9820]" />
                  <h3 className="text-sm font-bold text-[#1F1F1F]">
                    Suscripción SaaS del Comercio
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile.subscription_status === "active" ? "Al día" : "Pendiente"}
                </span>
              </div>

              {/* Plan Card */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Plan Contratado
                </div>
                <div className="text-base font-black text-[#1F1F1F]">
                  {profile.subscription_plan === "enterprise"
                    ? "Plan Cadena & Franquicias"
                    : profile.subscription_plan === "free"
                    ? "Plan Almacén Inicial"
                    : "Plan Pro Crecimiento"}
                </div>
                <div className="text-lg font-mono font-bold text-[#FE9820]">
                  ${(profile.subscription_price || 15000).toLocaleString("es-AR")}{" "}
                  <span className="text-xs text-neutral-500 font-sans font-normal">/ mes</span>
                </div>
                <div className="text-[11px] text-neutral-500 pt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    Próxima cuota:{" "}
                    {profile.subscription_renewal_at
                      ? new Date(profile.subscription_renewal_at).toLocaleDateString("es-AR")
                      : "En 30 días"}
                  </span>
                </div>
              </div>

              {/* Business CUIT / Fiscal Form */}
              <form onSubmit={handleSaveBusinessBilling} className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                    CUIT / Razón Social del Comercio
                  </label>
                  <input
                    type="text"
                    value={businessCuit}
                    onChange={(e) => setBusinessCuit(e.target.value)}
                    placeholder="Ej: 30-71234567-8"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-medium text-[#1F1F1F] focus:outline-none focus:border-[#FE9820] focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-neutral-400">
                    Comercio: <strong>{profile.business_name}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isBillingPending}
                  className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs border border-neutral-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isBillingPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Guardar CUIT Comercio</span>
                </button>
              </form>

              {/* Payment Methods Info */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1.5 text-xs text-neutral-500">
                <div className="font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-neutral-400" />
                  Medios de Pago de la Suscripción
                </div>
                <p className="text-[11px] leading-relaxed">
                  Las cuotas mensuales del sistema se abonan mediante transferencia bancaria o débito automático. Para consultar facturas o solicitar cambio de sucursales, contactá a Soporte Oficial.
                </p>
              </div>
            </div>
          ) : (
            /* Platform Admin / Tech Support Info Card */
            <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-[#1F1F1F]">
                  Credencial de Plataforma
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 space-y-2">
                <div className="text-xs font-bold text-purple-900">
                  {profile.platform_role === "superadmin"
                    ? "Acceso Superadmin Activo"
                    : "Operador de Soporte Técnico"}
                </div>
                <p className="text-xs text-purple-700 leading-relaxed">
                  {profile.platform_role === "superadmin"
                    ? "Tu cuenta posee permisos irrestrictos de administración de base de datos, liquidaciones, suscripciones e invitaciones de equipo."
                    : "Tu cuenta posee permisos de auditoría, lectura de logs e impersonación en Modo Soporte para asistir a comercios clientes."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone: Delete Own Account */}
      <div className="p-6 rounded-3xl bg-red-50/40 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Darme de baja del sistema
          </h3>
          <p className="text-xs text-red-700/80 max-w-2xl">
            Eliminá tu cuenta de usuario de forma permanente. Si sos el único dueño de algún comercio, también se eliminarán sus datos asociados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDeleteConfirmText("")
            setIsDeleteModalOpen(true)
          }}
          className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Darme de baja</span>
        </button>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#1F1F1F]">
                ¿Seguro que querés darte de baja?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Tu cuenta ({profile.email}) y los comercios donde seas único dueño se eliminarán de forma definitiva. Escribí{" "}
                <strong className="text-red-600 font-mono">BAJA</strong> para confirmar.
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribí BAJA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-mono uppercase focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeletePending}
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletePending || deleteConfirmText.trim().toUpperCase() !== "BAJA"}
                onClick={() => {
                  startDeleteTransition(async () => {
                    const res = await deleteOwnAccountAction()
                    if (res?.error) {
                      showToast(res.error, true)
                      setIsDeleteModalOpen(false)
                    }
                  })
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDeletePending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmar Baja</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
