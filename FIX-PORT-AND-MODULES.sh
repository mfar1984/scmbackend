#!/bin/bash

# ============================================
# QUICK FIX SCRIPT untuk scm-core.malaysiadev.com
# Run this in cPanel Terminal
# ============================================

echo "🔧 ATLINE Backend - Quick Fix Script"
echo "======================================"
echo ""

# 1. Navigate to project
cd /home/malaysiadev/scm-core.malaysiadev.com

# 2. Activate Node.js environment
echo "📦 Activating Node.js environment..."
source /home/malaysiadev/nodevenv/scm-core.malaysiadev.com/24/bin/activate

# 3. Kill any process using port 3000
echo ""
echo "🔴 Killing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process found on port 3000"

# Alternative method
pkill -f "node.*3000" 2>/dev/null || echo "No node process found"

# 4. Install missing packages
echo ""
echo "📦 Installing missing packages..."
npm install formidable --save
npm install --production

# 5. Generate Prisma Client
echo ""
echo "🔄 Generating Prisma Client..."
npx prisma generate

# 6. Check files
echo ""
echo "✅ Checking critical files..."
echo "start.js:" && ls -lh start.js 2>/dev/null || echo "❌ Missing"
echo "formidable:" && ls -d node_modules/formidable 2>/dev/null && echo "✅ Installed" || echo "❌ Missing"
echo "standalone:" && ls -lh .next/standalone/server.js 2>/dev/null && echo "✅ Found" || echo "⚠️  Not found"

echo ""
echo "======================================"
echo "✅ Fix script completed!"
echo ""
echo "NEXT STEPS:"
echo "1. Go to cPanel → Setup Node.js App"
echo "2. Set startup file to: start.js"
echo "3. Click RESTART"
echo "4. Test: https://scm-core.malaysiadev.com"
echo ""
