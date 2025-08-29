import { StorageInterface } from '../StorageInterface';
import { ActivityLogEntry } from '../../interfaces/ActivityLogEntry';
import { DatabaseStorageConfig } from '../DatabaseStorageConfig';

export class SQLiteAdapter implements StorageInterface {
  private config: DatabaseStorageConfig;
  private db: any;
  private tableName: string;

  constructor(config: DatabaseStorageConfig) {
    this.config = config;
    this.tableName = config.tableName || 'activity_logs';
  }

  async initialize(): Promise<void> {
    try {
      const sqlite3 = await import('sqlite3');
      const { open } = await import('sqlite');
      
      this.db = await open({
        filename: this.config.connection.database || 'activity_logs.db',
        driver: sqlite3.Database
      });

      if (this.config.createTable) {
        await this.createTable();
      }
    } catch (error) {
      throw new Error(`Failed to initialize SQLite adapter: ${error}`);
    }
  }

  private async createTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        level TEXT DEFAULT 'info',
        event TEXT NOT NULL,
        subject_type TEXT,
        subject_id TEXT,
        subject_attributes TEXT,
        subject_changes TEXT,
        causer_type TEXT,
        causer_id TEXT,
        causer_name TEXT,
        causer_attributes TEXT,
        properties TEXT,
        batch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.db.exec(createTableSQL);

    // Create indexes
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_subject ON ${this.tableName} (subject_type, subject_id)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_causer ON ${this.tableName} (causer_type, causer_id)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_event ON ${this.tableName} (event)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_level ON ${this.tableName} (level)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_batch ON ${this.tableName} (batch_id)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_${this.tableName}_created_at ON ${this.tableName} (created_at)`);
  }

  async store(entry: ActivityLogEntry): Promise<void> {
    const sql = `
      INSERT INTO ${this.tableName} (
        id, name, description, level, event,
        subject_type, subject_id, subject_attributes, subject_changes,
        causer_type, causer_id, causer_name, causer_attributes,
        properties, batch_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      entry.id,
      entry.name,
      entry.description,
      entry.level,
      entry.event,
      entry.subject?.type,
      entry.subject?.id,
      entry.subject?.attributes ? JSON.stringify(entry.subject.attributes) : null,
      entry.subject?.changes ? JSON.stringify(entry.subject.changes) : null,
      entry.causer?.type,
      entry.causer?.id,
      entry.causer?.name,
      entry.causer?.attributes ? JSON.stringify(entry.causer.attributes) : null,
      entry.properties ? JSON.stringify(entry.properties) : null,
      entry.batchId,
      entry.createdAt.toISOString(),
      entry.updatedAt.toISOString()
    ];

    await this.db.run(sql, values);
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    await this.db.run('BEGIN TRANSACTION');

    try {
      for (const entry of entries) {
        await this.store(entry);
      }
      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await this.db.get(sql, [id]);
    
    if (!row) return null;
    
    return this.mapRowToEntry(row);
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

    if (filters?.subjectType) {
      conditions.push('subject_type = ?');
      values.push(filters.subjectType);
    }

    if (filters?.subjectId) {
      conditions.push('subject_id = ?');
      values.push(filters.subjectId);
    }

    if (filters?.causerType) {
      conditions.push('causer_type = ?');
      values.push(filters.causerType);
    }

    if (filters?.causerId) {
      conditions.push('causer_id = ?');
      values.push(filters.causerId);
    }

    if (filters?.event) {
      conditions.push('event = ?');
      values.push(filters.event);
    }

    if (filters?.level) {
      conditions.push('level = ?');
      values.push(filters.level);
    }

    if (filters?.batchId) {
      conditions.push('batch_id = ?');
      values.push(filters.batchId);
    }

    if (filters?.fromDate) {
      conditions.push('created_at >= ?');
      values.push(filters.fromDate.toISOString());
    }

    if (filters?.toDate) {
      conditions.push('created_at <= ?');
      values.push(filters.toDate.toISOString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      values.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ' OFFSET ?';
      values.push(filters.offset);
    }

    const rows = await this.db.all(sql, values);
    return rows.map((row: any) => this.mapRowToEntry(row));
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

    // Apply same filters as find method
    if (filters?.subjectType) {
      conditions.push('subject_type = ?');
      values.push(filters.subjectType);
    }

    if (filters?.subjectId) {
      conditions.push('subject_id = ?');
      values.push(filters.subjectId);
    }

    if (filters?.causerType) {
      conditions.push('causer_type = ?');
      values.push(filters.causerType);
    }

    if (filters?.causerId) {
      conditions.push('causer_id = ?');
      values.push(filters.causerId);
    }

    if (filters?.event) {
      conditions.push('event = ?');
      values.push(filters.event);
    }

    if (filters?.level) {
      conditions.push('level = ?');
      values.push(filters.level);
    }

    if (filters?.batchId) {
      conditions.push('batch_id = ?');
      values.push(filters.batchId);
    }

    if (filters?.fromDate) {
      conditions.push('created_at >= ?');
      values.push(filters.fromDate.toISOString());
    }

    if (filters?.toDate) {
      conditions.push('created_at <= ?');
      values.push(filters.toDate.toISOString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.db.get(sql, values);
    return result.count;
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

    // Apply same filters as find method
    if (filters?.subjectType) {
      conditions.push('subject_type = ?');
      values.push(filters.subjectType);
    }

    if (filters?.subjectId) {
      conditions.push('subject_id = ?');
      values.push(filters.subjectId);
    }

    if (filters?.causerType) {
      conditions.push('causer_type = ?');
      values.push(filters.causerType);
    }

    if (filters?.causerId) {
      conditions.push('causer_id = ?');
      values.push(filters.causerId);
    }

    if (filters?.event) {
      conditions.push('event = ?');
      values.push(filters.event);
    }

    if (filters?.level) {
      conditions.push('level = ?');
      values.push(filters.level);
    }

    if (filters?.batchId) {
      conditions.push('batch_id = ?');
      values.push(filters.batchId);
    }

    if (filters?.fromDate) {
      conditions.push('created_at >= ?');
      values.push(filters.fromDate.toISOString());
    }

    if (filters?.toDate) {
      conditions.push('created_at <= ?');
      values.push(filters.toDate.toISOString());
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.db.run(sql, values);
    return result.changes;
  }

  async clear(): Promise<void> {
    const sql = `DELETE FROM ${this.tableName}`;
    await this.db.run(sql);
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const countResult = await this.db.get(countSql);

    const dateSql = `
      SELECT 
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM ${this.tableName}
    `;
    const dateResult = await this.db.get(dateSql);

    return {
      totalEntries: countResult.count,
      oldestEntry: dateResult.oldest ? new Date(dateResult.oldest) : undefined,
      newestEntry: dateResult.newest ? new Date(dateResult.newest) : undefined
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
        attributes: row.subject_attributes ? JSON.parse(row.subject_attributes) : undefined,
        changes: row.subject_changes ? JSON.parse(row.subject_changes) : undefined
      } : undefined,
      causer: row.causer_type ? {
        type: row.causer_type,
        id: row.causer_id,
        name: row.causer_name,
        attributes: row.causer_attributes ? JSON.parse(row.causer_attributes) : undefined
      } : undefined,
      properties: row.properties ? JSON.parse(row.properties) : undefined,
      batchId: row.batch_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
