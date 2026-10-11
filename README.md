# MedFlow Hospital Management Platform

A complete, functional hospital workflow and bottleneck management platform designed to reduce overcrowded OPDs, long queues, unnecessary patient waiting, and inefficient coordination between hospital departments.

## 🏗️ Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + Axios + Socket.IO Client
- **Backend**: Node.js + Express + Sequelize ORM + MySQL + Socket.IO
- **Authentication**: JWT with refresh tokens, bcrypt password hashing
- **Real-time**: Socket.IO for live queue updates

## 📁 Project Structure

```
medflow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client & interceptors
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Page components
│   │   │   ├── auth/      # Login, Register
│   │   │   ├── patient/   # Patient portal pages
│   │   │   ├── doctor/    # Doctor portal pages
│   │   │   └── admin/     # Admin console pages
│   │   ├── routes/        # Route definitions
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── db/            # Database setup & migrations
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── sockets/       # Socket.IO handlers
│   │   ├── validators/    # Zod validation schemas
│   │   ├── utils/         # Utility functions
│   │   ├── app.js         # Express app setup
│   │   └── server.js      # Server entry point
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE medflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, can use root)
CREATE USER 'medflow'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON medflow.* TO 'medflow'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup

```bash
cd server

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required changes:
# - DB_PASSWORD=your_mysql_password
# - JWT_SECRET=your_long_random_secret
# - REFRESH_TOKEN_SECRET=another_long_random_secret
# - COOKIE_SECRET=another_random_secret

# Install dependencies
npm install

# Setup database (creates tables)
npm run db:setup

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

Server runs on http://localhost:5000

### 3. Frontend Setup

```bash
cd client

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:5173

## ⚙️ Environment Variables

### Server (.env)

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_NAME=medflow
DB_USER=root
DB_PASSWORD=CHANGE_ME

JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=CHANGE_ME_TO_ANOTHER_LONG_RANDOM_SECRET
REFRESH_TOKEN_EXPIRES_IN=7d

BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

COOKIE_SECRET=CHANGE_ME_TO_A_RANDOM_COOKIE_SECRET
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

SOCKET_IO_CORS_ORIGIN=http://localhost:5173
```

### Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=MedFlow
```

## 🔐 Demo Credentials

After running `npm run db:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medflow.com | demo123 |
| Doctor (General Medicine) | sarah.johnson@medflow.com | demo123 |
| Doctor (Cardiology) | michael.chen@medflow.com | demo123 |
| Doctor (Orthopedics) | emily.rodriguez@medflow.com | demo123 |
| Doctor (Pediatrics) | james.wilson@medflow.com | demo123 |
| Doctor (Dermatology) | lisa.park@medflow.com | demo123 |
| Patient 1 | john.smith@email.com | demo123 |
| Patient 2 | maria.garcia@email.com | demo123 |
| ... | ... | demo123 |

## 🎯 Features

### Patient Portal (`/patient`)
- ✅ Registration & login
- ✅ OPD registration with department selection
- ✅ Automatic token generation
- ✅ Real-time queue position & estimated wait
- ✅ Status: Registered → Waiting → Called → In Progress → Completed
- ✅ Visit history
- ✅ Medical profile (conditions, allergies, medications)
- ✅ Notifications when called

### Doctor Portal (`/doctor`)
- ✅ Secure login
- ✅ Department queue dashboard
- ✅ Call Next Patient
- ✅ Start Consultation
- ✅ Complete Consultation with notes, diagnosis, prescriptions
- ✅ Skip/Recall patients with audit logging
- ✅ View patient medical history (authorized only)
- ✅ Real-time queue updates

### Admin Console (`/admin`)
- ✅ Dashboard with metrics
- ✅ Department management
- ✅ Doctor account management
- ✅ Queue monitoring & correction
- ✅ Analytics & bottleneck detection
- ✅ Audit logs

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Patient
- `GET /api/patients/profile` - Get patient profile
- `POST /api/encounters` - Create OPD encounter
- `GET /api/patients/encounters` - Get encounter history
- `GET /api/patients/queue` - Get current queue status
- `GET /api/patients/medical-history` - Get medical history
- `POST /api/patients/medical-conditions` - Add condition
- `POST /api/patients/allergies` - Add allergy
- `POST /api/patients/medications` - Add medication

### Doctor
- `GET /api/doctor/dashboard` - Doctor dashboard
- `GET /api/doctor/queue` - Department queue
- `POST /api/doctor/queue/:id/call` - Call patient
- `POST /api/doctor/queue/:id/start` - Start consultation
- `POST /api/doctor/queue/:id/complete` - Complete consultation
- `POST /api/doctor/queue/:id/skip` - Skip patient
- `POST /api/doctor/queue/:id/recall` - Recall patient
- `GET /api/doctor/patients/:id/medical-history` - Patient history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET/POST/PATCH /api/admin/departments` - Departments CRUD
- `GET/POST/PATCH /api/admin/doctors` - Doctors CRUD
- `GET /api/admin/queue` - All queue entries
- `GET /api/admin/analytics` - Operational analytics
- `GET /api/admin/audit-logs` - Audit logs
- `POST /api/admin/queue/:id/correct` - Queue correction

## 🗄️ Database Schema

Key tables:
- `hospitals` - Hospital information
- `departments` - Hospital departments
- `users` - All users (patients, doctors, admins)
- `patients` - Patient profiles
- `doctor_profiles` - Doctor assignments
- `operating_sessions` - Department sessions
- `encounters` - Patient visits
- `queue_entries` - Queue tokens with status
- `consultations` - Consultation records
- `medical_conditions`, `allergies`, `medications` - Patient history
- `prescriptions` - Prescribed medications
- `lab_orders`, `lab_results` - Laboratory
- `audit_events` - Audit trail

## 🔒 Security Features

- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT with short expiry (15min) + refresh tokens (7 days)
- ✅ Role-based access control (RBAC)
- ✅ Row-level authorization
- ✅ Audit logging for all sensitive actions
- ✅ Rate limiting on auth endpoints
- ✅ Helmet.js security headers
- ✅ CORS configured for frontend origin
- ✅ Input validation with Zod
- ✅ SQL injection prevention via Sequelize ORM

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📦 Production Build

```bash
# Backend
cd server
npm run build  # if using build step
NODE_ENV=production npm start

# Frontend
cd client
npm run build
# Serve dist/ with nginx or similar
```

## 🐳 Docker (Optional)

```dockerfile
# Example Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

For issues and feature requests, please open a GitHub issue.

---

**MedFlow** - Streamlining hospital workflows, one patient at a time.