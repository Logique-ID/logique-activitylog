# @logique/activity-log

Package activity logging untuk Node. Mendukung berbagai database (RDBMS dan non-RDBMS) serta file storage.

## Fitur

- ✅ Support multiple database types (MySQL, PostgreSQL, SQLite, MongoDB, Redis)
- ✅ File storage (JSON, CSV, Log format)
- ✅ Batch logging untuk performa tinggi
- ✅ Query dan filtering yang fleksibel
- ✅ Subject dan causer tracking
- ✅ Custom properties dan metadata
- ✅ Log rotation dan compression
- ✅ TypeScript support
- ✅ Comprehensive testing

## Instalasi

```bash
npm install @logique/activity-log
```

### Dependencies (Peer Dependencies)

Package ini menggunakan peer dependencies untuk database drivers. Install sesuai kebutuhan:

```bash
# Untuk MySQL
npm install mysql2

# Untuk PostgreSQL
npm install pg

# Untuk SQLite
npm install sqlite3 sqlite

# Untuk MongoDB
npm install mongodb

# Untuk Redis
npm install redis
```

## Penggunaan

### 1. Setup dengan Database Storage

```typescript
import { ActivityLogger, DatabaseStorage } from '@logique/activity-log';

// Setup dengan MySQL
const logger = new ActivityLogger({
  storage: new DatabaseStorage({
    type: 'mysql',
    connection: {
      host: 'localhost',
      port: 3306,
      database: 'myapp',
      username: 'root',
      password: 'password'
    },
    tableName: 'activity_logs',
    createTable: true
  })
});

// Initialize
await logger.init();
```

### 2. Setup dengan File Storage

```typescript
import { ActivityLogger, FileStorage } from '@logique/activity-log';

const logger = new ActivityLogger({
  storage: new FileStorage({
    type: 'json',
    directory: './logs',
    filename: 'activity-{YYYY}-{MM}-{DD}.log',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 30
  })
});

await logger.init();
```

### 3. Logging Activities

```typescript
// Log user login
await logger.login({
  type: 'user',
  id: 123,
  name: 'John Doe'
}, {
  properties: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
});

// Log created event
await logger.created(
  'User created',
  {
    type: 'user',
    id: 456,
    attributes: { name: 'Jane Doe', email: 'jane@example.com' }
  },
  {
    causer: {
      type: 'user',
      id: 123,
      name: 'Admin User'
    }
  }
);

// Log updated event
await logger.updated(
  'User profile updated',
  {
    type: 'user',
    id: 456,
    changes: {
      before: { name: 'Jane Doe' },
      after: { name: 'Jane Smith' }
    }
  },
  {
    causer: {
      type: 'user',
      id: 456,
      name: 'Jane Doe'
    }
  }
);

// Log deleted event
await logger.deleted(
  'User deleted',
  {
    type: 'user',
    id: 789
  },
  {
    causer: {
      type: 'user',
      id: 123,
      name: 'Admin User'
    }
  }
);

// Log custom event
await logger.custom(
  'Payment processed',
  'payment_success',
  {
    level: 'info',
    subject: {
      type: 'payment',
      id: 'pay_123456',
      attributes: { amount: 100, currency: 'USD' }
    },
    causer: {
      type: 'user',
      id: 456,
      name: 'Jane Doe'
    },
    properties: {
      gateway: 'stripe',
      transactionId: 'txn_789'
    }
  }
);
```

### 4. Query dan Filtering

```typescript
// Find all activities for a specific user
const userActivities = await logger.find({
  subjectType: 'user',
  subjectId: 456,
  limit: 50
});

// Find activities by date range
const recentActivities = await logger.find({
  fromDate: new Date('2024-01-01'),
  toDate: new Date('2024-01-31'),
  limit: 100
});

// Find activities by event type
const loginActivities = await logger.find({
  event: 'logged_in',
  limit: 20
});

// Count activities
const totalActivities = await logger.count({
  subjectType: 'user',
  subjectId: 456
});

// Find specific activity by ID
const activity = await logger.findById('activity-id-123');
```

### 5. Batch Logging

```typescript
// Start batch
const batchId = logger.startBatch();

// Log multiple activities
await logger.created('User 1 created', { type: 'user', id: 1 });
await logger.created('User 2 created', { type: 'user', id: 2 });
await logger.created('User 3 created', { type: 'user', id: 3 });

// End batch (automatically flushes to storage)
await logger.endBatch();
```

### 6. Statistics dan Utilities

```typescript
// Get statistics
const stats = await logger.getStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Oldest entry: ${stats.oldestEntry}`);
console.log(`Newest entry: ${stats.newestEntry}`);

