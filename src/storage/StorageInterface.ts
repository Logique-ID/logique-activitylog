import { ActivityLogEntry } from '../interfaces/ActivityLogEntry';

export interface StorageInterface {
  /**
   * Initialize the storage
   */
  initialize(): Promise<void>;
  
  /**
   * Store a log entry
   */
  store(entry: ActivityLogEntry): Promise<void>;
  
  /**
   * Store multiple log entries
   */
  storeBatch(entries: ActivityLogEntry[]): Promise<void>;
  
  /**
   * Retrieve a log entry by ID
   */
  findById(id: string): Promise<ActivityLogEntry | null>;
  
  /**
   * Retrieve log entries with filters
   */
  find(filters?: {
    subjectType?: string;
    subjectId?: string | number;
    causerType?: string;
    causerId?: string | number;
    event?: string;
    level?: string;
    batchId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLogEntry[]>;
  
  /**
   * Count log entries with filters
   */
  count(filters?: {
    subjectType?: string;
    subjectId?: string | number;
    causerType?: string;
    causerId?: string | number;
    event?: string;
    level?: string;
    batchId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<number>;
  
  /**
   * Delete log entries with filters
   */
  delete(filters?: {
    subjectType?: string;
    subjectId?: string | number;
    causerType?: string;
    causerId?: string | number;
    event?: string;
    level?: string;
    batchId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<number>;
  
  /**
   * Clear all log entries
   */
  clear(): Promise<void>;
  
  /**
   * Get storage statistics
   */
  getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }>;
}
