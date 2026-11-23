import { z } from "zod"

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del cliente es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")).default(""),
  dni_cuil: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(200).optional().default(""),
  credit_limit: z.coerce
    .number()
    .min(0, "El límite de crédito no puede ser negativo")
    .default(0),
  notes: z.string().trim().max(500).optional().default(""),
  is_active: z.boolean().default(true),
})

export type CustomerInput = z.infer<typeof customerSchema>

export const customerPaymentSchema = z.object({
  customerId: z.string().uuid("ID de cliente inválido"),
  amount: z.coerce.number().min(0.01, "El monto del pago debe ser mayor a cero"),
  paymentMethod: z.enum(["cash", "transfer", "debit_card", "other"]).default("cash"),
  notes: z.string().trim().max(250).optional().default(""),
})

export type CustomerPaymentInput = z.infer<typeof customerPaymentSchema>
