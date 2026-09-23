/**
 * Sentinel Bounded Thumbnail Loader Queue
 * Controls network concurrency when 30+ camera tiles mount simultaneously.
 * Prevents HTTP request storms and ingress 429 rate limiting.
 */

export type ThumbnailLoadTask = {
  cameraId: string;
  url: string;
  resolve: (src: string) => void;
  reject: (err: any) => void;
};

export class ThumbnailLoaderQueue {
  private static instance: ThumbnailLoaderQueue;
  private concurrency = 3; // Bounded concurrency: max 3 parallel thumbnail loads
  private activeLoads = 0;
  private queue: ThumbnailLoadTask[] = [];
  private cache = new Map<string, { src: string; timestamp: number }>();
  private inFlight = new Map<string, Promise<string>>();

  public static getInstance(): ThumbnailLoaderQueue {
    if (!ThumbnailLoaderQueue.instance) {
      ThumbnailLoaderQueue.instance = new ThumbnailLoaderQueue();
    }
    return ThumbnailLoaderQueue.instance;
  }

  /**
   * Request a thumbnail with bounded concurrency and caching.
   */
  public async loadThumbnail(cameraId: string, url: string): Promise<string> {
    const normalizedId = cameraId.toLowerCase();

    // Check memory cache (valid for 8 seconds)
    const cached = this.cache.get(normalizedId);
    if (cached && Date.now() - cached.timestamp < 8000) {
      return cached.src;
    }

    // Check in-flight promise deduplication
    const existing = this.inFlight.get(normalizedId);
    if (existing) {
      return existing;
    }

    const promise = new Promise<string>((resolve, reject) => {
      // Remove any stale pending task for the same camera
      this.queue = this.queue.filter(task => task.cameraId !== normalizedId);

      this.queue.push({
        cameraId: normalizedId,
        url,
        resolve: (src) => {
          this.cache.set(normalizedId, { src, timestamp: Date.now() });
          this.inFlight.delete(normalizedId);
          resolve(src);
        },
        reject: (err) => {
          this.inFlight.delete(normalizedId);
          reject(err);
        }
      });

      this.processNext();
    });

    this.inFlight.set(normalizedId, promise);
    return promise;
  }

  private processNext(): void {
    if (this.activeLoads >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeLoads++;

    const img = new Image();
    let isDone = false;

    const cleanup = () => {
      if (!isDone) {
        isDone = true;
        this.activeLoads--;
        // Process next item in queue after brief 30ms yield
        setTimeout(() => this.processNext(), 30);
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      task.reject(new Error(`Thumbnail load timeout for ${task.cameraId}`));
    }, 6000);

    img.onload = () => {
      clearTimeout(timer);
      cleanup();
      task.resolve(task.url);
    };

    img.onerror = (err) => {
      clearTimeout(timer);
      cleanup();
      task.reject(err);
    };

    img.src = task.url;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveLoads(): number {
    return this.activeLoads;
  }
}

export const thumbnailLoaderQueue = ThumbnailLoaderQueue.getInstance();
