import { ActivityLog } from '../ActivityLog';
import { FileStorage } from '../storage/FileStorage';

describe('ActivityLog', () => {
  let activityLog: ActivityLog;

  beforeEach(() => {
    activityLog = new ActivityLog({
      storage: new FileStorage({
        type: 'json',
        directory: './test-logs',
        filename: 'test-{YYYY}-{MM}-{DD}.log'
      })
    });
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await activityLog.clear();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize successfully', async () => {
    await expect(activityLog.initialize()).resolves.not.toThrow();
  });

  it('should log an activity', async () => {
    await activityLog.initialize();

    const entry = await activityLog.log({
      name: 'Test activity',
      event: 'test',
      level: 'info'
    });

    expect(entry).toBeDefined();
    expect(entry.name).toBe('Test activity');
    expect(entry.event).toBe('test');
    expect(entry.level).toBe('info');
    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeInstanceOf(Date);
  });

  it('should log a created event', async () => {
    await activityLog.initialize();

    const entry = await activityLog.logCreated({
      name: 'User created',
      subject: {
        type: 'user',
        id: 123,
        attributes: { name: 'John Doe' }
      }
    });

    expect(entry.event).toBe('created');
    expect(entry.subject?.type).toBe('user');
    expect(entry.subject?.id).toBe(123);
  });

  it('should log an updated event', async () => {
    await activityLog.initialize();

    const entry = await activityLog.logUpdated({
      name: 'User updated',
      subject: {
        type: 'user',
        id: 123,
        changes: {
          before: { name: 'John Doe' },
          after: { name: 'John Smith' }
        }
      }
    });

    expect(entry.event).toBe('updated');
    expect(entry.subject?.changes?.before?.['name']).toBe('John Doe');
    expect(entry.subject?.changes?.after?.['name']).toBe('John Smith');
  });

  it('should log a deleted event', async () => {
    await activityLog.initialize();

    const entry = await activityLog.logDeleted({
      name: 'User deleted',
      subject: {
        type: 'user',
        id: 123
      }
    });

    expect(entry.event).toBe('deleted');
    expect(entry.level).toBe('warning');
  });

  it('should log a login event', async () => {
    await activityLog.initialize();

    const entry = await activityLog.logLogin({
      causer: {
        type: 'user',
        id: 123,
        name: 'John Doe'
      }
    });

    expect(entry.event).toBe('logged_in');
    expect(entry.causer?.type).toBe('user');
    expect(entry.causer?.id).toBe(123);
  });

  it('should find activities', async () => {
    await activityLog.initialize();

    // Log some activities
    await activityLog.log({
      name: 'Test 1',
      event: 'test',
      subject: { type: 'user', id: 123 }
    });

    await activityLog.log({
      name: 'Test 2',
      event: 'test',
      subject: { type: 'user', id: 123 }
    });

    const activities = await activityLog.find({
      subjectType: 'user',
      subjectId: 123
    });

    expect(activities).toHaveLength(2);
    expect(activities[0]?.subject?.type).toBe('user');
    expect(activities[0]?.subject?.id).toBe(123);
  });

  it('should count activities', async () => {
    await activityLog.initialize();

    // Log some activities
    await activityLog.log({ name: 'Test 1', event: 'test' });
    await activityLog.log({ name: 'Test 2', event: 'test' });
    await activityLog.log({ name: 'Test 3', event: 'test' });

    const count = await activityLog.count();
    expect(count).toBe(3);
  });

  it('should get statistics', async () => {
    await activityLog.initialize();

    // Log some activities
    await activityLog.log({ name: 'Test 1', event: 'test' });
    await activityLog.log({ name: 'Test 2', event: 'test' });

    const stats = await activityLog.getStats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.oldestEntry).toBeInstanceOf(Date);
    expect(stats.newestEntry).toBeInstanceOf(Date);
  });
});
