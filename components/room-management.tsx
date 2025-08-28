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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Eye,
  Bed,
  Users,
  DollarSign,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wrench,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

interface Room {
  id: string
  room_number: string
  room_type: "single" | "double" | "suite" | "deluxe" | "presidential"
  floor_number: number
  capacity: number
  base_price: number
  status: "available" | "occupied" | "maintenance" | "cleaning" | "out_of_order"
  amenities: string[]
  description?: string
  created_at: string
  updated_at: string
}

interface HousekeepingTask {
  id: string
  room_id: string
  assigned_to?: string
  task_type: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date?: string
  completed_at?: string
  created_at: string
  room?: { room_number: string }
  assigned_to_profile?: { first_name: string; last_name: string }
}

interface RoomFormData {
  room_number: string
  room_type: string
  floor_number: string
  capacity: string
  base_price: string
  amenities: string[]
  description: string
}

interface TaskFormData {
  room_id: string
  task_type: string
  description: string
  priority: string
  due_date: string
}

interface RoomManagementProps {
  initialRooms: Room[]
  initialTasks: HousekeepingTask[]
  userRole: string
  userId: string
}

const roomTypeLabels = {
  single: "Single",
  double: "Double",
  suite: "Suite",
  deluxe: "Deluxe",
  presidential: "Presidential",
}

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-200",
  occupied: "bg-blue-100 text-blue-800 border-blue-200",
  maintenance: "bg-orange-100 text-orange-800 border-orange-200",
  cleaning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  out_of_order: "bg-red-100 text-red-800 border-red-200",
}

