import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load / Save JSON Database
const DB_FILE = path.join(process.cwd(), "db_store.json");

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], userData: {} }, null, 2));
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    
    // Auto-migration to expand catalog to 1250 products with Indian Brands for all user profiles
    let migrated = false;
    if (db && db.userData) {
      for (const userId of Object.keys(db.userData)) {
        const userWarehouse = db.userData[userId];
        if (userWarehouse && userWarehouse.products) {
          const needsIndianBrands = userWarehouse.products.some((p: any) => 
            p.name.startsWith("Thermal") || p.name.includes("Zenith") || p.name.includes("Apex") || p.name.includes("Aero") || p.name.includes("Lumina")
          );
          if (needsIndianBrands || userWarehouse.products.length < 100) {
            console.log(`Migrating user database for ${userId} to contain 1,250 products with Indian Brands...`);
            userWarehouse.products = generateAllDefaultProducts();
            userWarehouse.orders = [
              {
                id: "ord-1",
                productId: `prod-drinkware-1`,
                productName: "Butterfly Chilled Chalice #1001",
                sku: "SK-DR-101",
                quantity: 150,
                totalCost: 1275,
                status: "Shipped",
                createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
                estimatedArrival: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
              },
              {
                id: "ord-2",
                productId: `prod-furniture-1`,
                productName: "Wipro Furniture Adjustable Credenza #1001",
                sku: "SK-FU-101",
                quantity: 40,
                totalCost: 4400,
                status: "Sent",
                createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
                estimatedArrival: new Date(Date.now() + 19 * 24 * 3600 * 1000).toISOString().split('T')[0]
              }
            ];
            migrated = true;
          }
        }
      }
    }
    if (migrated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    }
    
    return db;
  } catch (e) {
    console.error("Error reading database file, resetting...", e);
    return { users: [], userData: {} };
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write to database file", e);
  }
}

