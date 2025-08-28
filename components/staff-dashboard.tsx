"use client"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Eye,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Save,
  X,
  UserCheck,
  UserX,
  Shield,
  Settings,
} from "lucide-react"
import Link from "next/link"

interface Staff {
  id: string
  first_name: string
  last_name: string
  phone?: string
  role: "admin" | "manager" | "receptionist" | "housekeeping" | "maintenance" | "security"
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Schedule {
  id: string
  staff_id: string
  shift_date: string
  start_time: string
  end_time: string
  break_duration: number
  created_at: string
  staff?: {
    first_name: string
    last_name: string
    role: string
  }
}

interface Task {
  id: string
  room_id: string
  assigned_to: string
  task_type: string
  description?: string
  priority: string
  status: string
  due_date?: string
  created_at: string
  room?: { room_number: string }
  assigned_to_profile?: { first_name: string; last_name: string }
}

interface StaffFormData {
  first_name: string
  last_name: string
  phone: string
  role: string
}

interface ScheduleFormData {
  staff_id: string
  shift_date: string
  start_time: string
  end_time: string
  break_duration: string
}

interface StaffDashboardProps {
  initialStaff: Staff[]
  initialSchedules: Schedule[]
  initialTasks: Task[]
  userRole: string
  userId: string
}

const roleColors = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
  receptionist: "bg-blue-100 text-blue-800 border-blue-200",
  housekeeping: "bg-green-100 text-green-800 border-green-200",
  maintenance: "bg-orange-100 text-orange-800 border-orange-200",
  security: "bg-gray-100 text-gray-800 border-gray-200",
}

const roleLabels = {
  admin: "Administrator",
  manager: "Manager",
  receptionist: "Receptionist",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  security: "Security",
}

