import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppointment, useTask, useAnnouncement } from '../hooks';
import { Card, Spinner, Button, StatusBadge } from '../components/common';
import { formatDate, getInitials, getRelativeTime, getPriorityColor, isPast } from '../utils/helpers';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiAlertCircle, FiBookOpen } from 'react-icons/fi';

export default function DashboardPage() {
  const { user } = useAuth();
  const { appointments, fetchAppointments } = useAppointment();
  const { tasks, fetchTasks } = useTask();
  const { announcements, fetchAnnouncements } = useAnnouncement();
  const [loading, setLoading] = useState(true);
  const [annCountCleared, setAnnCountCleared] = useState(false);
  const annTimerRef = useRef(null);

  const isLecturer = user?.role === 'lecturer';

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      setAnnCountCleared(false);
      clearTimeout(annTimerRef.current);
      await Promise.all([
        fetchAppointments(),
        fetchTasks(),
        fetchAnnouncements(),
      ]);
      setLoading(false);
      annTimerRef.current = setTimeout(() => setAnnCountCleared(true), 10 * 60 * 1000);
    };
    loadData();
    return () => clearTimeout(annTimerRef.current);
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeAppointments = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  const gradientBg = isLecturer
    ? 'from-emerald-600 to-teal-700'
    : 'from-indigo-600 to-violet-700';

  const categoryStyles = {
    urgent:   { bg: 'bg-red-100 text-red-700',    label: 'Urgent' },
    deadline: { bg: 'bg-amber-100 text-amber-700', label: 'Deadline' },
    class:    { bg: 'bg-blue-100 text-blue-700',   label: 'Class' },
    general:  { bg: 'bg-gray-100 text-gray-600',   label: 'General' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-r ${gradientBg} rounded-2xl p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold mb-3 ${isLecturer ? 'bg-emerald-500/30' : 'bg-indigo-500/30'}`}>
            {isLecturer ? '👨‍🏫 Lecturer' : '👨‍🎓 Student'}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-white/70">
            {isLecturer
              ? "Here's an overview of your teaching activities."
              : "Here's an overview of your academic activities."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover className={`border-l-4 ${isLecturer ? 'border-l-emerald-500' : 'border-l-indigo-500'}`}>
          <p className="text-sm text-gray-500 mb-1">Upcoming Appointments</p>
          <p className={`text-3xl font-bold ${isLecturer ? 'text-emerald-600' : 'text-indigo-600'}`}>{activeAppointments.length}</p>
        </Card>
        <Card hover className={`border-l-4 ${isLecturer ? 'border-l-teal-500' : 'border-l-violet-500'}`}>
          <p className="text-sm text-gray-500 mb-1">Pending Tasks</p>
          <p className={`text-3xl font-bold ${isLecturer ? 'text-teal-600' : 'text-violet-600'}`}>
            {pendingTasks.length}
          </p>
        </Card>
        <Card hover className={`border-l-4 ${isLecturer ? 'border-l-amber-500' : 'border-l-purple-500'}`}>
          <p className="text-sm text-gray-500 mb-1">New Announcements</p>
          <p className={`text-3xl font-bold ${isLecturer ? 'text-amber-600' : 'text-purple-600'}`}>{annCountCleared ? 0 : announcements.length}</p>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Appointments</h2>
          {activeAppointments.length > 0 ? (
            <div className="space-y-3">
              {activeAppointments.slice(0, 3).map(apt => {
                const otherParty = isLecturer ? apt.studentId : apt.lecturerId;
                const otherName = otherParty
                  ? `${otherParty.firstName} ${otherParty.lastName}`
                  : isLecturer ? 'Student' : 'Lecturer';
                const otherInitials = otherParty
                  ? getInitials(otherParty.firstName, otherParty.lastName)
                  : '?';
                const bookedByName = apt.bookedBy
                  ? `${apt.bookedBy.firstName} ${apt.bookedBy.lastName}`
                  : null;

                return (
                  <div key={apt._id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isLecturer ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {otherInitials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 leading-none">{otherName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{isLecturer ? 'Student' : 'Lecturer'}</p>
                        </div>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{apt.title}</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FiCalendar size={11} className="text-gray-400 flex-shrink-0" />
                        <span>{formatDate(apt.scheduledDate)}</span>
                        <span className="text-gray-300">·</span>
                        <FiClock size={11} className="text-gray-400 flex-shrink-0" />
                        <span>{apt.scheduledTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FiMapPin size={11} className="text-gray-400 flex-shrink-0" />
                        <span>{apt.location || 'Online'}</span>
                      </div>
                      {bookedByName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FiUser size={11} className="text-gray-400 flex-shrink-0" />
                          <span>Booked by <span className="font-medium text-gray-600">{bookedByName}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No upcoming appointments</p>
          )}
          <Link to="/appointments">
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Appointments
            </Button>
          </Link>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Tasks</h2>
          {pendingTasks.length > 0 ? (
            <div className="space-y-3">
              {pendingTasks.slice(0, 3).map(task => {
                const overdue = isPast(task.deadline);
                const createdByName = task.createdBy
                  ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                  : null;

                return (
                  <div key={task._id} className={`p-4 border rounded-xl hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    {/* Header: title + priority badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{task.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Description preview */}
                    {task.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">{task.description}</p>
                    )}

                    {/* Details row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        <FiAlertCircle size={11} className="flex-shrink-0" />
                        <span>{overdue ? 'Overdue · ' : 'Due '}{formatDate(task.deadline)}</span>
                      </div>
                      {task.relatedCourse && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FiBookOpen size={11} className="flex-shrink-0" />
                          <span>{task.relatedCourse}</span>
                        </div>
                      )}
                      {createdByName && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FiUser size={11} className="flex-shrink-0" />
                          <span>{createdByName}</span>
                        </div>
                      )}
                    </div>

                    {/* Status pill */}
                    <div className="mt-2">
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No pending tasks</p>
          )}
          <Link to="/tasks">
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Tasks
            </Button>
          </Link>
        </Card>
      </div>

      {/* Latest Announcements */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Latest Announcements</h2>
        {announcements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {announcements.slice(0, 3).map(ann => {
              const cat = categoryStyles[ann.category] || categoryStyles.general;
              const authorName = ann.authorId
                ? `${ann.authorId.firstName} ${ann.authorId.lastName}`
                : null;

              return (
                <div key={ann._id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors flex flex-col gap-2">
                  {/* Category badge + time */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.bg}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-gray-400">{getRelativeTime(ann.createdAt)}</span>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{ann.title}</p>

                  {/* Content preview */}
                  <p className="text-xs text-gray-500 line-clamp-2 flex-1">{ann.content}</p>

                  {/* Author */}
                  {authorName && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100">
                      <FiUser size={10} />
                      <span>{authorName}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No announcements</p>
        )}
        <Link to="/announcements">
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Announcements
          </Button>
        </Link>
      </Card>
    </div>
  );
}
