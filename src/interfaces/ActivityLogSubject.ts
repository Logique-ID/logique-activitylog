export interface ActivityLogSubject {
  /**
   * Subject type (model name)
   */
  type: string;
  
  /**
   * Subject ID
   */
  id: string | number;
  
  /**
   * Subject attributes (optional)
   */
  attributes?: Record<string, any>;
  
  /**
   * Subject changes (for updates)
   */
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}
