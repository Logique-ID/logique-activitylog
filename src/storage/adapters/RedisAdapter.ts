import { StorageInterface } from '../StorageInterface';
import { ActivityLogEntry } from '../../interfaces/ActivityLogEntry';
import { DatabaseStorageConfig } from '../DatabaseStorageConfig';

export class RedisAdapter implements StorageInterface {
  private config: DatabaseStorageConfig;
  private client: any;
  private keyPrefix: string;

  constructor(config: DatabaseStorageConfig) {
    this.config = config;
    this.keyPrefix = config.tableName || 'activity_logs';
  }

  async initialize(): Promise<void> {
    try {
      const { createClient } = await import('redis');
      
      this.client = createClient({
        url: this.config.connection.url || 
          `redis://${this.config.connection.host}:${this.config.connection.port}`,
        ...this.config.connection.options
      });

      await this.client.connect();
    } catch (error) {
      throw new Error(`Failed to initialize Redis adapter: ${error}`);
    }
  }

  async store(entry: ActivityLogEntry): Promise<void> {
    const key = `${this.keyPrefix}:${entry.id}`;
    const data = JSON.stringify({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      level: entry.level,
      event: entry.event,
      subject: entry.subject,
      causer: entry.causer,
      properties: entry.properties,
      batch_id: entry.batchId,
      created_at: entry.createdAt.toISOString(),
      updated_at: entry.updatedAt.toISOString()
    });

    await this.client.set(key, data);
    
    // Add to sorted set for time-based queries
    await this.client.zAdd(`${this.keyPrefix}:timeline`, {
      score: entry.createdAt.getTime(),
      value: entry.id
    });

    // Add to sets for filtering
    if (entry.subject?.type) {
      await this.client.sAdd(`${this.keyPrefix}:subject_type:${entry.subject.type}`, entry.id);
    }
    if (entry.subject?.id) {
      await this.client.sAdd(`${this.keyPrefix}:subject_id:${entry.subject.id}`, entry.id);
    }
    if (entry.causer?.type) {
      await this.client.sAdd(`${this.keyPrefix}:causer_type:${entry.causer.type}`, entry.id);
    }
    if (entry.causer?.id) {
      await this.client.sAdd(`${this.keyPrefix}:causer_id:${entry.causer.id}`, entry.id);
    }
    if (entry.event) {
      await this.client.sAdd(`${this.keyPrefix}:event:${entry.event}`, entry.id);
    }
    if (entry.level) {
      await this.client.sAdd(`${this.keyPrefix}:level:${entry.level}`, entry.id);
    }
    if (entry.batchId) {
      await this.client.sAdd(`${this.keyPrefix}:batch:${entry.batchId}`, entry.id);
    }
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const pipeline = this.client.multi();

    for (const entry of entries) {
      const key = `${this.keyPrefix}:${entry.id}`;
      const data = JSON.stringify({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        level: entry.level,
        event: entry.event,
        subject: entry.subject,
        causer: entry.causer,
        properties: entry.properties,
        batch_id: entry.batchId,
        created_at: entry.createdAt.toISOString(),
        updated_at: entry.updatedAt.toISOString()
      });

      pipeline.set(key, data);
      pipeline.zAdd(`${this.keyPrefix}:timeline`, {
        score: entry.createdAt.getTime(),
        value: entry.id
      });

      if (entry.subject?.type) {
        pipeline.sAdd(`${this.keyPrefix}:subject_type:${entry.subject.type}`, entry.id);
      }
      if (entry.subject?.id) {
        pipeline.sAdd(`${this.keyPrefix}:subject_id:${entry.subject.id}`, entry.id);
      }
      if (entry.causer?.type) {
        pipeline.sAdd(`${this.keyPrefix}:causer_type:${entry.causer.type}`, entry.id);
      }
      if (entry.causer?.id) {
        pipeline.sAdd(`${this.keyPrefix}:causer_id:${entry.causer.id}`, entry.id);
      }
      if (entry.event) {
        pipeline.sAdd(`${this.keyPrefix}:event:${entry.event}`, entry.id);
      }
      if (entry.level) {
        pipeline.sAdd(`${this.keyPrefix}:level:${entry.level}`, entry.id);
      }
      if (entry.batchId) {
        pipeline.sAdd(`${this.keyPrefix}:batch:${entry.batchId}`, entry.id);
      }
    }

    await pipeline.exec();
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    const key = `${this.keyPrefix}:${id}`;
    const data = await this.client.get(key);
    
    if (!data) return null;
    
    return this.mapDataToEntry(JSON.parse(data));
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
    // Build intersection of sets based on filters
    const setKeys: string[] = [];
    
    if (filters?.subjectType) {
      setKeys.push(`${this.keyPrefix}:subject_type:${filters.subjectType}`);
    }
    if (filters?.subjectId) {
      setKeys.push(`${this.keyPrefix}:subject_id:${filters.subjectId}`);
    }
    if (filters?.causerType) {
      setKeys.push(`${this.keyPrefix}:causer_type:${filters.causerType}`);
    }
    if (filters?.causerId) {
      setKeys.push(`${this.keyPrefix}:causer_id:${filters.causerId}`);
    }
    if (filters?.event) {
      setKeys.push(`${this.keyPrefix}:event:${filters.event}`);
    }
    if (filters?.level) {
      setKeys.push(`${this.keyPrefix}:level:${filters.level}`);
    }
    if (filters?.batchId) {
      setKeys.push(`${this.keyPrefix}:batch:${filters.batchId}`);
    }

    let ids: string[] = [];
    
    if (setKeys.length > 0) {
      ids = await this.client.sInter(setKeys);
    } else {
      // If no filters, get all IDs from timeline
      const timelineIds = await this.client.zRange(`${this.keyPrefix}:timeline`, 0, -1);
      ids = timelineIds.map((id: any) => id.toString());
    }

    // Apply date filters if specified
    if (filters?.fromDate || filters?.toDate) {
      const minScore = filters.fromDate ? filters.fromDate.getTime() : '-inf';
      const maxScore = filters.toDate ? filters.toDate.getTime() : '+inf';
      
      const timelineIds = await this.client.zRangeByScore(
        `${this.keyPrefix}:timeline`,
        minScore,
        maxScore
      );
      
      const timelineIdSet = new Set(timelineIds.map((id: any) => id.toString()));
      ids = ids.filter(id => timelineIdSet.has(id));
    }

    // Apply pagination
    if (filters?.offset) {
      ids = ids.slice(filters.offset);
    }
    if (filters?.limit) {
      ids = ids.slice(0, filters.limit);
    }

    // Fetch actual data
    const entries: ActivityLogEntry[] = [];
    for (const id of ids) {
      const entry = await this.findById(id);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    const entries = await this.find(filters);
    return entries.length;
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
    const entries = await this.find(filters);
    const deletedCount = entries.length;

    const pipeline = this.client.multi();

    for (const entry of entries) {
      const key = `${this.keyPrefix}:${entry.id}`;
      pipeline.del(key);
      pipeline.zRem(`${this.keyPrefix}:timeline`, entry.id);

      if (entry.subject?.type) {
        pipeline.sRem(`${this.keyPrefix}:subject_type:${entry.subject.type}`, entry.id);
      }
      if (entry.subject?.id) {
        pipeline.sRem(`${this.keyPrefix}:subject_id:${entry.subject.id}`, entry.id);
      }
      if (entry.causer?.type) {
        pipeline.sRem(`${this.keyPrefix}:causer_type:${entry.causer.type}`, entry.id);
      }
      if (entry.causer?.id) {
        pipeline.sRem(`${this.keyPrefix}:causer_id:${entry.causer.id}`, entry.id);
      }
      if (entry.event) {
        pipeline.sRem(`${this.keyPrefix}:event:${entry.event}`, entry.id);
      }
      if (entry.level) {
        pipeline.sRem(`${this.keyPrefix}:level:${entry.level}`, entry.id);
      }
      if (entry.batchId) {
        pipeline.sRem(`${this.keyPrefix}:batch:${entry.batchId}`, entry.id);
      }
    }

    await pipeline.exec();
    return deletedCount;
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys(`${this.keyPrefix}:*`);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    const totalEntries = await this.client.zCard(`${this.keyPrefix}:timeline`);
    
    const oldestResult = await this.client.zRange(`${this.keyPrefix}:timeline`, 0, 0, { WITHSCORES: true });
    const newestResult = await this.client.zRange(`${this.keyPrefix}:timeline`, -1, -1, { WITHSCORES: true });

    return {
      totalEntries,
      oldestEntry: oldestResult.length > 0 ? new Date(parseInt(oldestResult[1])) : undefined,
      newestEntry: newestResult.length > 0 ? new Date(parseInt(newestResult[1])) : undefined
    };
  }

  private mapDataToEntry(data: any): ActivityLogEntry {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      level: data.level,
      event: data.event,
      subject: data.subject,
      causer: data.causer,
      properties: data.properties,
      batchId: data.batch_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
