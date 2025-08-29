import { ActivityLogEntry } from '../interfaces/ActivityLogEntry';
import { StorageInterface } from '../storage/StorageInterface';

export class ActivityLogQuery {
  private filters: {
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
  } = {};

  constructor(private storage?: StorageInterface) {}

  /**
   * Filter by subject type
   */
  whereSubjectType(type: string): ActivityLogQuery {
    this.filters.subjectType = type;
    return this;
  }

  /**
   * Filter by subject ID
   */
  whereSubjectId(id: string | number): ActivityLogQuery {
    this.filters.subjectId = id;
    return this;
  }

  /**
   * Filter by causer type
   */
  whereCauserType(type: string): ActivityLogQuery {
    this.filters.causerType = type;
    return this;
  }

  /**
   * Filter by causer ID
   */
  whereCauserId(id: string | number): ActivityLogQuery {
    this.filters.causerId = id;
    return this;
  }

  /**
   * Filter by event
   */
  whereEvent(event: string): ActivityLogQuery {
    this.filters.event = event;
    return this;
  }

  /**
   * Filter by field (generic where)
   */
  where(field: string, value: any): ActivityLogQuery {
    if (field === 'event') {
      this.filters.event = value;
    } else if (field === 'level') {
      this.filters.level = value;
    } else if (field === 'batchId') {
      this.filters.batchId = value;
    } else if (field === 'createdAt') {
      // Handle date comparisons
      if (typeof value === 'string' && value.startsWith('>=')) {
        this.filters.fromDate = new Date(value.substring(3));
      } else if (typeof value === 'string' && value.startsWith('<=')) {
        this.filters.toDate = new Date(value.substring(3));
      }
    }
    return this;
  }

  /**
   * OR where condition
   */
  orWhere(field: string, value: any): ActivityLogQuery {
    // For simplicity, we'll just add to the same filter
    // In a real implementation, you might want to handle OR conditions properly
    return this.where(field, value);
  }

  /**
   * Order by field
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'desc'): ActivityLogQuery {
    // Store ordering preference
    (this.filters as any).orderBy = { field, direction };
    return this;
  }

  /**
   * Filter by level
   */
  whereLevel(level: 'info' | 'warning' | 'error' | 'debug'): ActivityLogQuery {
    this.filters.level = level;
    return this;
  }

  /**
   * Filter by batch ID
   */
  whereBatchId(batchId: string): ActivityLogQuery {
    this.filters.batchId = batchId;
    return this;
  }

  /**
   * Filter by date range
   */
  whereDateRange(fromDate: Date, toDate: Date): ActivityLogQuery {
    this.filters.fromDate = fromDate;
    this.filters.toDate = toDate;
    return this;
  }

  /**
   * Filter by date from
   */
  whereDateFrom(fromDate: Date): ActivityLogQuery {
    this.filters.fromDate = fromDate;
    return this;
  }

  /**
   * Filter by date to
   */
  whereDateTo(toDate: Date): ActivityLogQuery {
    this.filters.toDate = toDate;
    return this;
  }

  /**
   * Set limit
   */
  limit(limit: number): ActivityLogQuery {
    this.filters.limit = limit;
    return this;
  }

  /**
   * Set offset
   */
  offset(offset: number): ActivityLogQuery {
    this.filters.offset = offset;
    return this;
  }

  /**
   * Get filters
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Clear all filters
   */
  clear(): ActivityLogQuery {
    this.filters = {};
    return this;
  }

  /**
   * Apply filters to entries (for in-memory filtering)
   */
  apply(entries: ActivityLogEntry[]): ActivityLogEntry[] {
    let filtered = [...entries];

    if (this.filters.subjectType) {
      filtered = filtered.filter(entry => entry.subject?.type === this.filters.subjectType);
    }

    if (this.filters.subjectId) {
      filtered = filtered.filter(entry => entry.subject?.id === this.filters.subjectId);
    }

    if (this.filters.causerType) {
      filtered = filtered.filter(entry => entry.causer?.type === this.filters.causerType);
    }

    if (this.filters.causerId) {
      filtered = filtered.filter(entry => entry.causer?.id === this.filters.causerId);
    }

    if (this.filters.event) {
      filtered = filtered.filter(entry => entry.event === this.filters.event);
    }

    if (this.filters.level) {
      filtered = filtered.filter(entry => entry.level === this.filters.level);
    }

    if (this.filters.batchId) {
      filtered = filtered.filter(entry => entry.batchId === this.filters.batchId);
    }

    if (this.filters.fromDate) {
      filtered = filtered.filter(entry => entry.createdAt >= this.filters.fromDate!);
    }

    if (this.filters.toDate) {
      filtered = filtered.filter(entry => entry.createdAt <= this.filters.toDate!);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    if (this.filters.offset) {
      filtered = filtered.slice(this.filters.offset);
    }

    if (this.filters.limit) {
      filtered = filtered.slice(0, this.filters.limit);
    }

    return filtered;
  }

  /**
   * Execute query and get results
   */
  async get(): Promise<ActivityLogEntry[]> {
    if (this.storage) {
      return await this.storage.find(this.filters);
    }
    return [];
  }

  /**
   * Count results
   */
  async count(): Promise<number> {
    if (this.storage) {
      return await this.storage.count(this.filters);
    }
    return 0;
  }

  /**
   * Create a new query instance
   */
  static create(): ActivityLogQuery {
    return new ActivityLogQuery();
  }
}
