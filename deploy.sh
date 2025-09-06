#!/bin/bash

# AI Trivia Deployment Script
echo "🎯 Deploying AI Trivia Multiplayer Game..."

# Check if required environment variables are set
required_vars=("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "CLERK_SECRET_KEY" "NEXT_PUBLIC_CONVEX_URL" "OPENAI_API_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        echo "Please set all required environment variables in .env.local"
        exit 1
    fi
done

echo "✅ Environment variables check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Convex (if in development)
if [ "$NODE_ENV" != "production" ]; then
    echo "🚀 Deploying to Convex..."
    npx convex deploy
fi

echo "🎉 Deployment complete!"
echo ""
echo "🔗 Next steps:"
echo "1. Deploy to Railway: railway up"
echo "2. Set environment variables in Railway dashboard"
echo "3. Your app will be available at your Railway domain"
echo ""
echo "📚 Documentation: See README.md for detailed setup instructions"