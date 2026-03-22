# University Communication Workspace (UCW) - Backend API

A comprehensive backend API for managing academic communication, appointments, project supervision, and task management in a university setting.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
- [Real-Time Features](#real-time-features)
- [Database Schema](#database-schema)
- [Authentication](#authentication)

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (Cloud or Local)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on `.env.example`
```bash
cp .env.example .env
```

4. Update `.env` with your configuration values

5. Start the server
```bash
npm run dev  # Development with nodemon
# or
npm start   # Production
```

The server will run on `http://localhost:5000`

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/             # Business logic for each feature
│   ├── middleware/              # Auth, error handling, validation
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # API route definitions
│   ├── services/               # Reusable services (future)
│   ├── utils/                  # Utility functions (future)
│   └── server.js               # Main application file
├── tests/                       # Unit and integration tests
├── .env.example                 # Environment variables template
└── package.json
```

## Environment Setup

Create a `.env` file with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ucw_db

# JWT
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Socket.io
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Users
- `GET /api/users` - Get all users (with search/filter)
- `GET /api/users/:id` - Get specific user
- `GET /api/users/lecturers` - Get all lecturers
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Deactivate user account

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments` - Get user's appointments
- `GET /api/appointments/:id` - Get specific appointment
- `GET /api/appointments/lecturer/:lecturerId/availability` - Check lecturer availability
- `PUT /api/appointments/:id` - Update appointment details
- `PUT /api/appointments/:id/status` - Confirm/decline appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Messages
- `POST /api/messages` - Send direct message
- `POST /api/messages/group/:groupId` - Send group message
- `GET /api/messages/conversations` - Get conversation list
- `GET /api/messages/conversation/:userId` - Get messages with user
- `GET /api/messages/group/:groupId` - Get group messages
- `GET /api/messages/unread/count` - Get unread message count
- `PUT /api/messages/:id/read` - Mark message as read
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Projects
- `POST /api/projects` - Create project group (lecturers)
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Archive project
- `POST /api/projects/:id/members` - Add member to project
- `POST /api/projects/:id/submissions` - Submit project work
- `GET /api/projects/:id/submissions` - Get project submissions
- `POST /api/projects/submissions/:id/feedback` - Add feedback to submission

### Tasks
- `POST /api/tasks` - Create task (lecturers)
- `GET /api/tasks` - Get user's tasks
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task

### Announcements
- `POST /api/announcements` - Create announcement
- `GET /api/announcements` - Get announcements
- `GET /api/announcements/:id` - Get specific announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear/read` - Clear read notifications

## Real-Time Features

The backend uses Socket.io for real-time communication. Available events:

### Client → Server Events
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `join_group` - Join a group chat room
- `leave_group` - Leave a group chat room
- `typing` - User started typing
- `stop_typing` - User stopped typing

### Server → Client Events
- `new_message` - Receive new message
- `message_delivered` - Message delivery confirmation
- `message_read` - Message read receipt
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `user_typing` - Someone is typing
- `user_stopped_typing` - Someone stopped typing
- `new_announcement` - New announcement posted
- `task_created` - New task assigned
- `task_status_updated` - Task status changed
- `project_submission` - Project work submitted

## Database Schema

### User
```javascript
{
  email, password, role, firstName, lastName,
  department, profilePicture, contactInfo,
  isActive, timestamps
}
```

### Appointment
```javascript
{
  studentId, lecturerId, title, description,
  scheduledDate, scheduledTime, duration,
  status, location, notes, timestamps
}
```

### Message
```javascript
{
  senderId, recipientId, groupId, messageType,
  content, attachments, isRead, readAt,
  editedAt, deletedAt, timestamp
}
```

### ProjectGroup
```javascript
{
  groupName, projectTitle, description,
  supervisorId, members, status,
  startDate, deadline, timestamps
}
```

### ProjectSubmission
```javascript
{
  projectGroupId, submittedBy, title,
  description, fileUrl, version, feedback,
  status, submittedAt, timestamps
}
```

### Task
```javascript
{
  createdBy, assignedTo, title, description,
  deadline, status, priority, relatedCourse,
  relatedProject, attachments, completedAt, timestamps
}
```

### Announcement
```javascript
{
  authorId, title, content, category,
  targetAudience, targetGroupId, attachments,
  isActive, expiryDate, timestamps
}
```

### Notification
```javascript
{
  userId, type, title, message, referenceId,
  referenceType, isRead, readAt, timestamps
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Flow
1. User sends credentials to `POST /api/auth/login`
2. Server returns JWT token
3. Client stores token in localStorage/sessionStorage
4. Client includes token in Authorization header: `Bearer <token>`

### Protected Routes
All protected routes require the `Authorization: Bearer <token>` header.

### Token Expiration
Tokens expire after the duration specified in `JWT_EXPIRE` environment variable (default: 7 days).

## Error Handling

All endpoints return consistent JSON responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Role-Based Access Control

- **Student**: Can book appointments, submit projects, view tasks, send messages
- **Lecturer**: Can create appointments slots, manage projects, assign tasks, post announcements
- **Administrator**: Full access to all features and user management

## Development

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch   # Run tests in watch mode
```

### Code Quality
- Use meaningful variable names
- Add comments for complex logic
- Follow REST conventions
- Keep controllers focused on business logic

## Deployment

### Recommended Platforms
- **Backend**: Heroku, AWS EC2, DigitalOcean, Railway
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3 or Cloudinary

### Pre-deployment Checklist
- [ ] Set `NODE_ENV=production` in environment
- [ ] Update `JWT_SECRET` with strong value
- [ ] Configure `CORS_ORIGIN` for frontend URL
- [ ] Set up MongoDB Atlas for production
- [ ] Configure MongoDB backups
- [ ] Enable HTTPS
- [ ] Set up logging and monitoring

## Future Enhancements

- [ ] Email notifications integration
- [ ] SMS notifications
- [ ] Video conferencing integration
- [ ] File versioning system
- [ ] Advanced plagiarism detection
- [ ] Analytics dashboard
- [ ] Mobile app support
- [ ] Offline-first capability

## License

ISC
