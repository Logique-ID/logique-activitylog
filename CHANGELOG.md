# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2025-08-29

### Added
- CommonJS support with comprehensive examples
- Query builder API with fluent interface
- Enhanced file storage with proper date-based filename generation
- Method chaining support for complex queries
- Support for generic `where()` and `orWhere()` conditions
- Order by functionality with ascending/descending support
- Date range filtering capabilities
- Property-based filtering (e.g., `properties.userAgent`)
- Count functionality for query results
- Improved error handling and type safety

### Fixed
- File storage filename placeholder replacement (now properly generates `activity-2025-08-29.log`)
- TypeScript compilation errors with `exactOptionalPropertyTypes`
- Property access issues in query filtering
- Date handling in sorting and statistics
- Import/export issues in CommonJS modules

### Changed
- Updated package scripts to use `npx` for better compatibility
- Enhanced query interface with more intuitive method names
- Improved file storage initialization with proper path handling
- Better error messages and debugging information

### Examples
- Added `examples/commonjs-basic-usage.js` - Basic CommonJS usage with file storage
- Added `examples/commonjs-batch-logging.js` - Batch logging example in CommonJS
- Added `examples/commonjs-query-examples.js` - Comprehensive query examples in CommonJS
- Added `examples/commonjs-database-example.js` - Database storage example in CommonJS
- Updated existing TypeScript examples with improved functionality

## [Unreleased]

### Added
- Initial release
- Support for multiple database types (MySQL, PostgreSQL, SQLite, MongoDB, Redis)
- File storage support (JSON, CSV, Log format)
- Batch logging functionality
- Query and filtering capabilities
- Subject and causer tracking
- Custom properties and metadata
- Log rotation and compression
- TypeScript support
- Comprehensive testing setup
- ActivityLogFormatter for formatting entries
- ActivityLogQuery builder for complex queries
- Statistics and summary functionality

### Features
- ActivityLogger class with simplified API
- ActivityLog class with full functionality
- Storage interface with multiple implementations
- Database adapters for various database systems
- File storage with configurable formats
- Batch processing for high-performance logging
- Flexible querying and filtering system
- Event type constants and enums
- Comprehensive error handling
- Performance optimizations

### Documentation
- Complete README with usage examples
- API reference documentation
- Configuration examples for all database types
- Code examples for common use cases
- Installation and setup instructions
