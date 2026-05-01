# BlackAI - Prototype

A full-stack web application for managing projects and events with multi-language support (English, Hindi, Marathi).

## Features

- **Projects Management**: Create, edit, and showcase projects with auto-translation
- **Events Management**: Comprehensive event system with registration, pricing, and scheduling
- **Multi-language Support**: Automatic translation between English, Hindi, and Marathi
- **Admin Panel**: Secure admin authentication and content management
- **Responsive Design**: Clean, modern UI that works on all devices

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Wouter
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Session-based with express-session

## Environment Variables

Create a `.env` file based on `.env.example`:

```
DATABASE_URL=your_postgresql_connection_string
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
npm run db:push
npm run db:setup
```

3. Run development server:
```bash
npm run dev
```

## Deployment on Render

### Prerequisites
- PostgreSQL database (Neon, Render PostgreSQL, or any PostgreSQL provider)
- GitHub repository

### Steps

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/client-prototype.git
git push -u origin main
```

2. **Create Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: client-prototype
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables**: Add `DATABASE_URL`

3. **Setup Database** (after first deployment):
   - Run in Render Shell:
   ```bash
   npm run db:push
   npm run db:setup
   ```

## Default Admin Credentials

- **Username**: vigyat
- **Email**: vigyat@blackai.in
- **Password**: vigyat@123

**⚠️ Change these credentials after first login!**

## Project Structure

```
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── script/              # Database setup scripts
└── dist/                # Production build
```

## License

MIT
