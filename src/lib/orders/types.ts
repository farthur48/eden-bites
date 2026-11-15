export type FulfilmentMethod = "delivery" | "pickup";

export type OrderStatus = "new" | "preparing" | "out_for_delivery" | "completed" | "cancelled";

export type DeliveryFeeStatus = "pending" | "confirmed" | "not_required";

export type PaymentMethod =
  | "cash_on_delivery"
  | "cash_on_pickup"
  | "momo_on_delivery"
  | "momo_on_pickup";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export type CheckoutRequestItem = {
  productId: string;
  optionIds: string[];
  quantity: number;
  specialInstructions: string | null;
};

export type OrderLineOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  pricePesewas: number;
};

export type PricedOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPricePesewas: number;
  lineTotalPesewas: number;
  options: OrderLineOption[];
  specialInstructions: string | null;
};

export type OrderConfirmation = {
  reference: string;
  customerName: string;
  phone: string;
  email: string | null;
  fulfilmentMethod: FulfilmentMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  address: string | null;
  area: string | null;
  directions: string | null;
  notes: string | null;
  items: PricedOrderItem[];
  subtotalPesewas: number;
  deliveryFeePesewas: number | null;
  deliveryFeeStatus: DeliveryFeeStatus;
  totalPesewas: number;
  status: OrderStatus;
  createdAt: string;
  mode: "live" | "preview";
};

export type CheckoutFieldErrors = Partial<
  Record<"name" | "phone" | "email" | "address" | "area" | "payment" | "cart" | "form", string>
>;

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: CheckoutFieldErrors }
  | { status: "success"; confirmation: OrderConfirmation };
