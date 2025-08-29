import { StorageInterface } from './StorageInterface';
import { ActivityLogEntry } from '../interfaces/ActivityLogEntry';
import { FileStorageConfig } from './FileStorageConfig';
import * as fs from 'fs/promises';
import * as path from 'path';


export class FileStorage implements StorageInterface {
  private config: FileStorageConfig;
  private currentFile!: string;
  private currentFileSize: number = 0;
  private buffer: ActivityLogEntry[] = [];
  private bufferSize: number = 0;

  constructor(config: FileStorageConfig) {
    this.config = {
      ...{
        type: 'json',
        directory: './logs',
        filename: 'activity-{YYYY}-{MM}-{DD}.log',
        maxFileSize: 10 * 1024 * 1024, // 10MB default
        maxFiles: 30,
        compress: false,
        encoding: 'utf8',
        append: true,
      },
      ...config
    };
    
    // Initialize current file path
    this.currentFile = this.getCurrentFilePath();
  }

  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.config.directory, { recursive: true });
      
      // Get current file path
      this.currentFile = this.getCurrentFilePath();
      
      // Check if file exists and get its size
      try {
        const stats = await fs.stat(this.currentFile);
        this.currentFileSize = stats.size;
      } catch {
        this.currentFileSize = 0;
      }

      // Initialize buffer
      this.buffer = [];
      this.bufferSize = 0;
    } catch (error) {
      throw new Error(`Failed to initialize file storage: ${error}`);
    }
  }

  private getCurrentFilePath(): string {
    const now = new Date();
    let filename = this.config.filename || 'activity-{YYYY}-{MM}-{DD}.log';
    
    filename = filename
      .replace('{YYYY}', now.getFullYear().toString())
      .replace('{MM}', (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace('{DD}', now.getDate().toString().padStart(2, '0'))
      .replace('{HH}', now.getHours().toString().padStart(2, '0'))
      .replace('{mm}', now.getMinutes().toString().padStart(2, '0'))
      .replace('{ss}', now.getSeconds().toString().padStart(2, '0'));
    
    return path.join(this.config.directory, filename);
  }

  private async rotateFile(): Promise<void> {
    if (this.currentFileSize >= (this.config.maxFileSize || 10 * 1024 * 1024)) {
      const newFile = this.getCurrentFilePath();
      if (newFile !== this.currentFile) {
        this.currentFile = newFile;
        this.currentFileSize = 0;
      }
    }
  }

  private async writeToFile(data: string): Promise<void> {
    await this.rotateFile();
    
    const writeMode = this.config.append && this.currentFileSize === 0 ? 'w' : 'a';
    await fs.writeFile(this.currentFile, data + '\n', { 
      flag: writeMode,
      encoding: this.config.encoding as BufferEncoding 
    });
    
    this.currentFileSize += Buffer.byteLength(data + '\n', this.config.encoding as BufferEncoding);
  }

  async store(entry: ActivityLogEntry): Promise<void> {
    if ((this.config as any).enableBatchLogging) {
      this.buffer.push(entry);
      this.bufferSize += JSON.stringify(entry).length;
      
      if (this.buffer.length >= ((this.config as any).batchSize || 100)) {
        await this.flushBuffer();
      }
    } else {
      await this.writeEntry(entry);
    }
  }

  async storeBatch(entries: ActivityLogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    for (const entry of entries) {
      await this.writeEntry(entry);
    }
  }

  private async writeEntry(entry: ActivityLogEntry): Promise<void> {
    let data: string;
    
    switch (this.config.type) {
      case 'json':
        data = JSON.stringify(entry);
        break;
      case 'csv':
        data = this.entryToCsv(entry);
        break;
      case 'log':
        data = this.entryToLog(entry);
        break;
      default:
        data = JSON.stringify(entry);
    }

    await this.writeToFile(data);
  }

  private entryToCsv(entry: ActivityLogEntry): string {
    const fields = [
      entry.id,
      entry.name,
      entry.description || '',
      entry.level,
      entry.event,
      entry.subject?.type || '',
      entry.subject?.id || '',
      entry.causer?.type || '',
      entry.causer?.id || '',
      entry.causer?.name || '',
      entry.batchId || '',
      entry.createdAt.toISOString(),
      entry.updatedAt.toISOString()
    ];
    
    return fields.map(field => `"${field}"`).join(',');
  }

  private entryToLog(entry: ActivityLogEntry): string {
    const timestamp = entry.createdAt.toISOString();
    const level = entry.level.toUpperCase();
    const subject = entry.subject ? `${entry.subject.type}:${entry.subject.id}` : 'N/A';
    const causer = entry.causer ? `${entry.causer.type}:${entry.causer.id}` : 'N/A';
    
    return `[${timestamp}] [${level}] ${entry.event} - Subject: ${subject} - Causer: ${causer} - ${entry.name}`;
  }

  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;

    const data = this.buffer.map(entry => {
      switch (this.config.type) {
        case 'json':
          return JSON.stringify(entry);
        case 'csv':
          return this.entryToCsv(entry);
        case 'log':
          return this.entryToLog(entry);
        default:
          return JSON.stringify(entry);
      }
    }).join('\n');

    await this.writeToFile(data);
    
    this.buffer = [];
    this.bufferSize = 0;
  }

  async findById(id: string): Promise<ActivityLogEntry | null> {
    const files = await this.getLogFiles();
    
    for (const file of files) {
      const entries = await this.readFile(file);
      const entry = entries.find(e => e.id === id);
      if (entry) return entry;
    }
    
    return null;
  }

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
    const files = await this.getLogFiles();
    let allEntries: ActivityLogEntry[] = [];
    
    for (const file of files) {
      const entries = await this.readFile(file);
      allEntries.push(...entries);
    }
    
    // Apply filters
    allEntries = allEntries.filter(entry => {
      if (filters?.subjectType && entry.subject?.type !== filters.subjectType) return false;
      if (filters?.subjectId && entry.subject?.id !== filters.subjectId) return false;
      if (filters?.causerType && entry.causer?.type !== filters.causerType) return false;
      if (filters?.causerId && entry.causer?.id !== filters.causerId) return false;
      if (filters?.event && entry.event !== filters.event) return false;
      if (filters?.level && entry.level !== filters.level) return false;
      if (filters?.batchId && entry.batchId !== filters.batchId) return false;
      if (filters?.fromDate && entry.createdAt < filters.fromDate) return false;
      if (filters?.toDate && entry.createdAt > filters.toDate) return false;
      return true;
    });
    
    // Sort by creation date (newest first)
    allEntries.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return bTime - aTime;
    });
    
    // Apply pagination
    if (filters?.offset) {
      allEntries = allEntries.slice(filters.offset);
    }
    if (filters?.limit) {
      allEntries = allEntries.slice(0, filters.limit);
    }
    
    return allEntries;
  }

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
    const entries = await this.find(filters);
    return entries.length;
  }

  async delete(_filters?: {
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
    // For file storage, we can't easily delete individual entries
    // This would require rewriting files, which is expensive
    // For now, we'll return 0 to indicate no deletion was performed
    return 0;
  }

  async clear(): Promise<void> {
    const files = await this.getLogFiles();
    for (const file of files) {
      await fs.unlink(file);
    }
  }

  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    sizeInBytes?: number;
  }> {
    const files = await this.getLogFiles();
    let totalEntries = 0;
    let totalSize = 0;
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;
    
    for (const file of files) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
      
      const entries = await this.readFile(file);
      totalEntries += entries.length;
      
      for (const entry of entries) {
        const entryDate = entry.createdAt instanceof Date ? entry.createdAt : new Date(entry.createdAt);
        if (!oldestEntry || entryDate < oldestEntry) {
          oldestEntry = entryDate;
        }
        if (!newestEntry || entryDate > newestEntry) {
          newestEntry = entryDate;
        }
      }
    }
    
    return {
      totalEntries,
      oldestEntry,
      newestEntry,
      sizeInBytes: totalSize
    };
  }

  private async getLogFiles(): Promise<string[]> {
    const files = await fs.readdir(this.config.directory);
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .map(file => path.join(this.config.directory, file))
      .sort()
      .reverse(); // Newest first
    
    if (this.config.maxFiles) {
      return logFiles.slice(0, this.config.maxFiles);
    }
    
    return logFiles;
  }

  private async readFile(filePath: string): Promise<ActivityLogEntry[]> {
    try {
      const content = await fs.readFile(filePath, this.config.encoding as BufferEncoding);
      const lines = content.split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          if (this.config.type === 'json') {
            return JSON.parse(line);
          } else {
            // For CSV and log formats, we can't easily reconstruct the full object
            // This is a limitation of file storage
            return null;
          }
        } catch {
          return null;
        }
      }).filter(entry => entry !== null) as ActivityLogEntry[];
    } catch {
      return [];
    }
  }
}
