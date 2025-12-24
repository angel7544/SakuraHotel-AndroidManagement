import { getSupabaseClient } from "./supabaseClient";
import { SupabaseClient, User } from "@supabase/supabase-js";

export async function getUserRoles(client?: SupabaseClient, currentUser?: User | null): Promise<("owner" | "staff" | "customer")[]> {
  const supabase = client || getSupabaseClient();
  let user = currentUser;

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  
  if (!user) return [] as any;

  const metaRoles = (user.app_metadata?.roles as string[] | undefined) || [];
  const allowedMeta = metaRoles.filter((r) => r === "owner" || r === "staff" || r === "customer");
  if (allowedMeta.length > 0) return allowedMeta as any;

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (staff?.role === "Manager") return ["owner"] as any;
  if (staff?.role) return ["staff"] as any;
  return ["customer"] as any;
}

export async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  try {
    await fetch("/api/session", { method: "DELETE" });
  } catch {}
}
