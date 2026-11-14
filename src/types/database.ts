export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tagline: string | null;
          description: string | null;
          price_pesewas: number;
          image_url: string | null;
          image_alt: string | null;
          is_active: boolean;
          is_featured: boolean;
          sort_order: number;
          serves: string;
          prep_minutes: number;
          tags: string[];
          allergen_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          tagline?: string | null;
          description?: string | null;
          price_pesewas: number;
          image_url?: string | null;
          image_alt?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          serves?: string;
          prep_minutes?: number;
          tags?: string[];
          allergen_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
          description?: string | null;
          price_pesewas?: number;
          image_url?: string | null;
          image_alt?: string | null;
          is_active?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          serves?: string;
          prep_minutes?: number;
          tags?: string[];
          allergen_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_option_groups: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          description: string | null;
          is_required: boolean;
          selection_type: "single" | "multiple";
          min_selections: number;
          max_selections: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          description?: string | null;
          is_required?: boolean;
          selection_type?: "single" | "multiple";
          min_selections?: number;
          max_selections?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          description?: string | null;
          is_required?: boolean;
          selection_type?: "single" | "multiple";
          min_selections?: number;
          max_selections?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_options: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          description: string | null;
          price_pesewas: number;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          description?: string | null;
          price_pesewas?: number;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          description?: string | null;
          price_pesewas?: number;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string;
          is_open: boolean;
          opening_note: string | null;
          whatsapp_number: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          contact_address: string | null;
          instagram_url: string | null;
          pickup_instructions: string | null;
          notify_dashboard: boolean;
          notify_whatsapp: boolean;
          logo_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_name?: string;
          is_open?: boolean;
          opening_note?: string | null;
          whatsapp_number?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          contact_address?: string | null;
          instagram_url?: string | null;
          pickup_instructions?: string | null;
          notify_dashboard?: boolean;
          notify_whatsapp?: boolean;
          logo_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string;
          is_open?: boolean;
          opening_note?: string | null;
          whatsapp_number?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          contact_address?: string | null;
          instagram_url?: string | null;
          pickup_instructions?: string | null;
          notify_dashboard?: boolean;
          notify_whatsapp?: boolean;
          logo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          reference: string;
          order_number: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          fulfilment_method: "delivery" | "pickup";
          delivery_address: string | null;
          delivery_area: string | null;
          delivery_directions: string | null;
          notes: string | null;
          status: "new" | "preparing" | "completed" | "cancelled";
          payment_method: "cash_on_delivery" | "cash_on_pickup" | "momo_on_delivery" | "momo_on_pickup";
          payment_status: "pending" | "paid" | "failed" | "cancelled";
          subtotal_pesewas: number;
          delivery_fee_pesewas: number;
          delivery_fee_status: "pending" | "confirmed" | "not_required";
          total_pesewas: number;
          idempotency_key: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference: string;
          order_number?: string | null;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          fulfilment_method: "delivery" | "pickup";
          delivery_address?: string | null;
          delivery_area?: string | null;
          delivery_directions?: string | null;
          notes?: string | null;
          status?: "new" | "preparing" | "completed" | "cancelled";
          payment_method: "cash_on_delivery" | "cash_on_pickup" | "momo_on_delivery" | "momo_on_pickup";
          payment_status?: "pending" | "paid" | "failed" | "cancelled";
          subtotal_pesewas: number;
          delivery_fee_pesewas?: number;
          delivery_fee_status?: "pending" | "confirmed" | "not_required";
          total_pesewas: number;
          idempotency_key?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          order_number?: string | null;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          fulfilment_method?: "delivery" | "pickup";
          delivery_address?: string | null;
          delivery_area?: string | null;
          delivery_directions?: string | null;
          notes?: string | null;
          status?: "new" | "preparing" | "completed" | "cancelled";
          payment_method?: "cash_on_delivery" | "cash_on_pickup" | "momo_on_delivery" | "momo_on_pickup";
          payment_status?: "pending" | "paid" | "failed" | "cancelled";
          subtotal_pesewas?: number;
          delivery_fee_pesewas?: number;
          delivery_fee_status?: "pending" | "confirmed" | "not_required";
          total_pesewas?: number;
          idempotency_key?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_item_extras: {
        Row: {
          id: string;
          order_item_id: string;
          extra_id: string | null;
          extra_name: string;
          unit_price_pesewas: number;
          quantity: number;
          line_total_pesewas: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          extra_id?: string | null;
          extra_name: string;
          unit_price_pesewas: number;
          quantity?: number;
          line_total_pesewas: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_item_id?: string;
          extra_id?: string | null;
          extra_name?: string;
          unit_price_pesewas?: number;
          quantity?: number;
          line_total_pesewas?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price_pesewas: number;
          quantity: number;
          line_total_pesewas: number;
          options: Json;
          special_instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price_pesewas: number;
          quantity: number;
          line_total_pesewas: number;
          options?: Json;
          special_instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          unit_price_pesewas?: number;
          quantity?: number;
          line_total_pesewas?: number;
          options?: Json;
          special_instructions?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_notifications: {
        Row: {
          id: string;
          order_id: string;
          channel: "dashboard" | "sms_business" | "sms_customer";
          event: string;
          status: "pending" | "processing" | "sent" | "failed" | "skipped";
          recipient: string | null;
          provider: string | null;
          provider_message_id: string | null;
          payload: Json;
          error_message: string | null;
          attempt_count: number;
          max_attempts: number;
          next_attempt_at: string;
          last_attempt_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          channel: "dashboard" | "sms_business" | "sms_customer";
          event?: string;
          status?: "pending" | "processing" | "sent" | "failed" | "skipped";
          recipient?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          payload?: Json;
          error_message?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          next_attempt_at?: string;
          last_attempt_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          channel?: "dashboard" | "sms_business" | "sms_customer";
          event?: string;
          status?: "pending" | "processing" | "sent" | "failed" | "skipped";
          recipient?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          payload?: Json;
          error_message?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          next_attempt_at?: string;
          last_attempt_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_order_atomic: {
        Args: { payload: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductOptionGroup =
  Database["public"]["Tables"]["product_option_groups"]["Row"];
export type ProductOption =
  Database["public"]["Tables"]["product_options"]["Row"];
export type StoreSettings =
  Database["public"]["Tables"]["store_settings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderItemExtra = Database["public"]["Tables"]["order_item_extras"]["Row"];
export type OrderNotification = Database["public"]["Tables"]["order_notifications"]["Row"];
export type OrderStatus = Order["status"];
export type FulfilmentMethod = Order["fulfilment_method"];
export type DeliveryFeeStatus = Order["delivery_fee_status"];
export type PaymentMethod = Order["payment_method"];
export type PaymentStatus = Order["payment_status"];
