import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la categoría es obligatorio").max(60, "Máximo 60 caracteres"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre del producto es obligatorio").max(150, "Máximo 150 caracteres"),
  barcode: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  category_id: z
    .string()
    .uuid("Categoría inválida")
    .nullable()
    .optional(),
  cost_price: z.coerce
    .number()
    .min(0, "El precio de costo no puede ser negativo"),
  sale_price: z.coerce
    .number()
    .min(0.01, "El precio de venta debe ser mayor a cero"),
  stock: z.coerce
    .number()
    .min(0, "El stock no puede ser negativo")
    .default(0),
  min_stock: z.coerce
    .number()
    .min(0, "El stock mínimo no puede ser negativo")
    .default(5),
  image_url: z
    .string()
    .url("URL de imagen inválida")
    .nullable()
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid("ID de producto inválido"),
  delta: z.coerce.number().refine((val) => val !== 0, "El ajuste no puede ser cero"),
  reason: z.string().optional().default("manual_adjustment"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const spreadsheetProductRowSchema = z.object({
  name: z.string().trim().min(1, "Nombre obligatorio"),
  barcode: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  cost_price: z.coerce.number().min(0).default(0),
  sale_price: z.coerce.number().min(0.01, "Precio de venta requerido"),
  stock: z.coerce.number().min(0).default(0),
  min_stock: z.coerce.number().min(0).default(5),
});

export type SpreadsheetProductRow = z.infer<typeof spreadsheetProductRowSchema>;
