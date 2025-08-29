import { StorageInterface } from '../StorageInterface';
import { ActivityLogEntry } from '../../interfaces/ActivityLogEntry';
import { DatabaseStorageConfig } from '../DatabaseStorageConfig';

export class MongoDBAdapter implements StorageInterface {
  private config: DatabaseStorageConfig;
  private client: any;
  private collection: any;
  private collectionName: string;

  constructor(config: DatabaseStorageConfig) {
    this.config = config;
    this.collectionName = config.tableName || 'activity_logs';
  }

  async initialize(): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb');
      
      const url = this.config.connection.url || 
        `mongodb://${this.config.connection.host}:${this.config.connection.port}/${this.config.connection.database}`;
      
      this.client = new MongoClient(url, this.config.connection.options);
      await this.client.connect();
      
      const db = this.client.db(this.config.connection.database);
      this.collection = db.collection(this.collectionName);

      if (this.config.createTable) {
        await this.createIndexes();
      }
    } catch (error) {
      throw new Error(`Failed to initialize MongoDB adapter: ${error}`);
    }
  }

  private async createIndexes(): Promise<void> {
    await this.collection.createIndex({ subject_type: 1, subject_id: 1 });
    await this.collection.createIndex({ causer_type: 1, causer_id: 1 });
    await this.collection.createIndex({ event: 1 });
    await this.collection.createIndex({ level: 1 });
    await this.collection.createIndex({ batch_id: 1 });
    await this.collection.createIndex({ created_at: -1 });
  }

  async store(entry: ActivityLogEntry): Promise<void> {
    const document = {
      _id: entry.id,
      name: entry.name,
      description: entry.description,
      level: entry.level,
      event: entry.event,
      subject: entry.subject ? {
        type: entry.subject.type,
        id: entry.subject.id,
        attributes: entry.subject.attributes,
        changes: entry.subject.changes
      } : null,
      causer: entry.causer ? {
        type: entry.causer.type,
        id: entry.causer.id,
        name: entry.causer.name,
        attributes: entry.causer.attributes
      } : null,
      properties: entry.properties,
      batch_id: entry.batchId,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt
    };

    await this.collection.insertOne(document);
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const documents = entries.map(entry => ({
      _id: entry.id,
      name: entry.name,
      description: entry.description,
      level: entry.level,
      event: entry.event,
      subject: entry.subject ? {
        type: entry.subject.type,
        id: entry.subject.id,
        attributes: entry.subject.attributes,
        changes: entry.subject.changes
      } : null,
      causer: entry.causer ? {
        type: entry.causer.type,
        id: entry.causer.id,
        name: entry.causer.name,
        attributes: entry.causer.attributes
      } : null,
      properties: entry.properties,
      batch_id: entry.batchId,
      created_at: entry.createdAt,
      updated_at: entry.updatedAt
    }));

    await this.collection.insertMany(documents);
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    const document = await this.collection.findOne({ _id: id });
    
    if (!document) return null;
    
    return this.mapDocumentToEntry(document);
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
    const query: any = {};

    if (filters?.subjectType) {
      query['subject.type'] = filters.subjectType;
    }

    if (filters?.subjectId) {
      query['subject.id'] = filters.subjectId;
    }

    if (filters?.causerType) {
      query['causer.type'] = filters.causerType;
    }

    if (filters?.causerId) {
      query['causer.id'] = filters.causerId;
    }

    if (filters?.event) {
      query.event = filters.event;
    }

    if (filters?.level) {
      query.level = filters.level;
    }

    if (filters?.batchId) {
      query.batch_id = filters.batchId;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.created_at = {};
      if (filters.fromDate) {
        query.created_at.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.created_at.$lte = filters.toDate;
      }
    }

    const cursor = this.collection.find(query).sort({ created_at: -1 });

    if (filters?.limit) {
      cursor.limit(filters.limit);
    }

    if (filters?.offset) {
      cursor.skip(filters.offset);
    }

    const documents = await cursor.toArray();
    return documents.map((doc: any) => this.mapDocumentToEntry(doc));
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
    const query: any = {};

    // Apply same filters as find method
    if (filters?.subjectType) {
      query['subject.type'] = filters.subjectType;
    }

    if (filters?.subjectId) {
      query['subject.id'] = filters.subjectId;
    }

    if (filters?.causerType) {
      query['causer.type'] = filters.causerType;
    }

    if (filters?.causerId) {
      query['causer.id'] = filters.causerId;
    }

    if (filters?.event) {
      query.event = filters.event;
    }

    if (filters?.level) {
      query.level = filters.level;
    }

    if (filters?.batchId) {
      query.batch_id = filters.batchId;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.created_at = {};
      if (filters.fromDate) {
        query.created_at.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.created_at.$lte = filters.toDate;
      }
    }

    return await this.collection.countDocuments(query);
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
    const query: any = {};

    // Apply same filters as find method
    if (filters?.subjectType) {
      query['subject.type'] = filters.subjectType;
    }

    if (filters?.subjectId) {
      query['subject.id'] = filters.subjectId;
    }

    if (filters?.causerType) {
      query['causer.type'] = filters.causerType;
    }

    if (filters?.causerId) {
      query['causer.id'] = filters.causerId;
    }

    if (filters?.event) {
      query.event = filters.event;
    }

    if (filters?.level) {
      query.level = filters.level;
    }

    if (filters?.batchId) {
      query.batch_id = filters.batchId;
    }

    if (filters?.fromDate || filters?.toDate) {
      query.created_at = {};
      if (filters.fromDate) {
        query.created_at.$gte = filters.fromDate;
      }
      if (filters.toDate) {
        query.created_at.$lte = filters.toDate;
      }
    }

    const result = await this.collection.deleteMany(query);
    return result.deletedCount;
  }

  async clear(): Promise<void> {
    await this.collection.deleteMany({});
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    const totalEntries = await this.collection.countDocuments();

    const oldestResult = await this.collection.findOne({}, { sort: { created_at: 1 } });
    const newestResult = await this.collection.findOne({}, { sort: { created_at: -1 } });

    return {
      totalEntries,
      oldestEntry: oldestResult?.created_at,
      newestEntry: newestResult?.created_at
    };
  }

  private mapDocumentToEntry(doc: any): ActivityLogEntry {
    return {
      id: doc._id,
      name: doc.name,
      description: doc.description,
      level: doc.level,
      event: doc.event,
      subject: doc.subject ? {
        type: doc.subject.type,
        id: doc.subject.id,
        attributes: doc.subject.attributes,
        changes: doc.subject.changes
      } : undefined,
      causer: doc.causer ? {
        type: doc.causer.type,
        id: doc.causer.id,
        name: doc.causer.name,
        attributes: doc.causer.attributes
      } : undefined,
      properties: doc.properties,
      batchId: doc.batch_id,
      createdAt: new Date(doc.created_at),
      updatedAt: new Date(doc.updated_at)
    };
  }
}
