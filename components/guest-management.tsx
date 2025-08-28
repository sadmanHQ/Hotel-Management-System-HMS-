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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Eye, Users, Mail, Phone, MapPin, Calendar, ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  id_number?: string
  nationality?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

interface GuestFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  id_number: string
  nationality: string
  date_of_birth: string
}

interface GuestManagementProps {
  initialGuests: Guest[]
  userRole: string
}

export function GuestManagement({ initialGuests, userRole }: GuestManagementProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<GuestFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    id_number: "",
    nationality: "",
    date_of_birth: "",
  })

  const supabase = createClient()

  // Filter guests based on search term
  const filteredGuests = useMemo(() => {
    if (!searchTerm) return guests

    return guests.filter(
      (guest) =>
        guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.nationality?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [guests, searchTerm])

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      id_number: "",
      nationality: "",
      date_of_birth: "",
    })
  }

  const handleInputChange = (field: keyof GuestFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddGuest = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (First Name, Last Name, Email)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("guests")
        .insert([
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            id_number: formData.id_number || null,
            nationality: formData.nationality || null,
            date_of_birth: formData.date_of_birth || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setGuests((prev) => [data, ...prev])
      setIsAddDialogOpen(false)
      resetForm()
      toast({
        title: "Success",
        description: "Guest added successfully",
      })
    } catch (error) {
      console.error("Error adding guest:", error)
      toast({
        title: "Error",
        description: "Failed to add guest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditGuest = async () => {
    if (!selectedGuest || !formData.first_name || !formData.last_name || !formData.email) {
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
        .from("guests")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          id_number: formData.id_number || null,
          nationality: formData.nationality || null,
          date_of_birth: formData.date_of_birth || null,
        })
        .eq("id", selectedGuest.id)
        .select()
        .single()

      if (error) throw error

      setGuests((prev) => prev.map((guest) => (guest.id === selectedGuest.id ? data : guest)))
      setIsEditDialogOpen(false)
      setSelectedGuest(null)
      resetForm()
      toast({
        title: "Success",
        description: "Guest updated successfully",
      })
    } catch (error) {
      console.error("Error updating guest:", error)
      toast({
        title: "Error",
        description: "Failed to update guest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (guest: Guest) => {
    setSelectedGuest(guest)
    setFormData({
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      phone: guest.phone || "",
      address: guest.address || "",
      id_number: guest.id_number || "",
      nationality: guest.nationality || "",
      date_of_birth: guest.date_of_birth || "",
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (guest: Guest) => {
    setSelectedGuest(guest)
    setIsViewDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

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
                  <h1 className="text-xl font-bold text-gray-900">Guest Management</h1>
                  <p className="text-sm text-gray-500">Manage guest information and profiles</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                {filteredGuests.length} Guest{filteredGuests.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests by name, email, phone, or nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>Enter the guest's information below</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    placeholder="American"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => handleInputChange("id_number", e.target.value)}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Main St, City, State, ZIP"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGuest} disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Guest"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Guests</CardTitle>
            <CardDescription>
              {filteredGuests.length} guest{filteredGuests.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredGuests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No guests found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first guest"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Guest
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">
                          {guest.first_name} {guest.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {guest.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {guest.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {guest.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest.nationality ? (
                            <Badge variant="outline">{guest.nationality}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(guest.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openViewDialog(guest)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(guest)}>
                              <Edit className="h-4 w-4" />
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

        {/* Edit Guest Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
              <DialogDescription>Update the guest's information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_nationality">Nationality</Label>
                <Input
                  id="edit_nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_id_number">ID Number</Label>
                <Input
                  id="edit_id_number"
                  value={formData.id_number}
                  onChange={(e) => handleInputChange("id_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_date_of_birth">Date of Birth</Label>
                <Input
                  id="edit_date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit_address">Address</Label>
                <Textarea
                  id="edit_address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditGuest} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Guest Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Guest Details</DialogTitle>
              <DialogDescription>View complete guest information</DialogDescription>
            </DialogHeader>
            {selectedGuest && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                      <p className="text-lg font-medium">
                        {selectedGuest.first_name} {selectedGuest.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p>{selectedGuest.email}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p>{selectedGuest.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Nationality</Label>
                      <p>{selectedGuest.nationality || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">ID Number</Label>
                      <p>{selectedGuest.id_number || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p>{selectedGuest.date_of_birth ? formatDate(selectedGuest.date_of_birth) : "Not provided"}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Member Since</Label>
                      <p>{formatDate(selectedGuest.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                      <p>{formatDate(selectedGuest.updated_at)}</p>
                    </div>
                  </div>
                </div>
                {selectedGuest.address && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Address</Label>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p>{selectedGuest.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              {selectedGuest && (
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    openEditDialog(selectedGuest)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Guest
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
