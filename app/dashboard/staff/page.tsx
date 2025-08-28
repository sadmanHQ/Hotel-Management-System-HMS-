import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StaffDashboard } from "@/components/staff-dashboard"

export default async function StaffPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to manage staff
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch staff data
  const { data: staff, error: staffError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  // Fetch staff schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from("staff_schedules")
    .select(`
      *,
      staff:profiles!staff_schedules_staff_id_fkey(first_name, last_name, role)
    `)
    .gte("shift_date", new Date().toISOString().split("T")[0])
    .order("shift_date", { ascending: true })

  // Fetch housekeeping tasks assigned to staff
  const { data: tasks, error: tasksError } = await supabase
    .from("housekeeping_tasks")
    .select(`
      *,
      room:rooms(room_number),
      assigned_to_profile:profiles!housekeeping_tasks_assigned_to_fkey(first_name, last_name)
    `)
    .not("assigned_to", "is", null)
    .order("created_at", { ascending: false })

  if (staffError) {
    console.error("Error fetching staff:", staffError)
  }

  return (
    <StaffDashboard
      initialStaff={staff || []}
      initialSchedules={schedules || []}
      initialTasks={tasks || []}
      userRole={profile.role}
      userId={profile.id}
    />
  )
}