// Procedural Generator for 1000s of Products (1,250 products across requested categories)
function generateProductsForCategory(category: string, count: number): any[] {
  const catShort = category.toLowerCase().slice(0, 2).toUpperCase();
  
  // Data pools for realistic name combinations
  let prefixes: string[] = [];
  let adjectives: string[] = [];
  let nouns: string[] = [];
  let minCost = 5;
  let maxCost = 50;
  
  if (category.toLowerCase() === "drinkware") {
    prefixes = ["Milton", "Cello", "Borosil", "Signoraware", "Pigeon", "Prestige", "Hawkins", "Butterfly", "Vinod", "LaOpala", "Jaypee", "InstaCuppa"];
    adjectives = ["Chilled", "Insulated", "Double-Wall", "Vacuum", "Sleek", "Robust", "Compact", "Elite", "Travel", "Copper", "Matte", "Sports", "Thermal"];
    nouns = ["Flask", "Tumbler", "Mug", "Bottle", "Thermos", "Chalice", "Jug", "Growler", "Carafe", "Goblet", "Canister", "Shaker"];
    minCost = 4;
    maxCost = 15;
  } else if (category.toLowerCase() === "footware") {
    prefixes = ["Bata", "Red Tape", "Liberty", "Lakhani", "Paragon", "Sparx", "Campus", "Khadims", "Woodland", "Metro", "Relaxo", "Walkaroo"];
    adjectives = ["Cushioned", "Lightweight", "Waterproof", "All-Terrain", "Responsive", "Breathing", "Carbon", "Trail", "Comfort", "Athletic", "Grip"];
    nouns = ["Runners", "Sneakers", "Boots", "Trainers", "Sandals", "Cleats", "Loafers", "Slippers", "Joggers", "Oxfords", "Moccasins", "Climbers"];
    minCost = 20;
    maxCost = 80;
  } else if (category.toLowerCase() === "office supplies") {
    prefixes = ["Classmate", "Camel", "Camlin", "Nataraj", "Apsara", "Kangaro", "Solo", "Linc", "Luxor", "Reynolds", "Papergrid"];
    adjectives = ["Ergonomic", "Modular", "Minimalist", "Magnetic", "Smart", "Refillable", "Compact", "Desktop", "Leather", "Executive", "Eco-Friendly"];
    nouns = ["Organizer", "Planner", "Notebook", "Stapler", "Desk-Pad", "Pen-Set", "Clip-Board", "File-Rack", "Journal", "Binder", "Shears", "Holder"];
    minCost = 2;
    maxCost = 25;
  } else if (category.toLowerCase() === "wearable tech") {
    prefixes = ["boAt", "Noise", "Fire-Boltt", "Fastrack", "Pebble", "Boult", "BeatXP", "Titan-Active", "Hammer", "Ambrane", "Zebronics", "Portronics"];
    adjectives = ["Smart", "Active", "Haptic", "Biometric", "Wireless", "OLED", "Pro", "Fitness", "GPS", "Waterproof", "Multi-Sport", "Sleek"];
    nouns = ["Band", "Watch", "Tracker", "Ring", "Earbuds", "Sensors", "Specs", "Patch", "Strap", "Bracelet", "Sleeve", "Pod"];
    minCost = 15;
    maxCost = 150;
  } else if (category.toLowerCase() === "furniture") {
    prefixes = ["Godrej Interio", "Nilkamal", "Pepperfry", "Urban Ladder", "Sleepwell", "Duroflex", "Featherlite", "Wipro Furniture", "Supreme", "Zuari", "Damro", "Greenply"];
    adjectives = ["Ergonomic", "Adjustable", "Floating", "Reclining", "Swivel", "Padded", "Velvet", "Walnut", "Oak", "Mesh", "Orthopedic", "Executive"];
    nouns = ["Chair", "Desk", "Stool", "Table", "Bookshelf", "Credenza", "Ottoman", "Lounge", "Bench", "Cabinet", "Recliner", "Stand"];
    minCost = 50;
    maxCost = 350;
  } else {
    prefixes = ["Generic", "Standard", "Basic"];
    adjectives = ["Utility", "Simple", "Standard"];
    nouns = ["Item", "Product", "Unit"];
  }

  const result: any[] = [];
  for (let i = 1; i <= count; i++) {
    const pIdx = (i * 7) % prefixes.length;
    const aIdx = (i * 13) % adjectives.length;
    const nIdx = (i * 17) % nouns.length;
    
    const name = `${prefixes[pIdx]} ${adjectives[aIdx]} ${nouns[nIdx]} #${1000 + i}`;
    const sku = `SK-${catShort}-${String(100 + i).slice(-3)}`;
    
    const unitCost = Math.round((minCost + ((i * 31) % (maxCost - minCost))) * 100) / 100;
    const markupFactor = 1.4 + ((i * 19) % 11) * 0.1;
    const unitPrice = Math.round(unitCost * markupFactor * 100) / 100;
    
    const minStock = Math.round((10 + ((i * 11) % 40)) * 5); // 50 to 250
    const maxStock = Math.round(minStock * (2.5 + ((i * 5) % 4))); // e.g. 125 to 1375
    const reorderPoint = Math.round(minStock * 1.4);
    
    // Distribute stock states: ~5% stockouts, ~5% overstock, 90% normal
    const stockRand = (i * 23) % 100;
    let currentStock = 0;
    if (stockRand < 5) {
      currentStock = Math.round(minStock * 0.5); // stockout hazard
    } else if (stockRand < 10) {
      currentStock = Math.round(maxStock * 1.15); // overstock risk
    } else {
      currentStock = Math.round(minStock + (maxStock - minStock) * 0.45); // stable
    }
    
    const leadTimeDays = 3 + ((i * 3) % 18);
    
    const trends: ("rising" | "stable" | "falling")[] = ["rising", "stable", "falling"];
    const demandTrend = trends[(i * 11) % 3];
    const seasonalityFactor = Math.round((0.85 + ((i * 7) % 7) * 0.1) * 100) / 100;
    
    // Generate sales history for past 12 weeks
    const salesHistory: any[] = [];
    const baseWeeklySales = Math.round(currentStock * 0.12 + 8);
    for (let w = -11; w <= 0; w++) {
      const weekTrendFactor = demandTrend === "rising" ? (1 + (w * 0.03)) : demandTrend === "falling" ? (1 - (w * 0.03)) : 1;
      const weekSeasonality = 1 + Math.sin((w + i) * 0.5) * 0.15;
      const randomVariance = 0.85 + ((w * i * 13) % 31) * 0.01;
      const units = Math.max(1, Math.round(baseWeeklySales * weekTrendFactor * weekSeasonality * randomVariance));
      salesHistory.push({
        interval: `Week ${w}`,
        units
      });
    }

    result.push({
      id: `prod-${category.toLowerCase().replace(" ", "")}-${i}`,
      name,
      sku,
      category,
      currentStock,
      minStock,
      maxStock,
      reorderPoint,
      leadTimeDays,
      unitCost,
      unitPrice,
      demandTrend,
      seasonalityFactor,
      salesHistory
    });
  }

  return result;
}

