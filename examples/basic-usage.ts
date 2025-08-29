import { ActivityLogger, DatabaseStorage, FileStorage } from '@logique/activity-log';

async function basicUsage() {
  // Setup dengan MySQL
  const mysqlLogger = new ActivityLogger({
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

  // Setup dengan File Storage
  const fileLogger = new ActivityLogger({
    storage: new FileStorage({
      type: 'json',
      directory: './logs',
      filename: 'activity-{YYYY}-{MM}-{DD}.log',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30
    })
  });

  // Initialize loggers
  await mysqlLogger.init();
  await fileLogger.init();

  // Log user login
  await mysqlLogger.login({
    type: 'user',
    id: 123,
    name: 'John Doe'
  }, {
    properties: {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  // Log user creation
  await mysqlLogger.created(
    'New user registered',
    {
      type: 'user',
      id: 456,
      attributes: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user'
      }
    },
    {
      causer: {
        type: 'system',
        id: 'system',
        name: 'System'
      }
    }
  );

  // Log profile update
  await mysqlLogger.updated(
    'User profile updated',
    {
      type: 'user',
      id: 456,
      changes: {
        before: { name: 'Jane Doe', email: 'jane@example.com' },
        after: { name: 'Jane Smith', email: 'jane.smith@example.com' }
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

  // Log file upload
  await mysqlLogger.fileUploaded(
    {
      type: 'file',
      id: 'file_123',
      attributes: {
        name: 'document.pdf',
        size: 1024000,
        type: 'application/pdf'
      }
    },
    {
      causer: {
        type: 'user',
        id: 456,
        name: 'Jane Smith'
      },
      properties: {
        uploadMethod: 'web',
        fileSize: 1024000
      }
    }
  );

  // Log custom event
  await mysqlLogger.custom(
    'Payment processed',
    'payment_success',
    {
      level: 'info',
      subject: {
        type: 'payment',
        id: 'pay_123456',
        attributes: {
          amount: 100,
          currency: 'USD',
          status: 'completed'
        }
      },
      causer: {
        type: 'user',
        id: 456,
        name: 'Jane Smith'
      },
      properties: {
        gateway: 'stripe',
        transactionId: 'txn_789',
        paymentMethod: 'card'
      }
    }
  );

  // Query activities
  const userActivities = await mysqlLogger.find({
    subjectType: 'user',
    subjectId: 456,
    limit: 10
  });

  console.log('User activities:', userActivities.length);

  // Get statistics
  const stats = await mysqlLogger.getStats();
  console.log('Total activities:', stats.totalEntries);
  console.log('Oldest activity:', stats.oldestEntry);
  console.log('Newest activity:', stats.newestEntry);
}

// Run example
basicUsage().catch(console.error);
