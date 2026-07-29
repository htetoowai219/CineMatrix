# CineMatrix

**CineMatrix** is an end-to-end multi-tenant cinema booking and management platform built on the MERN stack (MongoDB, Express, React, Node.js).

The platform connects moviegoers with registered independent cinemas, enabling users to discover movies, inspect dynamic seat layouts, and reserve tickets. Cinema owners get a dedicated dashboard to manage rooms, schedule screenings, and manually verify payment receipts.

---

## Features

### Public Moviegoers App (`frontend-client`)

- **Movie Discovery:** Explore currently showing and upcoming movies.
- **Cinema Explorer:** Browse registered cinemas, view locations, photos, and active schedules.
- **Smart Screening Picker:** Filter screenings by proximity to current time or select specific movies/cinemas.
- **Interactive Seat Selection:** Dynamic room seat grid showing available, held, and occupied seats.
- **Ticket Booking & Receipt Upload:** Reserve seats and attach payment screenshots for owner verification.
- **Booking Status Tracker:** Monitor pending, confirmed, or rejected bookings.

### Owner & Admin Portal (`frontend-admin`)

- **Cinema Owner Dashboard:**
  - **Room & Seat Layout Setup:** Define screen rooms and dynamic grid dimensions (rows, columns, disabled seats).
  - **Screening Management:** Assign movies to rooms with custom dates, times, and ticket pricing.
  - **Booking Approvals:** Inspect uploaded payment screenshots, approve/reject bookings, and auto-release held seats.
- **Global Super Admin:**
  - **Cinema Onboarding:** Verify and approve new cinema registrations.
  - **Centralized Movie Catalog:** Manage global movie listings (title, duration, poster, status).

---

## Architecture & Tech Stack

The repository is structured as a **monorepo with isolated frontends** sharing a central Express API server:

- **Backend:** Node.js, Express.js, MongoDB (Mongoose ORM)
- **Authentication & Authorization:** JSON Web Tokens (JWT), Role-Based Access Control (RBAC)
- **Frontend Apps:** React.js, Tailwind CSS, React Router DOM
- **Media Storage:** Cloudinary (for cinema photos & payment receipt screenshots)

```text
cinema-platform/
├── backend/            # Express REST API & Database Schemas
├── frontend-client/    # Public Web App for Moviegoers
└── frontend-admin/     # Protected Dashboard for Cinema Owners & Admins
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection string)
- [Cloudinary Account](https://cloudinary.com/) (For image uploads)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cinematrix.git
cd cinematrix
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
FRONTEND_CLIENT=http://localhost:5173/
FRONTEND_ADMIN=http://localhost:5174/
MONGO_URI=your_mongodb_connection_strnig

ACCESS_TOKEN_SECRET=secret_for_access_token
ACCESS_TOKEN_EXP=1d
REFRESH_TOKEN_SECRET=secret_for_refresh_token
REFRESH_TOKEN_EXP=7d
```

Start the backend server:

```bash
npm run dev
```

### 3. Client Frontend Setup (`frontend-client`)

Open a new terminal window:

```bash
cd frontend-client
npm install
npm run dev
```

### 4. Admin Frontend Setup (`frontend-admin`)

Open another terminal window:

```bash
cd frontend-admin
npm install
npm run dev
```

---

## 🐳 Docker Setup

This project uses **Docker Compose** to run all services locally in isolated containers:

- **MongoDB** (Port `27018` mapped to container `27017`)
- **Express Backend** (Port `3000`)
- **Frontend Client** (Port `5173`)
- **Frontend Admin** (Port `5174`)

---

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

---

### Getting Started with Docker

#### 1. Configure Environment Variables

Ensure your `backend/.env` file exists with the necessary environment configurations:

```env
PORT=3000
MONGO_URI=mongodb://mongodb:27017/cinematrix
FRONTEND_CLIENT=http://localhost:5173
FRONTEND_ADMIN=http://localhost:5174
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXP=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXP=7d
```

> **Note:** Inside Docker, `MONGO_URI` uses the container service hostname `mongodb` instead of `localhost`.

#### 2. Run the Application

Start all services in hot-reload development mode with a single command:

```bash
docker compose up --build
```

Access the applications in your browser:

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Frontend Admin:** [http://localhost:5174](http://localhost:5174)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

---

### Useful Docker Commands

| Action                      | Command                          |
| :-------------------------- | :------------------------------- |
| **Start in background**     | `docker compose up -d`           |
| **Stop all services**       | `docker compose down`            |
| **Stop and wipe DB volume** | `docker compose down -v`         |
| **View logs for backend**   | `docker compose logs -f backend` |
| **Rebuild containers**      | `docker compose up --build`      |

--

## Role-Based Access Control (RBAC)

| Role               | Access Level  | Responsibilities                                                  |
| :----------------- | :------------ | :---------------------------------------------------------------- |
| **`customer`**     | Public Client | View movies/cinemas, select seats, submit booking requests        |
| **`cinema_owner`** | Dashboard     | Manage room layouts, schedule screenings, approve/reject bookings |
| **`admin`**        | Dashboard     | Approve cinema registrations, update central movie database       |

---

## 🗺️ Roadmap & Key Improvements

- [ ] Implement Redis-based temporary seat locking (10-minute payment timeout).
- [ ] Add automated TTL (Time-To-Live) index for expired pending bookings in MongoDB.
- [ ] Integrate TMDB (The Movie Database) API for auto-fetching movie metadata and trailers.
- [ ] Add email notification triggers when a booking is confirmed/rejected.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
