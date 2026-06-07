@echo off
echo Starting MongoDB Atlas Setup for OAMS...
echo.

echo Step 1: Opening MongoDB Atlas registration...
start https://www.mongodb.com/cloud/atlas

echo.
echo Step 2: After creating account, create free cluster (M0 Sandbox)
echo Step 3: Create database user (oamsuser)
echo Step 4: Get connection string from Atlas
echo Step 5: Update .env file with connection string
echo.

echo Your backend will automatically connect once .env is updated!
echo.
echo Press any key to continue...
pause > nul
