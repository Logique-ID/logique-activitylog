import { StorageInterface } from '../StorageInterface';
import { ActivityLogEntry } from '../../interfaces/ActivityLogEntry';
import { DatabaseStorageConfig } from '../DatabaseStorageConfig';

export class PostgreSQLAdapter implements StorageInterface {
  private config: DatabaseStorageConfig;
  private client: any;
  private tableName: string;

  constructor(config: DatabaseStorageConfig) {
    this.config = config;
    this.tableName = config.tableName || 'activity_logs';
  }

  async initialize(): Promise<void> {
    try {
      const { Client } = await import('pg');
      
      this.client = new Client({
        host: this.config.connection.host,
        port: this.config.connection.port,
        database: this.config.connection.database,
        user: this.config.connection.username,
        password: this.config.connection.password,
        ...this.config.connection.options
      });

      await this.client.connect();

      if (this.config.createTable) {
        await this.createTable();
      }
    } catch (error) {
      throw new Error(`Failed to initialize PostgreSQL adapter: ${error}`);
    }
  }

  private async createTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        level VARCHAR(20) DEFAULT 'info',
        event VARCHAR(255) NOT NULL,
        subject_type VARCHAR(255),
        subject_id VARCHAR(255),
        subject_attributes JSONB,
        subject_changes JSONB,
        causer_type VARCHAR(255),
        causer_id VARCHAR(255),
        causer_name VARCHAR(255),
        causer_attributes JSONB,
        properties JSONB,
        batch_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_activity_logs_subject ON ${this.tableName} (subject_type, subject_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_causer ON ${this.tableName} (causer_type, causer_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_event ON ${this.tableName} (event);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON ${this.tableName} (level);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_batch ON ${this.tableName} (batch_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON ${this.tableName} (created_at);
    `;

    await this.client.query(createTableSQL);
  }

  async store(entry: ActivityLogEntry): Promise<void> {
    const sql = `
      INSERT INTO ${this.tableName} (
        id, name, description, level, event,
        subject_type, subject_id, subject_attributes, subject_changes,
        causer_type, causer_id, causer_name, causer_attributes,
        properties, batch_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `;

    const values = [
      entry.id,
      entry.name,
      entry.description,
      entry.level,
      entry.event,
      entry.subject?.type,
      entry.subject?.id,
      entry.subject?.attributes,
      entry.subject?.changes,
      entry.causer?.type,
      entry.causer?.id,
      entry.causer?.name,
      entry.causer?.attributes,
      entry.properties,
      entry.batchId,
      entry.createdAt,
      entry.updatedAt
    ];

    await this.client.query(sql, values);
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    // PostgreSQL batch insert
    const values = entries.map(entry => [
      entry.id,
      entry.name,
      entry.description,
      entry.level,
      entry.event,
      entry.subject?.type,
      entry.subject?.id,
      entry.subject?.attributes,
      entry.subject?.changes,
      entry.causer?.type,
      entry.causer?.id,
      entry.causer?.name,
      entry.causer?.attributes,
      entry.properties,
      entry.batchId,
      entry.createdAt,
      entry.updatedAt
    ]);

    const sql = `
      INSERT INTO ${this.tableName} (
        id, name, description, level, event,
        subject_type, subject_id, subject_attributes, subject_changes,
        causer_type, causer_id, causer_name, causer_attributes,
        properties, batch_id, created_at, updated_at
      ) VALUES ${values.map((_, i) => `($${i * 17 + 1}, $${i * 17 + 2}, $${i * 17 + 3}, $${i * 17 + 4}, $${i * 17 + 5}, $${i * 17 + 6}, $${i * 17 + 7}, $${i * 17 + 8}, $${i * 17 + 9}, $${i * 17 + 10}, $${i * 17 + 11}, $${i * 17 + 12}, $${i * 17 + 13}, $${i * 17 + 14}, $${i * 17 + 15}, $${i * 17 + 16}, $${i * 17 + 17})`).join(', ')}
    `;

    await this.client.query(sql, values.flat());
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.client.query(sql, [id]);
    
    if (result.rows.length === 0) return null;
    
    return this.mapRowToEntry(result.rows[0]);
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
    let sql = `SELECT * FROM ${this.tableName}`;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (filters?.subjectType) {
      conditions.push(`subject_type = $${++paramCount}`);
      values.push(filters.subjectType);
    }

    if (filters?.subjectId) {
      conditions.push(`subject_id = $${++paramCount}`);
      values.push(filters.subjectId);
    }

    if (filters?.causerType) {
      conditions.push(`causer_type = $${++paramCount}`);
      values.push(filters.causerType);
    }

    if (filters?.causerId) {
      conditions.push(`causer_id = $${++paramCount}`);
      values.push(filters.causerId);
    }

    if (filters?.event) {
      conditions.push(`event = $${++paramCount}`);
      values.push(filters.event);
    }

    if (filters?.level) {
      conditions.push(`level = $${++paramCount}`);
      values.push(filters.level);
    }

    if (filters?.batchId) {
      conditions.push(`batch_id = $${++paramCount}`);
      values.push(filters.batchId);
    }

    if (filters?.fromDate) {
      conditions.push(`created_at >= $${++paramCount}`);
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      conditions.push(`created_at <= $${++paramCount}`);
      values.push(filters.toDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      sql += ` LIMIT $${++paramCount}`;
      values.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ` OFFSET $${++paramCount}`;
      values.push(filters.offset);
    }

    const result = await this.client.query(sql, values);
    return result.rows.map((row: any) => this.mapRowToEntry(row));
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
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Apply same filters as find method
    if (filters?.subjectType) {
      conditions.push(`subject_type = $${++paramCount}`);
      values.push(filters.subjectType);
    }

    if (filters?.subjectId) {
      conditions.push(`subject_id = $${++paramCount}`);
      values.push(filters.subjectId);
    }

    if (filters?.causerType) {
      conditions.push(`causer_type = $${++paramCount}`);
      values.push(filters.causerType);
    }

    if (filters?.causerId) {
      conditions.push(`causer_id = $${++paramCount}`);
      values.push(filters.causerId);
    }

    if (filters?.event) {
      conditions.push(`event = $${++paramCount}`);
      values.push(filters.event);
    }

    if (filters?.level) {
      conditions.push(`level = $${++paramCount}`);
      values.push(filters.level);
    }

    if (filters?.batchId) {
      conditions.push(`batch_id = $${++paramCount}`);
      values.push(filters.batchId);
    }

    if (filters?.fromDate) {
      conditions.push(`created_at >= $${++paramCount}`);
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      conditions.push(`created_at <= $${++paramCount}`);
      values.push(filters.toDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.client.query(sql, values);
    return parseInt(result.rows[0].count);
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
    let sql = `DELETE FROM ${this.tableName}`;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Apply same filters as find method
    if (filters?.subjectType) {
      conditions.push(`subject_type = $${++paramCount}`);
      values.push(filters.subjectType);
    }

    if (filters?.subjectId) {
      conditions.push(`subject_id = $${++paramCount}`);
      values.push(filters.subjectId);
    }

    if (filters?.causerType) {
      conditions.push(`causer_type = $${++paramCount}`);
      values.push(filters.causerType);
    }

    if (filters?.causerId) {
      conditions.push(`causer_id = $${++paramCount}`);
      values.push(filters.causerId);
    }

    if (filters?.event) {
      conditions.push(`event = $${++paramCount}`);
      values.push(filters.event);
    }

    if (filters?.level) {
      conditions.push(`level = $${++paramCount}`);
      values.push(filters.level);
    }

    if (filters?.batchId) {
      conditions.push(`batch_id = $${++paramCount}`);
      values.push(filters.batchId);
    }

    if (filters?.fromDate) {
      conditions.push(`created_at >= $${++paramCount}`);
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      conditions.push(`created_at <= $${++paramCount}`);
      values.push(filters.toDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.client.query(sql, values);
    return result.rowCount;
  }

  async clear(): Promise<void> {
    const sql = `DELETE FROM ${this.tableName}`;
    await this.client.query(sql);
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const countResult = await this.client.query(countSql);

    const dateSql = `
      SELECT 
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM ${this.tableName}
    `;
    const dateResult = await this.client.query(dateSql);

    return {
      totalEntries: parseInt(countResult.rows[0].count),
      oldestEntry: dateResult.rows[0].oldest ? new Date(dateResult.rows[0].oldest) : undefined,
      newestEntry: dateResult.rows[0].newest ? new Date(dateResult.rows[0].newest) : undefined,
      sizeInBytes: undefined
    };
  }

  private mapRowToEntry(row: any): ActivityLogEntry {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      level: row.level,
      event: row.event,
      subject: row.subject_type ? {
        type: row.subject_type,
        id: row.subject_id,
        attributes: row.subject_attributes,
        changes: row.subject_changes
      } : undefined,
      causer: row.causer_type ? {
        type: row.causer_type,
        id: row.causer_id,
        name: row.causer_name,
        attributes: row.causer_attributes
      } : undefined,
      properties: row.properties,
      batchId: row.batch_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
