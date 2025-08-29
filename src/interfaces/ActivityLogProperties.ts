export interface ActivityLogProperties {
  /**
   * Custom properties for the log entry
   */
  [key: string]: any;
  
  /**
   * IP address of the request
   */
  ip?: string;
  
  /**
   * User agent of the request
   */
  userAgent?: string;
  
  /**
   * Request method
   */
  method?: string;
  
  /**
   * Request URL
   */
  url?: string;
  
  /**
   * Request headers
   */
  headers?: Record<string, string>;
  
  /**
   * Request body
   */
  body?: any;
  
  /**
   * Response status
   */
  status?: number;
  
  /**
   * Execution time in milliseconds
   */
  executionTime?: number;
  
  /**
   * Additional context data
   */
  context?: Record<string, any>;
}
