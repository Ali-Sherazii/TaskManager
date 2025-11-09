# MongoDB Setup Guide

## Quick Start

### Option 1: Local MongoDB (Recommended for Learning)

1. **Install MongoDB:**
   - Windows: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Mac: `brew install mongodb-community`
   - Linux: Follow [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/installation/)

2. **Start MongoDB:**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   
   # Mac/Linux
   mongod
   ```

3. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/taskmanager
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### Option 2: MongoDB Atlas (Cloud - Free)

1. **Create Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select region closest to you
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"

4. **Whitelist IP:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP

5. **Get Connection String:**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `taskmanager`

6. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```

7. **Start the server:**
   ```bash
   npm start
   ```

## Verify Connection

When you start the server, you should see:
```
MongoDB connected successfully
Database: taskmanager
Host: localhost:27017
```

## Troubleshooting

### "MongoServerError: Authentication failed"
- Check username and password in connection string
- Verify database user exists in MongoDB Atlas

### "MongooseServerSelectionError: connect ECONNREFUSED"
- MongoDB is not running
- Start MongoDB: `mongod` or `net start MongoDB`
- Check if port 27017 is available

### "MongoNetworkError: failed to connect"
- Check MongoDB Atlas IP whitelist
- Verify connection string is correct
- Check internet connection (for Atlas)

## MongoDB vs SQLite

**MongoDB Advantages:**
- NoSQL - flexible schema
- Better for scaling
- Built-in replication
- Cloud hosting (Atlas)
- Better for complex queries

**For This Project:**
- MongoDB is perfect for learning modern database concepts
- Easy to deploy to cloud
- Better for production applications

## Useful MongoDB Commands

**Connect to MongoDB Shell:**
```bash
mongosh  # or mongo (older versions)
```

**List Databases:**
```javascript
show dbs
```

**Use Database:**
```javascript
use taskmanager
```

**Show Collections (Tables):**
```javascript
show collections
```

**View Documents:**
```javascript
db.users.find()
db.tasks.find()
db.sessions.find()
```

## Next Steps

1. Install MongoDB locally or set up Atlas
2. Update `.env` with connection string
3. Run `npm install` to install mongoose
4. Start server: `npm start`
5. Verify connection in console output



