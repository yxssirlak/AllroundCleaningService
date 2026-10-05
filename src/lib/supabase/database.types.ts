export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type InventoryMovementType = "in" | "out";

export interface Database {
  public: {
    Tables: {
      inventory_products: {
        Row: {
          id: string;
          name: string;
          sku: string | null;
          barcode: string | null;
          unit: string;
          location: string | null;
          stock_quantity: number;
          minimum_quantity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sku: string;
          barcode?: string | null;
          unit?: string;
          location?: string | null;
          stock_quantity?: number;
          minimum_quantity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          sku?: string;
          barcode?: string | null;
          unit?: string;
          location?: string | null;
          minimum_quantity?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          product_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          stock_after: number;
          note: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          stock_after: number;
          note?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_products";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_members: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_inventory_member: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_inventory_movement: {
        Args: {
          p_product_id: string;
          p_movement_type: string;
          p_quantity: number;
          p_note: string | null;
        };
        Returns: {
          id: string;
          product_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          stock_after: number;
          note: string | null;
          created_by: string;
          created_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
