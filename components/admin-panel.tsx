"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Settings,
  BarChart3,
  DollarSign,
  Users,
  Building,
  Calendar,
  Package,
  Wrench,
  FileText,
  Shield,
  Activity,
  TrendingUp,
} from "lucide-react"

interface Analytics {
  totalRevenue: number
  monthlyRevenue: number
  totalBookings: number
  occupancyRate: number
  averageStay: number
  totalGuests: number
  activeStaff: number
  maintenanceIssues: number
}

interface RevenueData {
  month: string
  revenue: number
  bookings: number
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  active: boolean
}

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  min_quantity: number
  unit: string
  cost_per_unit: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function AdminPanel() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchAnalytics()
    fetchRevenueData()
    fetchServices()
    fetchInventory()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch comprehensive analytics
      const [
        { data: bookings },
        { data: payments },
        { data: guests },
        { data: rooms },
        { data: staff },
        { data: housekeeping },
      ] = await Promise.all([
        supabase.from("bookings").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("guests").select("*"),
        supabase.from("rooms").select("*"),
        supabase.from("profiles").select("*").eq("role", "staff"),
        supabase.from("housekeeping_tasks").select("*").eq("status", "pending"),
      ])

      const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const currentMonth = new Date().getMonth()
      const monthlyRevenue =
        payments
          ?.filter((p) => new Date(p.created_at).getMonth() === currentMonth)
          .reduce((sum, payment) => sum + payment.amount, 0) || 0

      const occupiedRooms = rooms?.filter((r) => r.status === "occupied").length || 0
      const totalRooms = rooms?.length || 1
      const occupancyRate = (occupiedRooms / totalRooms) * 100

      const completedBookings = bookings?.filter((b) => b.status === "checked_out") || []
      const averageStay =
        completedBookings.length > 0
          ? completedBookings.reduce((sum, booking) => {
              const checkIn = new Date(booking.check_in_date)
              const checkOut = new Date(booking.check_out_date)
              return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
            }, 0) / completedBookings.length
          : 0

      setAnalytics({
        totalRevenue,
        monthlyRevenue,
        totalBookings: bookings?.length || 0,
        occupancyRate,
        averageStay,
        totalGuests: guests?.length || 0,
        activeStaff: staff?.length || 0,
        maintenanceIssues: housekeeping?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const fetchRevenueData = async () => {
    try {
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, created_at")
        .order("created_at", { ascending: true })

      if (payments) {
        const monthlyData: { [key: string]: { revenue: number; bookings: number } } = {}

        payments.forEach((payment) => {
          const date = new Date(payment.created_at)
          const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, bookings: 0 }
          }

          monthlyData[monthKey].revenue += payment.amount
          monthlyData[monthKey].bookings += 1
        })

        const chartData = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          revenue: data.revenue,
          bookings: data.bookings,
        }))

        setRevenueData(chartData)
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error)
    }
  }

  const fetchServices = async () => {
    try {
      const { data } = await supabase.from("services").select("*").order("name")

      if (data) setServices(data)
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const { data } = await supabase.from("inventory").select("*").order("name")

      if (data) setInventory(data)
    } catch (error) {
      console.error("Error fetching inventory:", error)
    }
  }

  const addService = async (serviceData: Omit<Service, "id">) => {
    try {
      const { data, error } = await supabase.from("services").insert([serviceData]).select()

      if (error) throw error
      if (data) {
        setServices([...services, data[0]])
      }
    } catch (error) {
      console.error("Error adding service:", error)
    }
  }

  const updateInventory = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase.from("inventory").update(updates).eq("id", id)

      if (error) throw error

      setInventory(inventory.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    } catch (error) {
      console.error("Error updating inventory:", error)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const roomStatusData = [
    { name: "Available", value: 25, color: "#00C49F" },
    { name: "Occupied", value: 18, color: "#0088FE" },
    { name: "Maintenance", value: 3, color: "#FF8042" },
    { name: "Cleaning", value: 4, color: "#FFBB28" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Comprehensive hotel management and analytics</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Shield className="w-4 h-4 mr-1" />
          Administrator
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.occupancyRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +5% from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline w-3 h-3 mr-1" />
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeStaff}</div>
                <p className="text-xs text-muted-foreground">{analytics.maintenanceIssues} pending tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue and booking trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Status Distribution</CardTitle>
                <CardDescription>Current room availability overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    available: {
                      label: "Available",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roomStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {roomStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Analytics</CardTitle>
                <CardDescription>Detailed booking performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    bookings: {
                      label: "Bookings",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="bookings" fill="var(--color-bookings)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Stay Duration</span>
                  <span className="text-lg font-bold">{analytics.averageStay.toFixed(1)} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Revenue</span>
                  <span className="text-lg font-bold">${analytics.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Guests</span>
                  <span className="text-lg font-bold">{analytics.totalGuests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Maintenance Issues</span>
                  <span className="text-lg font-bold text-orange-600">{analytics.maintenanceIssues}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Service Management</h2>
            <ServiceDialog onAdd={addService} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant={service.active ? "default" : "secondary"}>
                      {service.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{service.category}</span>
                    <span className="text-lg font-bold">${service.price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Inventory Management</h2>
            <Button>Add Item</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage hotel inventory and supplies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.min_quantity} {item.unit}
                      </TableCell>
                      <TableCell>${item.cost_per_unit}</TableCell>
                      <TableCell>
                        <Badge variant={item.quantity <= item.min_quantity ? "destructive" : "default"}>
                          {item.quantity <= item.min_quantity ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateInventory(item.id, { quantity: item.quantity + 10 })}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Revenue and expense analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Occupancy Reports</CardTitle>
                <CardDescription>Room utilization analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Employee productivity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Generate Report</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Settings</CardTitle>
                <CardDescription>Configure hotel information and policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel-name">Hotel Name</Label>
                  <Input id="hotel-name" defaultValue="Grand Hotel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-in-time">Check-in Time</Label>
                  <Input id="check-in-time" type="time" defaultValue="15:00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-out-time">Check-out Time</Label>
                  <Input id="check-out-time" type="time" defaultValue="11:00" />
                </div>
                <Button>Save Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Advanced system settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="UTC">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>Update Configuration</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ServiceDialog({ onAdd }: { onAdd: (service: Omit<Service, "id">) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    active: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
    setOpen(false)
    setFormData({ name: "", description: "", price: 0, category: "", active: true })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Service</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>Create a new hotel service offering</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name</Label>
            <Input
              id="service-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-description">Description</Label>
            <Input
              id="service-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-price">Price</Label>
            <Input
              id="service-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spa">Spa & Wellness</SelectItem>
                <SelectItem value="dining">Dining</SelectItem>
                <SelectItem value="recreation">Recreation</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">Add Service</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
