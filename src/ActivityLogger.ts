import { ActivityLog } from './ActivityLog';
import { ActivityLogConfig } from './interfaces/ActivityLogConfig';
import { ActivityLogEntry } from './interfaces/ActivityLogEntry';
import { ActivityLogSubject } from './interfaces/ActivityLogSubject';
import { ActivityLogCauser } from './interfaces/ActivityLogCauser';
import { ActivityLogProperties } from './interfaces/ActivityLogProperties';

export class ActivityLogger {
  private activityLog: ActivityLog;

  constructor(config: ActivityLogConfig) {
    this.activityLog = new ActivityLog(config);
  }

  /**
   * Initialize the logger
   */
  async init(): Promise<void> {
    await this.activityLog.initialize();
  }

  /**
   * Log an activity with simplified interface
   */
  async log(
    name: string,
    event: string,
    options?: {
      description?: string;
      level?: 'info' | 'warning' | 'error' | 'debug';
      subject?: ActivityLogSubject;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.log({
      name,
      event,
      ...options
    });
  }

  /**
   * Log a created event
   */
  async created(
    name: string,
    subject: ActivityLogSubject,
    options?: {
      description?: string;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logCreated({
      name,
      subject,
      ...options
    });
  }

  /**
   * Log an updated event
   */
  async updated(
    name: string,
    subject: ActivityLogSubject,
    options?: {
      description?: string;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logUpdated({
      name,
      subject,
      ...options
    });
  }

  /**
   * Log a deleted event
   */
  async deleted(
    name: string,
    subject: ActivityLogSubject,
    options?: {
      description?: string;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logDeleted({
      name,
      subject,
      ...options
    });
  }

  /**
   * Log a login event
   */
  async login(
    causer: ActivityLogCauser,
    options?: {
      name?: string;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logLogin({
      causer,
      ...options
    });
  }

  /**
   * Log a logout event
   */
  async logout(
    causer: ActivityLogCauser,
    options?: {
      name?: string;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logLogout({
      causer,
      ...options
    });
  }

  /**
   * Log a password change event
   */
  async passwordChanged(
    causer: ActivityLogCauser,
    options?: {
      name?: string;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logPasswordChanged({
      causer,
      ...options
    });
  }

  /**
   * Log a file upload event
   */
  async fileUploaded(
    subject: ActivityLogSubject,
    options?: {
      name?: string;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logFileUploaded({
      subject,
      ...options
    });
  }

  /**
   * Log a file deletion event
   */
  async fileDeleted(
    subject: ActivityLogSubject,
    options?: {
      name?: string;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logFileDeleted({
      subject,
      ...options
    });
  }

  /**
   * Log a custom event
   */
  async custom(
    name: string,
    event: string,
    options?: {
      description?: string;
      level?: 'info' | 'warning' | 'error' | 'debug';
      subject?: ActivityLogSubject;
      causer?: ActivityLogCauser;
      properties?: ActivityLogProperties;
    }
  ): Promise<ActivityLogEntry> {
    return this.activityLog.logCustom({
      name,
      event,
      ...options
    });
  }

  /**
   * Start batch logging
   */
  startBatch(): string {
    return this.activityLog.startBatch();
  }

  /**
   * End batch logging
   */
  async endBatch(): Promise<void> {
    await this.activityLog.endBatch();
  }

  /**
   * Find activity log entries
   */
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
    return this.activityLog.find(filters);
  }

  /**
   * Find activity log entry by ID
   */
  async findById(id: string): Promise<ActivityLogEntry | null> {
    return this.activityLog.findById(id);
  }

  /**
   * Count activity log entries
   */
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
    return this.activityLog.count(filters);
  }

  /**
   * Delete activity log entries
   */
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
    return this.activityLog.delete(filters);
  }

  /**
   * Clear all activity log entries
   */
  async clear(): Promise<void> {
    await this.activityLog.clear();
  }

  /**
   * Get activity log statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    return this.activityLog.getStats();
  }
}
