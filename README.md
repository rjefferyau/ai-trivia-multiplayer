# AI-Powered Multiplayer Trivia Game

A real-time multiplayer trivia application with AI-generated questions, built with Next.js, Convex, and deployed on Railway.

## Features

- 🎮 Real-time multiplayer gameplay (2-4 players)
- 🤖 AI-generated questions with fact-checking
- 🔐 User authentication with Clerk
- 📊 Live scoring and leaderboards
- 💬 In-game chat
- 🎨 Beautiful UI with shadcn/ui
- ⚡ Real-time updates with Convex
- 🚀 Deployed on Railway

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database and serverless functions)
- **Authentication**: Clerk
- **AI**: OpenAI API for question generation
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Accounts on:
  - [Clerk](https://clerk.com) for authentication
  - [Convex](https://convex.dev) for backend
  - [OpenAI](https://platform.openai.com) for AI features
  - [Railway](https://railway.app) for deployment

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd trivia-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Then fill in your API keys in `.env.local`:
- Clerk keys from your Clerk dashboard
- Convex URL from your Convex project
- OpenAI API key

4. Initialize Convex:
```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex
- Create a new project or link to existing one
- Deploy your schema and functions
- Watch for changes in development

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment to Railway

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Railway
2. Railway will auto-detect the Next.js app
3. Add environment variables in Railway dashboard:
   - All variables from `.env.local`
   - Railway will automatically set `PORT` and `NODE_ENV`

### Manual Deployment

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Link to existing project or create new:
```bash
railway link [project-id]
```

5. Set environment variables:
```bash
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-key>
railway variables set CLERK_SECRET_KEY=<your-key>
railway variables set NEXT_PUBLIC_CONVEX_URL=<your-url>
railway variables set CONVEX_DEPLOYMENT=<your-deployment>
railway variables set OPENAI_API_KEY=<your-key>
```

6. Deploy:
```bash
railway up
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | Yes |
| `CONVEX_DEPLOYMENT` | Convex deployment name | Yes |
| `OPENAI_API_KEY` | OpenAI API key for question generation | Yes |

## Project Structure

```
trivia-game/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── lobby/             # Game lobby
│   ├── game/[id]/         # Game room
│   └── sign-in/           # Authentication pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── users.ts          # User functions
│   ├── gameRooms.ts      # Game room logic
│   ├── questions.ts      # Question management
│   ├── ai.ts            # AI integration
│   └── chat.ts          # Chat functions
├── lib/                  # Utility functions
├── public/              # Static assets
└── railway.toml         # Railway configuration
```

## Game Flow

1. **Authentication**: Users sign up/login via Clerk
2. **Lobby**: Users can create or join game rooms
3. **Waiting Room**: Players ready up before game starts
4. **Gameplay**: 
   - AI generates questions for selected categories
   - Players answer in real-time
   - Points awarded for correct answers + speed bonus
5. **Results**: Final scores and leaderboard

## Development Tips

### Adding New Features

1. **Database Changes**: Update `convex/schema.ts`
2. **New Functions**: Add to appropriate file in `convex/`
3. **UI Components**: Use shadcn/ui components
4. **Real-time Updates**: Use Convex queries with subscriptions

### Testing Locally

- Use multiple browser windows to test multiplayer
- Convex dashboard shows real-time data changes
- Check Railway logs for production issues

## Troubleshooting

### Common Issues

1. **Convex not connecting**: Check `NEXT_PUBLIC_CONVEX_URL` is correct
2. **Auth not working**: Verify Clerk keys and URLs
3. **AI questions failing**: Check OpenAI API key and credits
4. **Railway deployment fails**: Check build logs and environment variables

### Support

- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT

## Contributing

Pull requests are welcome! Please follow the existing code style and add tests for new features.
