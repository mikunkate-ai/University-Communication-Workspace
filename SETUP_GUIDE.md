# 🚀 Quick Start Guide - University Communication Workspace

## Prerequisites
Make sure you have installed:
- **Node.js** (v16+) - Download from https://nodejs.org/
- **MongoDB** - Either local installation or MongoDB Atlas account
- **Git** (optional)

## ⚡ Quick Setup (5 minutes)

### Option 1: Manual Setup (Recommended for first time)

#### 1. Install Backend Dependencies
```bash
cd c:\Users\Onika\Documents\Finalyearproject\backend
npm install
```

#### 2. Install Frontend Dependencies
```bash
cd c:\Users\Onika\Documents\Finalyearproject\frontend
npm install
```

#### 3. Start MongoDB
**Windows - If installed locally:**
```bash
mongod
```

**Or if using MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update `MONGODB_URI` in `backend/.env`

#### 4. Start Backend Server (Terminal 1)
```bash
cd c:\Users\Onika\Documents\Finalyearproject\backend
npm start
```

Expected output:
```
✓ Server running on http://localhost:5000
✓ MongoDB connected
✓ Socket.io initialized
```

#### 5. Start Frontend Server (Terminal 2)
```bash
cd c:\Users\Onika\Documents\Finalyearproject\frontend
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:3000
```

#### 6. Open in Browser
Go to: **http://localhost:3000**

---

## 📝 Testing the Application

### Create a Test Account
1. Click **"Sign up"** on the login page
2. Fill in:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Password: `Test123!`
   - Role: `Student` or `Lecturer`
3. Click **Create Account**
4. You should be logged in to the Dashboard

### Test Features
- **Dashboard**: View overview of appointments and tasks
- **Appointments**: Click "Book Appointment" to schedule
- **Messages**: Real-time messaging with other users
- **Projects**: Create and manage group projects
- **Tasks**: View and update task status
- **Announcements**: Read university announcements
- **Profile**: Edit your profile information

---

## 🔧 Troubleshooting

### Issue: "npm not found"
- Install Node.js from https://nodejs.org/
- Restart PowerShell/Terminal

### Issue: "Port 3000 already in use"
Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 3001,  // Change to 3001
  // ...
}
```

### Issue: "Port 5000 already in use"
Edit `backend/.env`:
```
PORT=5001
```

### Issue: "MongoDB connection error"
**Option A: Use Local MongoDB**
- Install MongoDB: https://www.mongodb.com/try/download/community
- Make sure `mongod` is running
- Update `.env`: `MONGODB_URI=mongodb://localhost:27017/ucw_db`

**Option B: Use MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create cluster
- Get connection string
- Update `.env`: `MONGODB_URI=<your-connection-string>`

### Issue: "Cannot find module"
Run this in both backend and frontend folders:
```bash
npm install
```

---

## 📂 Project Structure

```
Finalyearproject/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server entry
│   │   ├── config/            # Database config
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, error handling
│   │   └── services/          # Business logic
│   ├── package.json
│   ├── .env                   # Configuration (created)
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main component
│   │   ├── main.jsx           # Entry point
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── context/           # State management
│   │   ├── services/          # API client
│   │   └── utils/             # Helper functions
│   ├── package.json
│   ├── .env                   # Configuration (created)
│   ├── vite.config.js         # Build config
│   └── README.md
│
├── BACKEND_SUMMARY.md
├── FRONTEND_SUMMARY.md
└── SETUP_GUIDE.md             # This file
```

---

## 🎯 What's Included

### Backend Features
✅ User authentication with JWT
✅ Appointment scheduling system
✅ Real-time messaging via Socket.io
✅ Project management
✅ Task tracking
✅ Announcements system
✅ Notifications
✅ Error handling & validation

### Frontend Features
✅ React 18 with Vite
✅ Responsive design (Tailwind CSS)
✅ Real-time messaging
✅ Form validation
✅ State management with Context API
✅ 11 reusable components
✅ 9 fully functional pages
✅ Protected routes

---

## 📱 Features Overview

### Login & Registration
- Email validation
- Password strength checking
- Role selection (Student/Lecturer)

### Dashboard
- Overview of appointments
- Recent tasks
- Announcements feed
- Statistics

### Appointments
- View all appointments
- Book appointments with lecturers
- Check lecturer availability
- Update appointment status

### Messages
- Real-time chat
- Conversation list
- Message history
- Typing indicators

### Projects
- Create project groups
- Add team members
- Submit project work
- View feedback

### Tasks
- View assigned tasks
- Filter by status
- Update task progress
- Priority tracking

### Announcements
- Browse announcements
- Filter by category
- View details
- Search functionality

### Profile
- View user information
- Edit profile
- Account settings
- Change password (coming soon)

---

## 🔗 API Endpoints

All API calls go to: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `GET /users/lecturers` - Get all lecturers

### Appointments
- `POST /appointments` - Create appointment
- `GET /appointments` - Get all appointments
- `PUT /appointments/:id` - Update appointment

### Messages
- `POST /messages` - Send message
- `GET /messages/:userId` - Get conversation
- `GET /conversations` - Get all conversations

### Projects
- `POST /projects` - Create project
- `GET /projects` - Get all projects
- `PUT /projects/:id` - Update project

### Tasks
- `POST /tasks` - Create task
- `GET /tasks` - Get all tasks
- `PUT /tasks/:id/status` - Update task status

### Announcements
- `GET /announcements` - Get all announcements
- `POST /announcements` - Create announcement (admin)

---

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  password: String (hashed),
  role: String (Student/Lecturer/Admin),
  department: String,
  contactInfo: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Appointments Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,
  lecturerId: ObjectId,
  title: String,
  scheduledDate: Date,
  scheduledTime: String,
  duration: Number,
  location: String,
  status: String,
  createdAt: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  content: String,
  timestamp: Date,
  isRead: Boolean
}
```

---

## 🚀 Deployment (Future)

### Frontend Deployment
```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or GitHub Pages
```

### Backend Deployment
- Deploy to Heroku, Railway, or AWS
- Update `MONGODB_URI` to use MongoDB Atlas
- Update `CORS_ORIGIN` to your frontend URL
- Set `NODE_ENV=production`

---

## 📞 Need Help?

1. **Check logs** - Look at console output for error messages
2. **Check ports** - Make sure 3000, 5000, and 27017 are not in use
3. **Database** - Verify MongoDB is running
4. **Dependencies** - Run `npm install` in both folders
5. **Environment** - Check `.env` files are configured correctly

---

## ✨ Next Steps

1. ✅ Setup complete!
2. 📱 Explore the application
3. 🧪 Test all features
4. 🎨 Customize as needed
5. 🚀 Deploy when ready

**Happy coding!** 🎉
