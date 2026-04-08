-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  address_line1 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  inventory_count INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  shipping_address JSONB NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_provider_order_id TEXT,
  payment_provider_payment_id TEXT,
  fraud_risk_score INTEGER DEFAULT 0,
  fraud_risk_level TEXT DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10,2) NOT NULL,
  variant_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'approved',
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User security table for lockout and brute force protection
CREATE TABLE IF NOT EXISTS user_security (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ,
  last_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  severity TEXT DEFAULT 'low',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cart: Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Security/Audit: Only admins can read
CREATE POLICY "Admins can view security alerts" ON security_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin'))
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Categories: Public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Products: Public read
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Coupons: Authenticated users can read active coupons
CREATE POLICY "Coupons are viewable by authenticated users" ON coupons FOR SELECT USING (auth.role() = 'authenticated');

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view their own order items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Wishlist: Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- Reviews: Public read, authenticated create
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RPC for secure order creation
CREATE OR REPLACE FUNCTION create_order_securely(
  p_user_id UUID,
  p_total_amount DECIMAL,
  p_discount_amount DECIMAL,
  p_final_amount DECIMAL,
  p_coupon_id UUID,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_payment_provider_order_id TEXT,
  p_payment_provider_payment_id TEXT,
  p_items JSONB,
  p_fraud_risk_score INTEGER DEFAULT 0,
  p_fraud_risk_level TEXT DEFAULT 'low'
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- 1. Create the order
  INSERT INTO orders (
    user_id, total_amount, discount_amount, final_amount, 
    coupon_id, shipping_address, payment_status, payment_method,
    payment_provider_order_id, payment_provider_payment_id,
    fraud_risk_score, fraud_risk_level
  ) VALUES (
    p_user_id, p_total_amount, p_discount_amount, p_final_amount,
    p_coupon_id, p_shipping_address, 'paid', p_payment_method,
    p_payment_provider_order_id, p_payment_provider_payment_id,
    p_fraud_risk_score, p_fraud_risk_level
  ) RETURNING id INTO v_order_id;

  -- 2. Create order items and update stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert order item
    INSERT INTO order_items (
      order_id, product_id, quantity, price_at_purchase, variant_info
    ) VALUES (
      v_order_id, 
      (v_item->>'product_id')::UUID, 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'price_at_purchase')::DECIMAL,
      (v_item->'variant_info')
    );

    -- Update stock
    UPDATE products 
    SET inventory_count = inventory_count - (v_item->>'quantity')::INTEGER
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- 3. Update coupon usage if applicable
  IF p_coupon_id IS NOT NULL THEN
    UPDATE coupons 
    SET usage_count = usage_count + 1 
    WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting table for production-grade protection
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_interval_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
  -- Get current state
  SELECT count, last_reset INTO v_count, v_last_reset
  FROM rate_limits
  WHERE key = p_key;

  -- If not exists or interval passed, reset
  IF v_count IS NULL OR v_now > v_last_reset + (p_interval_seconds || ' seconds')::interval THEN
    INSERT INTO rate_limits (key, count, last_reset)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE
    SET count = 1, last_reset = v_now;
    RETURN TRUE;
  END IF;

  -- If under limit, increment
  IF v_count < p_limit THEN
    UPDATE rate_limits
    SET count = count + 1
    WHERE key = p_key;
    RETURN TRUE;
  END IF;

  -- Over limit
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
