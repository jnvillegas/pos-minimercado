import { z } from "zod"

export const onboardingBusinessSchema = z.object({
  name: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  industry: z.string().min(2, "Seleccioná o escribí el rubro del negocio"),
  currency: z.enum(["ARS", "USD"], {
    message: "Seleccioná una moneda válida (ARS o USD)",
  }),
})

export type OnboardingBusinessInput = z.infer<typeof onboardingBusinessSchema>
