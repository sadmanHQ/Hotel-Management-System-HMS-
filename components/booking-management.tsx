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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  Users,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  LogIn,
  LogOut,
} from "lucide-react"
import Link from "next/link"

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface Room {
  id: string
  room_number: string
  room_type: string
  capacity: number
  base_price: number
}

interface Service {
  id: string
  name: string
  price: number
}

interface Payment {
  id: string
  amount: number
  payment_method: string
  status: string
  payment_date: string
}

interface Booking {
  id: string
  guest_id: string
  room_id: string
  check_in_date: string
  check_out_date: string
  adults: number
  children: number
  total_amount: number
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"
  special_requests?: string
  created_at: string
  guest?: Guest
  room?: Room
  payments?: Payment[]
}

interface BookingFormData {
  guest_id: string
  room_id: string
  check_in_date: string
  check_out_date: string
  adults: string
  children: string
  special_requests: string
}

interface BookingManagementProps {
  initialBookings: Booking[]
  availableRooms: Room[]
  guests: Guest[]
  services: Service[]
  userRole: string
  userId: string
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  checked_in: "bg-green-100 text-green-800 border-green-200",
  checked_out: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
}

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  checked_in: LogIn,
  checked_out: LogOut,
  cancelled: AlertTriangle,
}

export function BookingManagement({
  initialBookings,
  availableRooms,
  guests,
  services,
  userRole,
  userId,
}: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false)
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false)
  const [isViewBookingOpen, setIsViewBookingOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    guest_id: "",
    room_id: "",
    check_in_date: "",
    check_out_date: "",
    adults: "1",
    children: "0",
    special_requests: "",
  })

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
  })

  const supabase = createClient()

  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    let filtered = bookings

    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.guest?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.guest?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.guest?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.room?.room_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    return filtered
  }, [bookings, searchTerm, statusFilter])

  const resetBookingForm = () => {
    setBookingFormData({
      guest_id: "",
      room_id: "",
      check_in_date: "",
      check_out_date: "",
      adults: "1",
      children: "0",
      special_requests: "",
    })
  }

  const handleBookingInputChange = (field: keyof BookingFormData, value: string) => {
    setBookingFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateTotalAmount = () => {
    if (!bookingFormData.room_id || !bookingFormData.check_in_date || !bookingFormData.check_out_date) {
      return 0
    }

    const room = availableRooms.find((r) => r.id === bookingFormData.room_id)
    if (!room) return 0

    const checkIn = new Date(bookingFormData.check_in_date)
    const checkOut = new Date(bookingFormData.check_out_date)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    return nights * room.base_price
  }

  const handleAddBooking = async () => {
    if (
      !bookingFormData.guest_id ||
      !bookingFormData.room_id ||
      !bookingFormData.check_in_date ||
      !bookingFormData.check_out_date
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const totalAmount = calculateTotalAmount()
    if (totalAmount <= 0) {
      toast({
        title: "Error",
        description: "Invalid booking dates",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert([
          {
            guest_id: bookingFormData.guest_id,
            room_id: bookingFormData.room_id,
            check_in_date: bookingFormData.check_in_date,
            check_out_date: bookingFormData.check_out_date,
            adults: Number.parseInt(bookingFormData.adults),
            children: Number.parseInt(bookingFormData.children),
            total_amount: totalAmount,
            special_requests: bookingFormData.special_requests || null,
            created_by: userId,
          },
        ])
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          payments(*)
        `)
        .single()

      if (error) throw error

      setBookings((prev) => [data, ...prev])
      setIsAddBookingOpen(false)
      resetBookingForm()
      toast({
        title: "Success",
        description: "Booking created successfully",
      })
    } catch (error) {
      console.error("Error adding booking:", error)
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditBooking = async () => {
    if (!selectedBooking || !bookingFormData.guest_id || !bookingFormData.room_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const totalAmount = calculateTotalAmount()

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          guest_id: bookingFormData.guest_id,
          room_id: bookingFormData.room_id,
          check_in_date: bookingFormData.check_in_date,
          check_out_date: bookingFormData.check_out_date,
          adults: Number.parseInt(bookingFormData.adults),
          children: Number.parseInt(bookingFormData.children),
          total_amount: totalAmount,
          special_requests: bookingFormData.special_requests || null,
        })
        .eq("id", selectedBooking.id)
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          payments(*)
        `)
        .single()

      if (error) throw error

      setBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? data : booking)))
      setIsEditBookingOpen(false)
      setSelectedBooking(null)
      resetBookingForm()
      toast({
        title: "Success",
        description: "Booking updated successfully",
      })
    } catch (error) {
      console.error("Error updating booking:", error)
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId)
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          payments(*)
        `)
        .single()

      if (error) throw error

      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? data : booking)))
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      })
    } catch (error) {
      console.error("Error updating booking status:", error)
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPayment = async () => {
    if (!selectedBooking || !paymentData.amount) {
      toast({
        title: "Error",
        description: "Please enter payment amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("payments").insert([
        {
          booking_id: selectedBooking.id,
          amount: Number.parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          status: "paid",
          created_by: userId,
        },
      ])

      if (error) throw error

      // Refresh booking data
      const { data: updatedBooking } = await supabase
        .from("bookings")
        .select(`
          *,
          guest:guests(*),
          room:rooms(*),
          payments(*)
        `)
        .eq("id", selectedBooking.id)
        .single()

      if (updatedBooking) {
        setBookings((prev) => prev.map((booking) => (booking.id === selectedBooking.id ? updatedBooking : booking)))
        setSelectedBooking(updatedBooking)
      }

      setIsPaymentOpen(false)
      setPaymentData({ amount: "", payment_method: "cash" })
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
    } catch (error) {
      console.error("Error adding payment:", error)
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setBookingFormData({
      guest_id: booking.guest_id,
      room_id: booking.room_id,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      adults: booking.adults.toString(),
      children: booking.children.toString(),
      special_requests: booking.special_requests || "",
    })
    setIsEditBookingOpen(true)
  }

  const openViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsViewBookingOpen(true)
  }

  const openPaymentDialog = (booking: Booking) => {
    setSelectedBooking(booking)
    const totalPaid = booking.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const remaining = booking.total_amount - totalPaid
    setPaymentData({ amount: remaining.toString(), payment_method: "cash" })
    setIsPaymentOpen(true)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const bookingStats = useMemo(() => {
    const stats = {
      total: bookings.length,
      pending: 0,
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      cancelled: 0,
    }

    bookings.forEach((booking) => {
      stats[booking.status]++
    })

    return stats
  }, [bookings])

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
                <Calendar className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Booking Management</h1>
                  <p className="text-sm text-gray-500">Manage reservations and check-ins</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {filteredBookings.length} Booking{filteredBookings.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{bookingStats.total}</div>
              <p className="text-xs text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{bookingStats.confirmed}</div>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{bookingStats.checked_in}</div>
              <p className="text-xs text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{bookingStats.checked_out}</div>
              <p className="text-xs text-muted-foreground">Checked Out</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{bookingStats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bookings by guest name, email, or room number..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetBookingForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>Enter booking details below</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guest">Guest *</Label>
                  <Select
                    value={bookingFormData.guest_id}
                    onValueChange={(value) => handleBookingInputChange("guest_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select guest" />
                    </SelectTrigger>
                    <SelectContent>
                      {guests.map((guest) => (
                        <SelectItem key={guest.id} value={guest.id}>
                          {guest.first_name} {guest.last_name} ({guest.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room *</Label>
                  <Select
                    value={bookingFormData.room_id}
                    onValueChange={(value) => handleBookingInputChange("room_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.room_number} ({room.room_type}) - {formatPrice(room.base_price)}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_in">Check-in Date *</Label>
                  <Input
                    id="check_in"
                    type="date"
                    value={bookingFormData.check_in_date}
                    onChange={(e) => handleBookingInputChange("check_in_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out">Check-out Date *</Label>
                  <Input
                    id="check_out"
                    type="date"
                    value={bookingFormData.check_out_date}
                    onChange={(e) => handleBookingInputChange("check_out_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Input
                    id="adults"
                    type="number"
                    min="1"
                    value={bookingFormData.adults}
                    onChange={(e) => handleBookingInputChange("adults", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Input
                    id="children"
                    type="number"
                    min="0"
                    value={bookingFormData.children}
                    onChange={(e) => handleBookingInputChange("children", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea
                    id="special_requests"
                    value={bookingFormData.special_requests}
                    onChange={(e) => handleBookingInputChange("special_requests", e.target.value)}
                    placeholder="Any special requests or notes"
                    rows={3}
                  />
                </div>
                {calculateTotalAmount() > 0 && (
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Total Amount: {formatPrice(calculateTotalAmount())}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddBookingOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBooking} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first booking"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => setIsAddBookingOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Booking
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const StatusIcon = statusIcons[booking.status]
                      const totalPaid = booking.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
                      const isPaidInFull = totalPaid >= booking.total_amount

                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>
                                {booking.guest?.first_name} {booking.guest?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{booking.guest?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">Room {booking.room?.room_number}</p>
                              <p className="text-sm text-gray-500 capitalize">{booking.room?.room_type}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                          <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              {booking.adults + booking.children}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatPrice(booking.total_amount)}</p>
                              {totalPaid > 0 && (
                                <p className="text-sm text-gray-500">
                                  Paid: {formatPrice(totalPaid)}
                                  {!isPaidInFull && (
                                    <span className="text-red-600">
                                      {" "}
                                      (Balance: {formatPrice(booking.total_amount - totalPaid)})
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[booking.status]} capitalize`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {booking.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openViewBooking(booking)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditBooking(booking)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!isPaidInFull && (
                                <Button variant="ghost" size="sm" onClick={() => openPaymentDialog(booking)}>
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Booking Dialog */}
        <Dialog open={isEditBookingOpen} onOpenChange={setIsEditBookingOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>Update booking information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_guest">Guest *</Label>
                <Select
                  value={bookingFormData.guest_id}
                  onValueChange={(value) => handleBookingInputChange("guest_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {guests.map((guest) => (
                      <SelectItem key={guest.id} value={guest.id}>
                        {guest.first_name} {guest.last_name} ({guest.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_room">Room *</Label>
                <Select
                  value={bookingFormData.room_id}
                  onValueChange={(value) => handleBookingInputChange("room_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number} ({room.room_type}) - {formatPrice(room.base_price)}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_check_in">Check-in Date *</Label>
                <Input
                  id="edit_check_in"
                  type="date"
                  value={bookingFormData.check_in_date}
                  onChange={(e) => handleBookingInputChange("check_in_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_check_out">Check-out Date *</Label>
                <Input
                  id="edit_check_out"
                  type="date"
                  value={bookingFormData.check_out_date}
                  onChange={(e) => handleBookingInputChange("check_out_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_adults">Adults</Label>
                <Input
                  id="edit_adults"
                  type="number"
                  min="1"
                  value={bookingFormData.adults}
                  onChange={(e) => handleBookingInputChange("adults", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_children">Children</Label>
                <Input
                  id="edit_children"
                  type="number"
                  min="0"
                  value={bookingFormData.children}
                  onChange={(e) => handleBookingInputChange("children", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_special_requests">Special Requests</Label>
                <Textarea
                  id="edit_special_requests"
                  value={bookingFormData.special_requests}
                  onChange={(e) => handleBookingInputChange("special_requests", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Status</Label>
                <Select
                  value={selectedBooking?.status}
                  onValueChange={(value) => selectedBooking && handleStatusChange(selectedBooking.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditBookingOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditBooking} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Booking Dialog */}
        <Dialog open={isViewBookingOpen} onOpenChange={setIsViewBookingOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>Complete booking information</DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Guest</Label>
                      <p className="text-lg font-medium">
                        {selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{selectedBooking.guest?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Room</Label>
                      <p className="font-medium">Room {selectedBooking.room?.room_number}</p>
                      <p className="text-sm text-gray-500 capitalize">{selectedBooking.room?.room_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Dates</Label>
                      <p>
                        {formatDate(selectedBooking.check_in_date)} - {formatDate(selectedBooking.check_out_date)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Guests</Label>
                      <p>
                        {selectedBooking.adults} adults, {selectedBooking.children} children
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Status</Label>
                      <Badge className={`${statusColors[selectedBooking.status]} capitalize`}>
                        {selectedBooking.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Total Amount</Label>
                      <p className="text-lg font-medium">{formatPrice(selectedBooking.total_amount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Payments</Label>
                      {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                        <div className="space-y-1">
                          {selectedBooking.payments.map((payment) => (
                            <p key={payment.id} className="text-sm">
                              {formatPrice(payment.amount)} ({payment.payment_method}) -{" "}
                              {formatDate(payment.payment_date)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No payments recorded</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Created</Label>
                      <p>{formatDate(selectedBooking.created_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedBooking.special_requests && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Special Requests</Label>
                    <p className="mt-1">{selectedBooking.special_requests}</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsViewBookingOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              {selectedBooking && (
                <Button
                  onClick={() => {
                    setIsViewBookingOpen(false)
                    openEditBooking(selectedBooking)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>Add a payment for this booking</DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Booking: Room {selectedBooking.room?.room_number}</p>
                  <p className="text-sm text-gray-600">
                    {selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">Total: {formatPrice(selectedBooking.total_amount)}</p>
                  {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Paid: {formatPrice(selectedBooking.payments.reduce((sum, p) => sum + p.amount, 0))}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Amount *</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select
                    value={paymentData.payment_method}
                    onValueChange={(value) => setPaymentData((prev) => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPayment} disabled={isLoading}>
                {isLoading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
