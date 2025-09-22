-- Create tables for the e-commerce application

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category VARCHAR(255) NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (for additional user data)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_intent_id VARCHAR(255),
  shipping_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample categories
INSERT INTO categories (name, description, image) VALUES
('Spiritual Books', 'Books for spiritual enlightenment and growth', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Crystals & Gems', 'Healing crystals and precious gemstones', 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400'),
('Meditation Tools', 'Tools and accessories for meditation practice', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'),
('Incense & Candles', 'Aromatherapy and sacred scents', 'https://images.unsplash.com/photo-1602893923133-460f86e5b4fe?w=400'),
('Yoga Accessories', 'Equipment for yoga and mindfulness practice', 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400'),
('Sacred Art', 'Spiritual artwork and decorative items', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400');

-- Insert sample products
INSERT INTO products (name, description, price, category, images, stock, featured) VALUES
('The Power of Now', 'A guide to spiritual enlightenment by Eckhart Tolle. Transform your life through present-moment awareness.', 599.00, 'Spiritual Books', '["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"]', 25, true),
('Amethyst Crystal Set', 'Beautiful collection of amethyst crystals for healing and meditation. Includes 5 different sized stones.', 1299.00, 'Crystals & Gems', '["https://images.unsplash.com/photo-1602897230985-7d36beb12e8b?w=400"]', 15, true),
('Meditation Cushion', 'Comfortable zabuton meditation cushion filled with organic buckwheat hulls. Perfect for long sessions.', 899.00, 'Meditation Tools', '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"]', 30, false),
('Sage Smudge Bundle', 'White sage bundle for cleansing and purification rituals. Ethically sourced from California.', 249.00, 'Incense & Candles', '["https://images.unsplash.com/photo-1602893923133-460f86e5b4fe?w=400"]', 50, true),
('Tibetan Singing Bowl', 'Handcrafted brass singing bowl from Nepal. Creates beautiful healing sounds for meditation.', 1599.00, 'Meditation Tools', '["https://images.unsplash.com/photo-1593006725217-fdadef0cc8b8?w=400"]', 12, true),
('Yoga Mat Premium', 'Eco-friendly cork yoga mat with natural rubber base. Non-slip surface perfect for all practices.', 2299.00, 'Yoga Accessories', '["https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400"]', 20, false),
('Buddha Statue', 'Handcarved wooden Buddha statue for meditation space. Brings peace and tranquility to any room.', 3499.00, 'Sacred Art', '["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"]', 8, true),
('Essential Oil Set', 'Collection of 6 pure essential oils including lavender, frankincense, and sandalwood for aromatherapy.', 1899.00, 'Incense & Candles', '["https://images.unsplash.com/photo-1594736797933-d0ac1b3b6c10?w=400"]', 25, false);

-- Create admin user (you'll need to update this with actual Clerk user ID)
INSERT INTO users (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000000', 'admin@yourstore.com', 'Admin User', 'admin');

-- Create Row Level Security (RLS) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Only admins can insert products" ON products FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can update products" ON products FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can delete products" ON products FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Only admins can insert categories" ON categories FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can update categories" ON categories FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Only admins can delete categories" ON categories FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Orders policies (users can view their own orders, admins can view all)
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid()::text = user_id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Only admins can update orders" ON orders FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Order items policies (follow orders policies)
CREATE POLICY "Users can view their order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin')
  )
);
CREATE POLICY "Users can insert their order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()::text
  )
);

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::text = id OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Only admins can insert users" ON users FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
