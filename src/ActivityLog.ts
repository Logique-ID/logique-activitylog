import { ActivityLogConfig } from './interfaces/ActivityLogConfig';
import { ActivityLogEntry } from './interfaces/ActivityLogEntry';
import { ActivityLogSubject } from './interfaces/ActivityLogSubject';
import { ActivityLogCauser } from './interfaces/ActivityLogCauser';
import { ActivityLogProperties } from './interfaces/ActivityLogProperties';
import { ActivityLogEventType } from './constants/ActivityLogEventType';
import { ActivityLogQuery } from './utils/ActivityLogQuery';

import { v4 as uuidv4 } from 'uuid';

export class ActivityLog {
  private config: ActivityLogConfig;
  private batchId?: string;
  private batchEntries: ActivityLogEntry[] = [];

  constructor(config: ActivityLogConfig) {
    this.config = {
      defaultLevel: 'info',
      enableSubjectTracking: true,
      enableCauserTracking: true,
      maxProperties: 1000,
      enableBatchLogging: false,
      batchSize: 100,
      enableLogRotation: false,
      logRotationInterval: 30,
      ...config
    };
  }

  /**
   * Initialize the activity log
   */
  async initialize(): Promise<void> {
    await this.config.storage.initialize();
  }

  /**
   * Start a new batch for batch logging
   */
  startBatch(): string {
    this.batchId = uuidv4();
    this.batchEntries = [];
    return this.batchId!;
  }

  /**
   * End the current batch and flush all entries
   */
  async endBatch(): Promise<void> {
    if (this.batchId && this.batchEntries.length > 0) {
      await this.config.storage.storeBatch(this.batchEntries);
      this.batchId = undefined as string | undefined;
      this.batchEntries = [];
    }
  }

  /**
   * Log an activity
   */
  async log(options: {
    name: string;
    description?: string;
    level?: 'info' | 'warning' | 'error' | 'debug';
    event?: string;
    subject?: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    const entry: ActivityLogEntry = {
      id: uuidv4(),
      name: options.name,
      description: options.description || undefined,
      level: options.level || this.config.defaultLevel || 'info',
      event: options.event || ActivityLogEventType.CUSTOM,
      subject: options.subject,
      causer: options.causer,
      properties: this.limitProperties(options.properties),
      batchId: this.batchId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (this.config.enableBatchLogging && this.batchId) {
      this.batchEntries.push(entry);
      
      if (this.batchEntries.length >= (this.config.batchSize || 100)) {
        await this.endBatch();
      }
    } else {
      await this.config.storage.store(entry);
    }

    return entry;
  }

  /**
   * Log a created event
   */
  async logCreated(options: {
    name: string;
    description?: string;
    subject: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      ...options,
      event: ActivityLogEventType.CREATED,
      level: 'info'
    });
  }

  /**
   * Log an updated event
   */
  async logUpdated(options: {
    name: string;
    description?: string;
    subject: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      ...options,
      event: ActivityLogEventType.UPDATED,
      level: 'info'
    });
  }

  /**
   * Log a deleted event
   */
  async logDeleted(options: {
    name: string;
    description?: string;
    subject: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      ...options,
      event: ActivityLogEventType.DELETED,
      level: 'warning'
    });
  }

  /**
   * Log a login event
   */
  async logLogin(options: {
    name?: string;
    causer: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      name: options.name || 'User logged in',
      event: ActivityLogEventType.LOGGED_IN,
      level: 'info',
      causer: options.causer,
      properties: options.properties || undefined
    });
  }

  /**
   * Log a logout event
   */
  async logLogout(options: {
    name?: string;
    causer: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      name: options.name || 'User logged out',
      event: ActivityLogEventType.LOGGED_OUT,
      level: 'info',
      causer: options.causer,
      properties: options.properties || undefined
    });
  }

  /**
   * Log a password change event
   */
  async logPasswordChanged(options: {
    name?: string;
    causer: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      name: options.name || 'Password changed',
      event: ActivityLogEventType.PASSWORD_CHANGED,
      level: 'info',
      causer: options.causer,
      properties: options.properties || undefined
    });
  }

  /**
   * Log a file upload event
   */
  async logFileUploaded(options: {
    name?: string;
    subject: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      name: options.name || 'File uploaded',
      event: ActivityLogEventType.FILE_UPLOADED,
      level: 'info',
      subject: options.subject,
      causer: options.causer || undefined,
      properties: options.properties || undefined
    });
  }

  /**
   * Log a file deletion event
   */
  async logFileDeleted(options: {
    name?: string;
    subject: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      name: options.name || 'File deleted',
      event: ActivityLogEventType.FILE_DELETED,
      level: 'warning',
      subject: options.subject,
      causer: options.causer || undefined,
      properties: options.properties || undefined
    });
  }

  /**
   * Log a custom event
   */
  async logCustom(options: {
    name: string;
    description?: string;
    event: string;
    level?: 'info' | 'warning' | 'error' | 'debug';
    subject?: ActivityLogSubject;
    causer?: ActivityLogCauser;
    properties?: ActivityLogProperties;
  }): Promise<ActivityLogEntry> {
    return this.log({
      ...options,
      event: options.event
    });
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
    return await this.config.storage.find(filters);
  }

  /**
   * Find activity log entry by ID
   */
  async findById(id: string): Promise<ActivityLogEntry | null> {
    return await this.config.storage.findById(id);
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
    return await this.config.storage.count(filters);
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
    return await this.config.storage.delete(filters);
  }

  /**
   * Clear all activity log entries
   */
  async clear(): Promise<void> {
    await this.config.storage.clear();
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
    return await this.config.storage.getStats();
  }

  /**
   * Get query builder for complex queries
   */
  query() {
    return new ActivityLogQuery(this.config.storage);
  }

  /**
   * Limit properties to prevent excessive storage usage
   */
  private limitProperties(properties?: ActivityLogProperties): ActivityLogProperties | undefined {
    if (!properties) return undefined;

    const limited: ActivityLogProperties = {};
    const keys = Object.keys(properties);
    const maxKeys = this.config.maxProperties || 1000;

    for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
      const key = keys[i];
      if (key !== undefined) {
        limited[key] = properties[key];
      }
    }

    return limited;
  }
}
