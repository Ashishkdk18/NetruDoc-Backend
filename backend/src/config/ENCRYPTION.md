# Database Encryption Configuration

## MongoDB Encryption at Rest

This application uses MongoDB Atlas, which provides encryption at rest by default.

### Atlas Encryption Features:

- **Encryption at Rest**: Enabled by default for all Atlas clusters
- **Encryption in Transit**: TLS/SSL encryption for all connections
- **Network Isolation**: VPC peering and private endpoints available

### Configuration:

- Encryption is handled at the MongoDB Atlas cluster level
- No additional application-level configuration required
- Ensure connection string uses SSL/TLS (default in Atlas)

### For Self-Hosted MongoDB:

If migrating to self-hosted MongoDB Enterprise:

1. Enable WiredTiger encryption at rest
2. Configure encryption key management (KMIP or local keyfile)
3. Update connection string with encryption options

### Current Setup:

- Database: MongoDB Atlas (Cloud)
- Encryption: Enabled by default
- Connection: TLS/SSL encrypted
- Compliance: HIPAA-ready with proper Atlas configuration
