import { ActivityLogger, DatabaseStorage } from '@logique/activity-log';

async function batchLoggingExample() {
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
    }),
    enableBatchLogging: true,
    batchSize: 50
  });

  await logger.init();

  // Start batch logging
  const batchId = logger.startBatch();
  console.log('Started batch with ID:', batchId);

  // Log multiple activities in batch
  for (let i = 1; i <= 100; i++) {
    await logger.created(
      `User ${i} created`,
      {
        type: 'user',
        id: i,
        attributes: {
          name: `User ${i}`,
          email: `user${i}@example.com`
        }
      },
      {
        causer: {
          type: 'system',
          id: 'import-process',
          name: 'Import Process'
        }
      }
    );

    // Log some updates
    if (i % 3 === 0) {
      await logger.updated(
        `User ${i} profile updated`,
        {
          type: 'user',
          id: i,
          changes: {
            before: { status: 'pending' },
            after: { status: 'active' }
          }
        },
        {
          causer: {
            type: 'system',
            id: 'auto-activation',
            name: 'Auto Activation Process'
          }
        }
      );
    }
  }

  // End batch (this will flush all remaining entries)
  await logger.endBatch();
  console.log('Batch completed');

  // Find activities from this batch
  const batchActivities = await logger.find({
    batchId: batchId,
    limit: 10
  });

  console.log(`Found ${batchActivities.length} activities in batch`);

  // Get batch statistics
  const batchCount = await logger.count({
    batchId: batchId
  });

  console.log(`Total activities in batch: ${batchCount}`);
}

// Run example
batchLoggingExample().catch(console.error);
