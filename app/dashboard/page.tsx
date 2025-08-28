import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Hotel, Users, Bed, Calendar, DollarSign, Settings, LogOut } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  const [{ count: totalRooms }, { count: totalGuests }, { count: activeBookings }] = await Promise.all([
    supabase.from("rooms").select("*", { count: "exact", head: true }),
    supabase.from("guests").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["confirmed", "checked_in"]),
  ])

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Hotel className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hotel Management System</h1>
                <p className="text-sm text-gray-500">Welcome back, {profile?.first_name || "User"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              <form action={handleSignOut}>
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Manage your hotel operations efficiently</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms || 0}</div>
              <p className="text-xs text-muted-foreground">Available rooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBookings || 0}</div>
              <p className="text-xs text-muted-foreground">Current reservations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGuests || 0}</div>
              <p className="text-xs text-muted-foreground">Registered guests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Guest Management
              </CardTitle>
              <CardDescription>Manage guest information, check-ins, and check-outs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/dashboard/guests">Manage Guests</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-green-600" />
                Room Management
              </CardTitle>
              <CardDescription>View room status, manage housekeeping, and maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/dashboard/rooms">Manage Rooms</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Booking System
              </CardTitle>
              <CardDescription>Create new bookings and manage reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/dashboard/bookings">Manage Bookings</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                Financial Reports
              </CardTitle>
              <CardDescription>View revenue, payments, and financial analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Reports</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Staff Management
              </CardTitle>
              <CardDescription>Manage staff schedules, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/dashboard/staff">Manage Staff</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-red-600" />
                Admin Panel
              </CardTitle>
              <CardDescription>System settings, user management, and configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={profile?.role !== "admin"} asChild={profile?.role === "admin"}>
                {profile?.role === "admin" ? (
                  <Link href="/dashboard/admin">Access Admin Panel</Link>
                ) : (
                  "Admin Access Only"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