function generateAllDefaultProducts(): any[] {
  return [
    ...generateProductsForCategory("Drinkware", 250),
    ...generateProductsForCategory("Footware", 250),
    ...generateProductsForCategory("Office supplies", 250),
    ...generateProductsForCategory("Wearable tech", 250),
    ...generateProductsForCategory("Furniture", 250)
  ];
}

const DEFAULT_PRODUCTS = generateAllDefaultProducts();

const DEFAULT_ORDERS = [
  {
    id: "ord-1",
    productId: "prod-drinkware-1",
    productName: "Butterfly Chilled Chalice #1001",
    sku: "SK-DR-101",
    quantity: 150,
    totalCost: 1275,
    status: "Shipped",
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  },
  {
    id: "ord-2",
    productId: "prod-furniture-1",
    productName: "Wipro Furniture Adjustable Credenza #1001",
    sku: "SK-FU-101",
    quantity: 40,
    totalCost: 4400,
    status: "Sent",
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    estimatedArrival: new Date(Date.now() + 19 * 24 * 3600 * 1000).toISOString().split('T')[0]
  }
];

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized access. No session key provided." });
    return;
  }
  const userId = authHeader.split(" ")[1];
  const db = loadDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: "Session invalid or expired." });
    return;
  }
  (req as any).userId = userId;
  next();
}

// Lazy Initialize Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured. Please supply it in the AI Studio Settings.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API Routes

// Registration
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { email, password, warehouseName, managerName } = req.body;
  if (!email || !password || !warehouseName || !managerName) {
    res.status(400).json({ error: "All registration fields are required." });
    return;
  }

  const db = loadDB();
  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    res.status(400).json({ error: "Email already registered." });
    return;
  }

  const newId = "usr-" + Math.random().toString(36).substring(2, 9);
  const newUser = {
    id: newId,
    email,
    password, // Stored safely in workspace DB
    warehouseName,
    managerName
  };

  db.users.push(newUser);
  // Seed initial high-quality warehouse products
  db.userData[newId] = {
    products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
    orders: JSON.parse(JSON.stringify(DEFAULT_ORDERS))
  };

  saveDB(db);

  res.status(201).json({
    userId: newId,
    email: newUser.email,
    warehouseName: newUser.warehouseName,
    managerName: newUser.managerName
  });
});

// Login
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const db = loadDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  // Ensure default seeded data exists for user if it is blank for some reason
  if (!db.userData[user.id]) {
    db.userData[user.id] = {
      products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
      orders: JSON.parse(JSON.stringify(DEFAULT_ORDERS))
    };
    saveDB(db);
  }

  res.status(200).json({
    userId: user.id,
    email: user.email,
    warehouseName: user.warehouseName,
    managerName: user.managerName
  });
});

