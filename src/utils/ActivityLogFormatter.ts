import { ActivityLogEntry } from '../interfaces/ActivityLogEntry';

export class ActivityLogFormatter {
  /**
   * Format activity log entry to human readable string
   */
  static format(entry: ActivityLogEntry, format: 'text' | 'json' | 'html' = 'text'): string {
    switch (format) {
      case 'json':
        return this.formatJson(entry);
      case 'html':
        return this.formatHtml(entry);
      default:
        return this.formatText(entry);
    }
  }

  /**
   * Format as plain text
   */
  private static formatText(entry: ActivityLogEntry): string {
    const timestamp = entry.createdAt.toISOString();
    const level = entry.level.toUpperCase();
    const subject = entry.subject ? `${entry.subject.type}:${entry.subject.id}` : 'N/A';
    const causer = entry.causer ? `${entry.causer.type}:${entry.causer.id}` : 'N/A';
    
    let text = `[${timestamp}] [${level}] ${entry.event}\n`;
    text += `Name: ${entry.name}\n`;
    
    if (entry.description) {
      text += `Description: ${entry.description}\n`;
    }
    
    text += `Subject: ${subject}\n`;
    text += `Causer: ${causer}\n`;
    
    if (entry.properties && Object.keys(entry.properties).length > 0) {
      text += `Properties: ${JSON.stringify(entry.properties, null, 2)}\n`;
    }
    
    if (entry.batchId) {
      text += `Batch ID: ${entry.batchId}\n`;
    }
    
    return text;
  }

  /**
   * Format as JSON
   */
  private static formatJson(entry: ActivityLogEntry): string {
    return JSON.stringify(entry, null, 2);
  }

  /**
   * Format as HTML
   */
  private static formatHtml(entry: ActivityLogEntry): string {
    const timestamp = entry.createdAt.toISOString();
    const level = entry.level.toUpperCase();
    const levelClass = `level-${entry.level}`;
    const subject = entry.subject ? `${entry.subject.type}:${entry.subject.id}` : 'N/A';
    const causer = entry.causer ? `${entry.causer.type}:${entry.causer.id}` : 'N/A';
    
    let html = `
      <div class="activity-log-entry ${levelClass}">
        <div class="entry-header">
          <span class="timestamp">${timestamp}</span>
          <span class="level">${level}</span>
          <span class="event">${entry.event}</span>
        </div>
        <div class="entry-body">
          <div class="name"><strong>Name:</strong> ${entry.name}</div>
    `;
    
    if (entry.description) {
      html += `<div class="description"><strong>Description:</strong> ${entry.description}</div>`;
    }
    
    html += `
          <div class="subject"><strong>Subject:</strong> ${subject}</div>
          <div class="causer"><strong>Causer:</strong> ${causer}</div>
    `;
    
    if (entry.properties && Object.keys(entry.properties).length > 0) {
      html += `<div class="properties"><strong>Properties:</strong> <pre>${JSON.stringify(entry.properties, null, 2)}</pre></div>`;
    }
    
    if (entry.batchId) {
      html += `<div class="batch-id"><strong>Batch ID:</strong> ${entry.batchId}</div>`;
    }
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Format multiple entries
   */
  static formatMultiple(entries: ActivityLogEntry[], format: 'text' | 'json' | 'html' = 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
      case 'html':
        return `
          <div class="activity-log-entries">
            ${entries.map(entry => this.formatHtml(entry)).join('')}
          </div>
        `;
      default:
        return entries.map(entry => this.formatText(entry)).join('\n---\n');
    }
  }

  /**
   * Get a summary of activity log entries
   */
  static getSummary(entries: ActivityLogEntry[]): {
    total: number;
    byLevel: Record<string, number>;
    byEvent: Record<string, number>;
    bySubjectType: Record<string, number>;
    byCauserType: Record<string, number>;
  } {
    const summary = {
      total: entries.length,
      byLevel: {} as Record<string, number>,
      byEvent: {} as Record<string, number>,
      bySubjectType: {} as Record<string, number>,
      byCauserType: {} as Record<string, number>
    };

    for (const entry of entries) {
      // Count by level
      summary.byLevel[entry.level] = (summary.byLevel[entry.level] || 0) + 1;
      
      // Count by event
      summary.byEvent[entry.event] = (summary.byEvent[entry.event] || 0) + 1;
      
      // Count by subject type
      if (entry.subject?.type) {
        summary.bySubjectType[entry.subject.type] = (summary.bySubjectType[entry.subject.type] || 0) + 1;
      }
      
      // Count by causer type
      if (entry.causer?.type) {
        summary.byCauserType[entry.causer.type] = (summary.byCauserType[entry.causer.type] || 0) + 1;
      }
    }

    return summary;
  }
}
