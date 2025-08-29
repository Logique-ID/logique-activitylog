import { StorageInterface } from '../StorageInterface';
import { ActivityLogEntry } from '../../interfaces/ActivityLogEntry';
import { DatabaseStorageConfig } from '../DatabaseStorageConfig';

export class MySQLAdapter implements StorageInterface {
  private config: DatabaseStorageConfig;
  private connection: any;
  private tableName: string;

  constructor(config: DatabaseStorageConfig) {
    this.config = config;
    this.tableName = config.tableName || 'activity_logs';
  }

  async initialize(): Promise<void> {
    try {
      // Dynamic import untuk mysql2
      const mysql = await import('mysql2/promise');
      
      this.connection = await mysql.createConnection({
        host: this.config.connection.host || 'localhost',
        port: this.config.connection.port || 3306,
        user: this.config.connection.username || 'root',
        password: this.config.connection.password || '',
        database: this.config.connection.database || 'test',
        ...this.config.connection.options
      });

      if (this.config.createTable) {
        await this.createTable();
      }
    } catch (error) {
      throw new Error(`Failed to initialize MySQL adapter: ${error}`);
    }
  }

  private async createTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        level ENUM('debug', 'info', 'warning', 'error') DEFAULT 'info',
        event VARCHAR(255) NOT NULL,
        subject_type VARCHAR(255),
        subject_id VARCHAR(255),
        subject_attributes JSON,
        subject_changes JSON,
        causer_type VARCHAR(255),
        causer_id VARCHAR(255),
        causer_name VARCHAR(255),
        causer_attributes JSON,
        properties JSON,
        batch_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_subject (subject_type, subject_id),
        INDEX idx_causer (causer_type, causer_id),
        INDEX idx_event (event),
        INDEX idx_level (level),
        INDEX idx_batch (batch_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await this.connection.execute(createTableSQL);
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
      entry.createdAt,
      entry.updatedAt
    ];

    await this.connection.execute(sql, values);
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const sql = `
      INSERT INTO ${this.tableName} (
        id, name, description, level, event,
        subject_type, subject_id, subject_attributes, subject_changes,
        causer_type, causer_id, causer_name, causer_attributes,
        properties, batch_id, created_at, updated_at
      ) VALUES ?
    `;

    const values = entries.map(entry => [
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
      entry.createdAt,
      entry.updatedAt
    ]);

    await this.connection.query(sql, [values]);
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const [rows] = await this.connection.execute(sql, [id]);
    
    if (rows.length === 0) return null;
    
    return this.mapRowToEntry(rows[0]);
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
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      conditions.push('created_at <= ?');
      values.push(filters.toDate);
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

    const [rows] = await this.connection.execute(sql, values);
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
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      conditions.push('created_at <= ?');
      values.push(filters.toDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await this.connection.execute(sql, values);
    return rows[0].count;
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
      values.push(filters.fromDate);
    }

    if (filters?.toDate) {
      conditions.push('created_at <= ?');
      values.push(filters.toDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const [result] = await this.connection.execute(sql, values);
    return result.affectedRows;
  }

  async clear(): Promise<void> {
    const sql = `DELETE FROM ${this.tableName}`;
    await this.connection.execute(sql);
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const [countResult] = await this.connection.execute(countSql);

    const dateSql = `
      SELECT 
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM ${this.tableName}
    `;
    const [dateResult] = await this.connection.execute(dateSql);

    const sizeSql = `
      SELECT 
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `;
    const [sizeResult] = await this.connection.execute(sizeSql, [
      this.config.connection.database,
      this.tableName
    ]);

    return {
      totalEntries: countResult[0].count,
      oldestEntry: dateResult[0].oldest ? new Date(dateResult[0].oldest) : undefined,
      newestEntry: dateResult[0].newest ? new Date(dateResult[0].newest) : undefined,
      sizeInBytes: sizeResult[0]?.size_mb ? sizeResult[0].size_mb * 1024 * 1024 : undefined
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