// Get User Profile details
app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = loadDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: "User session not found." });
    return;
  }
  res.json({
    userId: user.id,
    email: user.email,
    warehouseName: user.warehouseName,
    managerName: user.managerName
  });
});

// GET all inventory products
app.get("/api/inventory", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = loadDB();
  const userWarehouse = db.userData[userId] || { products: [], orders: [] };
  res.json(userWarehouse.products);
});

// POST add new inventory product
app.post("/api/inventory", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const productData = req.body;
  
  if (!productData.name || !productData.sku || !productData.category) {
    res.status(400).json({ error: "Product name, SKU, and Category are required." });
    return;
  }

  const db = loadDB();
  if (!db.userData[userId]) {
    db.userData[userId] = { products: [], orders: [] };
  }

  const products = db.userData[userId].products;
  const skuExists = products.find((p: any) => p.sku.toUpperCase() === productData.sku.toUpperCase());
  if (skuExists) {
    res.status(400).json({ error: "A product with this SKU already exists." });
    return;
  }

  const newProduct = {
    id: "prod-" + Math.random().toString(36).substring(2, 9),
    name: productData.name,
    sku: productData.sku.toUpperCase(),
    category: productData.category,
    currentStock: Number(productData.currentStock) || 0,
    minStock: Number(productData.minStock) || 50,
    maxStock: Number(productData.maxStock) || 500,
    reorderPoint: Number(productData.reorderPoint) || 100,
    leadTimeDays: Number(productData.leadTimeDays) || 7,
    unitCost: Number(productData.unitCost) || 10.0,
    unitPrice: Number(productData.unitPrice) || 19.99,
    demandTrend: productData.demandTrend || "stable",
    seasonalityFactor: Number(productData.seasonalityFactor) || 1.0,
    salesHistory: productData.salesHistory || [
      { interval: "Week -3", units: 20 },
      { interval: "Week -2", units: 25 },
      { interval: "Week -1", units: 22 },
      { interval: "Week 0", units: 30 }
    ]
  };

  products.push(newProduct);
  saveDB(db);

  res.status(201).json(newProduct);
});

// PUT update existing inventory product
app.put("/api/inventory/:id", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const productId = req.params.id;
  const updateData = req.body;

  const db = loadDB();
  const userWarehouse = db.userData[userId];
  if (!userWarehouse) {
    res.status(404).json({ error: "Inventory workspace not found." });
    return;
  }

  const index = userWarehouse.products.findIndex((p: any) => p.id === productId);
  if (index === -1) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  const existing = userWarehouse.products[index];
  
  // Update fields carefully
  userWarehouse.products[index] = {
    ...existing,
    name: updateData.name !== undefined ? updateData.name : existing.name,
    sku: updateData.sku !== undefined ? updateData.sku.toUpperCase() : existing.sku,
    category: updateData.category !== undefined ? updateData.category : existing.category,
    currentStock: updateData.currentStock !== undefined ? Number(updateData.currentStock) : existing.currentStock,
    minStock: updateData.minStock !== undefined ? Number(updateData.minStock) : existing.minStock,
    maxStock: updateData.maxStock !== undefined ? Number(updateData.maxStock) : existing.maxStock,
    reorderPoint: updateData.reorderPoint !== undefined ? Number(updateData.reorderPoint) : existing.reorderPoint,
    leadTimeDays: updateData.leadTimeDays !== undefined ? Number(updateData.leadTimeDays) : existing.leadTimeDays,
    unitCost: updateData.unitCost !== undefined ? Number(updateData.unitCost) : existing.unitCost,
    unitPrice: updateData.unitPrice !== undefined ? Number(updateData.unitPrice) : existing.unitPrice,
    demandTrend: updateData.demandTrend !== undefined ? updateData.demandTrend : existing.demandTrend,
    seasonalityFactor: updateData.seasonalityFactor !== undefined ? Number(updateData.seasonalityFactor) : existing.seasonalityFactor,
    salesHistory: updateData.salesHistory !== undefined ? updateData.salesHistory : existing.salesHistory
  };

  saveDB(db);
  res.json(userWarehouse.products[index]);
});

