-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample products
INSERT INTO products (name, description, price, image_url, category) VALUES
  (
    'Premium Headphones',
    'High-quality wireless headphones with noise cancellation and premium sound quality.',
    299.99,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format',
    'Electronics'
  ),
  (
    'Smart Watch',
    'Feature-rich smartwatch with health tracking, notifications, and long battery life.',
    199.99,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format',
    'Electronics'
  ),
  (
    'Wireless Earbuds',
    'True wireless earbuds with active noise cancellation and premium sound.',
    149.99,
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&auto=format',
    'Electronics'
  ),
  (
    'Gaming Console',
    'Next-gen gaming console with 4K graphics and immersive gaming experience.',
    499.99,
    'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=500&auto=format',
    'Electronics'
  ),
  (
    'Fitness Tracker',
    'Advanced fitness tracker with heart rate monitoring and sleep tracking.',
    79.99,
    'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=500&auto=format',
    'Electronics'
  ),
  (
    'Portable Speaker',
    'Waterproof portable speaker with 360° sound and 20-hour battery life.',
    129.99,
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format',
    'Electronics'
  ),
  (
    'Tablet Pro',
    'Powerful tablet with high-resolution display and long battery life.',
    399.99,
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format',
    'Electronics'
  ),
  (
    'Wireless Charger',
    'Fast wireless charging pad compatible with all Qi-enabled devices.',
    49.99,
    'https://images.unsplash.com/photo-1618577608401-189f1d9b1b1f?w=500&auto=format',
    'Electronics'
  ); 