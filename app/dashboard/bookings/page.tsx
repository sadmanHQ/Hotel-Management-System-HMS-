import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookingManagement } from "@/components/booking-management"

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Check if user has permission to manage bookings
  if (!profile || !["admin", "manager", "receptionist"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch bookings with related data
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      *,
      guest:guests(*),
      room:rooms(*),
      payments(*)
    `)
    .order("created_at", { ascending: false })

  // Fetch available rooms and guests for new bookings
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .eq("status", "available")
    .order("room_number")

  const { data: guests, error: guestsError } = await supabase.from("guests").select("*").order("first_name")

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name")

  if (bookingsError) {
    console.error("Error fetching bookings:", bookingsError)
  }

  return (
    <BookingManagement
      initialBookings={bookings || []}
      availableRooms={rooms || []}
      guests={guests || []}
      services={services || []}
      userRole={profile.role}
      userId={profile.id}
    />
  )
}
