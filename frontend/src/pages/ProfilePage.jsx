import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Input, Button, Alert, Spinner, Modal, Select } from '../components/common';
import { getInitials } from '../utils/helpers';

export default function ProfilePage() {
  const { user, updateProfile, deleteAccount, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', department: '', phone: '', office: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isLecturer = user?.role === 'lecturer';

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        department: user.department || '',
        phone: user.contactInfo?.phone || '',
        office: user.contactInfo?.office || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(user._id, formData);
    if (result.success) {
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeactivate = async () => {
    const result = await deleteAccount(user._id, false);
    if (result.success) {
      navigate('/login');
    }
  };

  const handlePermanentDelete = async () => {
    const result = await deleteAccount(user._id, true);
    if (result.success) {
      navigate('/login');
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  const avatarGradient = isLecturer
    ? 'from-emerald-500 to-teal-600'
    : 'from-indigo-500 to-violet-600';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {message && (
        <Alert type="success" message={message} onClose={() => setMessage('')} />
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex items-center gap-6 mb-6">
          <div className={`w-20 h-20 bg-gradient-to-br ${avatarGradient} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${isLecturer ? 'shadow-emerald-500/25' : 'shadow-indigo-500/25'}`}>
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold ${isLecturer ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                {user?.role}
              </span>
              <span className="text-sm text-gray-500">{user?.email}</span>
            </div>
          </div>
        </div>

        <Button variant={isEditing ? 'secondary' : 'primary'} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </Card>

      {/* Profile Details */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h2>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} disabled />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={errors.lastName} disabled />
            </div>
            <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} disabled error={errors.email} />
            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Department' },
                { value: 'Software Engineering', label: 'Software Engineering' },
                { value: 'Computer Science', label: 'Computer Science' }
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone Number" name="phone" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={handleChange} error={errors.phone} />
              <Input label="Office" name="office" placeholder="Room 101" value={formData.office} onChange={handleChange} error={errors.office} />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Save Changes'}
            </Button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'First Name', value: user?.firstName },
              { label: 'Last Name', value: user?.lastName },
              { label: 'Email Address', value: user?.email },
              { label: 'Role', value: user?.role, capitalize: true },
              { label: 'Department', value: user?.department || 'Not specified' },
              { label: 'Phone', value: user?.contactInfo?.phone || 'Not specified' },
              { label: 'Office', value: user?.contactInfo?.office || 'Not specified' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-1">{item.label}</p>
                <p className={`text-sm font-medium text-gray-800 ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account Settings */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">Account Status</p>
              <p className="text-xs text-gray-500">Your account is active</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">Active</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">Member Since</p>
              <p className="text-xs text-gray-500">{new Date(user?.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-bold text-red-600 mb-3">Danger Zone</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Deactivate Account</p>
                <p className="text-xs text-gray-500">Temporarily disable your account. You can reactivate later.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDeactivateModal(true)}>
                Deactivate
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">Delete Account</p>
                <p className="text-xs text-gray-500">Permanently delete your account and all data.</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Deactivate Modal */}
      <Modal
        isOpen={showDeactivateModal}
        title="Deactivate Account"
        onClose={() => setShowDeactivateModal(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeactivateModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeactivate}>Deactivate</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to deactivate your account? Your account will be disabled but your data will be preserved. You can contact an administrator to reactivate it.
        </p>
      </Modal>

      {/* Permanent Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Permanently Delete Account"
        onClose={() => setShowDeleteModal(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handlePermanentDelete}>Delete Forever</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          <strong className="text-red-600">Warning:</strong> This action is irreversible. Your account and all associated data will be permanently deleted. Are you absolutely sure?
        </p>
      </Modal>
    </div>
  );
}
