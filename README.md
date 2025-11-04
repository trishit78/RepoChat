# RepoChat 🤖

> AI-powered GitHub repository analyzer and chat interface built with Next.js, tRPC, and Google Gemini AI

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596be)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Overview

RepoChat is an intelligent repository management system that allows you to:
- 🔗 Connect GitHub repositories
- 🤖 AI-powered commit summarization using Google Gemini
- 📊 Automatic code analysis and embeddings
- 💬 Interactive Q&A about your codebase
- 📈 Visual commit history and insights
- 🔐 Secure authentication with Clerk

## ✨ Features

### Core Functionality
- **Repository Integration**: Seamlessly connect and index GitHub repositories
- **AI Commit Summaries**: Automatically generate human-readable commit summaries
- **Code Embeddings**: Vector-based code search using semantic understanding
- **Real-time Updates**: Automatic polling for new commits
- **Project Dashboard**: Visual overview of all your connected repositories
- **Meeting Transcription**: (Coming soon) Record and analyze development meetings

### Technical Highlights
- **Type-safe API**: End-to-end type safety with tRPC
- **Modern UI**: Beautiful interface built with shadcn/ui components
- **Responsive Design**: Optimized for desktop and mobile devices
- **Database**: PostgreSQL with Prisma ORM and pgvector extension
- **Authentication**: Secure user management with Clerk

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database with pgvector extension
- GitHub account and personal access token
- Google Gemini API key
- Clerk account for authentication

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/repochat.git
cd repochat
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/repochat?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# GitHub
GITHUB_TOKEN=ghp_xxxxx

# Google Gemini AI
GEMINI_API_KEY=xxxxx

# Node Environment
NODE_ENV=development
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npx prisma studio
```

5. **Run the development server**
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Running with Docker

If you prefer to run the database and app in Docker for development, this repository includes a simple `docker-compose.yml` and `Dockerfile` to get you started.

Quick steps (PowerShell on Windows):

1. Copy your env file and fill in secrets (do not commit it):

```powershell
Copy-Item .env.example .env
# Edit .env and replace tokens/keys with your local secrets
```

2. Start Postgres and the app (start only `db` and `app` to save memory):

```powershell
# Start DB and app
docker-compose up -d --build db app

# (Optional) start everything including pgAdmin
docker-compose up -d --build
```

3. Follow logs:

```powershell
docker-compose logs -f app
docker-compose logs -f db
```

## �📁 Project Structure

```
src/
├── app/
│   ├── (protected)/        # Protected routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── qa/            # Q&A interface
│   │   ├── meetings/      # Meeting management
│   │   └── create/        # Project creation
│   ├── api/
│   │   └── trpc/          # tRPC API routes
│   ├── sign-in/           # Authentication pages
│   └── sign-up/
├── components/
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── gemini.ts         # AI integration
│   ├── github.ts         # GitHub API
│   └── github-loader.ts  # Repository indexing
├── server/
│   ├── api/
│   │   ├── routers/      # tRPC routers
│   │   └── trpc.ts       # tRPC configuration
│   └── db.ts             # Prisma client
└── styles/
    └── globals.css       # Global styles
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **Forms**: React Hook Form

### Backend
- **API**: tRPC v11
- **Database**: PostgreSQL with Prisma ORM
- **Vector Search**: pgvector extension
- **Authentication**: Clerk
- **AI/ML**: Google Gemini AI

### Development
- **Code Quality**: ESLint + TypeScript ESLint
- **Formatting**: Prettier
- **Package Manager**: pnpm/npm/yarn

## 🔑 Key Features Explained

### 1. Repository Indexing
When you connect a repository, RepoChat:
- Clones and analyzes the codebase
- Generates AI summaries for each file
- Creates vector embeddings for semantic search
- Stores structured data in PostgreSQL

### 2. Commit Summarization
- Automatically fetches new commits
- Analyzes git diffs
- Generates concise, human-readable summaries
- Displays commit history with author info

### 3. AI-Powered Q&A
- Ask questions about your codebase
- Get context-aware answers
- Search through commit history
- Understand code relationships

## 📝 API Routes

### Project Management
- `POST /api/trpc/project.createProject` - Create a new project
- `GET /api/trpc/project.getProjects` - Get all user projects
- `GET /api/trpc/project.getCommits` - Get project commits

## 🎨 UI Components

RepoChat uses shadcn/ui components with the New York style variant:
- Sidebar navigation
- Cards and layouts
- Forms and inputs
- Buttons and dialogs
- Tables and data display

## 🔒 Security

- Server-side authentication with Clerk
- Environment variable validation with Zod
- Protected API routes with middleware
- Secure database queries with Prisma

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify pgvector extension is installed

**GitHub API Rate Limit**
- Use a personal access token
- Implement exponential backoff
- Consider caching responses

**AI Summarization Fails**
- Check GEMINI_API_KEY is valid
- Verify API quota limits
- Review error logs for details

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Google Gemini AI](https://ai.google.dev/docs)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTORS.md](CONTRIBUTORS.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [T3 Stack](https://create.t3.gg/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- AI powered by [Google Gemini](https://ai.google.dev/)

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the maintainers.

---

Made with ❤️ by the RepoChat team
