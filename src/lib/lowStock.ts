import { getDatabase } from './database';

export interface LowStockQueryParams {
  search?: string;
  category?: string;
  status?: 'critical' | 'low';
  sortBy?: 'lowest' | 'highest' | 'recent' | 'name';
  page?: number;
  pageSize?: number;
  limit?: number;
}

export async function fetchLowStockProducts(params: LowStockQueryParams = {}) {
  const db = await getDatabase();
  const collection = db.collection('products');

  // Programmatically configure database indexes to optimize low stock queries
  try {
    await collection.createIndex({ sku: 1 });
    await collection.createIndex({ name: 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ stock: 1 });
    await collection.createIndex({ hidden: 1 });
    await collection.createIndex({ updatedAt: -1 });
  } catch (err) {
    console.error('[MongoDB] Index creation error:', err);
  }

  // 1. Build query filters (items below low-stock threshold 5 and visible)
  const query: Record<string, string | number | boolean | object | Array<unknown>> = {
    hidden: { $ne: true },
    stock: { $lte: 5 }
  };

  // Status Filter: Critical (stock <= 2) or Low (3 <= stock <= 5)
  if (params.status === 'critical') {
    query.stock = { $lte: 2 };
  } else if (params.status === 'low') {
    query.stock = { $gte: 3, $lte: 5 };
  }

  // Search Filter: Product name or SKU code
  if (params.search) {
    const regexQuery = { $regex: params.search, $options: 'i' };
    query.$or = [
      { name: regexQuery },
      { sku: regexQuery }
    ];
  }

  // Category Filter
  if (params.category) {
    query.category = params.category;
  }

  // 2. Build sorting criteria (lowest stock first is default, matching requirements)
  let sortCriteria: Record<string, 1 | -1> = { stock: 1, updatedAt: -1 };

  if (params.sortBy === 'highest') {
    sortCriteria = { stock: -1, updatedAt: -1 };
  } else if (params.sortBy === 'recent') {
    sortCriteria = { updatedAt: -1, stock: 1 };
  } else if (params.sortBy === 'name') {
    sortCriteria = { name: 1, stock: 1 };
  } else if (params.sortBy === 'lowest') {
    sortCriteria = { stock: 1, updatedAt: -1 };
  }

  // 3. Count matching entries
  const total = await collection.countDocuments(query);

  // 4. Handle pagination parameters
  const limitValue = params.limit || params.pageSize || 20;
  const pageValue = params.page || 1;
  const skipValue = (pageValue - 1) * limitValue;

  // 5. Query only the necessary fields to satisfy performance guidelines
  const products = await collection
    .find(query)
    .project({
      _id: 1,
      id: 1,
      name: 1,
      sku: 1,
      category: 1,
      stock: 1,
      colors: 1,
      images: 1,
      updatedAt: 1,
      hidden: 1
    })
    .sort(sortCriteria)
    .skip(skipValue)
    .limit(limitValue)
    .toArray();

  const formattedProducts = products.map(p => ({
    ...p,
    id: p.id || p._id.toString(),
    _id: p._id.toString()
  }));

  return {
    products: formattedProducts,
    pagination: {
      total,
      page: pageValue,
      pageSize: limitValue,
      totalPages: Math.ceil(total / limitValue)
    }
  };
}
