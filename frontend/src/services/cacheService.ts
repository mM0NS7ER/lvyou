// 缓存服务，处理localStorage缓存操作

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // 过期时间戳(毫秒)
}

class CacheService {
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    if (!this.isLocalStorageAvailable()) return;

    const expiry = new Date().getTime() + ttlMinutes * 60 * 1000;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: new Date().getTime(),
      expiry
    };

    try {
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (e) {
      console.error('LocalStorage缓存设置失败:', e);
      // 如果存储失败，可以尝试清理旧缓存
      this.clearExpiredItems();
    }
  }

  get<T>(key: string): T | null {
    if (!this.isLocalStorageAvailable()) return null;

    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const cacheItem: CacheItem<T> = JSON.parse(itemStr);

      // 检查是否过期
      if (new Date().getTime() > cacheItem.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (e) {
      console.error('LocalStorage缓存获取失败:', e);
      return null;
    }
  }

  remove(key: string): void {
    if (!this.isLocalStorageAvailable()) return;
    localStorage.removeItem(key);
  }

  clearExpiredItems(): void {
    if (!this.isLocalStorageAvailable()) return;

    const now = new Date().getTime();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) continue;

        const cacheItem: CacheItem<any> = JSON.parse(itemStr);
        if (now > cacheItem.expiry) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // 忽略解析错误，可能是非缓存数据
      }
    }
  }
}

export const cacheService = new CacheService();
