// Mock data for local development
export interface MockProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface MockCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface MockOrder {
  id: number;
  user_id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

class MockDatabase {
  private products: MockProduct[] = [
    {
      id: 1,
      name: "Spiritual Crystal Set",
      description: "A beautiful collection of healing crystals for meditation and spiritual growth",
      price: 49.99,
      image_url: "https://images.unsplash.com/photo-1518562180175-34a163b1de8a?w=400",
      category_id: 1,
      stock_quantity: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Meditation Cushion",
      description: "Comfortable meditation cushion for your daily practice",
      price: 79.99,
      image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      category_id: 2,
      stock_quantity: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "Sacred Incense Bundle",
      description: "Premium incense sticks for spiritual cleansing and aromatherapy",
      price: 24.99,
      image_url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
      category_id: 3,
      stock_quantity: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private categories: MockCategory[] = [
    {
      id: 1,
      name: "Crystals & Stones",
      description: "Healing crystals and gemstones",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "Meditation Accessories",
      description: "Tools and accessories for meditation practice",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "Incense & Aromatherapy",
      description: "Sacred scents and aromatherapy products",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private orders: MockOrder[] = [];
  private users: MockUser[] = [];

  // Product methods
  getProducts() {
    return { data: this.products, error: null };
  }

  getProduct(id: number) {
    const product = this.products.find(p => p.id === id);
    return { data: product ? [product] : [], error: product ? null : 'Product not found' };
  }

  createProduct(product: Omit<MockProduct, 'id' | 'created_at' | 'updated_at'>) {
    const newProduct: MockProduct = {
      ...product,
      id: Math.max(...this.products.map(p => p.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.products.push(newProduct);
    return { data: [newProduct], error: null };
  }

  updateProduct(id: number, updates: Partial<MockProduct>) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return { data: [], error: 'Product not found' };
    
    this.products[index] = {
      ...this.products[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return { data: [this.products[index]], error: null };
  }

  deleteProduct(id: number) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return { data: [], error: 'Product not found' };
    
    this.products.splice(index, 1);
    return { data: [], error: null };
  }

  // Category methods
  getCategories() {
    return { data: this.categories, error: null };
  }

  createCategory(category: Omit<MockCategory, 'id' | 'created_at' | 'updated_at'>) {
    const newCategory: MockCategory = {
      ...category,
      id: Math.max(...this.categories.map(c => c.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.categories.push(newCategory);
    return { data: [newCategory], error: null };
  }

  // Order methods
  getOrders() {
    return { data: this.orders, error: null };
  }

  createOrder(order: Omit<MockOrder, 'id' | 'created_at' | 'updated_at'>) {
    const newOrder: MockOrder = {
      ...order,
      id: Math.max(...this.orders.map(o => o.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.orders.push(newOrder);
    return { data: [newOrder], error: null };
  }

  // User methods
  getUsers() {
    return { data: this.users, error: null };
  }

  createUser(user: Omit<MockUser, 'created_at' | 'updated_at'>) {
    const newUser: MockUser = {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.users.push(newUser);
    return { data: [newUser], error: null };
  }
}

export const mockDB = new MockDatabase();
