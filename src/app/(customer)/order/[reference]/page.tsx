import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OrderReferenceRedirectPage() {
  redirect("/order-confirmation");
}
