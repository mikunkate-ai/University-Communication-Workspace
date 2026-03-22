# UCW Frontend - React Application

A modern, responsive React-based frontend for the University Communication Workspace (UCW) platform.

## 🚀 Features

- **User Authentication**: Register, login, and profile management
- **Real-time Messaging**: Direct and group conversations with live typing indicators
- **Appointment Scheduling**: Book and manage appointments with lecturers
- **Task Management**: Track academic tasks with status updates
- **Project Collaboration**: Group projects with member management and submissions
- **Announcements**: Stay updated with university announcements
- **Dashboard**: Overview of appointments, tasks, and announcements
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:5000`

## 🔧 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables** in `.env.local`:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

## 🏃 Running the Application

### Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx              # Main layout with sidebar and header
│   │   └── common/                 # Reusable UI components
│   │       └── index.jsx           # Badge, Button, Card, Input, Modal, etc.
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state management
│   │   └── SocketContext.jsx       # Real-time Socket.io management
│   ├── hooks/
│   │   ├── index.js                # Task, Project, Announcement hooks
│   │   ├── useAppointment.js       # Appointment management hook
│   │   ├── useMessage.js           # Message management hook
│   │   └── useUser.js              # User data management hook
│   ├── pages/
│   │   ├── LoginPage.jsx           # User login
│   │   ├── RegisterPage.jsx        # User registration
│   │   ├── DashboardPage.jsx       # Main dashboard
│   │   ├── AppointmentsPage.jsx    # Appointment management
│   │   ├── MessagesPage.jsx        # Direct messaging
│   │   ├── ProjectsPage.jsx        # Project management
│   │   ├── TasksPage.jsx           # Task management
│   │   ├── AnnouncementsPage.jsx   # View announcements
│   │   └── ProfilePage.jsx         # User profile
│   ├── services/
│   │   └── apiService.js           # Centralized API client
│   ├── utils/
│   │   └── helpers.js              # Utility functions
│   ├── App.jsx                     # Main app component with routing
│   └── main.jsx                    # Application entry point
├── index.html                      # HTML entry point
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
└── .env.example                    # Environment variables template
```

## 🎨 Key Components

### Common Components
- **Badge**: Status and priority badges
- **Button**: Reusable button with variants
- **Card**: Container component for content
- **Input**: Form input field
- **TextArea**: Multi-line text input
- **Select**: Dropdown selection
- **Spinner**: Loading indicator
- **Alert**: Alert messages
- **Modal**: Dialog component

### Pages

#### Login & Register
- Email and password validation
- Role selection (Student/Lecturer)
- Form error handling

#### Dashboard
- Quick overview of appointments, tasks, and announcements
- Statistics cards
- Recent activity list

#### Appointments
- View all appointments
- Book new appointments with lecturers
- Check lecturer availability
- Update appointment status

#### Messages
- Real-time messaging with other users
- Conversation list
- Typing indicators
- Message history

#### Projects
- Create and manage project groups
- Add team members
- Submit project work
- View feedback

#### Tasks
- View assigned tasks
- Filter by status
- Update task progress
- Priority indicators

#### Announcements
- Browse all announcements
- Filter by category
- View announcement details
- Search functionality

#### Profile
- View user information
- Edit profile details
- Account settings
- Account status

## 🔄 Context & State Management

### AuthContext
Manages user authentication state:
- `user`: Current user object
- `token`: JWT authentication token
- `isAuthenticated`: Authentication status
- `login()`: User login function
- `register()`: User registration function
- `logout()`: User logout function
- `getCurrentUser()`: Fetch current user
- `updateProfile()`: Update user profile

### SocketContext
Manages real-time Socket.io connections:
- `socket`: Socket.io instance
- `isConnected`: Connection status
- `notifications`: Real-time notifications
- `joinConversation()`: Join chat room
- `sendTyping()`: Send typing indicator
- Event listeners for messages, tasks, announcements

## 🛠️ Custom Hooks

### useAppointment
```javascript
const { appointments, fetchAppointments, createAppointment, updateAppointmentStatus } = useAppointment();
```

### useMessage
```javascript
const { messages, conversations, fetchMessages, sendMessage, markAsRead } = useMessage();
```

### useTask
```javascript
const { tasks, fetchTasks, updateTaskStatus } = useTask();
```

### useProject
```javascript
const { projects, fetchProjects, createProject } = useProject();
```

### useUser
```javascript
const { user, fetchUser, fetchLecturers } = useUser();
```

### useAnnouncement
```javascript
const { announcements, fetchAnnouncements } = useAnnouncement();
```

## 📡 API Integration

All API calls are centralized in `services/apiService.js`:

```javascript
// User Services
userService.getAll(params)
userService.getById(id)
userService.getLecturers()
userService.update(id, data)

// Appointment Services
appointmentService.create(data)
appointmentService.getAll(params)
appointmentService.updateStatus(id, status)

// Message Services
messageService.send(data)
messageService.getConversations()
messageService.getDirectMessages(userId, params)

// Project Services
projectService.create(data)
projectService.getAll(params)
projectService.submit(id, data)

// Task Services
taskService.create(data)
taskService.updateStatus(id, status)

// Announcement Services
announcementService.getAll(params)
```

## 🎯 Utility Functions

Helper functions for common operations:

```javascript
// Date formatting
formatDate(date)           // "Jan 15, 2024"
formatDateTime(date)       // "Jan 15, 2024, 2:30 PM"
formatTime(date)           // "2:30 PM"
getRelativeTime(date)      // "2 hours ago"

// String utilities
truncateString(str, len)   // "This is a long string..."
getInitials(firstName, lastName) // "JD"

// Validation
isValidEmail(email)        // true/false
isValidPassword(password)  // true/false

// Status & Priority colors
getStatusColor(status)     // CSS classes
getPriorityColor(priority) // CSS classes
```

## 🔐 Authentication Flow

1. User visits the application
2. If not authenticated, redirected to login/register
3. User logs in with credentials
4. Backend returns JWT token
5. Token stored in localStorage
6. Token sent with all subsequent API requests
7. On app reload, token is restored from localStorage
8. Socket.io connection uses token for authentication

## 🚨 Error Handling

- API errors are caught and displayed as alerts
- Form validation errors are shown inline
- Loading states prevent duplicate submissions
- Network errors are handled gracefully

## 🧪 Testing

Run tests with:
```bash
npm run test
```

## 📦 Dependencies

Key dependencies:
- **React**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Socket.io-client**: Real-time communication
- **Tailwind CSS**: Styling
- **React Icons**: Icon library

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel
```

### Deploy to Netlify
```bash
npm run build
# Deploy dist/ folder
```

## 📱 Responsive Design

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

All components are fully responsive using Tailwind CSS breakpoints.

## 🔗 Related Documentation

- [Backend Documentation](../backend/README.md)
- [API Documentation](../backend/API.md)
- [Database Schema](../backend/DATABASE.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

This project is part of the University Communication Workspace (UCW) final year project.

## 🆘 Support

For issues or questions:
1. Check existing documentation
2. Review error messages
3. Check browser console for errors
4. Contact the development team
