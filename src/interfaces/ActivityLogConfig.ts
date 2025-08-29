import { StorageInterface } from '../storage/StorageInterface';

export interface ActivityLogConfig {
  /**
   * Storage implementation to use
   */
  storage: StorageInterface;
  
  /**
   * Default log level
   */
  defaultLevel?: 'info' | 'warning' | 'error' | 'debug';
  
  /**
   * Whether to enable automatic subject tracking
   */
  enableSubjectTracking?: boolean;
  
  /**
   * Whether to enable automatic causer tracking
   */
  enableCauserTracking?: boolean;
  
  /**
   * Maximum number of properties to store
   */
  maxProperties?: number;
  
  /**
   * Whether to enable batch logging
   */
  enableBatchLogging?: boolean;
  
  /**
   * Batch size for batch logging
   */
  batchSize?: number;
  
  /**
   * Whether to enable log rotation
   */
  enableLogRotation?: boolean;
  
  /**
   * Log rotation interval in days
   */
  logRotationInterval?: number;
  
  /**
   * Custom formatter function
   */
  formatter?: (entry: any) => string;
}
