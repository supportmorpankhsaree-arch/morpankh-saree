import { getDatabase } from './database';
import { getFromCache, setCache, deleteCache } from './redis';

export interface WebsiteSettings {
  maintenanceMode: boolean;
  updatedBy?: string;
  updatedAt: string | Date;
}

const SETTINGS_CACHE_KEY = 'settings:website';
const SETTINGS_TTL = 3600; // 1 hour

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  try {
    const cached = await getFromCache<WebsiteSettings>(SETTINGS_CACHE_KEY);
    if (cached !== null) {
      console.log(`[Redis] Cache HIT for key: ${SETTINGS_CACHE_KEY}`);
      return cached;
    }
  } catch (err) {
    console.error(`[Redis] Error checking settings cache:`, err);
  }

  try {
    const db = await getDatabase();
    const collection = db.collection('website_settings');
    const settings = await collection.findOne({});
    let maintenanceMode = false;
    let updatedAt = new Date();

    if (!settings) {
      await collection.insertOne({
        maintenanceMode,
        updatedAt,
      }).catch(() => {});
    } else {
      maintenanceMode = !!settings.maintenanceMode;
      updatedAt = settings.updatedAt instanceof Date ? settings.updatedAt : new Date(settings.updatedAt as string);
    }

    const result: WebsiteSettings = {
      maintenanceMode,
      updatedAt,
    };

    try {
      await setCache(SETTINGS_CACHE_KEY, result, SETTINGS_TTL);
    } catch (err) {
      // Redis optional
    }

    return result;
  } catch (dbErr) {
    console.warn('[Settings] Database not reachable, defaulting to maintenanceMode: false');
    return {
      maintenanceMode: false,
      updatedAt: new Date(),
    };
  }
}

export async function updateWebsiteSettings(maintenanceMode: boolean, updatedBy?: string): Promise<WebsiteSettings> {
  const db = await getDatabase();
  const collection = db.collection('website_settings');
  
  const updatedAt = new Date();
  const updateData: {
    maintenanceMode: boolean;
    updatedAt: Date;
    updatedBy?: string;
  } = {
    maintenanceMode,
    updatedAt,
  };

  if (updatedBy) {
    updateData.updatedBy = updatedBy;
  }

  await collection.updateOne(
    {},
    {
      $set: updateData,
    },
    { upsert: true }
  );

  const result: WebsiteSettings = {
    maintenanceMode,
    updatedBy,
    updatedAt,
  };

  try {
    await deleteCache(SETTINGS_CACHE_KEY);
  } catch (err) {
    console.error(`[Redis] Error invalidating settings cache:`, err);
  }

  return result;
}