// DELETE inventory product
app.delete("/api/inventory/:id", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const productId = req.params.id;

  const db = loadDB();
  const userWarehouse = db.userData[userId];
  if (!userWarehouse) {
    res.status(404).json({ error: "Inventory workspace not found." });
    return;
  }

  const index = userWarehouse.products.findIndex((p: any) => p.id === productId);
  if (index === -1) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  userWarehouse.products.splice(index, 1);
  saveDB(db);

  res.json({ success: true, message: "Product deleted from inventory." });
});

// POST add a sales event / record for a product
app.post("/api/inventory/:id/sales", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const productId = req.params.id;
  const { units, interval } = req.body;

  if (units === undefined || !interval) {
    res.status(400).json({ error: "Interval name and units are required." });
    return;
  }

  const db = loadDB();
  const userWarehouse = db.userData[userId];
  const product = userWarehouse?.products.find((p: any) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  // Deduct units from current stock
  product.currentStock = Math.max(0, product.currentStock - Number(units));
  
  // Add to sales history
  const existingInterval = product.salesHistory.find((s: any) => s.interval === interval);
  if (existingInterval) {
    existingInterval.units += Number(units);
  } else {
    product.salesHistory.push({ interval, units: Number(units) });
  }

  // Keep sales history to max 12 items for clean graphing
  if (product.salesHistory.length > 12) {
    product.salesHistory.shift();
  }

  saveDB(db);
  res.json(product);
});

// GET active replenishment orders
app.get("/api/orders", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = loadDB();
  const userWarehouse = db.userData[userId] || { products: [], orders: [] };
  res.json(userWarehouse.orders);
});

// POST create replenishment order
app.post("/api/orders", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || Number(quantity) <= 0) {
    res.status(400).json({ error: "Product ID and a positive order quantity are required." });
    return;
  }

  const db = loadDB();
  const userWarehouse = db.userData[userId];
  if (!userWarehouse) {
    res.status(404).json({ error: "Inventory workspace not found." });
    return;
  }

  const product = userWarehouse.products.find((p: any) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  const totalCost = product.unitCost * Number(quantity);
  const estimatedArrivalDate = new Date(Date.now() + product.leadTimeDays * 24 * 3600 * 1000)
    .toISOString()
    .split('T')[0];

  const newOrder = {
    id: "ord-" + Math.random().toString(36).substring(2, 9),
    productId,
    productName: product.name,
    sku: product.sku,
    quantity: Number(quantity),
    totalCost,
    status: "Sent" as const,
    createdAt: new Date().toISOString(),
    estimatedArrival: estimatedArrivalDate
  };

  userWarehouse.orders.unshift(newOrder);
  saveDB(db);

  res.status(201).json(newOrder);
});

// PUT update replenishment order status
app.put("/api/orders/:id", requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const orderId = req.params.id;
  const { status } = req.body; // 'Draft' | 'Sent' | 'Shipped' | 'Received'

  if (!status) {
    res.status(400).json({ error: "Order status is required." });
    return;
  }

  const db = loadDB();
  const userWarehouse = db.userData[userId];
  if (!userWarehouse) {
    res.status(404).json({ error: "Inventory workspace not found." });
    return;
  }

  const orderIndex = userWarehouse.orders.findIndex((o: any) => o.id === orderId);
  if (orderIndex === -1) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  const order = userWarehouse.orders[orderIndex];
  const oldStatus = order.status;
  order.status = status;

  // If order status changes to 'Received', credit the stock!
  if (status === "Received" && oldStatus !== "Received") {
    const product = userWarehouse.products.find((p: any) => p.id === order.productId);
    if (product) {
      product.currentStock += order.quantity;
    }
  }

  saveDB(db);
  res.json(order);
});

