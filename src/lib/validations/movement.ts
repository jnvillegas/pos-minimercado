import { z } from "zod";

export const movementCategoryOptions = [
  { value: "suppliers", label: "Proveedores" },
  { value: "services", label: "Servicios e Impuestos" },
  { value: "rent", label: "Alquiler" },
  { value: "owner_withdrawal", label: "Retiro de efectivo (Dueño)" },
  { value: "maintenance", label: "Mantenimiento / Limpieza" },
  { value: "other", label: "Otro" },
] as const;

export const movementSchema = z.object({
  type: z.enum(["income", "expense"], {
    message: "El tipo debe ser ingreso o gasto",
  }),
  concept: z
    .string()
    .trim()
    .min(1, "El concepto o descripción es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  amount: z.coerce
    .number()
    .min(0.01, "El monto debe ser mayor a cero"),
  category: z
    .string()
    .trim()
    .min(1, "La categoría es obligatoria")
    .default("suppliers"),
  payment_method: z.enum(
    ["cash", "transfer", "debit_card", "credit_card"],
    { message: "Método de pago inválido" }
  ),
  affect_shift: z.boolean().default(true),
  notes: z.string().trim().optional().nullable(),
});

export type MovementInput = z.infer<typeof movementSchema>;
