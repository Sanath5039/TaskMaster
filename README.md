# TaskMaster

A full-stack task management app built with the MERN stack.

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite, React Router, Axios |
| Backend   | Node.js, Express                    |
| Database  | MongoDB Atlas via Mongoose          |
| Auth      | JWT + bcrypt                        |

## Project Structure

```
task-master/
├── server/               # Node.js + Express backend
│   ├── config/
│   │   └── db.js         # MongoDB connection
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── app.js
│   ├── server.js
│   └── .env.example
│
└── client/               # React + Vite frontend
    └── src/
        ├── api/
        │   └── axios.js
        ├── components/
        │   └── ProtectedRoute.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── Dashboard.jsx
        ├── App.jsx
        └── main.jsx
```

## Setup Instructions

### 1. MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster
2. Create a database user with read/write access
3. Whitelist your IP (or use `0.0.0.0/0` for development)
4. Copy your **Connection String**

### 2. Backend

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskmaster?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
```

Install dependencies and start:
```bash
npm install
npm run dev
```

The API will be available at `http://localhost:5000`

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## API Reference

| Method | Endpoint             | Access   | Description       |
|--------|----------------------|----------|-------------------|
| POST   | /api/auth/register   | Public   | Register new user |
| POST   | /api/auth/login      | Public   | Login user        |
| GET    | /api/auth/me         | Private  | Get current user  |

### Example Requests

**Register**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Get Current User**
```
GET /api/auth/me
Authorization: Bearer <your_jwt_token>
```

