import { ActivityLogger, FileStorage } from '../src';

async function fileStorageExample() {
  console.log('🚀 Starting File Storage Example...\n');

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

  try {
    // Initialize logger
    console.log('📁 Initializing File Storage...');
    await fileLogger.init();
    console.log('✅ File Storage initialized successfully!\n');

    // Log user login
    console.log('👤 Logging user login...');
    await fileLogger.login({
      type: 'user',
      id: 123,
      name: 'John Doe'
    }, {
      properties: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ User login logged!\n');

    // Log user creation
    console.log('➕ Logging user creation...');
    await fileLogger.created(
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
    console.log('✅ User creation logged!\n');

    // Log profile update
    console.log('✏️ Logging profile update...');
    await fileLogger.updated(
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
    console.log('✅ Profile update logged!\n');

    // Log file upload
    console.log('📁 Logging file upload...');
    await fileLogger.fileUploaded(
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
        }
      }
    );
    console.log('✅ File upload logged!\n');

    // Log user deletion
    console.log('🗑️ Logging user deletion...');
    await fileLogger.deleted(
      'User account deleted',
      {
        type: 'user',
        id: 789,
        attributes: {
          name: 'Bob Johnson',
          email: 'bob@example.com'
        }
      },
      {
        causer: {
          type: 'admin',
          id: 1,
          name: 'Admin User'
        }
      }
    );
    console.log('✅ User deletion logged!\n');

    // Query activities
    console.log('🔍 Querying activities...');
    const activities = await fileLogger.find({
      limit: 10,
      offset: 0
    });
    console.log(`📊 Found ${activities.length} activities\n`);

    // Get statistics
    console.log('📈 Getting statistics...');
    const stats = await fileLogger.getStats();
    console.log('📊 Statistics:', {
      totalEntries: stats.totalEntries,
      oldestEntry: stats.oldestEntry?.toISOString(),
      newestEntry: stats.newestEntry?.toISOString(),
      sizeInBytes: stats.sizeInBytes
    });

    console.log('\n🎉 File Storage Example completed successfully!');
    console.log('📁 Check the ./logs directory for generated log files.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
fileStorageExample().catch(console.error);
