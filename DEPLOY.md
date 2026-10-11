# MedFlow - Hospital Management Platform

## Project Structure
```
medflow/
├── client/          # React + Vite Frontend
├── server/          # Node.js + Express Backend
└── README.md
```

## Quick Deploy Commands

### 1. Push to GitHub
```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial MedFlow commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/medflow.git
git branch -M main
git push -u origin main
```

---

## Backend Deployment (Railway)

### 1. Add Railway Config
Create `server/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node src/server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Railway Deployment Steps
1. Go to [Railway.app](https://railway.app) → New Project → "Deploy from GitHub"
2. Select your `medflow` repo
3. Set **Root Directory** to `server`
4. Add MySQL: Click "+ New" → "Database" → "MySQL"
5. Set Environment Variables in Railway dashboard:
```
NODE_ENV=production
PORT=3000
DB_HOST=${{ MYSQLHOST }}
DB_PORT=${{ MYSQLPORT }}
DB_NAME=${{ MYSQLDATABASE }}
DB_USER=${{ MYSQLUSER }}
DB_PASSWORD=${{ MYSQLPASSWORD }}
JWT_SECRET=your-64-char-random-secret
REFRESH_TOKEN_SECRET=your-64-char-refresh-secret
BCRYPT_ROUNDS=12
CLIENT_URL=https://your-app.vercel.app
SOCKET_IO_CORS_ORIGIN=https://your-app.vercel.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```
6. Deploy → Get your Railway URL: `https://medflow-api.railway.app`

---

## Frontend Deployment (Vercel)

### 1. Vercel Config
Create `client/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "https://your-app.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### 2. Update Client Env for Production
Create `client/.env.production`:
```env
VITE_API_URL=https://medflow-api.railway.app/api
VITE_SOCKET_URL=https://medflow-api.railway.app
VITE_APP_NAME=MedFlow
```

### 3. Vercel Deployment Steps
1. Go to [Vercel.com](https://vercel.com) → "Add New Project"
2. Import your GitHub repo
3. Set **Root Directory** to `client`
4. Add Environment Variables:
```
VITE_API_URL=https://medflow-api.railway.app/api
VITE_SOCKET_URL=https://medflow-api.railway.app
```
5. Deploy → Get your Vercel URL: `https://medflow.vercel.app`

### 4. Update Railway with Vercel URL
Go back to Railway → Update `CLIENT_URL` and `SOCKET_IO_CORS_ORIGIN` to your Vercel URL.

---

## Post-Deploy Checklist

- [ ] Railway health check passes: `https://medflow-api.railway.app/api/health`
- [ ] Vercel loads without console errors
- [ ] Login works with demo credentials
- [ ] Socket.IO connects (check Network tab for WS upgrade)
- [ ] Patient/Doctor/Admin portals all load
- [ ] Real-time queue updates work

---

## Demo Credentials (seeded automatically)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medflow.com | demo123 |
| Doctor | sarah.johnson@medflow.com | demo123 |
| Patient | john.smith@email.com | demo123 |

---

## Environment Variables Reference

### Server (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | production |
| DB_HOST | MySQL host | railway-mysql-host |
| DB_PORT | MySQL port | 3306 |
| DB_NAME | Database name | medflow |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | *** |
| JWT_SECRET | 64-char secret | openssl rand -hex 32 |
| REFRESH_TOKEN_SECRET | 64-char secret | openssl rand -hex 32 |
| BCRYPT_ROUNDS | Hash rounds | 12 |
| CLIENT_URL | Frontend URL | https://medflow.vercel.app |
| SOCKET_IO_CORS_ORIGIN | Socket origin | https://medflow.vercel.app |
| COOKIE_SECURE | Secure cookies | true |
| COOKIE_SAME_SITE | CSRF protection | none |

### Client (.env.production)
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API | https://medflow-api.railway.app/api |
| VITE_SOCKET_URL | Socket server | https://medflow-api.railway.app |
| VITE_APP_NAME | App name | MedFlow |

---

## Useful Commands

```bash
# Local development
cd server && npm run dev
cd client && npm run dev

# Database operations
cd server && npm run db:setup && npm run db:migrate && npm run db:seed

# Production build
cd client && npm run build
cd server && npm start
```