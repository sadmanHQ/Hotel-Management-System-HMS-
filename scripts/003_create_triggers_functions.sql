-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON public.housekeeping_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::staff_role, 'receptionist')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically update room status based on bookings
CREATE OR REPLACE FUNCTION update_room_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- When booking is confirmed and check-in date is today or past
  IF NEW.status = 'confirmed' AND NEW.check_in_date <= CURRENT_DATE THEN
    UPDATE public.rooms 
    SET status = 'occupied' 
    WHERE id = NEW.room_id AND status = 'available';
  END IF;
  
  -- When booking is checked out
  IF NEW.status = 'checked_out' THEN
    UPDATE public.rooms 
    SET status = 'cleaning' 
    WHERE id = NEW.room_id;
  END IF;
  
  -- When booking is cancelled
  IF NEW.status = 'cancelled' THEN
    UPDATE public.rooms 
    SET status = 'available' 
    WHERE id = NEW.room_id AND status = 'occupied';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_status_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_status_on_booking();
