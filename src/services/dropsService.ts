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
  limit as firestoreLimit,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Drop } from '../types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class DropsService {
  private static instance: DropsService;
  private cache: Map<string, CacheItem<Drop[]>>;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): DropsService {
    if (!DropsService.instance) {
      DropsService.instance = new DropsService();
    }
    return DropsService.instance;
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
    const cacheKey = this.getCacheKey(userId, { page, limit });
    const now = Date.now();

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && now < cached.expiresAt) {
        return cached.data;
      }
    }

    try {
      const drops = await this.fetchUpcomingDrops(userId, page, limit);
      this.cache.set(cacheKey, {
        data: drops,
        timestamp: now,
        expiresAt: now + this.CACHE_DURATION
      });

      // Implement cache size management
      if (this.cache.size > this.MAX_CACHE_SIZE) {
        const oldestKey = Array.from(this.cache.keys())[0];
        this.cache.delete(oldestKey);
      }

      return drops;
    } catch (error) {
      console.error('Error fetching upcoming drops:', error);
      return [];
    }
  }

  private async fetchUpcomingDrops(userId: string, page: number, limit: number): Promise<Drop[]> {
    try {
      const dropsRef = collection(db, 'drops');
      const now = Timestamp.now();
      
      const q = query(
        dropsRef,
        where('userId', '==', userId),
        where('startTime', '>', now),
        orderBy('startTime', 'asc'),
        firestoreLimit(limit),
        startAfter(page * limit)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drop));
    } catch (error) {
      console.error('Error in fetchUpcomingDrops:', error);
      return [];
    }
  }

  public async getDrops(options: { 
    page?: number, 
    limit?: number, 
    forceRefresh?: boolean 
  } = {}): Promise<{ drops: Drop[]; hasMore: boolean }> {
    const { page = 1, limit = 10, forceRefresh = false } = options;
    
    try {
      const drops = await this.getUpcomingDrops('current_user', { page, limit, forceRefresh });
      // Implement hasMore logic based on returned drops
      const hasMore = drops.length === limit;
      
      return { drops, hasMore };
    } catch (error) {
      console.error('Error getting drops:', error);
      return { drops: [], hasMore: false };
    }
  }

  public async createDrop(drop: Omit<Drop, 'id'>): Promise<Drop> {
    try {
      const docRef = await addDoc(collection(db, 'drops'), {
        ...drop,
        createdAt: serverTimestamp()
      });

      // Clear cache to ensure fresh data
      this.clearCache();

      return { id: docRef.id, ...drop };
    } catch (error) {
      console.error('Error creating drop:', error);
      throw error;
    }
  }

  public async getUpcomingDropsForAdmin(maxResults: number = 50): Promise<Drop[]> {
    try {
      const dropsRef = collection(db, 'drops');
      const now = Timestamp.now();
      
      const q = query(
        dropsRef,
        where('startTime', '>', now),
        orderBy('startTime', 'asc'),
        firestoreLimit(maxResults)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drop));
    } catch (error) {
      console.error('Error getting upcoming drops for admin:', error);
      return [];
    }
  }

  public async getPastDropsForMatching(maxResults: number = 50): Promise<Drop[]> {
    try {
      const dropsRef = collection(db, 'drops');
      const now = Timestamp.now();
      
      const q = query(
        dropsRef,
        where('startTime', '<', now),
        orderBy('startTime', 'desc'),
        firestoreLimit(maxResults)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Drop));
    } catch (error) {
      console.error('Error getting past drops for matching:', error);
      return [];
    }
  }

  public async handleDropRegistrationEnd(dropId: string): Promise<boolean> {
    try {
      // Fetch the drop details
      const dropRef = doc(db, 'drops', dropId);
      const dropSnap = await getDoc(dropRef);
      
      if (!dropSnap.exists()) {
        console.error('Drop not found');
        return false;
      }

      // Update drop status to indicate registration has ended
      await updateDoc(dropRef, {
        registrationClosed: true,
        registrationClosedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error handling drop registration end:', error);
      return false;
    }
  }

  public clearCache(userId?: string): void {
    if (userId) {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(userId));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }
}

export const dropsService = DropsService.getInstance();
export default DropsService;
