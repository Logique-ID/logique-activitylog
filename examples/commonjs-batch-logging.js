const { ActivityLogger, FileStorage } = require('../dist');

async function commonjsBatchExample() {
  console.log('🚀 Starting CommonJS Batch Logging Example...\n');

  try {
    // Initialize File Storage
    console.log('📁 Initializing File Storage...');
    const fileStorage = new FileStorage({
      type: 'json',
      directory: './logs',
      filename: 'commonjs-batch-{YYYY}-{MM}-{DD}.log'
    });
    await fileStorage.initialize();
    console.log('✅ File Storage initialized successfully!\n');

    // Create Activity Logger with batch logging enabled
    const logger = new ActivityLogger({
      storage: fileStorage,
      defaultLevel: 'info',
      enableBatchLogging: true,
      batchSize: 5
    });

    console.log('📦 Starting batch logging (batch size: 5)...\n');

    // Start a batch
    const batchId = await logger.startBatch();
    console.log(`🆔 Batch ID: ${batchId}\n`);

    // Log multiple activities in batch
    const activities = [
      {
        name: 'Product created',
        event: 'created',
        subject: { type: 'product', id: 1, attributes: { name: 'Laptop', price: 999 } },
        causer: { type: 'user', id: 123, name: 'Admin' }
      },
      {
        name: 'Product updated',
        event: 'updated',
        subject: { type: 'product', id: 1, changes: { before: { price: 999 }, after: { price: 899 } } },
        causer: { type: 'user', id: 123, name: 'Admin' }
      },
      {
        name: 'Order placed',
        event: 'created',
        subject: { type: 'order', id: 1001, attributes: { total: 899, items: 1 } },
        causer: { type: 'user', id: 456, name: 'Customer' }
      },
      {
        name: 'Payment processed',
        event: 'created',
        subject: { type: 'payment', id: 2001, attributes: { amount: 899, method: 'credit_card' } },
        causer: { type: 'system', id: 'payment_gateway', name: 'Payment Gateway' }
      },
      {
        name: 'Inventory updated',
        event: 'updated',
        subject: { type: 'inventory', id: 1, changes: { before: { stock: 10 }, after: { stock: 9 } } },
        causer: { type: 'system', id: 'order_system', name: 'Order System' }
      }
    ];

    // Log activities
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      await logger.log(activity.name, activity);
      console.log(`✅ ${activity.name} logged!`);
    }

    // End the batch
    await logger.endBatch();
    console.log('\n🏁 Batch completed!\n');

    // Query batch activities
    console.log('🔍 Querying batch activities...');
    const batchActivities = await logger.query()
      .where('batchId', batchId)
      .orderBy('createdAt', 'asc')
      .get();
    
    console.log(`📊 Found ${batchActivities.length} activities in batch\n`);

    // Get batch statistics
    console.log('📈 Getting batch statistics...');
    const stats = await logger.getStats();
    console.log('📊 Statistics:', JSON.stringify(stats, null, 2));

    console.log('\n🎉 CommonJS Batch Logging Example completed successfully!');
    console.log('📁 Check the ./logs directory for generated log files.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
commonjsBatchExample().catch(console.error);
