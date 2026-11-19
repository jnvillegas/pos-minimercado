"use client"

import React, { useState, useTransition } from "react"
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Mail,
  Link as LinkIcon,
  Crown,
} from "lucide-react"
import {
  createInvitationAction,
  revokeInvitationAction,
  removeTeamMemberAction,
} from "./actions"

export interface MemberRecord {
  id: string
  user_id: string
  role: string
  created_at: string
  email?: string
}

export interface InvitationRecord {
  id: string
  email: string
  role: string
  token: string
  status: string
  created_at: string
  expires_at: string
}

interface TeamManagerProps {
  initialMembers: MemberRecord[]
  initialInvitations: InvitationRecord[]
  businessId: string
  currentUserId: string
}

export function TeamManager({
  initialMembers,
  initialInvitations,
  businessId,
  currentUserId,
}: TeamManagerProps) {
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers)
  const [invitations, setInvitations] = useState<InvitationRecord[]>(initialInvitations)

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [roleInput, setRoleInput] = useState<"manager" | "cashier">("cashier")
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

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

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "medium",
    }).format(new Date(dateStr))
  }

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 3000)
    showNotification("Enlace copiado al portapapeles")
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    startTransition(async () => {
      const res = await createInvitationAction(businessId, emailInput.trim(), roleInput)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        const invite = res.data as InvitationRecord
        setInvitations((prev) => [invite, ...prev])
        const link = `${window.location.origin}/invite/${invite.token}`
        setCreatedInviteUrl(link)
        showNotification(`Invitación generada para ${invite.email}`)
      }
    })
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("¿Estás seguro de revocar esta invitación?")) return

    startTransition(async () => {
      const res = await revokeInvitationAction(inviteId, businessId)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        setInvitations((prev) => prev.filter((i) => i.id !== inviteId))
        showNotification("Invitación revocada")
      }
    })
  }

  const handleRemoveMember = async (member: MemberRecord) => {
    if (!confirm(`¿Desvincular a este miembro del negocio?`)) return

    startTransition(async () => {
      const res = await removeTeamMemberAction(member.id, businessId)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== member.id))
        showNotification("Miembro desvinculado correctamente")
      }
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return {
          label: "Dueño",
          color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: Crown,
        }
      case "manager":
        return {
          label: "Encargado",
          color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          icon: Shield,
        }
      case "cashier":
        return {
          label: "Cajero",
          color: "bg-neutral-800 text-neutral-300 border-neutral-700",
          icon: Users,
        }
      default:
        return {
          label: role,
          color: "bg-neutral-800 text-neutral-400 border-neutral-700",
          icon: Users,
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Invite Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Equipo y Permisos (RBAC)
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Administrá cajeros y encargados. Los cajeros no pueden ver costos, márgenes ni reportes.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedInviteUrl(null)
            setEmailInput("")
            setIsInviteModalOpen(true)
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          <span>+ Invitar Empleado</span>
        </button>
      </div>

      {/* Active Team Members Card */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Miembros Activos</h3>
          </div>
          <span className="text-xs text-neutral-500">{members.length} miembros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4">Usuario / Email</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Fecha de Ingreso</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {members.map((m) => {
                const badge = getRoleBadge(m.role)
                const BadgeIcon = badge.icon
                const isSelf = m.user_id === currentUserId
                const isOwner = m.role === "owner"

                return (
                  <tr key={m.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-amber-400">
                        {(m.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p>{m.email || `Usuario #${m.user_id.substring(0, 8)}`}</p>
                        {isSelf && (
                          <span className="text-[10px] text-amber-500 font-semibold">
                            (Tu cuenta actual)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-neutral-400">
                      {formatDate(m.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!isOwner && !isSelf ? (
                        <button
                          onClick={() => handleRemoveMember(m)}
                          disabled={isPending}
                          title="Desvincular miembro"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-600">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Card */}
      {invitations.length > 0 && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">Invitaciones Pendientes</h3>
            </div>
            <span className="text-xs text-neutral-500">{invitations.length} pendientes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Correo Invitado</th>
                  <th className="py-3 px-4">Rol Ofrecido</th>
                  <th className="py-3 px-4">Enlace de Aceptación</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {invitations.map((inv) => {
                  const badge = getRoleBadge(inv.role)
                  const isCopied = copiedToken === inv.token

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">{inv.email}</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleCopyLink(inv.token)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 transition-colors"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          )}
                          <span>{isCopied ? "¡Copiado!" : "Copiar Enlace"}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          disabled={isPending}
                          title="Revocar invitación"
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors text-xs"
                        >
                          Revocar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Invite Staff */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Invitar Empleado</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdInviteUrl ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                  <p className="font-bold">¡Invitación generada con éxito!</p>
                  <p>Compartile este enlace a tu empleado para que se sume al negocio:</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteUrl)
                      showNotification("Enlace copiado")
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                  >
                    Copiar
                  </button>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs"
                >
                  Finalizar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Correo Electrónico del Empleado *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="empleado@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Rol en el Negocio
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as "manager" | "cashier")}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="cashier">
                      Cajero (Solo cobra en POS y opera caja; costos ocultos)
                    </option>
                    <option value="manager">
                      Encargado (Administra catálogo, costos, inventario y movimientos)
                    </option>
                  </select>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LinkIcon className="w-3.5 h-3.5" />
                    )}
                    <span>Generar Enlace</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
