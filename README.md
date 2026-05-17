# Employee Management System

A full-stack **HR management dashboard** with role-based access control, leave management, attendance tracking, polls, and analytics. Built with **React 19**, **ASP.NET Core Web API**, and **Entity Framework Core**.

> **Live Demo:** [employee-app-liard-five.vercel.app](https://employee-app-liard-five.vercel.app)
> **Backend API:** <<paste your Render URL here>>

---

## Features

### 👥 Employee Management
- Create, read, update, and delete employee records
- Profile management with role assignment
- Department & designation tracking

### 🔐 Role-Based Access Control
- Separate dashboards for Admin, Manager, and Employee roles
- Permissions enforced on both API and UI layers
- Secure authentication with JWT tokens

### 📅 Leave Management
- Apply for leave with date range and reason
- Manager approval / rejection workflow
- Leave balance tracking per employee
- History of approved & rejected requests

### 🕘 Attendance Tracking
- Daily check-in / check-out
- Attendance history with filters
- Manager view of team attendance

### 📊 HR Dashboard & Analytics
- Real-time charts powered by Recharts
- Headcount, attendance, and leave trend visualizations
- Role-specific dashboards (Admin sees company-wide, Employee sees personal)

### 🗳️ Polls
- Internal polls for team engagement
- Live vote count and results

---

## Tech Stack

### Frontend (`employee-frontend/`)
- **React 19** with **Vite** build tooling
- **Axios** for API communication
- **Recharts** for data visualization
- Deployed on **Vercel**

### Backend (`EmployeeApi/`)
- **ASP.NET Core Web API** (.NET 8 / 10)
- **Entity Framework Core** with code-first migrations
- **<<SQL Server / PostgreSQL — fill in>>** database
- Service-layer architecture (`Services/` folder)
- **Dockerized** for portable deployment
- Deployed on **Render**

---

## Screenshots

<!-- TODO: add 2-3 screenshots here. Take them from the live Vercel app. -->
<!-- Format: ![Description](path/to/screenshot.png) -->

| Login | Dashboard | Leave Approval |
|-------|-----------|----------------|
| _coming soon_ | _coming soon_ | _coming soon_ |

---

## Run Locally

### Prerequisites
- Node.js 20+
- .NET 8 SDK (or 10)
- A SQL database (or use the dockerized version)

### Backend
```bash
cd EmployeeApi
dotnet restore
dotnet ef database update
dotnet run
```
The API runs at `https://localhost:5001`.

### Frontend
```bash
cd employee-frontend
npm install
npm run dev
```
The app runs at `http://localhost:5173`.

### Run backend with Docker
```bash
cd EmployeeApi
docker build -t employee-api .
docker run -p 8080:8080 employee-api
```

---

## Project Structure

```
employee-app/
├── EmployeeApi/                 # ASP.NET Core backend
│   ├── Controllers/             # REST endpoints
│   ├── Services/                # Business logic
│   ├── Models/                  # Entity definitions
│   ├── Data/                    # EF Core DbContext
│   ├── Migrations/              # EF Core migrations
│   ├── Dockerfile               # Container configuration
│   └── Program.cs               # Startup & DI configuration
│
└── employee-frontend/           # React 19 frontend
    ├── src/
    │   ├── components/          # Reusable UI components
    │   ├── pages/               # Route-level views
    │   └── services/            # API client (axios)
    ├── vite.config.js
    └── package.json
```

---

## What This Project Demonstrates

- Full-stack development with modern React + .NET
- RESTful API design with proper status codes & resource routing
- Role-based authorization (multi-role enterprise app)
- Relational data modeling (Employees, Leaves, Attendance, Polls)
- EF Core code-first migrations
- Containerization with Docker
- Cloud deployment across two providers (Vercel + Render)
- Frontend state & data fetching patterns
- Data visualization with Recharts

---

## About the Author

**Abhinav Ponnakkari** — .NET developer based in India, available for freelance work.

- 📧 Email: clashabhinav7@gmail.com
- 💼 LinkedIn: <<add your LinkedIn URL>>
- 🐙 GitHub: [@abhinav-ponnakkari](https://github.com/abhinav-ponnakkari)

Open to freelance projects in:
- ASP.NET Core REST APIs
- React + .NET full-stack web apps
- Legacy .NET Framework → .NET 8/10 migrations
- Database design with SQL Server / PostgreSQL & EF Core
- Third-party API integrations (Stripe, Twilio, etc.)
