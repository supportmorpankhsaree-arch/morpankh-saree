import { MongoClient } from 'mongodb';

type MongoCache = {
  clientPromises?: Map<string, Promise<MongoClient>>;
};

const globalForMongo = globalThis as typeof globalThis & MongoCache;

// Clean and sanitize MongoDB URI
export function cleanMongoUri(rawUri?: string): string {
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

// Extract database name from MONGODB_URI
export function getDatabaseName(): string {
  const uri = cleanMongoUri(process.env.MONGODB_URI || 'mongodb://localhost:27017/morpankhsaree');
  const lastSegment = uri.split('/').pop() || '';
  const withoutQuery = lastSegment.split('?')[0];
  const dbName = withoutQuery.trim();
  return dbName || 'morpankhsaree';
}

export async function getMongoClient(rawUri?: string) {
  const uri = cleanMongoUri(rawUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/morpankhsaree');
  if (!uri) {
    throw new Error('MONGODB_URI is not configured on the server');
  }

  if (!globalForMongo.clientPromises) {
    globalForMongo.clientPromises = new Map();
  }

  const existing = globalForMongo.clientPromises.get(uri);
  if (existing) {
    return existing;
  }

  const clientPromise = (async () => {
    const client = new MongoClient(uri, {
      // Keep pool small per serverless instance to avoid Atlas connection spikes
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
    });

    await client.connect();
    return client;
  })().catch((error) => {
    globalForMongo.clientPromises?.delete(uri);
    if (error?.message?.includes('tlsv1 alert') || error?.message?.includes('alert number 80')) {
      console.error('❌ [MongoDB Atlas] Connection rejected (TLS alert 80). Please ensure your IP address is whitelisted in MongoDB Atlas Network Access (or allow 0.0.0.0/0) and that your Atlas cluster is active.');
    }
    throw error;
  });

  globalForMongo.clientPromises.set(uri, clientPromise);
  return clientPromise;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(getDatabaseName());
}

