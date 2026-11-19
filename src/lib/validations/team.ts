import { z } from "zod";

export const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(120, "Máximo 120 caracteres"),
  role: z.enum(["manager", "cashier"], {
    message: "El rol debe ser Encargado o Cajero",
  }),
});

export type InviteInput = z.infer<typeof inviteSchema>;
