import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp, 
  addDoc, 
  serverTimestamp, 
  startAfter,
  limit as firestoreLimit  // Rename to avoid conflict
} from 'firebase/firestore';
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
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): DropsCache {
    if (!DropsCache.instance) {
      DropsCache.instance = new DropsCache();
    }
    return DropsCache.instance;
  }

  private getCacheKey(userId: string, options?: { page?: number, limit?: number }): string {
    const pageKey = options?.page || 1;
    const limitKey = options?.limit || 10;
    return `drops_${userId}_page${pageKey}_limit${limitKey}`;
  }

  public async getUpcomingDrops(
    userId: string, 
    options: { page?: number, limit?: number, forceRefresh?: boolean } = {}
  ): Promise<Drop[]> {
    const { page = 1, limit = 10, forceRefresh = false } = options;

    if (!forceRefresh) {
      const cacheKey = this.getCacheKey(userId, { page, limit });
      const cachedData = this.cache.get(cacheKey);

      if (cachedData && cachedData.expiresAt > Date.now()) {
        return cachedData.data;
      }
    }

    const drops = await this.fetchUpcomingDrops(page, limit);

    const cacheKey = this.getCacheKey(userId, { page, limit });
    this.cache.set(cacheKey, {
      data: drops,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    });

    // Maintain cache size limit
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    return drops;
  }

  private async fetchUpcomingDrops(page: number = 1, limit: number = 10): Promise<Drop[]> {
    const currentTime = new Date();
    const oneMonthFromNow = new Date(currentTime.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dropsRef = collection(db, 'drops');
    const q = query(
      dropsRef, 
      where('startTime', '>=', Timestamp.fromDate(currentTime)),
      where('startTime', '<=', Timestamp.fromDate(oneMonthFromNow)),
      orderBy('startTime', 'asc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Drop));
  }

  async createDrop(drop: Omit<Drop, 'id'>): Promise<Drop> {
    const dropsRef = collection(db, 'drops');
    const docRef = await addDoc(dropsRef, {
      ...drop,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      id: docRef.id,
      ...drop
    } as Drop;
  }

  clearCache(userId: string): void {
    const cacheKey = this.getCacheKey(userId);
    this.cache.delete(cacheKey);
  }

  clearAllCache(): void {
    this.cache.clear();
  }
}

class DropsService {
  private static instance: DropsService;
  private cache: DropsCache;

  private constructor() {
    this.cache = DropsCache.getInstance();
  }

  public static getInstance(): DropsService {
    if (!DropsService.instance) {
      DropsService.instance = new DropsService();
    }
    return DropsService.instance;
  }

  async getDrops(options: {
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
  } = {}): Promise<{ drops: Drop[]; hasMore: boolean }> {
    const { page = 1, limit = 10, forceRefresh = false } = options;
    const drops = await this.cache.getUpcomingDrops('admin', { page, limit, forceRefresh });
    return {
      drops,
      hasMore: drops.length === limit
    };
  }

  async getUpcomingDrops(
    userId: string, 
    page: number = 1, 
    forceRefresh: boolean = false
  ): Promise<{ drops: Drop[]; hasMore: boolean }> {
    const limit = 10;
    const drops = await this.cache.getUpcomingDrops(userId, { page, limit, forceRefresh });
    return {
      drops,
      hasMore: drops.length === limit
    };
  }

  async createDrop(drop: Omit<Drop, 'id'>): Promise<Drop> {
    return this.cache.createDrop(drop);
  }

  async getUpcomingDropsForAdmin(maxResults: number = 50): Promise<Drop[]> {
    const currentTime = new Date();
    const dropsRef = collection(db, 'drops');
    const q = query(
      dropsRef,
      where('startTime', '>=', Timestamp.fromDate(currentTime)),
      orderBy('startTime', 'asc'),
      firestoreLimit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Drop));
  }

  async getPastDropsForMatching(maxResults: number = 50): Promise<Drop[]> {
    const currentTime = new Date();
    const dropsRef = collection(db, 'drops');
    const q = query(
      dropsRef,
      where('startTime', '<', Timestamp.fromDate(currentTime)),
      orderBy('startTime', 'desc'),
      firestoreLimit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Drop));
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.clearCache(userId);
    } else {
      this.cache.clearAllCache();
    }
  }
}

export const dropsService = DropsService.getInstance();
export const dropsCache = DropsCache.getInstance();
export default DropsService;