const statusIcons = {
  available: CheckCircle,
  occupied: Users,
  maintenance: Wrench,
  cleaning: Sparkles,
  out_of_order: AlertTriangle,
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export function RoomManagement({ initialRooms, initialTasks, userRole, userId }: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [tasks, setTasks] = useState<HousekeepingTask[]>(initialTasks)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [isViewRoomOpen, setIsViewRoomOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [roomFormData, setRoomFormData] = useState<RoomFormData>({
    room_number: "",
    room_type: "single",
    floor_number: "1",
    capacity: "2",
    base_price: "99.99",
    amenities: [],
    description: "",
  })

  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    room_id: "",
    task_type: "cleaning",
    description: "",
    priority: "medium",
    due_date: "",
  })

  const supabase = createClient()

  // Filter rooms based on search and filters
  const filteredRooms = useMemo(() => {
    let filtered = rooms

    if (searchTerm) {
      filtered = filtered.filter(
        (room) =>
          room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.room_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((room) => room.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((room) => room.room_type === typeFilter)
    }

    return filtered
  }, [rooms, searchTerm, statusFilter, typeFilter])

  const resetRoomForm = () => {
    setRoomFormData({
      room_number: "",
      room_type: "single",
      floor_number: "1",
      capacity: "2",
      base_price: "99.99",
      amenities: [],
      description: "",
    })
  }

  const resetTaskForm = () => {
    setTaskFormData({
      room_id: "",
      task_type: "cleaning",
      description: "",
      priority: "medium",
      due_date: "",
    })
  }

  const handleRoomInputChange = (field: keyof RoomFormData, value: string | string[]) => {
    setRoomFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTaskInputChange = (field: keyof TaskFormData, value: string) => {
    setTaskFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddRoom = async () => {
    if (!roomFormData.room_number || !roomFormData.room_type) {
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
        .from("rooms")
        .insert([
          {
            room_number: roomFormData.room_number,
            room_type: roomFormData.room_type,
            floor_number: Number.parseInt(roomFormData.floor_number),
            capacity: Number.parseInt(roomFormData.capacity),
            base_price: Number.parseFloat(roomFormData.base_price),
            amenities: roomFormData.amenities,
            description: roomFormData.description || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setRooms((prev) => [...prev, data])
      setIsAddRoomOpen(false)
      resetRoomForm()
      toast({
        title: "Success",
        description: "Room added successfully",
      })
    } catch (error) {
      console.error("Error adding room:", error)
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRoom = async () => {
    if (!selectedRoom || !roomFormData.room_number || !roomFormData.room_type) {
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
        .from("rooms")
        .update({
          room_number: roomFormData.room_number,
          room_type: roomFormData.room_type,
          floor_number: Number.parseInt(roomFormData.floor_number),
          capacity: Number.parseInt(roomFormData.capacity),
          base_price: Number.parseFloat(roomFormData.base_price),
          amenities: roomFormData.amenities,
          description: roomFormData.description || null,
        })
        .eq("id", selectedRoom.id)
        .select()
        .single()

      if (error) throw error

      setRooms((prev) => prev.map((room) => (room.id === selectedRoom.id ? data : room)))
      setIsEditRoomOpen(false)
      setSelectedRoom(null)
      resetRoomForm()
      toast({
        title: "Success",
        description: "Room updated successfully",
      })
    } catch (error) {
      console.error("Error updating room:", error)
      toast({
        title: "Error",
        description: "Failed to update room. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("rooms")
        .update({ status: newStatus })
        .eq("id", roomId)
        .select()
        .single()

      if (error) throw error

      setRooms((prev) => prev.map((room) => (room.id === roomId ? data : room)))
      toast({
        title: "Success",
        description: "Room status updated successfully",
      })
    } catch (error) {
      console.error("Error updating room status:", error)
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskFormData.room_id || !taskFormData.task_type) {
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
        .from("housekeeping_tasks")
        .insert([
          {
            room_id: taskFormData.room_id,
            task_type: taskFormData.task_type,
            description: taskFormData.description || null,
            priority: taskFormData.priority,
            due_date: taskFormData.due_date || null,
            created_by: userId,
          },
        ])
        .select(`
          *,
          room:rooms(room_number),
          assigned_to_profile:profiles!housekeeping_tasks_assigned_to_fkey(first_name, last_name)
        `)
        .single()

      if (error) throw error

      setTasks((prev) => [data, ...prev])
      setIsAddTaskOpen(false)
      resetTaskForm()
      toast({
        title: "Success",
        description: "Housekeeping task created successfully",
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditRoom = (room: Room) => {
    setSelectedRoom(room)
    setRoomFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      floor_number: room.floor_number.toString(),
      capacity: room.capacity.toString(),
      base_price: room.base_price.toString(),
      amenities: room.amenities || [],
      description: room.description || "",
    })
    setIsEditRoomOpen(true)
  }

  const openViewRoom = (room: Room) => {
    setSelectedRoom(room)
    setIsViewRoomOpen(true)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const roomStats = useMemo(() => {
    const stats = {
      total: rooms.length,
      available: 0,
      occupied: 0,
      maintenance: 0,
      cleaning: 0,
      out_of_order: 0,
    }

    rooms.forEach((room) => {
      stats[room.status]++
    })

    return stats
  }, [rooms])

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
                <Bed className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Room Management</h1>
                  <p className="text-sm text-gray-500">Manage rooms, status, and housekeeping</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {filteredRooms.length} Room{filteredRooms.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {/* Room Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{roomStats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Rooms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{roomStats.available}</div>
                  <p className="text-xs text-muted-foreground">Available</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{roomStats.occupied}</div>
                  <p className="text-xs text-muted-foreground">Occupied</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{roomStats.cleaning}</div>
                  <p className="text-xs text-muted-foreground">Cleaning</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{roomStats.maintenance}</div>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{roomStats.out_of_order}</div>
                  <p className="text-xs text-muted-foreground">Out of Order</p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rooms by number, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_order">Out of Order</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="presidential">Presidential</SelectItem>
                </SelectContent>
              </Select>
              {(userRole === "admin" || userRole === "manager") && (
                <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetRoomForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Room</DialogTitle>
                      <DialogDescription>Enter the room details below</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="room_number">Room Number *</Label>
                        <Input
                          id="room_number"
                          value={roomFormData.room_number}
                          onChange={(e) => handleRoomInputChange("room_number", e.target.value)}
                          placeholder="101"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="room_type">Room Type *</Label>
                        <Select
                          value={roomFormData.room_type}
                          onValueChange={(value) => handleRoomInputChange("room_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="double">Double</SelectItem>
                            <SelectItem value="suite">Suite</SelectItem>
                            <SelectItem value="deluxe">Deluxe</SelectItem>
                            <SelectItem value="presidential">Presidential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor_number">Floor Number</Label>
                        <Input
                          id="floor_number"
                          type="number"
                          value={roomFormData.floor_number}
                          onChange={(e) => handleRoomInputChange("floor_number", e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={roomFormData.capacity}
                          onChange={(e) => handleRoomInputChange("capacity", e.target.value)}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="base_price">Base Price ($)</Label>
                        <Input
                          id="base_price"
                          type="number"
                          step="0.01"
                          value={roomFormData.base_price}
                          onChange={(e) => handleRoomInputChange("base_price", e.target.value)}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={roomFormData.description}
                          onChange={(e) => handleRoomInputChange("description", e.target.value)}
                          placeholder="Room description and features"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddRoom} disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Room"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Rooms Grid */}
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first room"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRooms.map((room) => {
                  const StatusIcon = statusIcons[room.status]
                  return (
                    <Card key={room.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Room {room.room_number}</CardTitle>
                            <CardDescription className="capitalize">
                              {roomTypeLabels[room.room_type]} • Floor {room.floor_number}
                            </CardDescription>
                          </div>
                          <Badge className={`${statusColors[room.status]} capitalize`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {room.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {room.capacity} guests
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            {formatPrice(room.base_price)}
                          </span>
                        </div>

                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.slice(0, 3).map((amenity) => (
                              <Badge key={amenity} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {room.amenities.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{room.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openViewRoom(room)} className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {(userRole === "admin" || userRole === "manager") && (
                            <Button variant="outline" size="sm" onClick={() => openEditRoom(room)} className="flex-1">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>

                        {(userRole === "admin" || userRole === "manager" || userRole === "receptionist") && (
                          <Select value={room.status} onValueChange={(value) => handleStatusChange(room.id, value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="out_of_order">Out of Order</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="housekeeping" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Housekeeping Tasks</h3>
                <p className="text-sm text-gray-500">Manage cleaning and maintenance tasks</p>
              </div>
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetTaskForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Housekeeping Task</DialogTitle>
                    <DialogDescription>Assign a new task to housekeeping staff</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="task_room">Room *</Label>
                      <Select
                        value={taskFormData.room_id}
                        onValueChange={(value) => handleTaskInputChange("room_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              Room {room.room_number} ({roomTypeLabels[room.room_type]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task_type">Task Type *</Label>
                      <Select
                        value={taskFormData.task_type}
                        onValueChange={(value) => handleTaskInputChange("task_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="deep_cleaning">Deep Cleaning</SelectItem>
                          <SelectItem value="repair">Repair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={taskFormData.priority}
                        onValueChange={(value) => handleTaskInputChange("priority", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={taskFormData.due_date}
                        onChange={(e) => handleTaskInputChange("due_date", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task_description">Description</Label>
                      <Textarea
                        id="task_description"
                        value={taskFormData.description}
                        onChange={(e) => handleTaskInputChange("description", e.target.value)}
                        placeholder="Task details and instructions"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTask} disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-500">Create your first housekeeping task</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize">{task.task_type.replace("_", " ")}</h4>
                            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                            <Badge variant="outline" className="capitalize">
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Room {task.room?.room_number}
                            {task.assigned_to_profile && (
                              <span>
                                {" "}
                                • Assigned to {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                              </span>
                            )}
                          </p>
                          {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                          {task.due_date && (
                            <p className="text-xs text-gray-400">Due: {new Date(task.due_date).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Room Dialog */}
        <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>Update room information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_room_number">Room Number *</Label>
                <Input
                  id="edit_room_number"
                  value={roomFormData.room_number}
                  onChange={(e) => handleRoomInputChange("room_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_room_type">Room Type *</Label>
                <Select
                  value={roomFormData.room_type}
                  onValueChange={(value) => handleRoomInputChange("room_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="presidential">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_floor_number">Floor Number</Label>
                <Input
                  id="edit_floor_number"
                  type="number"
                  value={roomFormData.floor_number}
                  onChange={(e) => handleRoomInputChange("floor_number", e.target.value)}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_capacity">Capacity</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  value={roomFormData.capacity}
                  onChange={(e) => handleRoomInputChange("capacity", e.target.value)}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_base_price">Base Price ($)</Label>
                <Input
                  id="edit_base_price"
                  type="number"
                  step="0.01"
                  value={roomFormData.base_price}
                  onChange={(e) => handleRoomInputChange("base_price", e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={roomFormData.description}
                  onChange={(e) => handleRoomInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditRoomOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditRoom} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Room Dialog */}
        <Dialog open={isViewRoomOpen} onOpenChange={setIsViewRoomOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Room Details</DialogTitle>
              <DialogDescription>Complete room information</DialogDescription>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Room Number</Label>
                      <p className="text-lg font-medium">{selectedRoom.room_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Type</Label>
                      <p className="capitalize">{roomTypeLabels[selectedRoom.room_type]}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Floor</Label>
                      <p>{selectedRoom.floor_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Capacity</Label>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <p>{selectedRoom.capacity} guests</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <Badge className={`${statusColors[selectedRoom.status]} capitalize`}>
                        {selectedRoom.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Base Price</Label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{formatPrice(selectedRoom.base_price)}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Created</Label>
                      <p>{new Date(selectedRoom.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                      <p>{new Date(selectedRoom.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Amenities</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRoom.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRoom.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="mt-1">{selectedRoom.description}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsViewRoomOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              {selectedRoom && (userRole === "admin" || userRole === "manager") && (
                <Button
                  onClick={() => {
                    setIsViewRoomOpen(false)
                    openEditRoom(selectedRoom)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Room
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
