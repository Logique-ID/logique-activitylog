const { ActivityLogger, FileStorage } = require('../dist');

async function commonjsQueryExample() {
  console.log('🚀 Starting CommonJS Query Examples...\n');

  try {
    // Initialize File Storage
    console.log('📁 Initializing File Storage...');
    const fileStorage = new FileStorage({
      type: 'json',
      directory: './logs',
      filename: 'commonjs-query-{YYYY}-{MM}-{DD}.log'
    });
    await fileStorage.initialize();
    console.log('✅ File Storage initialized successfully!\n');

    // Create Activity Logger
    const logger = new ActivityLogger({
      storage: fileStorage,
      defaultLevel: 'info',
      enableBatchLogging: false
    });

    // Log sample data
    console.log('📝 Logging sample activities...');
    
    const sampleActivities = [
      {
        name: 'User logged in',
        event: 'logged_in',
        level: 'info',
        causer: { type: 'user', id: 123, name: 'John Doe' },
        properties: { ip: '192.168.1.1', userAgent: 'Chrome' }
      },
      {
        name: 'User logged in',
        event: 'logged_in',
        level: 'info',
        causer: { type: 'user', id: 456, name: 'Jane Smith' },
        properties: { ip: '192.168.1.2', userAgent: 'Firefox' }
      },
      {
        name: 'Product created',
        event: 'created',
        level: 'info',
        subject: { type: 'product', id: 1, attributes: { name: 'Laptop', price: 999 } },
        causer: { type: 'user', id: 123, name: 'John Doe' }
      },
      {
        name: 'Product updated',
        event: 'updated',
        level: 'warning',
        subject: { type: 'product', id: 1, changes: { before: { price: 999 }, after: { price: 899 } } },
        causer: { type: 'user', id: 123, name: 'John Doe' }
      },
      {
        name: 'User deleted',
        event: 'deleted',
        level: 'error',
        subject: { type: 'user', id: 789, attributes: { name: 'Bob Johnson' } },
        causer: { type: 'user', id: 123, name: 'John Doe' }
      },
      {
        name: 'System backup',
        event: 'created',
        level: 'info',
        causer: { type: 'system', id: 'backup_service', name: 'Backup Service' },
        properties: { size: '2.5GB', duration: '15min' }
      }
    ];

    for (const activity of sampleActivities) {
      await logger.log(activity.name, activity);
    }
    console.log('✅ Sample activities logged!\n');

    // Example 1: Basic querying
    console.log('🔍 Example 1: Basic Querying');
    console.log('============================');
    
    const allActivities = await logger.query().get();
    console.log(`📊 Total activities: ${allActivities.length}`);
    
    const recentActivities = await logger.query()
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();
    console.log(`📊 Recent 3 activities: ${recentActivities.length}`);
    console.log('');

    // Example 2: Filtering by event
    console.log('🔍 Example 2: Filtering by Event');
    console.log('================================');
    
    const loginActivities = await logger.query()
      .where('event', 'logged_in')
      .get();
    console.log(`📊 Login activities: ${loginActivities.length}`);
    
    const createActivities = await logger.query()
      .where('event', 'created')
      .get();
    console.log(`📊 Create activities: ${createActivities.length}`);
    console.log('');

    // Example 3: Filtering by level
    console.log('🔍 Example 3: Filtering by Level');
    console.log('================================');
    
    const errorActivities = await logger.query()
      .where('level', 'error')
      .get();
    console.log(`📊 Error activities: ${errorActivities.length}`);
    
    const warningActivities = await logger.query()
      .where('level', 'warning')
      .get();
    console.log(`📊 Warning activities: ${warningActivities.length}`);
    console.log('');

    // Example 4: Complex filtering
    console.log('🔍 Example 4: Complex Filtering');
    console.log('================================');
    
    const userActivities = await logger.query()
      .where('causer.type', 'user')
      .where('level', 'info')
      .orderBy('createdAt', 'desc')
      .get();
    console.log(`📊 User info activities: ${userActivities.length}`);
    
    const systemActivities = await logger.query()
      .where('causer.type', 'system')
      .get();
    console.log(`📊 System activities: ${systemActivities.length}`);
    console.log('');

    // Example 5: Date range filtering
    console.log('🔍 Example 5: Date Range Filtering');
    console.log('==================================');
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const todayActivities = await logger.query()
      .where('createdAt', '>=', yesterday.toISOString())
      .get();
    console.log(`📊 Today's activities: ${todayActivities.length}`);
    console.log('');

    // Example 6: Search in properties
    console.log('🔍 Example 6: Search in Properties');
    console.log('==================================');
    
    const chromeActivities = await logger.query()
      .where('properties.userAgent', 'Chrome')
      .get();
    console.log(`📊 Chrome user activities: ${chromeActivities.length}`);
    console.log('');

    // Example 7: Statistics
    console.log('📈 Example 7: Statistics');
    console.log('========================');
    
    const stats = await logger.getStats();
    console.log('📊 Overall Statistics:', JSON.stringify(stats, null, 2));
    console.log('');

    // Example 8: Group by event
    console.log('🔍 Example 8: Group by Event');
    console.log('============================');
    
    const events = ['logged_in', 'created', 'updated', 'deleted'];
    for (const event of events) {
      const count = await logger.query().where('event', event).count();
      console.log(`📊 ${event} events: ${count}`);
    }
    console.log('');

    console.log('🎉 CommonJS Query Examples completed successfully!');
    console.log('📁 Check the ./logs directory for generated log files.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
commonjsQueryExample().catch(console.error);
