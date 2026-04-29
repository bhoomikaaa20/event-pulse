# 🎬 PulseReel — Real-time Event Analytics Platform

A full-stack, cloud-ready platform for tracking real-time popularity of movie/event releases through user engagement. Built with a cinematic dark UI, live analytics, and a full admin CMS.

---

## 📸 Feature Highlights

| Feature | Description |
|---|---|
| 🔥 Trending Algorithm | Score-based ranking using views, likes, and recency decay |
| 💬 Comments | Full CRUD comments per event with optimistic UI |
| ❤️ Likes | Toggle likes tracked as structured EventLog entries |
| 👁️ View Tracking | Anonymous view logging per event visit |
| 📊 Analytics Dashboard | Admin-only charts and engagement metrics |
| 🛡️ Role-based Auth | JWT auth with `user` and `admin` roles |
| 🖼️ Admin CMS | Create, edit, delete events with image upload |
| ⚡ Real-time Updates | Polling-based live refresh on event and trending pages |

---

## 🗂️ Project Structure

```
event-pulse/
├── client/          # React frontend (TanStack Start + Vite)
└── server/          # Express backend (TypeScript + MongoDB)
```

---

## 🖥️ Tech Stack

### Frontend — `client/`

| Tech | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TanStack Router | 1.x | File-based routing |
| TanStack Query | 5.x | Server state + caching |
| Tailwind CSS | v4 | Styling |
| shadcn/ui (Radix) | — | Component primitives |
| Recharts | 2.x | Analytics charts |
| Lucide React | — | Icons |
| Sonner | — | Toast notifications |
| Axios | 1.x | HTTP client |
| Vite | 7.x | Build tool |

### Backend — `server/`

| Tech | Version | Purpose |
|---|---|---|
| Node.js + Express | 5.x | HTTP server |
| TypeScript | 6.x | Type safety |
| MongoDB + Mongoose | 9.x | Database & ODM |
| JWT (jsonwebtoken) | 9.x | Authentication |
| bcryptjs | 3.x | Password hashing |
| Multer | 2.x | File/image uploads |
| ts-node-dev | 2.x | Dev hot-reload |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/event-pulse
JWT_SECRET=your_super_secret_key_here
```

### 3. Run Development Servers

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd server
npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd client
npm run dev
# Runs on http://localhost:3000
```

---

## 🔌 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | — | Register new user |
| `POST` | `/login` | — | Login, returns JWT |
| `GET` | `/me` | ✅ Bearer | Get current user + liked events |

### Events — `/api/events`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List all events with view/like counts |
| `GET` | `/trending` | — | Events ranked by trending score |
| `GET` | `/:id` | — | Single event detail |
| `POST` | `/` | Admin | Create event |
| `PUT` | `/:id` | Admin | Update event |
| `DELETE` | `/:id` | Admin | Delete event |
| `POST` | `/:id/view` | — | Log a view |
| `POST` | `/:id/like` | ✅ User | Toggle like |

### Comments — `/api/events/:id/comments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List comments for event |
| `POST` | `/` | ✅ User | Post a comment |
| `PUT` | `/:commentId` | ✅ Owner | Edit own comment |
| `DELETE` | `/:commentId` | ✅ Owner / Admin | Delete comment |

### Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Admin | Aggregated engagement dashboard data |

---

## 🗄️ Database Models

### `Event`
```
title, description, image_url, category, timestamps
```

### `User`
```
name, email, password (hashed), role (user | admin), timestamps
```

### `EventLog`
```
userId, eventId (ref Event), action (VIEW | LIKE | SHARE | COMMENT | ...), metadata, timestamps
```

### `Comment`
```
eventId (ref Event), userId (ref User), text (max 1000 chars), timestamps
```

---

## 🎨 Design System

The UI uses a **cinematic noir** palette built with `oklch` colour space:

| Token | Value | Usage |
|---|---|---|
| Background | `oklch(0.14 0.02 30)` | Page background |
| Primary | `oklch(0.78 0.18 55)` | Amber accent |
| Accent | `oklch(0.62 0.22 28)` | Red-orange (likes) |
| Trending | `oklch(0.7 0.22 35)` | Trending badge |
| Font Display | Bebas Neue | Headings |
| Font Body | Inter | Body text |

---

## 🔐 Authentication Flow

1. User signs up → redirected to login tab (token **not** auto-issued on signup)
2. User logs in → JWT stored in `localStorage`
3. Navbar updates **instantly** via a custom `authChange` DOM event — no page reload required
4. JWT is sent as `Authorization: Bearer <token>` on protected requests
5. Admin role gates: Admin Panel, event CMS, analytics dashboard, and comment deletion

---

## 📁 Key Frontend Routes

| Route | File | Description |
|---|---|---|
| `/` | `index.tsx` | Event listing + search |
| `/event/:eventId` | `event.$eventId.tsx` | Event detail + comments |
| `/auth` | `auth.tsx` | Login / Signup tabs |
| `/admin` | `admin.tsx` | Admin CMS + Analytics |

---

## 📦 Production Build

```bash
# Build backend
cd server
npm run build        # outputs to server/dist/
npm start            # runs compiled JS

# Build frontend
cd client
npm run build        # outputs to client/dist/
npm run preview      # preview production build
```

---

## 🧠 Trending Algorithm

Events are scored using:

```
score = (views × 0.6) + (likes × 0.4) − (hours_since_update × 0.5)
```

| Score | Label |
|---|---|
| > 80 | 🔥 Trending |
| > 40 | 🚀 Rising |
| ≤ 40 | 💀 Fading |

---

## 🛡️ Role Permissions

| Action | Guest | User | Admin |
|---|---|---|---|
| View events | ✅ | ✅ | ✅ |
| View comments | ✅ | ✅ | ✅ |
| Like events | ❌ | ✅ | ✅ |
| Post comments | ❌ | ✅ | ✅ |
| Edit own comments | ❌ | ✅ | ✅ |
| Delete any comment | ❌ | ❌ | ✅ |
| Create/Edit/Delete events | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |

---

## 📝 License

MIT
