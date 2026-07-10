# SmartBook AI 🚀

SmartBook AI is a production-ready, highly interactive SaaS appointment scheduling and intelligence platform designed for modern service businesses (Clinics, Salons, Spas, Consultants). 

Developed for a national hackathon, it aims to prevent scheduling friction, eliminate no-shows with predictive statistical modeling, dynamically distribute tasks using active load-balancing algorithms, and automate bookings via natural language processing.

---

## 🌟 Hackathon Features

1. **AI Natural Language Booking (Core 1)**:
   - Customers type requests like: `"dental checkup next Tuesday after 5 PM with Sarah"` or `"haircut tomorrow evening"`.
   - The system parses dates, times, categories, and staff parameters. It returns matching slots for one-click scheduling.
2. **Smart Staff Workload Balancing (Core 2)**:
   - Auto-allocates staff members based on skills, customer reviews, years of experience, and their active booking counts for the day to balance workload.
3. **Interactive Calendar Grid (Core 3)**:
   - Fully interactive week/month calendar panel powered by `FullCalendar`. Reschedule bookings by dragging and dropping them, instantly triggering backend conflict checks.
4. **FIFO Waitlist Auto-Promotion (Core 4)**:
   - When a slot is fully booked, clients can join the waitlist. The moment an appointment is cancelled, the first client in the queue is automatically promoted and notified.
5. **Statistical No-Show Risk Predictor (Core 7)**:
   - Evaluates client history (past cancellations, no-shows) and situational parameters (lead time, slot hour) to output a **Low, Medium, or High** probability indicator.
6. **Simulated Payment Gateway & Invoice Receipts (Core 5)**:
   - Integrates mock Razorpay checkouts, verifies payments, marks records as "PAID", and renders printable invoices.
7. **Role-Based Access Control**:
   - Customer, Employee, and Admin portals with tailored interfaces and permissions.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, FullCalendar, Framer Motion, Lucide Icons, React Router
- **Backend**: Node.js, Express, TypeScript, Zod, JWT Auth
- **Database**: PostgreSQL (Prisma ORM) — configured for **SQLite** by default for zero-setup local dev.

---

## 📂 Project Structure

```text
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── context/        # Auth Context & JWT Session Storage
│   │   ├── pages/          # Landing Page, Login, Register, Dashboards
│   │   ├── App.tsx         # Routing configuration & client route-guards
│   │   └── index.css       # Design System & full styling tokens
│   └── tailwind.config.js  # Styling themes
│
├── server/                 # Express Backend (Node.js)
│   ├── prisma/             # Schema definitions and migrations (SQLite)
│   ├── src/
│   │   ├── routes/         # Auth, appointments, services, analytics, payments, reviews
│   │   ├── services/       # Local AI NLP parser, no-show stats engine
│   │   ├── middlewares/    # JWT token verifying headers
│   │   ├── seed.ts         # Seeding script with dummy schedules
│   │   └── server.ts       # Main listener setup
```

---

## 🚀 Easy Local Setup

Follow these simple commands in your terminal to get the application running instantly without database server installs:

### 1. Install Monorepo Concurrently Script
In the root directory, run:
```bash
npm install
```

### 2. Install Client & Server Packages
Download all frontend and backend dependencies:
```bash
npm run install:all
```

### 3. Setup SQLite Database & Seeding
Create the database file, apply schema tables, and populate it with mock data:
```bash
npm run db:setup
```

### 4. Run Dev Servers
Start both the Vite frontend and Express server concurrently:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser to view the application!

---

## 🔑 Demo Login Credentials (Quick-Fills Enabled)

To simplify evaluation, the Login page includes **one-click tab helpers** that pre-fill credentials for these default profiles:

- **Customer Profile**:
  - Email: `customer@smartbook.ai`
  - Password: `password123`
- **Employee (Staff) Profile**:
  - Email: `sarah@smartbook.ai`
  - Password: `password123`
- **Admin Profile**:
  - Email: `admin@smartbook.ai`
  - Password: `password123`
