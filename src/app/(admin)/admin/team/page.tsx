import React from "react"
import { connection } from "next/server"
import { requirePlatformAdmin } from "@/lib/auth/platform-admin"
import { createClient } from "@/lib/supabase/server"
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Mail,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react"

export const instant = false

export default async function AdminTeamPage() {
  await connection()
  const { user } = await requirePlatformAdmin()
  const supabase = await createClient()

  // Fetch admin records
  const { data: admins } = await supabase
    .from("platform_admins")
    .select("id, user_id, role, created_at")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1F1F1F]">
            Equipo de Superadministradores
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Usuarios con credenciales para acceder a la consola global y soporte técnico con impersonación
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Invitar Administrador</span>
        </button>
      </div>

      {/* Security Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#1F1F1F]">Rol Superadmin</h4>
            <p className="text-xs text-neutral-500">
              Control absoluto de la plataforma: métricas de facturación, alta/baja de comercios, configuración de planes y auditoría global.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#1F1F1F]">Rol Soporte Técnico</h4>
            <p className="text-xs text-neutral-500">
              Permite ingresar a las tiendas de los clientes en modo impersonación para resolver dudas de stock, turnos o cajas sin ver métricas de negocio.
            </p>
          </div>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1F1F1F]">
              Administradores Activos
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Personal autorizado con bypass RLS en nivel de plataforma
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Administrador</th>
                <th className="px-4 py-3">Rol de Acceso</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-5 py-3">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(admins || []).map((adm) => {
                const isMe = adm.user_id === user.id
                return (
                  <tr key={adm.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1F1F1F] flex items-center gap-2">
                            <span>{user.email}</span>
                            {isMe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                                Vos
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            ID: {adm.user_id.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                        <ShieldAlert className="w-3 h-3 text-purple-600" />
                        {adm.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activo
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-neutral-400">
                      {new Date(adm.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
