import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAnnouncement } from '../hooks';
import { Card, Button, Spinner, Badge, Input, TextArea, Select, Alert } from '../components/common';
import { formatDate, getRelativeTime } from '../utils/helpers';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { announcements, fetchAnnouncements, createAnnouncement } = useAnnouncement();
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '', content: '', category: 'general', targetAudience: user?.role === 'lecturer' ? 'students' : 'all', expiryDate: '',
  });

  const isLecturer = user?.role === 'lecturer';

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);
      await fetchAnnouncements();
      setLoading(false);
    };
    loadAnnouncements();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      showError('Please fill in the title and content.');
      return;
    }
    const result = await createAnnouncement(formData);
    if (result) {
      setFormData({ title: '', content: '', category: 'general', targetAudience: isLecturer ? 'students' : 'all', expiryDate: '' });
      setShowForm(false);
      showSuccess('Announcement posted successfully!');
    } else {
      showError('Failed to post announcement. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  const filteredAnnouncements = filter === 'all'
    ? announcements
    : announcements.filter(a => a.category === filter);

  const categories = ['general', 'urgent', 'deadline', 'class'];

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'class', label: 'Class' },
  ];

  const audienceOptions = isLecturer 
    ? [{ value: 'students', label: 'Students Only' }]
    : [
        { value: 'all', label: 'All' },
        { value: 'students', label: 'Students Only' },
        { value: 'lecturers', label: 'Lecturers Only' },
      ];

  const accentBtn = isLecturer
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20';

  const accentRing = isLecturer ? 'ring-emerald-500' : 'ring-indigo-500';

  const filterRing = isLecturer
    ? 'focus:ring-emerald-500/40 focus:border-emerald-500'
    : 'focus:ring-indigo-500/40 focus:border-indigo-500';

  return (
    <div className="space-y-6 animate-fade-in">
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 ${filterRing}`}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          {isLecturer && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-5 py-2.5 ${accentBtn} text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:-translate-y-0.5`}
            >
              {showForm ? 'Cancel' : 'Post Announcement'}
            </button>
          )}
        </div>
      </div>

      {showForm && isLecturer && (
        <Card className="animate-fade-in">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Post New Announcement</h2>
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <Input
              label="Title"
              placeholder="Announcement title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextArea
              label="Content"
              placeholder="Announcement content"
              rows="4"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Select
                label="Target Audience"
                options={audienceOptions}
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
            <Button type="submit" variant="primary">Post Announcement</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map(ann => (
              <Card
                key={ann._id}
                hover
                className={`cursor-pointer transition-all ${
                  selectedAnnouncement?._id === ann._id ? `ring-2 ${accentRing}` : ''
                }`}
                onClick={() => setSelectedAnnouncement(ann)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 flex-1 pr-3">{ann.title}</h3>
                  <Badge label={ann.category} variant={ann.category === 'urgent' ? 'error' : 'default'} />
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{ann.content}</p>
                <p className="text-xs text-gray-400 mt-3">{getRelativeTime(ann.createdAt)}</p>
              </Card>
            ))
          ) : (
            <Card>
              <p className="text-gray-400 text-center text-sm py-4">No announcements in this category</p>
            </Card>
          )}
        </div>

        {/* Announcement Detail */}
        <div className="lg:col-span-1">
          {selectedAnnouncement ? (
            <Card className="sticky top-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-gray-900 flex-1 pr-2">{selectedAnnouncement.title}</h2>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0"
                  title="Close"
                >
                  ×
                </button>
              </div>
              <Badge
                label={selectedAnnouncement.category}
                variant={selectedAnnouncement.category === 'urgent' ? 'error' : 'default'}
                className="mb-4"
              />
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{selectedAnnouncement.content}</p>
              <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 pt-4">
                <p>
                  <span className="font-medium text-gray-700">Posted: </span>
                  {formatDate(selectedAnnouncement.createdAt)}
                </p>
                {selectedAnnouncement.expiryDate && (
                  <p>
                    <span className="font-medium text-gray-700">Expires: </span>
                    {formatDate(selectedAnnouncement.expiryDate)}
                  </p>
                )}
                <p>
                  <span className="font-medium text-gray-700">Author: </span>
                  {selectedAnnouncement.authorId?.firstName || 'Unknown'} {selectedAnnouncement.authorId?.lastName || ''}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Audience: </span>
                  <span className="capitalize">{selectedAnnouncement.targetAudience || 'All'}</span>
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-gray-400 text-center text-sm py-4">Select an announcement to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
