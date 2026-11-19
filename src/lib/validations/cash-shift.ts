import { z } from "zod";

export const openShiftSchema = z.object({
  initialCash: z.coerce
    .number()
    .min(0, "El fondo inicial no puede ser negativo"),
});

export type OpenShiftInput = z.infer<typeof openShiftSchema>;

export const closeShiftSchema = z
  .object({
    shiftId: z.string().uuid("ID de turno inválido"),
    actualCash: z.coerce
      .number()
      .min(0, "El efectivo real no puede ser negativo"),
    expectedCash: z.coerce.number().min(0),
    notes: z.string().trim().optional().default(""),
  })
  .refine(
    (data) => {
      const diff = Math.abs(data.actualCash - data.expectedCash);
      if (diff > 0.001) {
        return (data.notes || "").trim().length >= 4;
      }
      return true;
    },
    {
      message: "Se requiere un motivo o justificación cuando hay diferencia de caja",
      path: ["notes"],
    }
  );

export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
