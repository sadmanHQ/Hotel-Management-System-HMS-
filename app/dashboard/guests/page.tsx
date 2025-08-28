import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GuestManagement } from "@/components/guest-management"

export default async function GuestsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to manage guests
  if (!profile || !["admin", "manager", "receptionist"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch guests data
  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("*")
    .order("created_at", { ascending: false })

  if (guestsError) {
    console.error("Error fetching guests:", guestsError)
  }

  return <GuestManagement initialGuests={guests || []} userRole={profile.role} />
}