// Format entries
import { ActivityLogFormatter } from '@logique/activity-log';

const entries = await logger.find({ limit: 10 });
const formatted = ActivityLogFormatter.formatMultiple(entries, 'html');

// Get summary
const summary = ActivityLogFormatter.getSummary(entries);
console.log('Summary:', summary);
```

## Konfigurasi Database

### MySQL

```typescript
const mysqlConfig = {
  type: 'mysql' as const,
  connection: {
    host: 'localhost',
    port: 3306,
    database: 'myapp',
    username: 'root',
    password: 'password'
  },
  tableName: 'activity_logs',
  createTable: true
};
```

### PostgreSQL

```typescript
const postgresConfig = {
  type: 'postgresql' as const,
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'password'
  },
  tableName: 'activity_logs',
  createTable: true
};
```

### SQLite

```typescript
const sqliteConfig = {
  type: 'sqlite' as const,
  connection: {
    database: './activity_logs.db'
  },
  tableName: 'activity_logs',
  createTable: true
};
```

### MongoDB

```typescript
const mongoConfig = {
  type: 'mongodb' as const,
  connection: {
    url: 'mongodb://localhost:27017',
    database: 'myapp'
  },
  tableName: 'activity_logs',
  createTable: true
};
```

### Redis

```typescript
const redisConfig = {
  type: 'redis' as const,
  connection: {
    url: 'redis://localhost:6379'
  },
  tableName: 'activity_logs'
};
```

## Konfigurasi File Storage

```typescript
const fileConfig = {
  type: 'json', // 'json', 'csv', 'log'
  directory: './logs',
  filename: 'activity-{YYYY}-{MM}-{DD}.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 30,
  compress: false,
  encoding: 'utf8',
  append: true
};
```

## Event Types

Package ini menyediakan predefined event types:

- `created` - Ketika resource dibuat
- `updated` - Ketika resource diupdate
- `deleted` - Ketika resource dihapus
- `restored` - Ketika resource di-restore
- `logged_in` - Ketika user login
- `logged_out` - Ketika user logout
- `password_changed` - Ketika password berubah
- `email_verified` - Ketika email diverifikasi
- `profile_updated` - Ketika profile diupdate
- `file_uploaded` - Ketika file diupload
- `file_deleted` - Ketika file dihapus
- `exported` - Ketika data diexport
- `imported` - Ketika data diimport
- `backup_created` - Ketika backup dibuat
- `backup_restored` - Ketika backup di-restore
- `custom` - Event custom

## API Reference

### ActivityLogger

#### Methods

- `init()` - Initialize logger
- `log(name, event, options?)` - Log activity
- `created(name, subject, options?)` - Log created event
- `updated(name, subject, options?)` - Log updated event
- `deleted(name, subject, options?)` - Log deleted event
- `login(causer, options?)` - Log login event
- `logout(causer, options?)` - Log logout event
- `passwordChanged(causer, options?)` - Log password change
- `fileUploaded(subject, options?)` - Log file upload
- `fileDeleted(subject, options?)` - Log file deletion
- `custom(name, event, options?)` - Log custom event
- `startBatch()` - Start batch logging
- `endBatch()` - End batch logging
- `find(filters?)` - Find activities
- `findById(id)` - Find activity by ID
- `count(filters?)` - Count activities
- `delete(filters?)` - Delete activities
- `clear()` - Clear all activities
- `getStats()` - Get statistics

### ActivityLogFormatter

#### Methods

- `format(entry, format?)` - Format single entry
- `formatMultiple(entries, format?)` - Format multiple entries
- `getSummary(entries)` - Get summary statistics

### ActivityLogQuery

#### Methods

- `whereSubjectType(type)` - Filter by subject type
- `whereSubjectId(id)` - Filter by subject ID
- `whereCauserType(type)` - Filter by causer type
- `whereCauserId(id)` - Filter by causer ID
- `whereEvent(event)` - Filter by event
- `whereLevel(level)` - Filter by level
- `whereBatchId(batchId)` - Filter by batch ID
- `whereDateRange(from, to)` - Filter by date range
- `whereDateFrom(from)` - Filter by date from
- `whereDateTo(to)` - Filter by date to
- `limit(limit)` - Set limit
- `offset(offset)` - Set offset
- `getFilters()` - Get current filters
- `clear()` - Clear filters
- `apply(entries)` - Apply filters to entries

## Testing

```bash
npm test
npm run test:watch
```

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - lihat file LICENSE untuk detail.

## Support

Untuk support dan pertanyaan, silakan buat issue di GitHub repository.
