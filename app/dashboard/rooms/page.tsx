import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RoomManagement } from "@/components/room-management"

export default async function RoomsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to manage rooms
  if (!profile || !["admin", "manager", "receptionist", "housekeeping"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch rooms data with housekeeping tasks
  const { data: rooms, error: roomsError } = await supabase.from("rooms").select("*").order("room_number")

  const { data: housekeepingTasks, error: tasksError } = await supabase
    .from("housekeeping_tasks")
    .select(`
      *,
      room:rooms(room_number),
      assigned_to_profile:profiles!housekeeping_tasks_assigned_to_fkey(first_name, last_name)
    `)
    .order("created_at", { ascending: false })

  if (roomsError) {
    console.error("Error fetching rooms:", roomsError)
  }

  if (tasksError) {
    console.error("Error fetching housekeeping tasks:", tasksError)
  }

  return (
    <RoomManagement
      initialRooms={rooms || []}
      initialTasks={housekeepingTasks || []}
      userRole={profile.role}
      userId={profile.id}
    />
  )
}
