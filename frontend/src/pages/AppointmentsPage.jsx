import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointment, useUser } from '../hooks';
import { Card, Button, Spinner, Input, SearchableSelect, StatusBadge, Alert } from '../components/common';
import { formatDate, formatDateTime, getInitials } from '../utils/helpers';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiX, FiAlertTriangle } from 'react-icons/fi';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const {
    appointments,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    cancelAppointment,
  } = useAppointment();
  const { fetchLecturers, fetchStudents } = useUser();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [location, setLocation] = useState('Online');
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, appointmentId: null, title: '', requireReason: false, reason: '' });

  const isLecturer = user?.role === 'lecturer';

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      await fetchAppointments();
      const contactList = isLecturer ? await fetchStudents() : await fetchLecturers();
      setContacts(contactList || []);
      setLoading(false);
    };
    loadData();
  }, [user?._id]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedContact) {
      setFormError(
        isLecturer
          ? 'Please select a student to book with.'
          : 'Please select a lecturer to book with.'
      );
      return;
    }
    if (!title.trim()) {
      setFormError('Please enter a title.');
      return;
    }
    if (!appointmentDate) {
      setFormError('Please select a date.');
      return;
    }
    if (!appointmentTime) {
      setFormError('Please select a time.');
      return;
    }

    const data = { title: title.trim(), scheduledDate: appointmentDate, scheduledTime: appointmentTime, location, duration };
    if (isLecturer) {
      data.studentId = selectedContact;
    } else {
      data.lecturerId = selectedContact;
    }

    setFormSubmitting(true);
    try {
      await createAppointment(data);
      setShowForm(false);
      setTitle('');
      setSelectedContact('');
      setAppointmentDate('');
      setAppointmentTime('');
      setLocation('Online');
      setDuration(30);
      setFormError('');
      showSuccess('Appointment booked successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAccept = async (id) => {
    const result = await updateAppointmentStatus(id, 'confirmed');
    if (result) showSuccess('Appointment confirmed.');
    else showError('Failed to confirm appointment.');
  };

  const handleDecline = async (id) => {
    const result = await updateAppointmentStatus(id, 'declined');
    if (result) showSuccess('Appointment declined.');
    else showError('Failed to decline appointment.');
  };

  const openCancelModal = (apt, requireReason = false) => {
    setCancelModal({ open: true, appointmentId: apt._id, title: apt.title, requireReason, reason: '' });
  };

  const handleConfirmCancel = async () => {
    if (cancelModal.requireReason && !cancelModal.reason.trim()) {
      showError('Please provide a reason for cancellation.');
      return;
    }
    const result = await cancelAppointment(cancelModal.appointmentId, cancelModal.reason || undefined);
    setCancelModal({ open: false, appointmentId: null, title: '', requireReason: false, reason: '' });
    if (result) showSuccess('Appointment cancelled.');
    else showError('Failed to cancel appointment.');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  const contactOptions = contacts.map(c => ({
    value: c._id,
    label: `${c.firstName} ${c.lastName}`,
    subtitle: c.department || c.email,
  }));

  const getOtherParty = (apt) => {
    if (isLecturer) return apt.studentId || null;
    return apt.lecturerId || null;
  };

  const getOtherPartyName = (apt) => {
    const party = getOtherParty(apt);
    if (!party) return isLecturer ? 'Student' : 'Lecturer';
    return `${party.firstName} ${party.lastName}`;
  };

  const getOtherPartyInitials = (apt) => {
    const party = getOtherParty(apt);
    if (!party) return '?';
    return getInitials(party.firstName, party.lastName);
  };

  const accentBtn = isLecturer
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20';

  const avatarBg = isLecturer ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700';

  // Group appointments
  const pending = appointments.filter(a => a.status === 'pending');
  const upcoming = appointments.filter(a => a.status === 'confirmed');
  const past = appointments.filter(a => ['declined', 'cancelled', 'completed'].includes(a.status));

  const AppointmentCard = ({ apt }) => {
    const otherName = getOtherPartyName(apt);
    const otherInitials = getOtherPartyInitials(apt);
    const bookedByName = apt.bookedBy
      ? `${apt.bookedBy.firstName} ${apt.bookedBy.lastName}`
      : null;
    const isPending = apt.status === 'pending';
    const isConfirmed = apt.status === 'confirmed';
    const isDone = ['declined', 'cancelled', 'completed'].includes(apt.status);

    return (
      <Card hover className={isDone ? 'opacity-75' : ''}>
        {/* Header: avatar + name + status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarBg}`}>
              {otherInitials}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{otherName}</p>
              <p className="text-xs text-gray-400">{isLecturer ? 'Student' : 'Lecturer'}</p>
            </div>
          </div>
          <StatusBadge status={apt.status} />
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-800 mb-3 leading-snug">{apt.title}</h3>

        {/* Details grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
            <span>{formatDate(apt.scheduledDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiClock size={14} className="text-gray-400 flex-shrink-0" />
            <span>
              {apt.scheduledTime}
              {apt.duration ? ` · ${apt.duration} min` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiMapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span>{apt.location || 'Online'}</span>
          </div>
          {bookedByName && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiUser size={14} className="text-gray-400 flex-shrink-0" />
              <span>Booked by <span className="font-medium text-gray-700">{bookedByName}</span></span>
            </div>
          )}
        </div>

        {/* Notes */}
        {apt.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 mb-3 italic">
            "{apt.notes}"
          </p>
        )}

        {/* Cancellation info */}
        {apt.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 mb-3 space-y-1">
            <p className="text-xs font-medium text-red-600">
              {apt.cancelledBy
                ? <>Cancelled by <span className="font-semibold">{apt.cancelledBy.firstName} {apt.cancelledBy.lastName}</span></>
                : 'This appointment was cancelled'}
            </p>
            {apt.cancellationReason && (
              <p className="text-xs text-red-500 italic">"{apt.cancellationReason}"</p>
            )}
          </div>
        )}

        {/* Actions */}
        {!isDone && (
          <div className="pt-3 border-t border-gray-100">
            {/* Lecturer actions */}
            {isLecturer && isPending && (
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => handleAccept(apt._id)}>
                  Accept
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDecline(apt._id)}>
                  Decline
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openCancelModal(apt)}>
                  Cancel
                </Button>
              </div>
            )}
            {isLecturer && isConfirmed && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium">Confirmed — appointment is set</span>
                <Button size="sm" variant="secondary" onClick={() => openCancelModal(apt)}>
                  Cancel
                </Button>
              </div>
            )}

            {/* Student actions */}
            {!isLecturer && isPending && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-500 font-medium">Awaiting lecturer confirmation</span>
                <Button size="sm" variant="secondary" onClick={() => openCancelModal(apt, true)}>
                  Cancel
                </Button>
              </div>
            )}
            {!isLecturer && isConfirmed && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-medium">Confirmed — see you there!</span>
                <Button size="sm" variant="secondary" onClick={() => openCancelModal(apt, true)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const SectionHeader = ({ title, count }) => (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-base font-bold text-gray-700">{title}</h2>
      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">{count}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      {/* Cancel confirmation modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Cancel Appointment</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel <span className="font-semibold text-gray-800">"{cancelModal.title}"</span>?
            </p>
            {cancelModal.requireReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Please let your lecturer know why you're cancelling..."
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 focus:bg-white transition-all resize-none"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel It
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setCancelModal({ open: false, appointmentId: null, title: '', requireReason: false, reason: '' })}
              >
                Keep It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Logged in as <span className="font-semibold text-gray-700">{user?.firstName} {user?.lastName}</span>
            <span className={`ml-2 inline-block px-2 py-0.5 rounded-md text-xs font-bold ${isLecturer ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {isLecturer ? 'Lecturer' : 'Student'}
            </span>
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className={`px-5 py-2.5 ${accentBtn} text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:-translate-y-0.5`}
        >
          {showForm ? 'Cancel' : 'Book Appointment'}
        </button>
      </div>

      {/* Book form */}
      {showForm && (
        <Card className="animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Book New Appointment</h2>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isLecturer ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
              {isLecturer ? '👨‍🏫 Booking as Lecturer' : '👨‍🎓 Booking as Student'}
            </span>
          </div>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            {contactOptions.length === 0 && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                No {isLecturer ? 'students' : 'lecturers'} found. Please refresh the page or contact support.
              </p>
            )}
            <SearchableSelect
              label={isLecturer ? 'Select Student' : 'Select Lecturer'}
              options={contactOptions}
              value={selectedContact}
              onChange={(val) => setSelectedContact(val)}
              placeholder={isLecturer ? 'Search for a student...' : 'Search for a lecturer...'}
            />
            <Input
              label="Title / Purpose"
              placeholder="e.g., Project discussion, Assignment help"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
              <Input
                label="Time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm appearance-none"
                >
                  <option value="Online">🌐 Online</option>
                  <option value="Lecturer's Office">🏢 Lecturer's Office</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Duration (mins)</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
            {formError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                {formError}
              </div>
            )}
            <Button type="submit" variant="primary" disabled={formSubmitting}>
              {formSubmitting ? 'Booking...' : 'Create Appointment'}
            </Button>
          </form>
        </Card>
      )}

      {/* No appointments at all */}
      {appointments.length === 0 && (
        <Card>
          <p className="text-gray-400 text-center text-sm py-4">No appointments scheduled</p>
        </Card>
      )}

      {/* Pending section */}
      {pending.length > 0 && (
        <section>
          <SectionHeader title="Pending" count={pending.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pending.map(apt => <AppointmentCard key={apt._id} apt={apt} />)}
          </div>
        </section>
      )}

      {/* Upcoming / Confirmed section */}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader title="Upcoming" count={upcoming.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcoming.map(apt => <AppointmentCard key={apt._id} apt={apt} />)}
          </div>
        </section>
      )}

      {/* Past / Done section */}
      {past.length > 0 && (
        <section>
          <SectionHeader title="Past" count={past.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {past.map(apt => <AppointmentCard key={apt._id} apt={apt} />)}
          </div>
        </section>
      )}
    </div>
  );
}
