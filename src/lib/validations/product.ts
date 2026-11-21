import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la categoría es obligatorio").max(60, "Máximo 60 caracteres"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "El nombre del proveedor es obligatorio").max(100, "Máximo 100 caracteres"),
  contact_name: z.string().trim().max(100).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")).default(""),
  cuit: z.string().trim().max(30).optional().default(""),
  delivery_days: z.string().trim().max(100).optional().default(""),
  payment_info: z.string().trim().max(250).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  is_active: z.boolean().default(true),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

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
  supplier_id: z
    .string()
    .uuid("Proveedor inválido")
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

export interface SpreadsheetProductRow {
  name: string;
  barcode?: string | null;
  category?: string | null;
  supplier?: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
}
