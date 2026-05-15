# LMS - Loan Management System

A full-stack lending platform where borrowers apply for loans and internal executives manage those loans through their lifecycle.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt

## Project Structure

```
LMS/
├── frontend/          # Next.js app
│   └── src/
│       ├── app/       # Pages (App Router)
│       └── lib/       # API client, auth context
├── backend/           # Express API
│   └── src/
│       ├── models/        # Mongoose schemas
│       ├── controllers/   # Route handlers
│       ├── routes/        # API routes
│       ├── middleware/    # Auth & RBAC middleware
│       ├── services/     # BRE logic
│       └── seed.ts       # Seed script
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)

### 1. Clone the repo
```bash
git clone <repo-url>
cd LMS
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```
PORT=5000
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/lms
JWT_SECRET=your_jwt_secret_here
```

Seed the database with default users:
```bash
npm run seed
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`
Backend runs on `http://localhost:5000`

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.com | Admin@123 |
| Sales | sales@lms.com | Sales@123 |
| Sanction | sanction@lms.com | Sanction@123 |
| Disbursement | disbursement@lms.com | Disbursement@123 |
| Collection | collection@lms.com | Collection@123 |
| Borrower | borrower@lms.com | Borrower@123 |

## Features

### Borrower Portal
1. **Sign Up / Login** - JWT auth with hashed passwords
2. **Personal Details** - BRE checks: age (23-50), salary (≥₹25,000), PAN format, employment status
3. **Salary Slip Upload** - PDF/JPG/PNG, max 5MB
4. **Loan Application** - Sliders for amount (₹50K-₹5L) and tenure (30-365 days), live SI calculator
5. **My Loans** - View all loan applications and their status

### Operations Dashboard
- **Sales** - View registered users who haven't applied yet (lead tracking)
- **Sanction** - Approve/reject applied loans with reason
- **Disbursement** - Mark sanctioned loans as disbursed
- **Collection** - Record payments with unique UTR, auto-close on full payment

### RBAC
- Backend middleware enforces role-based access on every API endpoint
- Frontend hides UI elements based on role
- Each executive sees only their module, Admin sees all

## Loan Status Lifecycle

```
APPLIED → SANCTIONED → DISBURSED → CLOSED
         ↘ REJECTED
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new borrower
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Borrower
- `POST /api/borrower/personal-details` - Submit personal details + BRE
- `POST /api/borrower/upload-salary-slip` - Upload salary slip
- `POST /api/borrower/apply-loan` - Apply for loan
- `GET /api/borrower/my-loans` - Get borrower's loans

### Dashboard
- `GET /api/dashboard/sales/leads` - Get leads (sales, admin)
- `GET /api/dashboard/sanction/applications` - Get pending apps (sanction, admin)
- `PUT /api/dashboard/sanction/:id/approve` - Approve loan
- `PUT /api/dashboard/sanction/:id/reject` - Reject loan
- `GET /api/dashboard/disbursement/loans` - Get sanctioned loans (disbursement, admin)
- `PUT /api/dashboard/disbursement/:id/disburse` - Disburse loan
- `GET /api/dashboard/collection/loans` - Get active loans (collection, admin)
- `POST /api/dashboard/collection/:id/payment` - Record payment
- `GET /api/dashboard/collection/:id/payments` - Get payment history
