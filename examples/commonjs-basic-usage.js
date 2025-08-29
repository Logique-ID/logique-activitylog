const { ActivityLogger, FileStorage } = require('../dist');

async function commonjsBasicExample() {
  console.log('🚀 Starting CommonJS Basic Example...\n');

  try {
    // Initialize File Storage
    console.log('📁 Initializing File Storage...');
    const fileStorage = new FileStorage({
      type: 'json',
      directory: './logs',
      filename: 'commonjs-{YYYY}-{MM}-{DD}.log'
    });
    await fileStorage.initialize();
    console.log('✅ File Storage initialized successfully!\n');

    // Create Activity Logger
    const logger = new ActivityLogger({
      storage: fileStorage,
      defaultLevel: 'info',
      enableBatchLogging: false
    });

    // Log some activities
    console.log('👤 Logging user activities...');
    
    await logger.log('User logged in', {
      event: 'logged_in',
      causer: {
        type: 'user',
        id: 123,
        name: 'John Doe'
      },
      properties: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ User login logged!');

    await logger.log('New user registered', {
      event: 'created',
      subject: {
        type: 'user',
        id: 456,
        attributes: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'user'
        }
      },
      causer: {
        type: 'system',
        id: 'system',
        name: 'System'
      }
    });
    console.log('✅ User creation logged!');

    await logger.log('User profile updated', {
      event: 'updated',
      subject: {
        type: 'user',
        id: 456,
        changes: {
          before: {
            name: 'Jane Doe',
            email: 'jane@example.com'
          },
          after: {
            name: 'Jane Smith',
            email: 'jane.smith@example.com'
          }
        }
      },
      causer: {
        type: 'user',
        id: 456,
        name: 'Jane Doe'
      }
    });
    console.log('✅ Profile update logged!\n');

    // Query activities
    console.log('🔍 Querying activities...');
    const activities = await logger.query()
      .where('event', 'logged_in')
      .orWhere('event', 'created')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`📊 Found ${activities.length} activities\n`);

    // Get statistics
    console.log('📈 Getting statistics...');
    const stats = await logger.getStats();
    console.log('📊 Statistics:', JSON.stringify(stats, null, 2));

    console.log('\n🎉 CommonJS Basic Example completed successfully!');
    console.log('📁 Check the ./logs directory for generated log files.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
commonjsBasicExample().catch(console.error);
