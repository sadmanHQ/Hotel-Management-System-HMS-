-- Hotel Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning', 'out_of_order');
CREATE TYPE room_type AS ENUM ('single', 'double', 'suite', 'deluxe', 'presidential');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial', 'refunded', 'failed');
CREATE TYPE staff_role AS ENUM ('admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'security');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role staff_role DEFAULT 'receptionist',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number TEXT UNIQUE NOT NULL,
  room_type room_type NOT NULL,
  floor_number INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  base_price DECIMAL(10,2) NOT NULL,
  status room_status DEFAULT 'available',
  amenities TEXT[], -- Array of amenities
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests table
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  id_number TEXT,
  nationality TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  special_requests TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table (additional hotel services)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking services (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.booking_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Housekeeping tasks
CREATE TABLE IF NOT EXISTS public.housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  task_type TEXT NOT NULL, -- 'cleaning', 'maintenance', 'inspection'
  description TEXT,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory usage tracking
CREATE TABLE IF NOT EXISTS public.inventory_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id),
  quantity_used INTEGER NOT NULL,
  used_by UUID REFERENCES public.profiles(id),
  usage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Staff schedules
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 60, -- minutes
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_room ON public.housekeeping_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_assigned ON public.housekeeping_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
