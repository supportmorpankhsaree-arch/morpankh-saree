import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

function cleanMongoUri(rawUri) {
  if (!rawUri) return '';
  let uri = rawUri.trim();
  while (uri.startsWith('MONGODB_URI=')) {
    uri = uri.slice('MONGODB_URI='.length).trim();
  }
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }
  return uri;
}

const rawUri = process.env.MONGODB_URI;
const uri = cleanMongoUri(rawUri);

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const lastSegment = uri.split('/').pop() || '';
const dbName = lastSegment.split('?')[0].trim() || 'morpankhsaree';

console.log(`📡 Connecting to MongoDB cluster for database: "${dbName}"...`);

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas successfully!');

    const db = client.db(dbName);

    // List existing collections
    const existingCollections = (await db.listCollections().toArray()).map(c => c.name);
    console.log('📦 Existing collections:', existingCollections);

    // Required models / collections
    const requiredCollections = [
      'products',
      'categories',
      'website_settings',
      'referralSettings',
      'orders',
      'users',
      'reviews',
      'carts',
      'wishlists',
      'blogs',
      'careers',
      'contact_messages',
      'announcement_bar',
      'homepage_popups',
      'referrals',
      'rewardTransactions',
      'admin_otps',
      'otps'
    ];

    for (const name of requiredCollections) {
      if (!existingCollections.includes(name)) {
        await db.createCollection(name);
        console.log(`  + Created collection: ${name}`);
      }
    }

    // 1. Initialize website_settings if missing
    const settingsCol = db.collection('website_settings');
    const existingSettings = await settingsCol.findOne({});
    if (!existingSettings) {
      await settingsCol.insertOne({
        maintenanceMode: false,
        updatedAt: new Date(),
        updatedBy: 'system'
      });
      console.log('✅ Initialized website_settings');
    }

    // 2. Initialize referralSettings if missing
    const referralSettingsCol = db.collection('referralSettings');
    const existingReferral = await referralSettingsCol.findOne({ _id: new ObjectId('000000000000000000000001') });
    if (!existingReferral) {
      await referralSettingsCol.insertOne({
        _id: new ObjectId('000000000000000000000001'),
        enabled: true,
        referrerRewardType: 'supercoins',
        referrerRewardAmount: 50,
        refereeDiscountType: 'fixed',
        refereeDiscountAmount: 100,
        minOrderAmount: 499,
        maxUsesPerUser: 1,
        expiryDays: 30,
        termsConditions: 'Referral rewards are valid on minimum orders of ₹499.',
        updatedAt: new Date()
      });
      console.log('✅ Initialized referralSettings');
    }

    // 3. Initialize announcement_bar if missing
    const announcementCol = db.collection('announcement_bar');
    const existingAnnouncement = await announcementCol.findOne({ key: 'announcement_bar' });
    if (!existingAnnouncement) {
      await announcementCol.insertOne({
        key: 'announcement_bar',
        text: '✨ Free Shipping on all orders above ₹999 | Use Code: MORPANKH10 for 10% OFF ✨',
        enabled: true,
        updatedAt: new Date()
      });
      console.log('✅ Initialized announcement_bar');
    }

    // 4. Initialize categories if empty
    const categoriesCol = db.collection('categories');
    const categoriesCount = await categoriesCol.countDocuments();
    if (categoriesCount === 0) {
      const defaultCategories = [
        {
          name: 'Silk Sarees',
          slug: 'silk',
          image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
          productCount: 4,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Paithani Sarees',
          slug: 'paithani',
          image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop',
          productCount: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Cotton Sarees',
          slug: 'cotton',
          image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600&h=800&fit=crop',
          productCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Georgette Sarees',
          slug: 'georgette',
          image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
          productCount: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Linen Sarees',
          slug: 'linen',
          image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&h=800&fit=crop',
          productCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Dresses',
          slug: 'dresses',
          image: 'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600&h=800&fit=crop',
          productCount: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await categoriesCol.insertMany(defaultCategories);
      console.log(`✅ Seeded ${defaultCategories.length} categories`);
    }

    // 5. Initialize products if empty
    const productsCol = db.collection('products');
    const productsCount = await productsCol.countDocuments();
    if (productsCount === 0) {
      const defaultProducts = [
        {
          name: 'Banarasi Silk Saree',
          slug: 'banarasi-silk-saree',
          price: 4999,
          comparePrice: 7999,
          description: 'Exquisite Banarasi silk saree with intricate zari work and traditional motifs. Perfect for weddings and festive occasions.',
          fabric: 'Pure Banarasi Silk with Gold Zari',
          images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop'
          ],
          category: 'silk',
          colors: [
            { colorName: 'Red', stock: 8, images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop'] },
            { colorName: 'Gold', stock: 6, images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop'] },
            { colorName: 'Maroon', stock: 11, images: ['https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600&h=800&fit=crop'] }
          ],
          stock: 25,
          sku: 'BNS-001',
          tags: ['wedding', 'festive', 'silk'],
          featured: true,
          isNew: false,
          isSale: true,
          isPremium: true,
          isTrending: true,
          isLiveSpecial: false,
          rating: 4.8,
          reviews: 124,
          salePercent: 37,
          hidden: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Paithani Saree',
          slug: 'paithani-saree',
          price: 8999,
          comparePrice: 12999,
          description: 'Traditional Paithani saree from Maharashtra with peacock border and rich pallu design.',
          fabric: 'Pure Paithani Silk',
          images: [
            'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600&h=800&fit=crop'
          ],
          category: 'paithani',
          colors: [
            { colorName: 'Purple', stock: 4, images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&h=800&fit=crop'] },
            { colorName: 'Green', stock: 5, images: ['https://images.unsplash.com/photo-1558602912-e3c8294db38?w=600&h=800&fit=crop'] },
            { colorName: 'Yellow', stock: 3, images: ['https://images.unsplash.com/photo-1578662996442-3f5f8558e5a9?w=600&h=800&fit=crop'] }
          ],
          stock: 12,
          sku: 'PTH-001',
          tags: ['traditional', 'maharashtra', 'wedding'],
          featured: true,
          isNew: true,
          isSale: false,
          isPremium: true,
          isTrending: true,
          isLiveSpecial: false,
          rating: 4.9,
          reviews: 89,
          hidden: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Cotton Handloom Saree',
          slug: 'cotton-handloom-saree',
          price: 1499,
          comparePrice: 2499,
          description: 'Comfortable cotton handloom saree perfect for daily wear and casual occasions.',
          fabric: 'Pure Cotton Handloom',
          images: [
            'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop'
          ],
          category: 'cotton',
          colors: [
            { colorName: 'Blue', stock: 20, images: ['https://images.unsplash.com/photo-1578632266217-adb1e80c6786?w=600&h=800&fit=crop'] },
            { colorName: 'White', stock: 15, images: ['https://images.unsplash.com/photo-1549468929-099e3ba8721f?w=600&h=800&fit=crop'] },
            { colorName: 'Green', stock: 15, images: ['https://images.unsplash.com/photo-1558602912-e3c8294db38?w=600&h=800&fit=crop'] }
          ],
          stock: 50,
          sku: 'CTN-001',
          tags: ['daily', 'casual', 'cotton'],
          featured: false,
          isNew: true,
          isSale: true,
          isPremium: false,
          isTrending: false,
          isLiveSpecial: false,
          rating: 4.5,
          reviews: 210,
          salePercent: 40,
          hidden: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Kanjivaram Silk Saree',
          slug: 'kanjivaram-silk-saree',
          price: 12999,
          comparePrice: 18999,
          description: 'Authentic Kanjivaram silk saree with pure silver zari work and temple borders.',
          fabric: 'Pure Mulberry Silk with Zari',
          images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&h=800&fit=crop'
          ],
          category: 'silk',
          colors: [
            { colorName: 'Red', stock: 5, images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop'] },
            { colorName: 'Green', stock: 3, images: ['https://images.unsplash.com/photo-1558602912-e3c8294db38?w=600&h=800&fit=crop'] },
            { colorName: 'Blue', stock: 7, images: ['https://images.unsplash.com/photo-1578632266217-adb1e80c6786?w=600&h=800&fit=crop'] }
          ],
          stock: 15,
          sku: 'KJV-001',
          tags: ['bridal', 'kanjivaram', 'pure silk'],
          featured: true,
          isNew: false,
          isSale: false,
          isPremium: true,
          isTrending: true,
          isLiveSpecial: false,
          rating: 4.9,
          reviews: 67,
          hidden: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Georgette Party Saree',
          slug: 'georgette-party-saree',
          price: 2499,
          comparePrice: 3999,
          description: 'Lightweight georgette saree with sequin work, perfect for evening parties and receptions.',
          fabric: 'Pure Georgette with Sequins',
          images: [
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&h=800&fit=crop'
          ],
          category: 'georgette',
          colors: [
            { colorName: 'Navy', stock: 12, images: ['https://images.unsplash.com/photo-1578632266217-adb1e80c6786?w=600&h=800&fit=crop'] },
            { colorName: 'Pink', stock: 8, images: ['https://images.unsplash.com/photo-1574362403979-ac68b263372b?w=600&h=800&fit=crop'] }
          ],
          stock: 20,
          sku: 'GEO-001',
          tags: ['party', 'evening', 'georgette'],
          featured: false,
          isNew: true,
          isSale: true,
          isPremium: false,
          isTrending: true,
          isLiveSpecial: false,
          rating: 4.6,
          reviews: 145,
          salePercent: 38,
          hidden: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Linen Floral Print Saree',
          slug: 'linen-floral-print-saree',
          price: 1999,
          comparePrice: 2999,
          description: 'Breathable organic linen saree with hand block floral prints. Elegant and sustainable choice.',
          fabric: '100% Organic Linen',
          images: [
            'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=600&h=800&fit=crop'
          ],
          category: 'linen',
          colors: [
            { colorName: 'Beige', stock: 15, images: ['https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&h=800&fit=crop'] },
            { colorName: 'Pastel Green', stock: 10, images: ['https://images.unsplash.com/photo-1558602912-e3c8294db38?w=600&h=800&fit=crop'] }
          ],
          stock: 25,
          sku: 'LIN-001',
          tags: ['organic', 'summer', 'linen'],
          featured: false,
          isNew: true,
          isSale: false,
          isPremium: false,
          isTrending: false,
          isLiveSpecial: false,
          rating: 4.4,
          reviews: 78,
          hidden: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await productsCol.insertMany(defaultProducts);
      console.log(`✅ Seeded ${defaultProducts.length} products`);
    }

    // 6. Ensure Indexes
    try {
      await productsCol.createIndex({ slug: 1 }, { unique: true });
      await productsCol.createIndex({ category: 1 });
      await productsCol.createIndex({ createdAt: -1 });
      await productsCol.createIndex({ featured: 1 });
      console.log('✅ Created indexes on products collection');
    } catch (e) {
      console.log('ℹ️ Products indexes note:', e.message);
    }

    try {
      await categoriesCol.createIndex({ slug: 1 }, { unique: true });
      console.log('✅ Created index on categories collection');
    } catch (e) {
      console.log('ℹ️ Categories index note:', e.message);
    }

    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
      await db.collection('users').createIndex({ referral_code: 1 }, { unique: true, sparse: true });
      console.log('✅ Created index on users collection');
    } catch (e) {
      console.log('ℹ️ Users index note:', e.message);
    }

    try {
      await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true, sparse: true });
      await db.collection('orders').createIndex({ customerEmail: 1 });
      await db.collection('orders').createIndex({ createdAt: -1 });
      console.log('✅ Created index on orders collection');
    } catch (e) {
      console.log('ℹ️ Orders index note:', e.message);
    }

    console.log('\n🎉 ALL MODELS & COLLECTIONS CONNECTED TO DATABASE SUCCESSFULLY!');
    const finalCollections = await db.listCollections().toArray();
    console.log('📦 Collections now in DB:', finalCollections.map(c => c.name).join(', '));
    const pCount = await productsCol.countDocuments();
    const cCount = await categoriesCol.countDocuments();
    console.log(`📊 Products count: ${pCount}, Categories count: ${cCount}`);

  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('❌ Database initialization error:', err);
  process.exit(1);
});
