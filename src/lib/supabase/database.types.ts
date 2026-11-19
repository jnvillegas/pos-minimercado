
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "business_invitations": {
                  Row: {
                    "business_id": string,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string,"role": string,"status": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by": string,"role": string,"status"?: string,"token"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string,"role"?: string,"status"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_invitations_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_members": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"role": string,"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_members_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "created_at": string,"currency": string,"id": string,"industry": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"currency"?: string,"id"?: string,"industry": string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"id"?: string,"industry"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cash_movements": {
                  Row: {
                    "amount": number,"business_id": string,"category": string,"concept": string,"created_at": string,"id": string,"notes": string | null,"payment_method": string,"shift_id": string | null,"type": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"business_id": string,"category"?: string,"concept": string,"created_at"?: string,"id"?: string,"notes"?: string | null,"payment_method": string,"shift_id"?: string | null,"type": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "amount"?: number,"business_id"?: string,"category"?: string,"concept"?: string,"created_at"?: string,"id"?: string,"notes"?: string | null,"payment_method"?: string,"shift_id"?: string | null,"type"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cash_movements_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cash_movements_shift_id_fkey"
      columns: ["shift_id"]
isOneToOne: false
      referencedRelation: "cash_shifts"
      referencedColumns: ["id"]
    }
                  ]
                },"cash_shifts": {
                  Row: {
                    "actual_cash": number | null,"business_id": string,"closed_at": string | null,"closed_by": string | null,"created_at": string,"difference": number | null,"expected_cash": number | null,"id": string,"initial_cash": number,"notes": string | null,"opened_at": string,"opened_by": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actual_cash"?: number | null,"business_id": string,"closed_at"?: string | null,"closed_by"?: string | null,"created_at"?: string,"difference"?: number | null,"expected_cash"?: number | null,"id"?: string,"initial_cash": number,"notes"?: string | null,"opened_at"?: string,"opened_by": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "actual_cash"?: number | null,"business_id"?: string,"closed_at"?: string | null,"closed_by"?: string | null,"created_at"?: string,"difference"?: number | null,"expected_cash"?: number | null,"id"?: string,"initial_cash"?: number,"notes"?: string | null,"opened_at"?: string,"opened_by"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cash_shifts_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "barcode": string | null,"business_id": string,"category_id": string | null,"cost_price": number,"created_at": string,"id": string,"image_url": string | null,"is_active": boolean,"min_stock": number,"name": string,"sale_price": number,"stock": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "barcode"?: string | null,"business_id": string,"category_id"?: string | null,"cost_price"?: number,"created_at"?: string,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"min_stock"?: number,"name": string,"sale_price"?: number,"stock"?: number,"updated_at"?: string
                  }
                  Update: {
                    "barcode"?: string | null,"business_id"?: string,"category_id"?: string | null,"cost_price"?: number,"created_at"?: string,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"min_stock"?: number,"name"?: string,"sale_price"?: number,"stock"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"sale_items": {
                  Row: {
                    "barcode": string | null,"created_at": string,"id": string,"product_id": string | null,"product_name": string,"quantity": number,"sale_id": string,"subtotal": number,"unit_cost": number,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "barcode"?: string | null,"created_at"?: string,"id"?: string,"product_id"?: string | null,"product_name": string,"quantity": number,"sale_id": string,"subtotal": number,"unit_cost"?: number,"unit_price"?: number
                  }
                  Update: {
                    "barcode"?: string | null,"created_at"?: string,"id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"sale_id"?: string,"subtotal"?: number,"unit_cost"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sale_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sale_items_sale_id_fkey"
      columns: ["sale_id"]
isOneToOne: false
      referencedRelation: "sales"
      referencedColumns: ["id"]
    }
                  ]
                },"sales": {
                  Row: {
                    "amount_tendered": number | null,"business_id": string,"change_due": number,"created_at": string,"discount_amount": number,"discount_type": string | null,"id": string,"payment_method": string,"shift_id": string | null,"status": string,"subtotal": number,"total_amount": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_tendered"?: number | null,"business_id": string,"change_due"?: number,"created_at"?: string,"discount_amount"?: number,"discount_type"?: string | null,"id"?: string,"payment_method": string,"shift_id"?: string | null,"status"?: string,"subtotal": number,"total_amount": number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "amount_tendered"?: number | null,"business_id"?: string,"change_due"?: number,"created_at"?: string,"discount_amount"?: number,"discount_type"?: string | null,"id"?: string,"payment_method"?: string,"shift_id"?: string | null,"status"?: string,"subtotal"?: number,"total_amount"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sales_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sales_shift_id_fkey"
      columns: ["shift_id"]
isOneToOne: false
      referencedRelation: "cash_shifts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitation":
{ Args: { "p_token": string }; Returns: Json
                           },
"adjust_product_stock":
{ Args: { "p_delta": number,"p_product_id": string,"p_reason"?: string }; Returns: {
              "barcode": string | null,
"business_id": string,
"category_id": string | null,
"cost_price": number,
"created_at": string,
"id": string,
"image_url": string | null,
"is_active": boolean,
"min_stock": number,
"name": string,
"sale_price": number,
"stock": number,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "products"
        isOneToOne: true
        isSetofReturn: false
      } },
"batch_import_products":
{ Args: { "p_business_id": string,"p_rows": Json }; Returns: Json
                           },
"close_cash_shift":
{ Args: { "p_actual_cash": number,"p_notes"?: string,"p_shift_id": string }; Returns: {
              "actual_cash": number | null,
"business_id": string,
"closed_at": string | null,
"closed_by": string | null,
"created_at": string,
"difference": number | null,
"expected_cash": number | null,
"id": string,
"initial_cash": number,
"notes": string | null,
"opened_at": string,
"opened_by": string,
"status": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "cash_shifts"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_business_with_owner":
{ Args: { "p_currency"?: string,"p_industry": string,"p_name": string }; Returns: Json
                           },
"create_sale":
{ Args: { "p_amount_tendered"?: number,"p_business_id": string,"p_discount_amount"?: number,"p_discount_type"?: string,"p_items": Json,"p_payment_method": string }; Returns: Json
                           },
"get_active_shift_metrics":
{ Args: { "p_shift_id": string }; Returns: Json
                           },
"get_business_financial_report":
{ Args: { "p_business_id": string,"p_end_date": string,"p_start_date": string }; Returns: Json
                           },
"get_business_role":
{ Args: { "p_business_id": string }; Returns: string
                           },
"get_shift_cash_balance":
{ Args: { "p_shift_id": string }; Returns: Json
                           },
"get_unified_movements":
{ Args: { "p_business_id": string,"p_end_date"?: string,"p_limit"?: number,"p_offset"?: number,"p_payment_method"?: string,"p_search"?: string,"p_start_date"?: string,"p_type"?: string }; Returns: {
              "amount": number,"category": string,"concept": string,"created_at": string,"id": string,"payment_method": string,"source": string,"type": string,"user_id": string
            }[]
                           },
"get_user_business_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"is_business_member":
{ Args: { "p_business_id": string }; Returns: boolean
                           },
"open_cash_shift":
{ Args: { "p_business_id": string,"p_initial_cash": number }; Returns: {
              "actual_cash": number | null,
"business_id": string,
"closed_at": string | null,
"closed_by": string | null,
"created_at": string,
"difference": number | null,
"expected_cash": number | null,
"id": string,
"initial_cash": number,
"notes": string | null,
"opened_at": string,
"opened_by": string,
"status": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "cash_shifts"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
