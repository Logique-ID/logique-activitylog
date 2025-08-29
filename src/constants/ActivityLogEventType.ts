export enum ActivityLogEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  RESTORED = 'restored',
  LOGGED_IN = 'logged_in',
  LOGGED_OUT = 'logged_out',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_VERIFIED = 'email_verified',
  PROFILE_UPDATED = 'profile_updated',
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  EXPORTED = 'exported',
  IMPORTED = 'imported',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  CUSTOM = 'custom'
}
