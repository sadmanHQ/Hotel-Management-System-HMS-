import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminPanel } from "@/components/admin-panel"

export default async function AdminPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check admin access
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return <AdminPanel />
}
