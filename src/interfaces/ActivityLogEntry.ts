import { ActivityLogSubject } from './ActivityLogSubject';
import { ActivityLogCauser } from './ActivityLogCauser';
import { ActivityLogProperties } from './ActivityLogProperties';

export interface ActivityLogEntry {
  /**
   * Unique identifier for the log entry
   */
  id: string;
  
  /**
   * Log entry name/description
   */
  name: string;
  
  /**
   * Log entry description
   */
  description?: string | undefined;
  
  /**
   * Log level
   */
  level: 'info' | 'warning' | 'error' | 'debug';
  
  /**
   * Event type (created, updated, deleted, etc.)
   */
  event: string;
  
  /**
   * Subject being logged (the model/entity)
   */
  subject?: ActivityLogSubject | undefined;
  
  /**
   * Causer of the action (user/system)
   */
  causer?: ActivityLogCauser | undefined;
  
  /**
   * Additional properties
   */
  properties?: ActivityLogProperties | undefined;
  
  /**
   * Batch ID for batch logging
   */
  batchId?: string | undefined;
  
  /**
   * Timestamp when the log was created
   */
  createdAt: Date;
  
  /**
   * Timestamp when the log was updated
   */
  updatedAt: Date;
}
