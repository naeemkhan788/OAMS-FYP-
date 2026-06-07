# MongoDB Setup Instructions for Windows

## Problem: MongoDB Connection Refused (ECONNREFUSED 127.0.0.1:27017)

The error indicates that MongoDB is not installed or not running on your system. Here's how to fix it:

## Option 1: Install MongoDB Community Server (Recommended)

### Step 1: Download MongoDB
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: MongoDB 7.0.x (latest stable)
   - Platform: Windows
   - Package: msi

### Step 2: Install MongoDB
1. Run the downloaded .msi file
2. Choose "Complete" installation
3. Check "Install MongoDB as a Service" and "Install MongoDB Compass"
4. Complete the installation

### Step 3: Start MongoDB Service
1. Open Services (press Win + R, type `services.msc`)
2. Find "MongoDB Server" service
3. Right-click and select "Start"
4. Set startup type to "Automatic"

### Step 4: Verify Installation
Open Command Prompt and run:
```cmd
mongod --version
```

## Option 2: Use MongoDB Atlas (Cloud Database)

### Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up for free account

### Step 2: Create Cluster
1. Create a free cluster (M0 Sandbox)
2. Choose a region closest to you
3. Wait for cluster to be created

### Step 3: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password

### Step 4: Update .env File
Replace the MONGODB_URI in your .env file:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/oams?retryWrites=true&w=majority
```

## Option 3: Use Docker (Advanced)

### Step 1: Install Docker Desktop
Download from: https://www.docker.com/products/docker-desktop

### Step 2: Run MongoDB Container
```cmd
docker run --name mongodb -p 27017:27017 -d mongo:7.0
```

### Step 3: Update .env File
```
MONGODB_URI=mongodb://localhost:27017/oams
```

## After Installation

### Start Your Backend Server
```cmd
cd backend
npm start
```

### Expected Output
```
Server running in development mode on port 5000
MongoDB Connected: 127.0.0.1
Database: oams
```

## Troubleshooting

### If MongoDB Service Won't Start
1. Check if port 27017 is blocked by firewall
2. Run Command Prompt as Administrator
3. Start service manually:
   ```cmd
   net start MongoDB
   ```

### If Connection Still Fails
1. Verify MongoDB is running:
   ```cmd
   mongo --eval "db.adminCommand('ismaster')"
   ```
2. Check Windows Firewall settings
3. Try different port (27018) and update .env

## Quick Test
After setup, test connection with:
```cmd
cd backend
node -e "require('./config/database.js')"
```

You should see: "MongoDB Connected: 127.0.0.1"

## Recommendation
For development, **Option 1 (Local Installation)** is recommended as it's faster and doesn't require internet connection once installed.
