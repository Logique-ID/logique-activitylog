export interface ActivityLogCauser {
  /**
   * Causer type (user, system, etc.)
   */
  type: string;
  
  /**
   * Causer ID
   */
  id: string | number;
  
  /**
   * Causer name/identifier
   */
  name?: string;
  
  /**
   * Causer attributes (optional)
   */
  attributes?: Record<string, any>;
}
