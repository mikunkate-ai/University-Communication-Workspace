import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMessage } from '../hooks/useMessage';
import { useUser } from '../hooks';
import { Button, Spinner, Modal } from '../components/common';
import { formatTime } from '../utils/helpers';
import { FiTrash2, FiSend, FiPlus, FiX, FiMessageSquare } from 'react-icons/fi';

// Returns the avatar gradient for a given role
const roleGradient = (role) => {
  if (role === 'lecturer') return 'from-emerald-500 to-teal-600';
  if (role === 'student') return 'from-violet-500 to-purple-600';
  return 'from-slate-400 to-slate-500';
};

// Returns the chat bubble gradient for a given role (used for received messages)
const roleBubbleClass = (role) => {
  if (role === 'lecturer') return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white';
  if (role === 'student') return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white';
  return 'bg-white border border-gray-100 text-gray-800';
};

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    messages,
    conversations,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    appendIncomingMessage,
    upsertConversation,
    clearMessages,
    deleteContact,
  } = useMessage();
  const { fetchLecturers, fetchStudents } = useUser();
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteContactConfirm, setShowDeleteContactConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const selectedConvRef = useRef(null);

  const isLecturer = user?.role === 'lecturer';
  // Own bubble: my role color
  const ownBubbleClass = isLecturer
    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
    : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white';
  const accentBg = isLecturer ? 'bg-emerald-600' : 'bg-indigo-600';
  const accentHover = isLecturer ? 'hover:bg-emerald-700' : 'hover:bg-indigo-700';
  const selectedBg = isLecturer ? 'bg-emerald-50/70' : 'bg-indigo-50/70';
  const focusRing = isLecturer
    ? 'focus:ring-emerald-500/40 focus:border-emerald-500'
    : 'focus:ring-indigo-500/40 focus:border-indigo-500';

  useEffect(() => {
    if (!user) return; // Wait for user to be loaded (handles page refresh)
    const loadConversations = async () => {
      setLoading(true);
      await fetchConversations();
      // Fetch the other role's users and filter out the current user
      const raw = isLecturer ? await fetchStudents() : await fetchLecturers();
      const filtered = (raw || []).filter(c => c._id?.toString() !== user._id?.toString());
      setContacts(filtered);
      setLoading(false);
    };
    loadConversations();
  }, [user?._id]); // Re-run once user is loaded (e.g., after hard refresh)

  // Keep ref in sync so the socket handler always sees the current conversation
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  // Real-time: update sidebar + append to open chat on incoming messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      // Always add/update the sender's entry in the sidebar so the
      // conversation appears even if the recipient has never messaged them
      upsertConversation(msg);

      // Also append to the currently open chat if it matches the sender
      const conv = selectedConvRef.current;
      if (!conv) return;
      const senderId = (msg.senderId?._id || msg.senderId)?.toString();
      const convUserId = conv.user?._id?.toString();
      if (senderId === convUserId) {
        appendIncomingMessage(msg);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, appendIncomingMessage, upsertConversation]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    await sendMessage(selectedConversation.user._id, messageText);
    setMessageText('');
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    const msgs = await fetchMessages(conversation.user._id);
    msgs.filter(m => !m.isOwn && !m.read).forEach(m => markAsRead(m._id));
  };

  const handleNewConversation = async (contact) => {
    const conv = { user: contact };
    setSelectedConversation(conv);
    await fetchMessages(contact._id);
    setShowNewConversation(false);
  };

  const handleClearMessages = async () => {
    if (!selectedConversation) return;
    setActionLoading(true);
    await clearMessages(selectedConversation.user._id);
    setActionLoading(false);
    setShowClearConfirm(false);
  };

  const handleDeleteContact = async () => {
    if (!selectedConversation) return;
    setActionLoading(true);
    await deleteContact(selectedConversation.user._id);
    setActionLoading(false);
    setShowDeleteContactConfirm(false);
    setSelectedConversation(null);
  };

  const handleSidebarDeleteContact = async (e, userId) => {
    e.stopPropagation();
    await deleteContact(userId);
    if (selectedConversation?.user?._id?.toString() === userId?.toString()) {
      setSelectedConversation(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const otherUserRole = selectedConversation?.user?.role || (isLecturer ? 'student' : 'lecturer');

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] animate-fade-in">
      {/* ── Conversations Sidebar ── */}
      <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <p className="text-xs text-gray-400">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowNewConversation(!showNewConversation)}
            className={`p-2 rounded-xl ${accentBg} ${accentHover} text-white transition-all hover:-translate-y-0.5 shadow-md`}
            title="New conversation"
          >
            <FiPlus size={16} />
          </button>
        </div>

        {/* New Conversation Picker */}
        {showNewConversation && (
          <div className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {isLecturer ? 'Students' : 'Lecturers'}
              </p>
              <button onClick={() => setShowNewConversation(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={14} />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {contacts.length > 0 ? contacts.map(contact => (
                <button
                  key={contact._id}
                  onClick={() => handleNewConversation(contact)}
                  className="w-full p-3 text-left hover:bg-white transition-colors border-b border-gray-100/60"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${roleGradient(contact.role)} text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-sm`}>
                      {contact.firstName?.[0]}{contact.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                </button>
              )) : (
                <p className="px-4 py-3 text-xs text-gray-400 text-center">
                  No {isLecturer ? 'students' : 'lecturers'} found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map(conv => {
              const isSelected = selectedConversation?.user?._id?.toString() === conv.user?._id?.toString();
              return (
                <div
                  key={conv._id || conv.user?._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`group relative flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? selectedBg : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 bg-gradient-to-br ${roleGradient(conv.user?.role)} text-white rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm`}>
                    {conv.user?.firstName?.[0]}{conv.user?.lastName?.[0]}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900">{conv.user?.firstName} {conv.user?.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                  </div>
                  {/* Delete contact button (shows on hover) */}
                  <button
                    onClick={(e) => handleSidebarDeleteContact(e, conv.user?._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    title="Delete contact"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
              <div className={`w-12 h-12 ${accentBg} rounded-2xl flex items-center justify-center mb-3 opacity-20`}>
                <FiMessageSquare size={20} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Click + to start a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white rounded-t-2xl border border-gray-100 border-b-0 shadow-sm px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${roleGradient(otherUserRole)} text-white rounded-xl flex items-center justify-center text-xs font-bold shadow-sm`}>
                  {selectedConversation.user?.firstName?.[0]}{selectedConversation.user?.lastName?.[0]}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">
                    {selectedConversation.user?.firstName} {selectedConversation.user?.lastName}
                  </h2>
                  <p className="text-xs text-gray-400 capitalize">{otherUserRole}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all font-medium"
                  title="Clear all messages"
                >
                  <FiTrash2 size={13} />
                  Clear chat
                </button>
                <button
                  onClick={() => setShowDeleteContactConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all font-medium"
                  title="Delete contact"
                >
                  <FiX size={13} />
                  Delete contact
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/80 to-gray-100/40 p-5 space-y-3 border-x border-gray-100">
              {messages.length > 0 ? (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className={`flex items-end gap-2 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar for received messages */}
                      {!msg.isOwn && (
                        <div className={`w-7 h-7 bg-gradient-to-br ${roleGradient(otherUserRole)} text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-0.5`}>
                          {selectedConversation.user?.firstName?.[0]}{selectedConversation.user?.lastName?.[0]}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.isOwn
                          ? `${ownBubbleClass} rounded-br-sm`
                          : `${roleBubbleClass(otherUserRole)} rounded-bl-sm`
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.isOwn || otherUserRole ? 'text-white/60' : 'text-gray-400'}`}>
                          {formatTime(msg.timestamp || msg.createdAt)}
                        </p>
                      </div>
                      {/* Avatar for own messages */}
                      {msg.isOwn && (
                        <div className={`w-7 h-7 bg-gradient-to-br ${roleGradient(user?.role)} text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mb-0.5`}>
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className={`w-14 h-14 bg-gradient-to-br ${roleGradient(otherUserRole)} rounded-2xl flex items-center justify-center mb-3 opacity-30`}>
                    <FiMessageSquare size={20} className="text-white" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Say hello to start the conversation!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="bg-white rounded-b-2xl border border-gray-100 border-t border-gray-100 shadow-sm p-4"
            >
              <div className="flex gap-3 items-end">
                <textarea
                  placeholder={`Message ${selectedConversation.user?.firstName}...`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className={`flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 ${focusRing} text-sm leading-relaxed`}
                  rows="2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className={`p-3 ${accentBg} ${accentHover} text-white rounded-xl transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                >
                  <FiSend size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
            </form>

            {/* Clear Messages Modal */}
            <Modal
              isOpen={showClearConfirm}
              title="Clear Chat"
              onClose={() => setShowClearConfirm(false)}
              actions={
                <>
                  <Button variant="secondary" onClick={() => setShowClearConfirm(false)} disabled={actionLoading}>Cancel</Button>
                  <Button variant="danger" onClick={handleClearMessages} disabled={actionLoading}>
                    {actionLoading ? 'Clearing...' : 'Clear All Messages'}
                  </Button>
                </>
              }
            >
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiTrash2 size={20} className="text-amber-500" />
                </div>
                <p className="text-gray-700 font-medium text-sm">Clear all messages?</p>
                <p className="text-gray-500 text-xs mt-1">
                  Messages will be deleted but <strong>{selectedConversation?.user?.firstName}</strong> stays in your contacts.
                </p>
              </div>
            </Modal>

            {/* Delete Contact Modal */}
            <Modal
              isOpen={showDeleteContactConfirm}
              title="Delete Contact"
              onClose={() => setShowDeleteContactConfirm(false)}
              actions={
                <>
                  <Button variant="secondary" onClick={() => setShowDeleteContactConfirm(false)} disabled={actionLoading}>Cancel</Button>
                  <Button variant="danger" onClick={handleDeleteContact} disabled={actionLoading}>
                    {actionLoading ? 'Deleting...' : 'Delete Contact'}
                  </Button>
                </>
              }
            >
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiX size={20} className="text-red-500" />
                </div>
                <p className="text-gray-700 font-medium text-sm">
                  Remove <strong>{selectedConversation?.user?.firstName} {selectedConversation?.user?.lastName}</strong>?
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  All messages will be deleted and they'll be removed from your list. You can add them again via the + button.
                </p>
              </div>
            </Modal>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-center">
              <div className={`w-20 h-20 ${accentBg} rounded-3xl flex items-center justify-center mx-auto mb-5 opacity-15`}>
                <FiMessageSquare size={32} className="text-white" />
              </div>
              <p className="text-gray-700 font-bold text-lg">Your Messages</p>
              <p className="text-gray-400 text-sm mt-1">Select a conversation or</p>
              <p className="text-gray-400 text-sm">click + to start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
