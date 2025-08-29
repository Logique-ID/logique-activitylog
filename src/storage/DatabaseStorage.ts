import { StorageInterface } from './StorageInterface';
import { ActivityLogEntry } from '../interfaces/ActivityLogEntry';
import { DatabaseStorageConfig } from './DatabaseStorageConfig';
import { MySQLAdapter } from './adapters/MySQLAdapter';
import { PostgreSQLAdapter } from './adapters/PostgreSQLAdapter';
import { SQLiteAdapter } from './adapters/SQLiteAdapter';
import { MongoDBAdapter } from './adapters/MongoDBAdapter';
import { RedisAdapter } from './adapters/RedisAdapter';

export class DatabaseStorage implements StorageInterface {
  private adapter: StorageInterface;
  private config: DatabaseStorageConfig;

  constructor(config: DatabaseStorageConfig) {
    this.config = config;
    this.adapter = this.createAdapter();
  }

  private createAdapter(): StorageInterface {
    switch (this.config.type) {
      case 'mysql':
        return new MySQLAdapter(this.config);
      case 'postgresql':
        return new PostgreSQLAdapter(this.config);
      case 'sqlite':
        return new SQLiteAdapter(this.config);
      case 'mongodb':
        return new MongoDBAdapter(this.config);
      case 'redis':
        return new RedisAdapter(this.config);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  async store(entry: ActivityLogEntry): Promise<void> {
    await this.adapter.store(entry);
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    await this.adapter.storeBatch(entries);
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    return await this.adapter.findById(id);
  }

  async find(filters?: {
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
  }): Promise<ActivityLogEntry[]> {
    return await this.adapter.find(filters);
  }

  async count(filters?: {
    subjectType?: string;
    subjectId?: string | number;
    causerType?: string;
    causerId?: string | number;
    event?: string;
    level?: string;
    batchId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<number> {
    return await this.adapter.count(filters);
  }

  async delete(filters?: {
    subjectType?: string;
    subjectId?: string | number;
    causerType?: string;
    causerId?: string | number;
    event?: string;
    level?: string;
    batchId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<number> {
    return await this.adapter.delete(filters);
  }

  async clear(): Promise<void> {
    await this.adapter.clear();
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    return await this.adapter.getStats();
  }
}
