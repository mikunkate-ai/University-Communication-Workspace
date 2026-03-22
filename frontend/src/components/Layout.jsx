import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  FiMenu, FiX, FiLogOut, FiBell, FiMessageSquare,
  FiCheckSquare, FiAlertCircle, FiFolder, FiCalendar,
} from 'react-icons/fi';
import { BiHome, BiCalendar, BiChat, BiBookmark, BiTask, BiNews, BiShield } from 'react-icons/bi';
import { Modal, Button } from './common';
import { getRelativeTime } from '../utils/helpers';

// Notification type config (icon, colors, label builder)
const NOTIF_CONFIG = {
  message: {
    icon: FiMessageSquare,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    cardBorder: 'border-l-blue-400',
    cardBg: 'bg-blue-50/40',
    getLabel: (n) => `New message from ${n.data?.senderName || 'someone'}`,
    getPreview: (n) => n.data?.preview || n.data?.content || '',
  },
  task: {
    icon: FiCheckSquare,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    cardBorder: 'border-l-amber-400',
    cardBg: 'bg-amber-50/40',
    getLabel: (n) => {
      if (n.data?.action === 'status_updated') {
        const name = n.data?.assignedTo?.[0]?.firstName || 'A student';
        return `${name} updated task: ${n.data?.title || 'Untitled task'}`;
      }
      return `New task assigned: ${n.data?.title || 'Untitled task'}`;
    },
    getPreview: (n) => n.data?.description || '',
  },
  announcement: {
    icon: FiAlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    cardBorder: 'border-l-red-400',
    cardBg: 'bg-red-50/40',
    getLabel: (n) => `Announcement: ${n.data?.title || 'New announcement'}`,
    getPreview: (n) => n.data?.content?.substring(0, 70) || '',
  },
  project: {
    icon: FiFolder,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    cardBorder: 'border-l-purple-400',
    cardBg: 'bg-purple-50/40',
    getLabel: (n) => `Project update: ${n.data?.title || 'New submission'}`,
    getPreview: (n) => '',
  },
  appointment: {
    icon: FiCalendar,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    cardBorder: 'border-l-teal-400',
    cardBg: 'bg-teal-50/40',
    getLabel: (n) => {
      const title = n.data?.title || 'Appointment';
      const action = n.data?.action;
      if (action === 'confirmed') return `Appointment confirmed: ${title}`;
      if (action === 'declined') return `Appointment declined: ${title}`;
      if (action === 'cancelled') return `Appointment cancelled: ${title}`;
      if (action === 'completed') return `Appointment completed: ${title}`;
      return `New appointment booked: ${title}`;
    },
    getPreview: (n) => {
      const d = n.data;
      if (!d?.scheduledDate) return '';
      return `${new Date(d.scheduledDate).toLocaleDateString()} at ${d.scheduledTime || ''}`.trim();
    },
  },
};

