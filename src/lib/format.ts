const ghsFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatGhs(pesewas: number): string {
  return ghsFormatter.format(pesewas / 100);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(new Date(value));
}

export function formatOrderStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPaymentMethod(method: string): string {
  switch (method) {
    case "cash_on_delivery":
      return "Cash on delivery";
    case "cash_on_pickup":
      return "Cash on pickup";
    case "momo_on_delivery":
      return "MoMo on delivery";
    case "momo_on_pickup":
      return "MoMo on pickup";
    default:
      return formatOrderStatus(method);
  }
}

export function formatPaymentStatus(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return formatOrderStatus(status);
  }
}
