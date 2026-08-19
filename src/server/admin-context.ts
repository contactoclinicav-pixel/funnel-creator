import "server-only";

import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin";
import { requireSession } from "@/server/context";

/** Solo para el panel interno /admin. No es un rol de workspace: es una lista de emails del founder en ADMIN_EMAILS. */
export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }
  return session;
}
