export interface DatabaseStorageConfig {
  /**
   * Database type
   */
  type: 'mysql' | 'postgresql' | 'sqlite' | 'mongodb' | 'redis';
  
  /**
   * Database connection configuration
   */
  connection: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    url?: string;
    options?: Record<string, any>;
  };
  
  /**
   * Table/collection name for activity logs
   */
  tableName?: string;
  
  /**
   * Whether to create table/collection if it doesn't exist
   */
  createTable?: boolean;
  
  /**
   * Additional table/collection options
   */
  tableOptions?: Record<string, any>;
  
  /**
   * Connection pool configuration
   */
  pool?: {
    min?: number;
    max?: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    reapIntervalMillis?: number;
    createRetryIntervalMillis?: number;
  };
}
