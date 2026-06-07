# MongoDB Compass Connection Guide

## 🚨 **Issue: MongoDB Not Installed Locally**

Your MongoDB Compass cannot connect because MongoDB is not installed on your system.

## ✅ **Solution 1: Install MongoDB Community Server**

### **Step 1: Download MongoDB**
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: MongoDB 7.0.x (latest)
   - Platform: Windows
   - Package: msi
3. Click **Download**

### **Step 2: Install MongoDB**
1. Run the downloaded `.msi` file
2. Choose **Complete** installation
3. Check **"Install MongoDB as a Service"**
4. Check **"Install MongoDB Compass"** (if not already installed)
5. Complete installation

### **Step 3: Start MongoDB Service**
1. Open **Services** (press Win + R, type `services.msc`)
2. Find **"MongoDB Server"**
3. Right-click → **Start**
4. Set **Startup Type** to **Automatic**

### **Step 4: Connect Compass**
1. Open MongoDB Compass
2. Click **"New Connection"**
3. Connection string: `mongodb://localhost:27017/oams`
4. Click **"Connect"**

## 🌐 **Solution 2: Use MongoDB Atlas (Easier)**

If local installation is complex, use cloud database:

### **Step 1: Create Atlas Account**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"**
3. Sign up with email

### **Step 2: Create Free Cluster**
1. Click **"Build a Database"**
2. Choose **"M0 Sandbox"** (FREE)
3. Select region closest to you
4. Click **"Create Cluster"**

### **Step 3: Setup Access**
1. **Database User:** Username `oamsuser`, create password
2. **Network Access:** Allow from anywhere (0.0.0.0/0)
3. **Connection String:** Copy from Atlas

### **Step 4: Update .env and Connect Compass**
1. Update .env: `MONGODB_URI=mongodb+srv://oamsuser:password@cluster0.id.mongodb.net/oams`
2. Compass: Paste Atlas connection string
3. Click **"Connect"**

## 🎯 **Expected Result**

### **Local MongoDB:**
```
MongoDB Connected: localhost
Database: oams
```

### **Atlas MongoDB:**
```
MongoDB Connected: cluster0.id.mongodb.net
Database: oams
```

## 🔧 **Backend Will Work With Either Solution**

Your backend is configured to work with both local and Atlas MongoDB.

## ⚡ **Recommendation**

**Use MongoDB Atlas** - it's faster, no installation needed, and works perfectly with Compass!

**Choose Solution 1 for local development or Solution 2 for cloud!** 🚀
