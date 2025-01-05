import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Drop } from '../types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class DropsCache {
  private static instance: DropsCache;
  private cache: Map<string, CacheItem<Drop[]>>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): DropsCache {
    if (!DropsCache.instance) {
      DropsCache.instance = new DropsCache();
    }
    return DropsCache.instance;
  }

  private getCacheKey(userId: string): string {
    return `drops_${userId}`;
  }

  public async getUpcomingDrops(userId: string): Promise<Drop[]> {
    const cacheKey = this.getCacheKey(userId);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    try {
      const drops = await this.fetchUpcomingDrops();
      this.cache.set(cacheKey, {
        data: drops,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION
      });
      return drops;
    } catch (error) {
      console.error('Error fetching drops:', error);
      // If we have expired cache data, return it as fallback
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }

  private async fetchUpcomingDrops(): Promise<Drop[]> {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'drops'),
      where('startTime', '>', now),
      orderBy('startTime'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Drop));
  }

  public clearCache(userId: string): void {
    const cacheKey = this.getCacheKey(userId);
    this.cache.delete(cacheKey);
  }

  public clearAllCache(): void {
    this.cache.clear();
  }
}

export const dropsCache = DropsCache.getInstance();
