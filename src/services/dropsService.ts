import { collection, query, where, orderBy, limit, getDocs, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
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
  private drops: Drop[] = [];
  private lastFetch: Date | null = null;
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes

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

  public async createDrop(drop: Omit<Drop, 'id'>): Promise<Drop> {
    const dropWithTimestamp = {
      ...drop,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: [],
      currentParticipants: 0,
    };

    const docRef = await addDoc(collection(db, 'drops'), dropWithTimestamp);
    const newDrop = { ...dropWithTimestamp, id: docRef.id } as Drop;
    
    // Update cache with new drop
    const cacheKeys = Array.from(this.cache.keys());
    cacheKeys.forEach(key => {
      const cached = this.cache.get(key);
      if (cached) {
        const updatedDrops = [...cached.data, newDrop].sort(
          (a, b) => a.startTime.toMillis() - b.startTime.toMillis()
        );
        this.cache.set(key, {
          ...cached,
          data: updatedDrops
        });
      }
    });

    return newDrop;
  }

  public async getDrops(): Promise<Drop[]> {
    if (this.shouldRefreshCache()) {
      await this.refreshCache();
    }
    return this.drops;
  }

  private shouldRefreshCache(): boolean {
    if (!this.lastFetch) return true;
    const now = new Date();
    return now.getTime() - this.lastFetch.getTime() > this.cacheDuration;
  }

  private async refreshCache(): Promise<void> {
    try {
      const now = Timestamp.now();
      const dropsRef = collection(db, 'drops');
      const q = query(dropsRef, where('startTime', '>', now));
      const querySnapshot = await getDocs(q);
      
      this.drops = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drop));
      
      this.lastFetch = new Date();
    } catch (error) {
      console.error('Error refreshing drops cache:', error);
      throw error;
    }
  }

  public clearCache(userId: string): void {
    const cacheKey = this.getCacheKey(userId);
    this.cache.delete(cacheKey);
  }

  public clearAllCache(): void {
    this.cache.clear();
  }

  public async clearDropsCache(): Promise<void> {
    this.drops = [];
    this.lastFetch = null;
  }
}

export const dropsCache = DropsCache.getInstance();
