```markdown
# 🚀 SaaSify-MERN

A modern **multi-tenant SaaS platform** built with the **MERN stack**.  
SaaSify-MERN enables organizations (tenants) to manage projects, collaborate with team members, and maintain secure isolated workspaces using **role-based access control and secure authentication**.

---

# 🌐 Live Demo

| Service | URL |
|-------|------|
| Frontend | https://saasify-mern-client.onrender.com |
| Backend API | https://saasify-mern.onrender.com |

---

# 📌 Project Description

**SaaSify-MERN** is a full-stack SaaS platform designed using a **multi-tenant architecture**. Each organization (tenant) operates inside its own isolated workspace with secure access controls.

The platform supports multiple user roles, secure authentication with **JWT and refresh tokens**, and a scalable backend architecture suitable for real-world SaaS applications.

The project demonstrates best practices for:

- Multi-tenant SaaS architecture
- Role-based access control (RBAC)
- Secure authentication
- Clean backend service architecture
- Scalable repository-based backend pattern
- Modern React frontend architecture

---

# ✨ Features

### 🏢 Multi-Tenant Architecture
- Separate workspaces for each organization
- Secure tenant-level data isolation

### 🔐 Secure Authentication
- JWT Access Tokens
- Refresh Tokens in **HTTP-only cookies**
- Automatic token refresh

### 👥 Role-Based Access Control (RBAC)
Three roles supported:

| Role | Permissions |
|-----|-------------|
| **Platform Admin** | Manage all tenants |
| **Tenant Admin** | Manage tenant members & projects |
| **Member** | Access tenant resources |

---

### 📊 SaaS Platform Features

- Tenant management
- Project management
- Member management
- Invite system
- Audit logs
- Analytics dashboard
- Saved views
- Tenant switching
- Secure API architecture

---

### 🎨 UI Features

- Modern SaaS dashboard layout
- Dark / Light mode
- Fully responsive design
- Tailwind-based UI
- Professional admin interface

---

# 🧰 Tech Stack

## Frontend

| Technology | Purpose |
|-----------|--------|
| **React** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Fast development build tool |
| **Tailwind CSS** | Styling |
| **React Router** | Routing |
| **TanStack Query** | API state management |

---

## Backend

| Technology | Purpose |
|-----------|--------|
| **Node.js** | Runtime |
| **Express.js** | API framework |
| **TypeScript** | Type safety |
| **MongoDB Atlas** | Cloud database |
| **Mongoose** | ODM |

---

## Authentication

- JWT Access Token
- Refresh Token with **HTTP-only cookies**
- Token rotation
- Secure authentication flow

---

# 🏗 Architecture Overview

```

Client (React + Vite)
│
│ HTTP Requests
▼
Server (Express API)
│
│ Mongoose ODM
▼
MongoDB Atlas

```

### Backend Architecture Layers

```

Routes
↓
Controllers
↓
Services
↓
Repositories
↓
Database (MongoDB)

```

This layered architecture improves:

- scalability
- maintainability
- testing
- separation of concerns

---

# 📁 Folder Structure

```

SAASIFY-MERN/
│
├─ client/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ layouts/
│  │  ├─ pages/
│  │  ├─ routes/
│  │  ├─ store/
│  │  └─ types/
│
├─ server/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ db/
│  │  ├─ middlewares/
│  │  ├─ models/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ validations/
│  │  └─ utils/

````

---


### 2️⃣ Install Dependencies

#### Install Backend Dependencies

```bash
cd server
npm install
```

#### Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

# 🔑 Environment Variables

## Backend (`server/.env`)

Example:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

CLIENT_ORIGIN=http://localhost:5173
COOKIE_NAME_REFRESH=saasify_refresh
```

---

## Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_URL=http://localhost:5173
```

---

# ▶️ Running the Project Locally

### Start Backend

```bash
cd server
npm run dev
```

Server will run on:

```
http://localhost:5000
```

---

### Start Frontend

```bash
cd client
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

# 📡 API Overview

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

---

### Tenant Management

```
GET    /api/tenants
POST   /api/tenants
PATCH  /api/tenants/:id
DELETE /api/tenants/:id
```

---

### Projects

```
GET    /api/projects
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

---

### Members

```
GET    /api/members
POST   /api/invites
PATCH  /api/members/:id
DELETE /api/members/:id
```

---

# ☁️ Deployment Guide (Render)

The project can be deployed using **Render**.

## Backend Deployment

1. Go to **Render Dashboard**
2. Create **New Web Service**
3. Connect GitHub repository
4. Configure settings

```
Root Directory: server
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
```

Add environment variables in **Render Environment Settings**.

---

## Frontend Deployment

1. Create **Static Site** on Render
2. Configure:

```
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
```

Add environment variables:

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

### React Router Fix

Add a rewrite rule:

```
Source: /*
Destination: /index.html
Action: Rewrite
```


# 🚀 Future Improvements

Possible future features:

* SSO Authentication
* Email notifications
* Activity timeline
* Real-time collaboration
* WebSocket notifications
* Advanced analytics
* Billing integration (Stripe)
* API rate limiting
* Organization settings

---

# 👨‍💻 Author

**Jakir Hossain**

GitHub:
[https://github.com/Jakirhossain80](https://github.com/Jakirhossain80)

---

# 📄 License

This project is licensed under the **MIT License**.

---

# ⭐ Support

If you like this project, please consider giving it a **star ⭐ on GitHub**.
It helps others discover the project and supports further development.

