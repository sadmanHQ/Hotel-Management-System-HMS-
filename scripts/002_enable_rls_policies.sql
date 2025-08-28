-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Rooms policies (all authenticated users can view, admins can manage)
CREATE POLICY "Authenticated users can view rooms" ON public.rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage rooms" ON public.rooms FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'receptionist')
  )
);

-- Guests policies
CREATE POLICY "Staff can view all guests" ON public.guests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage guests" ON public.guests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'receptionist')
  )
);

-- Bookings policies
CREATE POLICY "Staff can view all bookings" ON public.bookings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage bookings" ON public.bookings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'receptionist')
  )
);

-- Payments policies
CREATE POLICY "Staff can view payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage payments" ON public.payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'receptionist')
  )
);

-- Services policies
CREATE POLICY "Authenticated users can view services" ON public.services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can manage services" ON public.services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Booking services policies
CREATE POLICY "Staff can view booking services" ON public.booking_services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage booking services" ON public.booking_services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'receptionist')
  )
);

-- Housekeeping tasks policies
CREATE POLICY "Staff can view housekeeping tasks" ON public.housekeeping_tasks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Housekeeping staff can view assigned tasks" ON public.housekeeping_tasks FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Staff can manage housekeeping tasks" ON public.housekeeping_tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'housekeeping')
  )
);

-- Inventory policies
CREATE POLICY "Staff can view inventory" ON public.inventory FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managers can manage inventory" ON public.inventory FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Inventory usage policies
CREATE POLICY "Staff can view inventory usage" ON public.inventory_usage FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can record inventory usage" ON public.inventory_usage FOR INSERT WITH CHECK (used_by = auth.uid());
CREATE POLICY "Managers can manage inventory usage" ON public.inventory_usage FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Staff schedules policies
CREATE POLICY "Staff can view all schedules" ON public.staff_schedules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can view own schedule" ON public.staff_schedules FOR SELECT USING (staff_id = auth.uid());
CREATE POLICY "Managers can manage schedules" ON public.staff_schedules FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);
