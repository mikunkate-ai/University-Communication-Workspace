import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userService, announcementService, configService } from '../services/apiService';

const TABS = [
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'domains', label: 'Domains', icon: '🏢' },
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'class', label: 'Class' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: '🌐 Everyone' },
  { value: 'students', label: '🎓 Students Only' },
  { value: 'lecturers', label: '👨‍🏫 Lecturers Only' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('announcements');

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', content: '', category: 'general', targetAudience: 'all',
  });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementError, setAnnouncementError] = useState('');

  // Config state
  const [config, setConfig] = useState({ departments: [], groups: [] });
  const [newDepartment, setNewDepartment] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [configLoading, setConfigLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // userId currently being actioned
  const [confirmDialog, setConfirmDialog] = useState(null); // { userId, action }

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'administrator') {
      navigate('/');
    }
  }, [user, navigate]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await announcementService.getAll();
      setAnnouncements(res.data.announcements || []);
    } catch { /* silent */ }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const res = await configService.getConfig();
      setConfig(res.data.config);
    } catch { /* silent */ }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await userService.getAll({ search: userSearch || undefined });
      setUsers((res.data.users || []).filter(u => u.role !== 'administrator'));
    } catch { /* silent */ }
    setUsersLoading(false);
  }, [userSearch]);

  useEffect(() => { loadAnnouncements(); loadConfig(); }, [loadAnnouncements, loadConfig]);
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab, loadUsers]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      setAnnouncementError('Title and content are required.');
      return;
    }
    setPostingAnnouncement(true);
    setAnnouncementError('');
    try {
      await announcementService.create({ ...announcementForm, authorId: user._id });
      setAnnouncementMsg('✅ Announcement posted successfully!');
      setAnnouncementForm({ title: '', content: '', category: 'general', targetAudience: 'all' });
      loadAnnouncements();
      setTimeout(() => setAnnouncementMsg(''), 4000);
    } catch (err) {
      setAnnouncementError(err.response?.data?.message || 'Failed to post announcement.');
    }
    setPostingAnnouncement(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await announcementService.delete(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch { /* silent */ }
  };

  const handleAddConfig = async (type, item, setter) => {
    if (!item.trim()) return;
    setConfigLoading(true);
    try {
      await configService.addItem(type, item.trim());
      await loadConfig();
      setter('');
    } catch { /* silent */ }
    setConfigLoading(false);
  };

  const handleRemoveConfig = async (type, item) => {
    if (!window.confirm(`Delete ${item}?`)) return;
    setConfigLoading(true);
    try {
      await configService.removeItem(type, item);
      await loadConfig();
    } catch { /* silent */ }
    setConfigLoading(false);
  };

  const execUserAction = async (userId, action) => {
    setActionLoading(userId);
    try {
      if (action === 'deactivate') {
        await userService.delete(userId, false);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: false } : u));
      } else if (action === 'reactivate') {
        await userService.reactivate(userId);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: true } : u));
      } else if (action === 'delete') {
        await userService.delete(userId, true);
        setUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch { /* silent */ }
    setActionLoading(null);
    setConfirmDialog(null);
  };

  const categoryColors = {
    general: 'bg-indigo-100 text-indigo-700',
    urgent: 'bg-red-100 text-red-700',
    deadline: 'bg-amber-100 text-amber-700',
    class: 'bg-emerald-100 text-emerald-700',
  };

  const audienceLabels = { all: 'Everyone', students: 'Students', lecturers: 'Lecturers' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-300 text-sm mt-0.5">Manage announcements and user accounts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/20 bg-slate-800/40">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600/30 text-indigo-200 border-b-4 border-indigo-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/10 border-b-4 border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── ANNOUNCEMENTS TAB ─── */}
        {activeTab === 'announcements' && (
          <div className="p-6 space-y-6">
            {/* Post form */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Post New Announcement</h2>
              {announcementMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm">
                  {announcementMsg}
                </div>
              )}
              {announcementError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
                  {announcementError}
                </div>
              )}
              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <input
                  placeholder="Announcement title…"
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
                <textarea
                  placeholder="Write your announcement here…"
                  rows={4}
                  value={announcementForm.content}
                  onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none font-medium"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold tracking-wider uppercase text-gray-300 mb-2">Category</label>
                    <select
                      value={announcementForm.category}
                      onChange={e => setAnnouncementForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    >
                      {CATEGORY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className="bg-slate-800 text-white">{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-wider uppercase text-gray-300 mb-2">Send To</label>
                    <select
                      value={announcementForm.targetAudience}
                      onChange={e => setAnnouncementForm(p => ({ ...p, targetAudience: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    >
                      {AUDIENCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className="bg-slate-800 text-white">{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={postingAnnouncement}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postingAnnouncement ? 'Posting…' : '📢 Post Announcement'}
                </button>
              </form>
            </div>

            {/* Announcements list */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Past Announcements</h2>
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No announcements yet.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.map(a => (
                    <div key={a._id} className="flex items-start justify-between gap-4 p-5 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-indigo-500/50 transition-all shadow-sm shadow-black/20">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-white font-bold text-base tracking-wide truncate">{a.title}</h3>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${categoryColors[a.category] || 'bg-gray-100 text-gray-800'}`}>
                            {a.category}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-100 font-semibold border border-indigo-400/30">
                            → {audienceLabels[a.targetAudience] || a.targetAudience}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-1">{a.content}</p>
                        <p className="text-gray-400 text-xs font-medium">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(a._id)}
                        className="text-gray-400 hover:text-red-400 bg-black/20 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0 p-2"
                        title="Delete Announcement"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── DOMAINS TAB ─── */}
        {activeTab === 'domains' && (
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Departments */}
              <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                <h3 className="text-lg font-bold text-white mb-4">Manage Departments</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    placeholder="New Department…"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-800/80 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    disabled={configLoading}
                    onClick={() => handleAddConfig('departments', newDepartment, setNewDepartment)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {config.departments.map(dep => (
                    <div key={dep} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <span className="text-gray-200 font-medium">{dep}</span>
                      <button
                        disabled={configLoading}
                        onClick={() => handleRemoveConfig('departments', dep)}
                        className="text-gray-400 hover:text-red-400 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {config.departments.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No departments configured.</p>}
                </div>
              </div>

              {/* Groups */}
              <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/50">
                <h3 className="text-lg font-bold text-white mb-4">Manage Groups</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    placeholder="New Group…"
                    value={newGroup}
                    onChange={e => setNewGroup(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-800/80 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    disabled={configLoading}
                    onClick={() => handleAddConfig('groups', newGroup, setNewGroup)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {config.groups.map(grp => (
                    <div key={grp} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <span className="text-gray-200 font-medium">{grp}</span>
                      <button
                        disabled={configLoading}
                        onClick={() => handleRemoveConfig('groups', grp)}
                        className="text-gray-400 hover:text-red-400 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {config.groups.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No groups configured.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── USER MANAGEMENT TAB ─── */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">User Accounts</h2>
              <input
                placeholder="Search users…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadUsers()}
                className="px-4 py-2.5 bg-slate-700/80 border border-slate-500 rounded-xl text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all shadow-inner"
              />
            </div>

            {usersLoading ? (
              <div className="text-center py-12 text-gray-400">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No users found.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-600/50 bg-slate-800/40 shadow-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600/50 bg-slate-700/50">
                      <th className="text-left px-5 py-4 text-gray-200 font-bold uppercase tracking-wider text-xs">Name</th>
                      <th className="text-left px-5 py-4 text-gray-200 font-bold uppercase tracking-wider text-xs">Email</th>
                      <th className="text-left px-5 py-4 text-gray-200 font-bold uppercase tracking-wider text-xs">Role</th>
                      <th className="text-left px-5 py-4 text-gray-200 font-bold uppercase tracking-wider text-xs">Status</th>
                      <th className="text-right px-5 py-4 text-gray-200 font-bold uppercase tracking-wider text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600/30">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4 text-white font-bold text-base">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="px-5 py-4 text-gray-300 font-medium">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            u.role === 'lecturer'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/20'
                          }`}>
                            {u.role === 'lecturer' ? '👨‍🏫 Lecturer' : '🎓 Student'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            u.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20'
                              : 'bg-red-500/20 text-red-300 border border-red-400/20'
                          }`}>
                            {u.isActive ? '● Active' : '● Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {u.isActive ? (
                              <button
                                disabled={actionLoading === u._id}
                                onClick={() => setConfirmDialog({ userId: u._id, name: `${u.firstName} ${u.lastName}`, action: 'deactivate' })}
                                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/20 hover:bg-amber-500/30 transition-all disabled:opacity-50"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                disabled={actionLoading === u._id}
                                onClick={() => setConfirmDialog({ userId: u._id, name: `${u.firstName} ${u.lastName}`, action: 'reactivate' })}
                                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              disabled={actionLoading === u._id}
                              onClick={() => setConfirmDialog({ userId: u._id, name: `${u.firstName} ${u.lastName}`, action: 'delete' })}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-400/20 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                              {actionLoading === u._id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-2 capitalize">
              {confirmDialog.action} Account
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {confirmDialog.action === 'delete'
                ? <>Are you sure you want to <span className="text-red-400 font-semibold">permanently delete</span> <span className="text-white">{confirmDialog.name}</span>? This cannot be undone.</>
                : confirmDialog.action === 'deactivate'
                  ? <>Are you sure you want to <span className="text-amber-400 font-semibold">deactivate</span> <span className="text-white">{confirmDialog.name}</span>? They won't be able to log in.</>
                  : <>Are you sure you want to <span className="text-emerald-400 font-semibold">reactivate</span> <span className="text-white">{confirmDialog.name}</span>?</>
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => execUserAction(confirmDialog.userId, confirmDialog.action)}
                disabled={actionLoading === confirmDialog.userId}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 ${
                  confirmDialog.action === 'delete'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                    : confirmDialog.action === 'deactivate'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                }`}
              >
                {actionLoading === confirmDialog.userId ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