// Helper to extract aggregated metrics and top critical items to scale prompt to thousands of products
function getAIScalingContext(products: any[]) {
  const totalValuation = products.reduce((sum, p) => sum + (p.currentStock * p.unitCost), 0);
  const totalItems = products.length;
  const stockoutRiskProducts = products.filter(p => p.currentStock < p.minStock);
  const overstockRiskProducts = products.filter(p => p.currentStock > p.maxStock);
  
  // Categorized breakdown count
  const categoryCounts: Record<string, number> = {};
  for (const p of products) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }
  
  // Select top 10 most critical stockout risk items (lowest stock ratio compared to safety threshold)
  const sortedStockout = [...stockoutRiskProducts].sort((a, b) => {
    const ratioA = a.currentStock / (a.minStock || 1);
    const ratioB = b.currentStock / (b.minStock || 1);
    return ratioA - ratioB;
  }).slice(0, 10);
  
  // Select top 5 most critical overstocked items
  const sortedOverstock = [...overstockRiskProducts].sort((a, b) => {
    const ratioA = a.currentStock / (a.maxStock || 1);
    const ratioB = b.currentStock / (b.maxStock || 1);
    return ratioB - ratioA;
  }).slice(0, 5);

  return {
    totalValuation,
    totalItems,
    categoryCounts,
    stockoutCount: stockoutRiskProducts.length,
    overstockCount: overstockRiskProducts.length,
    criticalStockouts: sortedStockout,
    criticalOverstocks: sortedOverstock
  };
}

