-- Insert sample rooms
INSERT INTO public.rooms (room_number, room_type, floor_number, capacity, base_price, amenities, description) VALUES
('101', 'single', 1, 1, 99.99, ARRAY['wifi', 'tv', 'ac'], 'Cozy single room with city view'),
('102', 'double', 1, 2, 149.99, ARRAY['wifi', 'tv', 'ac', 'minibar'], 'Comfortable double room'),
('103', 'double', 1, 2, 149.99, ARRAY['wifi', 'tv', 'ac', 'minibar'], 'Comfortable double room'),
('201', 'suite', 2, 4, 299.99, ARRAY['wifi', 'tv', 'ac', 'minibar', 'balcony', 'kitchenette'], 'Spacious suite with living area'),
('202', 'suite', 2, 4, 299.99, ARRAY['wifi', 'tv', 'ac', 'minibar', 'balcony', 'kitchenette'], 'Spacious suite with living area'),
('301', 'deluxe', 3, 2, 199.99, ARRAY['wifi', 'tv', 'ac', 'minibar', 'balcony'], 'Deluxe room with premium amenities'),
('302', 'deluxe', 3, 2, 199.99, ARRAY['wifi', 'tv', 'ac', 'minibar', 'balcony'], 'Deluxe room with premium amenities'),
('401', 'presidential', 4, 6, 599.99, ARRAY['wifi', 'tv', 'ac', 'minibar', 'balcony', 'kitchenette', 'jacuzzi', 'butler_service'], 'Presidential suite with luxury amenities');

-- Insert sample services
INSERT INTO public.services (name, description, price) VALUES
('Room Service', '24/7 room service', 15.00),
('Laundry Service', 'Same day laundry service', 25.00),
('Airport Transfer', 'Airport pickup and drop-off', 45.00),
('Spa Treatment', 'Relaxing spa treatment', 120.00),
('Gym Access', 'Access to fitness center', 20.00),
('Business Center', 'Access to business facilities', 30.00),
('Pet Care', 'Pet sitting and care services', 50.00),
('Extra Bed', 'Additional bed in room', 35.00);

-- Insert sample inventory items
INSERT INTO public.inventory (name, category, current_stock, minimum_stock, unit_price, supplier) VALUES
('Towels', 'Linens', 200, 50, 12.99, 'Hotel Supplies Co'),
('Bed Sheets', 'Linens', 150, 30, 25.99, 'Hotel Supplies Co'),
('Toilet Paper', 'Bathroom', 500, 100, 2.99, 'Cleaning Supplies Ltd'),
('Shampoo', 'Bathroom', 100, 20, 8.99, 'Beauty Products Inc'),
('Coffee Pods', 'Minibar', 300, 50, 1.99, 'Beverage Distributors'),
('Water Bottles', 'Minibar', 400, 80, 0.99, 'Beverage Distributors'),
('Cleaning Spray', 'Cleaning', 80, 15, 6.99, 'Cleaning Supplies Ltd'),
('Vacuum Bags', 'Cleaning', 50, 10, 4.99, 'Cleaning Supplies Ltd');