export function StaffDashboard({
  initialStaff,
  initialSchedules,
  initialTasks,
  userRole,
  userId,
}: StaffDashboardProps) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false)
  const [isViewStaffOpen, setIsViewStaffOpen] = useState(false)
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [staffFormData, setStaffFormData] = useState<StaffFormData>({
    first_name: "",
    last_name: "",
    phone: "",
    role: "receptionist",
  })

  const [scheduleFormData, setScheduleFormData] = useState<ScheduleFormData>({
    staff_id: "",
    shift_date: "",
    start_time: "09:00",
    end_time: "17:00",
    break_duration: "60",
  })

  const supabase = createClient()

  // Filter staff based on search and filters
  const filteredStaff = useMemo(() => {
    let filtered = staff

    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((member) => member.role === roleFilter)
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter((member) => member.is_active === isActive)
    }

    return filtered
  }, [staff, searchTerm, roleFilter, statusFilter])

  const resetStaffForm = () => {
    setStaffFormData({
      first_name: "",
      last_name: "",
      phone: "",
      role: "receptionist",
    })
  }

  const resetScheduleForm = () => {
    setScheduleFormData({
      staff_id: "",
      shift_date: "",
      start_time: "09:00",
      end_time: "17:00",
      break_duration: "60",
    })
  }

  const handleStaffInputChange = (field: keyof StaffFormData, value: string) => {
    setStaffFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleScheduleInputChange = (field: keyof ScheduleFormData, value: string) => {
    setScheduleFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddStaff = async () => {
    if (!staffFormData.first_name || !staffFormData.last_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert([
          {
            first_name: staffFormData.first_name,
            last_name: staffFormData.last_name,
            phone: staffFormData.phone || null,
            role: staffFormData.role,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setStaff((prev) => [data, ...prev])
      setIsAddStaffOpen(false)
      resetStaffForm()
      toast({
        title: "Success",
        description: "Staff member added successfully",
      })
    } catch (error) {
      console.error("Error adding staff:", error)
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStaff = async () => {
    if (!selectedStaff || !staffFormData.first_name || !staffFormData.last_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name: staffFormData.first_name,
          last_name: staffFormData.last_name,
          phone: staffFormData.phone || null,
          role: staffFormData.role,
        })
        .eq("id", selectedStaff.id)
        .select()
        .single()

      if (error) throw error

      setStaff((prev) => prev.map((member) => (member.id === selectedStaff.id ? data : member)))
      setIsEditStaffOpen(false)
      setSelectedStaff(null)
      resetStaffForm()
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      })
    } catch (error) {
      console.error("Error updating staff:", error)
      toast({
        title: "Error",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", staffId)
        .select()
        .single()

      if (error) throw error

      setStaff((prev) => prev.map((member) => (member.id === staffId ? data : member)))
      toast({
        title: "Success",
        description: `Staff member ${!currentStatus ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("Error updating staff status:", error)
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSchedule = async () => {
    if (!scheduleFormData.staff_id || !scheduleFormData.shift_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("staff_schedules")
        .insert([
          {
            staff_id: scheduleFormData.staff_id,
            shift_date: scheduleFormData.shift_date,
            start_time: scheduleFormData.start_time,
            end_time: scheduleFormData.end_time,
            break_duration: Number.parseInt(scheduleFormData.break_duration),
            created_by: userId,
          },
        ])
        .select(`
          *,
          staff:profiles!staff_schedules_staff_id_fkey(first_name, last_name, role)
        `)
        .single()

      if (error) throw error

      setSchedules((prev) => [data, ...prev])
      setIsAddScheduleOpen(false)
      resetScheduleForm()
      toast({
        title: "Success",
        description: "Schedule created successfully",
      })
    } catch (error) {
      console.error("Error adding schedule:", error)
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditStaff = (member: Staff) => {
    setSelectedStaff(member)
    setStaffFormData({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone || "",
      role: member.role,
    })
    setIsEditStaffOpen(true)
  }

  const openViewStaff = (member: Staff) => {
    setSelectedStaff(member)
    setIsViewStaffOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const staffStats = useMemo(() => {
    const stats = {
      total: staff.length,
      active: 0,
      inactive: 0,
      admin: 0,
      manager: 0,
      receptionist: 0,
      housekeeping: 0,
      maintenance: 0,
      security: 0,
    }

    staff.forEach((member) => {
      if (member.is_active) stats.active++
      else stats.inactive++
      stats[member.role]++
    })

    return stats
  }, [staff])

  const todaySchedules = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return schedules.filter((schedule) => schedule.shift_date === today)
  }, [schedules])

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => task.status === "pending" || task.status === "in_progress")
  }, [tasks])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-sm text-gray-500">Manage employees, schedules, and assignments</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {filteredStaff.length} Staff Member{filteredStaff.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="staff" className="space-y-6">
          <TabsList>
            <TabsTrigger value="staff">Staff Members</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="tasks">Task Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-6">
            {/* Staff Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{staffStats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Staff</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{staffStats.active}</div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{staffStats.admin}</div>
                  <p className="text-xs text-muted-foreground">Admins</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{staffStats.manager}</div>
                  <p className="text-xs text-muted-foreground">Managers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{staffStats.receptionist}</div>
                  <p className="text-xs text-muted-foreground">Reception</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{staffStats.housekeeping}</div>
                  <p className="text-xs text-muted-foreground">Housekeeping</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{staffStats.maintenance}</div>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{staffStats.security}</div>
                  <p className="text-xs text-muted-foreground">Security</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search staff by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetStaffForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>Enter staff member details below</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={staffFormData.first_name}
                          onChange={(e) => handleStaffInputChange("first_name", e.target.value)}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={staffFormData.last_name}
                          onChange={(e) => handleStaffInputChange("last_name", e.target.value)}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={staffFormData.phone}
                        onChange={(e) => handleStaffInputChange("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={staffFormData.role}
                        onValueChange={(value) => handleStaffInputChange("role", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="housekeeping">Housekeeping</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          {userRole === "admin" && (
                            <>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddStaffOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStaff} disabled={isLoading}>
                      {isLoading ? "Adding..." : "Add Staff"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Staff Table */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>
                  {filteredStaff.length} staff member{filteredStaff.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first staff member"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">
                              {member.first_name} {member.last_name}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${roleColors[member.role]} capitalize`}>
                                <Shield className="h-3 w-3 mr-1" />
                                {roleLabels[member.role]}
                              </Badge>
                            </TableCell>
                            <TableCell>{member.phone || <span className="text-gray-400">-</span>}</TableCell>
                            <TableCell>
                              <Badge variant={member.is_active ? "default" : "secondary"}>
                                {member.is_active ? (
                                  <>
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <UserX className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(member.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openViewStaff(member)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openEditStaff(member)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStaffStatus(member.id, member.is_active)}
                                >
                                  {member.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Staff Schedules</h3>
                <p className="text-sm text-gray-500">Manage work schedules and shifts</p>
              </div>
              <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetScheduleForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Schedule</DialogTitle>
                    <DialogDescription>Assign a shift to a staff member</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule_staff">Staff Member *</Label>
                      <Select
                        value={scheduleFormData.staff_id}
                        onValueChange={(value) => handleScheduleInputChange("staff_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {staff
                            .filter((member) => member.is_active)
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name} ({roleLabels[member.role]})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift_date">Date *</Label>
                      <Input
                        id="shift_date"
                        type="date"
                        value={scheduleFormData.shift_date}
                        onChange={(e) => handleScheduleInputChange("shift_date", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={scheduleFormData.start_time}
                          onChange={(e) => handleScheduleInputChange("start_time", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={scheduleFormData.end_time}
                          onChange={(e) => handleScheduleInputChange("end_time", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="break_duration">Break Duration (minutes)</Label>
                      <Input
                        id="break_duration"
                        type="number"
                        value={scheduleFormData.break_duration}
                        onChange={(e) => handleScheduleInputChange("break_duration", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddScheduleOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSchedule} disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Schedule"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedules */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Shifts</CardTitle>
                  <CardDescription>
                    {todaySchedules.length} staff member{todaySchedules.length !== 1 ? "s" : ""} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todaySchedules.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No shifts scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaySchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {schedule.staff?.first_name} {schedule.staff?.last_name}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{schedule.staff?.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </p>
                            <p className="text-xs text-gray-500">Break: {schedule.break_duration}min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Schedules */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Schedules</CardTitle>
                  <CardDescription>Next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No schedules found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {schedules.slice(0, 10).map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">
                              {schedule.staff?.first_name} {schedule.staff?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(schedule.shift_date)} • {formatTime(schedule.start_time)} -{" "}
                              {formatTime(schedule.end_time)}
                            </p>
                          </div>
                          <Badge
                            className={`${roleColors[schedule.staff?.role as keyof typeof roleColors]} capitalize`}
                          >
                            {schedule.staff?.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Task Assignments</h3>
              <p className="text-sm text-gray-500">Current tasks assigned to staff members</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                  <CardDescription>
                    {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} need attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No pending tasks</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingTasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium capitalize">{task.task_type.replace("_", " ")}</p>
                            <Badge variant="outline" className="capitalize">
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Room {task.room?.room_number}
                            {task.assigned_to_profile && (
                              <span>
                                {" "}
                                • {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                              </span>
                            )}
                          </p>
                          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>All Tasks</CardTitle>
                  <CardDescription>Recent task assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No tasks found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {tasks.slice(0, 10).map((task) => (
                        <div key={task.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium capitalize">{task.task_type.replace("_", " ")}</p>
                            <Badge variant="outline" className="capitalize">
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Room {task.room?.room_number}
                            {task.assigned_to_profile && (
                              <span>
                                {" "}
                                • {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(task.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>Update staff member information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={staffFormData.first_name}
                    onChange={(e) => handleStaffInputChange("first_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={staffFormData.last_name}
                    onChange={(e) => handleStaffInputChange("last_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={staffFormData.phone}
                  onChange={(e) => handleStaffInputChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Role *</Label>
                <Select value={staffFormData.role} onValueChange={(value) => handleStaffInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    {userRole === "admin" && (
                      <>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditStaffOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditStaff} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Staff Dialog */}
        <Dialog open={isViewStaffOpen} onOpenChange={setIsViewStaffOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Staff Details</DialogTitle>
              <DialogDescription>Complete staff member information</DialogDescription>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                    <p className="text-lg font-medium">
                      {selectedStaff.first_name} {selectedStaff.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <Badge className={`${roleColors[selectedStaff.role]} capitalize mt-1`}>
                      {roleLabels[selectedStaff.role]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <p>{selectedStaff.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge variant={selectedStaff.is_active ? "default" : "secondary"} className="mt-1">
                      {selectedStaff.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Joined</Label>
                    <p>{formatDate(selectedStaff.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                    <p>{formatDate(selectedStaff.updated_at)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsViewStaffOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              {selectedStaff && (
                <Button
                  onClick={() => {
                    setIsViewStaffOpen(false)
                    openEditStaff(selectedStaff)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Staff
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
