"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { uploadMenuImage } from "@/lib/data/menu-admin";
import { hasPublicEnv } from "@/lib/env";
import { isAllowedImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function saveSettingsAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireAdmin();

  if (!hasPublicEnv()) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const storeName = readText(formData.get("storeName"), 120);

  if (storeName.length < 2) {
    return { status: "error", message: "Enter the business name." };
  }

  let logoUrl = readText(formData.get("logoUrl"), 1000);

  if (logoUrl && !isAllowedImageUrl(logoUrl)) {
    return {
      status: "error",
      message:
        "Use a local logo path or a Supabase Storage URL, or upload the logo file.",
    };
  }

  const logo = formData.get("logo");

  if (logo instanceof File && logo.size > 0) {
    const upload = await uploadMenuImage(logo, "brand");

    if (!upload.ok) {
      return { status: "error", message: upload.message };
    }

    logoUrl = upload.url;
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("store_settings").upsert({
      id: "main",
      store_name: storeName,
      is_open: formData.get("isOpen") === "on",
      opening_note: readText(formData.get("openingNote"), 500) || null,
      logo_url: logoUrl || null,
      whatsapp_number: readText(formData.get("whatsappNumber"), 40) || null,
      contact_phone: readText(formData.get("contactPhone"), 40) || null,
      contact_email: readText(formData.get("contactEmail"), 160) || null,
      contact_address: readText(formData.get("contactAddress"), 240) || null,
      instagram_url: readText(formData.get("instagramUrl"), 240) || null,
      pickup_instructions:
        readText(formData.get("pickupInstructions"), 500) || null,
      notify_dashboard: formData.get("notifyDashboard") === "on",
      notify_whatsapp: formData.get("notifyWhatsapp") === "on",
    });

    if (error) {
      return { status: "error", message: "Could not save the settings." };
    }
  } catch {
    return { status: "error", message: "Could not save the settings." };
  }

  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  redirect("/admin/settings?saved=1");
}

function readText(value: FormDataEntryValue | null, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
