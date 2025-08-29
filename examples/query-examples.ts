import { ActivityLogger, DatabaseStorage, ActivityLogQuery, ActivityLogFormatter } from '../src';

async function queryExamples() {
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

  await logger.init();

  // Create some sample data
  await createSampleData(logger);

  // Example 1: Find all activities for a specific user
  console.log('\n=== User Activities ===');
  const userActivities = await logger.find({
    subjectType: 'user',
    subjectId: 123,
    limit: 10
  });
  console.log(`Found ${userActivities.length} activities for user 123`);

  // Example 2: Find activities by date range
  console.log('\n=== Recent Activities ===');
  const recentActivities = await logger.find({
    fromDate: new Date('2024-01-01'),
    toDate: new Date('2024-12-31'),
    limit: 20
  });
  console.log(`Found ${recentActivities.length} activities in 2024`);

  // Example 3: Find login activities
  console.log('\n=== Login Activities ===');
  const loginActivities = await logger.find({
    event: 'logged_in',
    limit: 10
  });
  console.log(`Found ${loginActivities.length} login activities`);

  // Example 4: Find activities by level
  console.log('\n=== Warning Activities ===');
  const warningActivities = await logger.find({
    level: 'warning',
    limit: 10
  });
  console.log(`Found ${warningActivities.length} warning activities`);

  // Example 5: Find activities caused by specific user
  console.log('\n=== Admin Activities ===');
  const adminActivities = await logger.find({
    causerType: 'user',
    causerId: 999,
    limit: 10
  });
  console.log(`Found ${adminActivities.length} activities caused by admin`);

  // Example 6: Count activities
  console.log('\n=== Activity Counts ===');
  const totalActivities = await logger.count();
  const userCount = await logger.count({ subjectType: 'user' });
  const loginCount = await logger.count({ event: 'logged_in' });
  
  console.log(`Total activities: ${totalActivities}`);
  console.log(`User-related activities: ${userCount}`);
  console.log(`Login activities: ${loginCount}`);

  // Example 7: Using ActivityLogQuery builder
  console.log('\n=== Query Builder ===');
  const query = ActivityLogQuery.create()
    .whereSubjectType('user')
    .whereEvent('created')
    .whereDateFrom(new Date('2024-01-01'))
    .limit(5);

  const queryResults = await logger.find(query.getFilters());
  console.log(`Query builder found ${queryResults.length} results`);

  // Example 8: Format activities
  console.log('\n=== Formatted Activities ===');
  const activities = await logger.find({ limit: 3 });
  
  // Format as text
  const textFormat = ActivityLogFormatter.formatMultiple(activities, 'text');
  console.log('Text format:');
  console.log(textFormat);

  // Format as JSON
  const jsonFormat = ActivityLogFormatter.formatMultiple(activities, 'json');
  console.log('\nJSON format:');
  console.log(jsonFormat);

  // Example 9: Get summary statistics
  console.log('\n=== Summary Statistics ===');
  const allActivities = await logger.find({ limit: 100 });
  const summary = ActivityLogFormatter.getSummary(allActivities);
  
  console.log('Summary:', {
    total: summary.total,
    byLevel: summary.byLevel,
    byEvent: summary.byEvent,
    bySubjectType: summary.bySubjectType,
    byCauserType: summary.byCauserType
  });

  // Example 10: Find specific activity by ID
  console.log('\n=== Find by ID ===');
  if (activities.length > 0) {
    const activityId = activities[0].id;
    const specificActivity = await logger.findById(activityId);
    console.log(`Found activity: ${specificActivity?.name}`);
  }

  // Example 11: Get storage statistics
  console.log('\n=== Storage Statistics ===');
  const stats = await logger.getStats();
  console.log('Storage stats:', {
    totalEntries: stats.totalEntries,
    oldestEntry: stats.oldestEntry,
    newestEntry: stats.newestEntry,
    sizeInBytes: stats.sizeInBytes
  });
}

async function createSampleData(logger: ActivityLogger) {
  // Create some sample users
  for (let i = 1; i <= 5; i++) {
    await logger.created(
      `User ${i} created`,
      {
        type: 'user',
        id: 100 + i,
        attributes: {
          name: `User ${i}`,
          email: `user${i}@example.com`
        }
      },
      {
        causer: {
          type: 'user',
          id: 999,
          name: 'Admin User'
        }
      }
    );

    // Log some logins
    await logger.login({
      type: 'user',
      id: 100 + i,
      name: `User ${i}`
    });

    // Log some updates
    await logger.updated(
      `User ${i} profile updated`,
      {
        type: 'user',
        id: 100 + i,
        changes: {
          before: { status: 'pending' },
          after: { status: 'active' }
        }
      },
      {
        causer: {
          type: 'user',
          id: 999,
          name: 'Admin User'
        }
      }
    );
  }

  // Log some file uploads
  for (let i = 1; i <= 3; i++) {
    await logger.fileUploaded(
      {
        type: 'file',
        id: `file_${i}`,
        attributes: {
          name: `document_${i}.pdf`,
          size: 1024 * 1024 * i
        }
      },
      {
        causer: {
          type: 'user',
          id: 101,
          name: 'User 1'
        }
      }
    );
  }

  // Log some custom events
  await logger.custom(
    'Payment processed',
    'payment_success',
    {
      level: 'info',
      subject: {
        type: 'payment',
        id: 'pay_123',
        attributes: { amount: 100, currency: 'USD' }
      },
      causer: {
        type: 'user',
        id: 101,
        name: 'User 1'
      }
    }
  );

  await logger.custom(
    'System maintenance',
    'maintenance_started',
    {
      level: 'warning',
      causer: {
        type: 'system',
        id: 'cron',
        name: 'Cron Job'
      }
    }
  );
}

// Run example
queryExamples().catch(console.error);
