# 🎯 AI Trivia Setup Guide

## Quick Start

Your AI-powered multiplayer trivia game is ready! Here's how to get it running:

### 1. Set Up Services

Create accounts and get API keys from:

- **Clerk** (Authentication): https://clerk.com
- **Convex** (Backend): https://convex.dev  
- **OpenAI** (AI Questions): https://platform.openai.com
- **Railway** (Deployment): https://railway.app

### 2. Configure Environment

Copy the environment file:
```bash
cp .env.example .env.local
```

Fill in your keys in `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bmF0dXJhbC1lbGYtNTYuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_OhMHzF0X5c4BxQMHCJPRTkf5m8k2axDBYMjTbLDEpS
NEXT_PUBLIC_CONVEX_URL=https://giddy-monitor-109.convex.cloud
CONVEX_DEPLOYMENT=your-deployment
OPENAI_API_KEY=sk-...
```

### 3. Start Development

```bash
# Install dependencies
npm install

# Start Convex (in one terminal)
npx convex dev

# Start Next.js (in another terminal)  
npm run dev
```

Visit http://localhost:3000

### 4. Deploy to Production

**Option A: Railway (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Option B: Manual Railway**
1. Connect your GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on git push

### 5. Test Your Game

1. Sign up for an account
2. Create a game room
3. Share the room code with friends
4. Play multiplayer trivia with AI-generated questions!

## Features

✅ **Authentication** - Clerk handles sign-up/login  
✅ **Real-time Multiplayer** - Up to 4 players  
✅ **AI Questions** - OpenAI generates unique questions  
✅ **Fact-Checking** - AI verifies answer accuracy  
✅ **Live Scoring** - Speed bonuses and leaderboards  
✅ **Chat System** - In-game messaging  
✅ **Responsive UI** - Works on all devices  

## Architecture

- **Frontend**: Next.js 14 + TypeScript + shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk
- **AI**: OpenAI GPT-4
- **Deployment**: Railway

## Troubleshooting

**Build Errors**: Make sure all environment variables are set  
**Convex Issues**: Run `npx convex dev` to sync schema  
**Auth Problems**: Check Clerk keys and domain settings  
**AI Not Working**: Verify OpenAI API key and credits  

## Support

- **Convex Docs**: https://docs.convex.dev
- **Clerk Docs**: https://clerk.com/docs  
- **Railway Docs**: https://docs.railway.app

---

🎉 **Ready to play!** Your multiplayer AI trivia game is all set up!