import { ActivityLogEntry } from '../interfaces/ActivityLogEntry';

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
   * Create a new query instance
   */
  static create(): ActivityLogQuery {
    return new ActivityLogQuery();
  }
}
