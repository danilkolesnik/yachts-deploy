#!/bin/bash

# Backup script for Yachts database
CONTAINER_NAME="yachts-db-1"
DB_NAME="yachts"
DB_USER="postgres"
BACKUP_DIR="./backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

# Run backup
echo "Starting backup of database $DB_NAME..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists --no-owner --no-privileges > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    
    # Keep only last 7 backups
    cd "$BACKUP_DIR"
    ls -t backup_*.sql | tail -n +8 | xargs -r rm
    echo "Cleaned up old backups (kept last 7)"
else
    echo "Backup failed!"
    exit 1
fi 