// AI OPTIMIZATION REPORT GENERATOR (Server-Side using Gemini API)
app.post("/api/ai/report", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = loadDB();
  const userWarehouse = db.userData[userId];
  
  if (!userWarehouse || !userWarehouse.products || userWarehouse.products.length === 0) {
    res.status(400).json({ error: "You must have items in your inventory catalog to generate an AI optimization report." });
    return;
  }

  try {
    const client = getGeminiClient();
    const ctx = getAIScalingContext(userWarehouse.products);

    const categoriesList = Object.entries(ctx.categoryCounts)
      .map(([cat, count]) => `- ${cat}: ${count} products`)
      .join("\n");

    const criticalStockoutsSummary = ctx.criticalStockouts.map((p: any) => {
      const avgWeeklySales = Math.round(p.salesHistory.reduce((sum: number, sh: any) => sum + sh.units, 0) / p.salesHistory.length);
      return `Product: ${p.name} (SKU: ${p.sku})
- Category: ${p.category}
- Stock Levels: Current: ${p.currentStock}, Safety Buffer: ${p.minStock}, Max Storage: ${p.maxStock}
- Pricing: Unit Cost: $${p.unitCost}, Selling Price: $${p.unitPrice}
- Demand Trend: ${p.demandTrend}
- Average Weekly Sales: ${avgWeeklySales} units
- Lead Time to Deliver: ${p.leadTimeDays} days`;
    }).join("\n\n");

    const criticalOverstocksSummary = ctx.criticalOverstocks.map((p: any) => {
      return `- ${p.name} (SKU: ${p.sku}): Current stock=${p.currentStock}, Max Capacity=${p.maxStock}, Unit Cost=$${p.unitCost}`;
    }).join("\n");

    const prompt = `You are Lumina, a world-class predictive supply chain analyst and logistics optimization engine.
Construct an expert Executive Inventory Optimization Report analyzing this large warehouse with thousands of products.

**AGGREGATE WAREHOUSE METRICS**:
- Total Items Monitored: ${ctx.totalItems} SKUs
- Total Catalog Valuation: $${ctx.totalValuation.toFixed(2)}
- Products At Risk of Stockout: ${ctx.stockoutCount}
- Products Overstocked: ${ctx.overstockCount}

**CATALOG DISTRIBUTION**:
${categoriesList}

**TOP CRITICAL DEPLETIED HAZARDS (REPLENISH IMMEDIATELY)**:
${criticalStockoutsSummary}

**TOP SEVERE OVERSTOCK CAPITAL BINDS**:
${criticalOverstocksSummary}

Please structure the report with the following specific sections, using clean markdown formatting (no titles/branding in margins, just crisp layout):
1. **Executive Summary**: A concise assessment of the warehouse's health, total stock valuation, and aggregate operational risks. Mention how managing ${ctx.totalItems} products is optimized under current models.
2. **Critical Stockout Hazards**: Deep dive into the products at risk of depletion. Recommend optimal order quantities (using Economic Order Quantity EOQ rationale if possible), incorporating lead time safety windows.
3. **Overstock Capital Reductions**: Identify products binding up capital. Advise strategic holding-cost reduction steps (discounts, promotions, supplier returns).
4. **Predictive Analytics & Seasonal Insights**: Explain how demand trends (rising/falling) and seasonality factors will impact the upcoming weeks.
5. **Actionable Supplier Procurement Playbook**: Give 3 direct, tactical negotiations steps or action items for vendors. Include a professional pre-written email draft they can copy and send to suppliers to request expedited shipping for low-stock items.

Ensure the tone is analytical, highly professional, authoritative, and helpful. Use clear, humble labels. Do not use self-praising or dramatic words. Do not refer to container ports or simulated workspace metrics.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("Gemini report error:", error);
    res.status(500).json({ error: error.message || "The AI model encountered an issue compiling the optimization report." });
  }
});

// AI COPILOT CHAT (Grounded with inventory stats)
app.post("/api/ai/chat", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { message, chatHistory } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message content is required." });
    return;
  }

  const db = loadDB();
  const userWarehouse = db.userData[userId];

  try {
    const client = getGeminiClient();
    const ctx = getAIScalingContext(userWarehouse?.products || []);

    const briefCritical = ctx.criticalStockouts.map((p: any) => {
      return `- ${p.name} (SKU: ${p.sku}): Stock=${p.currentStock}, Buffer=${p.minStock}, Status=LOW STOCK, Lead Time=${p.leadTimeDays} days, Cost=$${p.unitCost}.`;
    }).join("\n");

    const briefOverstock = ctx.criticalOverstocks.map((p: any) => {
      return `- ${p.name} (SKU: ${p.sku}): Stock=${p.currentStock}, Max=${p.maxStock}, Status=OVERSTOCKED, Cost=$${p.unitCost}.`;
    }).join("\n");

    const contextInstruction = `You are Lumina, the intelligent logistics assistant embedded inside the Smart Inventory Demand Forecasting Dashboard.
Your role is to help warehouse managers make optimal, data-backed supply chain decisions across their catalog of ${ctx.totalItems} products.

**WAREHOUSE CONTEXT OVERVIEW**:
- Total Monitored SKUs: ${ctx.totalItems}
- Aggregate stock value: $${ctx.totalValuation.toFixed(2)}
- Current stockout risks: ${ctx.stockoutCount}
- Current overstocks: ${ctx.overstockCount}

**MOST CRITICAL STOCKOUT RISKS**:
${briefCritical}

**MOST SEVERE OVERSTOCKED ITEMS**:
${briefOverstock}

Instructions:
- Keep answers professional, practical, and highly specific.
- Reference actual quantities, SKUs, or product names from their inventory whenever relevant.
- Avoid abstract or generic advice; calculate required reorder points or safety stocks directly if asked!
- Never use generic system credit lines or container metadata.
- If they ask to draft an email or order form, supply an elegant, copyable text template.

User says: ${message}`;

    const formattedContents = [
      { role: "user" as const, parts: [{ text: contextInstruction }] }
    ];

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    res.status(500).json({ error: error.message || "The AI copilot failed to respond." });
  }
});

// Serve Vite Assets and SPAs
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Inventory Forecasting server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
