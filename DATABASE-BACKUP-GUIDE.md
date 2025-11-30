# ELako.Nv Database Backup Guide

## 🎯 **QUICK START - Choose Your Method:**

### Method 1: Official MongoDB Tools (Recommended)

```bash
# 1. Download & Install MongoDB Database Tools (FREE)
# https://www.mongodb.com/try/download/database-tools

# 2. Double-click one of these files:
backup-elako-database.bat     # Backup ElakoNv database only
backup-all-databases.bat      # Backup all databases
restore-elako-database.bat    # Restore from backup
```

### Method 2: Node.js Backup (Alternative)

```bash
# Works immediately, no extra tools needed
cd server
node backup-database-node.js
```

## 📁 **Backup Files Created:**

### MongoDB Tools Backup:

```
database-backups/
  2025-12-01_1430/
    ElakoNv/
      products.bson ✅
      users.bson ✅
      msmes.bson ✅
      orders.bson ✅
      [all collections].bson
```

### Node.js Backup:

```
server/node-backup/
  ElakoNv_2025-12-01T14-30-00/
    products.json ✅
    users.json ✅
    msmes.json ✅
    orders.json ✅
    _backup-info.json
```

## 🔧 **Commands Reference:**

```bash
# Backup specific database
mongodump --db ElakoNv --out backup/

# Backup ALL databases
mongodump --out backup-all/

# Restore database
mongorestore --db ElakoNv --drop backup/ElakoNv

# Check backup size
dir backup/ /s

# Compress backup (optional)
tar -czf backup.tar.gz backup/
```

## ⏰ **Automated Daily Backup (Optional):**

1. **Windows Task Scheduler:**

   - Open Task Scheduler
   - Create Basic Task
   - Set to run `backup-elako-database.bat` daily

2. **Batch Script with Scheduling:**

```bash
# Add to backup-elako-database.bat
schtasks /create /tn "ElakoBackup" /tr "%~dp0backup-elako-database.bat" /sc daily /st 02:00
```

## 🚀 **Atlas Cloud Backup:**

If using MongoDB Atlas:

```bash
mongodump --uri "mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/ElakoNv" --out atlas-backup/
```

## ✅ **Success Indicators:**

- ✅ See `.bson` files in backup folder
- ✅ No error messages in terminal
- ✅ Backup folder opens automatically
- ✅ File sizes > 0 bytes

## 🆘 **Troubleshooting:**

**Error: "mongodump not recognized"**

- Install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools
- Add to PATH or use full path

**Empty backup folders:**

- Check if MongoDB service is running
- Verify database name: `ElakoNv`
- Use Node.js backup as alternative

**Permission errors:**

- Run as Administrator
- Check folder permissions
