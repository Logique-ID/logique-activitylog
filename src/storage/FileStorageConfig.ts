export interface FileStorageConfig {
  /**
   * File storage type
   */
  type: 'json' | 'csv' | 'log';
  
  /**
   * Directory path for storing log files
   */
  directory: string;
  
  /**
   * File name pattern (supports date placeholders)
   */
  filename?: string;
  
  /**
   * Maximum file size in bytes before rotation
   */
  maxFileSize?: number;
  
  /**
   * Maximum number of files to keep
   */
  maxFiles?: number;
  
  /**
   * Whether to compress old log files
   */
  compress?: boolean;
  
  /**
   * File encoding
   */
  encoding?: string;
  
  /**
   * Whether to append to existing file or create new one
   */
  append?: boolean;
  
  /**
   * Custom formatter function for file output
   */
  formatter?: (entry: any) => string;
}