const DEFAULT_NOTIF = {
  icon: FiBell,
  iconBg: 'bg-gray-100',
  iconColor: 'text-gray-500',
  cardBorder: 'border-l-gray-300',
  cardBg: 'bg-gray-50/40',
  getLabel: () => 'New notification',
  getPreview: () => '',
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, clearNotifications } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const isLecturer = user?.role === 'lecturer';

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const menuItems = user?.role === 'administrator'
    ? [{ path: '/admin', label: 'Admin Panel', icon: BiShield }]
    : [
        { path: '/', label: 'Dashboard', icon: BiHome },
        { path: '/appointments', label: 'Appointments', icon: BiCalendar },
        { path: '/messages', label: 'Messages', icon: BiChat },
        { path: '/projects', label: 'Projects', icon: BiBookmark },
        { path: '/tasks', label: 'Tasks', icon: BiTask },
        { path: '/announcements', label: 'Announcements', icon: BiNews },
      ];

  // Role-specific colors — all static Tailwind classes
  const sidebarBg = isLecturer
    ? 'bg-gradient-to-b from-emerald-950 to-emerald-900'
    : 'bg-gradient-to-b from-indigo-950 to-indigo-900';
  const activeNavBg = isLecturer ? 'bg-emerald-600/20 text-emerald-400' : 'bg-indigo-600/20 text-indigo-400';
  const activeNavBorder = isLecturer ? 'border-l-emerald-400' : 'border-l-indigo-400';
  const hoverBg = isLecturer ? 'hover:bg-emerald-800/30' : 'hover:bg-indigo-800/30';
  const headerBorder = isLecturer ? 'border-t-emerald-500' : 'border-t-indigo-500';
  const badgeBg = isLecturer ? 'bg-emerald-500' : 'bg-indigo-500';
  const headerAccent = isLecturer
    ? 'from-emerald-600 to-teal-600'
    : 'from-indigo-600 to-violet-600';
  const clearBtnColor = isLecturer
    ? 'text-emerald-600 hover:text-emerald-700'
    : 'text-indigo-600 hover:text-indigo-700';

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${sidebarBg} text-white transition-all duration-300 flex flex-col shadow-xl`}>
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 bg-gradient-to-br ${isLecturer ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-violet-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <div className="leading-tight">
                <span className="block text-[0.9rem] font-bold tracking-tight">University Communication</span>
                <span className="block text-[0.85rem] font-medium text-white/60">Workspace</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? `${activeNavBg} border-l-3 ${activeNavBorder}`
                    : `text-gray-400 ${hoverBg} hover:text-white`
                }`}
              >
                <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Profile Link */}
        <div className="p-3 border-t border-white/5">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${hoverBg} text-gray-400 hover:text-white transition-all`}
          >
            <div className={`w-8 h-8 bg-gradient-to-br ${isLecturer ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-violet-500'} rounded-lg flex items-center justify-center text-xs font-bold text-white`}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`bg-slate-900 shadow-lg px-6 py-3.5 flex justify-between items-center border-t-2 ${headerBorder}`}>
          <h2 className="text-lg font-bold text-white">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Profile'}
          </h2>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
              >
                <FiBell size={20} />
                {notifications.length > 0 && (
                  <span className={`absolute top-1 right-1 ${badgeBg} text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse`}>
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 animate-fade-in overflow-hidden">
                  {/* Panel Header */}
                  <div className={`bg-gradient-to-r ${headerAccent} px-5 py-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base">Notifications</h3>
                        <p className="text-white/70 text-xs mt-0.5">
                          {notifications.length > 0
                            ? `${notifications.length} new update${notifications.length !== 1 ? 's' : ''}`
                            : 'All caught up!'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={() => clearNotifications()}
                            className="text-xs bg-white/20 hover:bg-white/30 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="p-3 space-y-2">
                        {notifications.map((notif, idx) => {
                          const cfg = NOTIF_CONFIG[notif.type] || DEFAULT_NOTIF;
                          const Icon = cfg.icon;
                          const preview = cfg.getPreview(notif);
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border-l-4 ${cfg.cardBorder} ${cfg.cardBg} hover:brightness-95 transition-all`}
                            >
                              {/* Icon */}
                              <div className={`w-9 h-9 ${cfg.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                <Icon size={16} className={cfg.iconColor} />
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-800 leading-snug">
                                  {cfg.getLabel(notif)}
                                </p>
                                {preview && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                    {preview}
                                  </p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                  {getRelativeTime(notif.timestamp)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                          <FiBell size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-semibold text-sm">You're all caught up!</p>
                        <p className="text-gray-400 text-xs mt-1">New notifications will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-red-400"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        onClose={() => setShowLogoutModal(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleLogoutConfirm}>Logout</Button>
          </>
        }
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiLogOut size={24} className="text-red-500" />
          </div>
          <p className="text-gray-700 font-medium mb-1">Are you sure you want to logout?</p>
          <p className="text-sm text-gray-500">You will need to log in again to access your account.</p>
        </div>
      </Modal>
    </div>
  );
}
