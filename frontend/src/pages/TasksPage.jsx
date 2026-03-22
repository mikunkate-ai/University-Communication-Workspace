import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask, useUser } from '../hooks';
import { Card, Button, Spinner, Input, TextArea, Select, StatusBadge, PriorityBadge, Alert } from '../components/common';
import { formatDate } from '../utils/helpers';

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, fetchTasks, updateTaskStatus, createTask } = useTask();
  const { fetchStudents } = useUser();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '', description: '', deadline: '', priority: 'medium', assignedTo: '',
  });

  const isLecturer = user?.role === 'lecturer';

  useEffect(() => {
    if (!user) return; // Wait for user to be loaded (handles page refresh)
    const loadData = async () => {
      setLoading(true);
      await fetchTasks();
      if (isLecturer) {
        const studentList = await fetchStudents();
        setStudents(studentList);
      }
      setLoading(false);
    };
    loadData();
  }, [user?._id]); // Re-run when user is loaded

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const result = await updateTaskStatus(taskId, newStatus);
    if (result) {
      showSuccess(`Task marked as ${newStatus.replace('_', ' ')}.`);
    } else {
      showError('Failed to update task status. Please try again.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) {
      showError('Please fill in the title and deadline.');
      return;
    }
    // Wrap assignedTo string into array (Select returns a single string value)
    const payload = {
      ...formData,
      assignedTo: formData.assignedTo ? [formData.assignedTo] : [],
    };
    const result = await createTask(payload);
    if (result) {
      setFormData({ title: '', description: '', deadline: '', priority: 'medium', assignedTo: '' });
      setShowForm(false);
      showSuccess('Task created successfully!');
    } else {
      showError('Failed to create task. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const studentOptions = students.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName}` }));

  const accentBtn = isLecturer
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20';

  const filterRing = isLecturer
    ? 'focus:ring-emerald-500/40 focus:border-emerald-500'
    : 'focus:ring-indigo-500/40 focus:border-indigo-500';

  return (
    <div className="space-y-6 animate-fade-in">
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 ${filterRing}`}
          >
            <option value="all">All Tasks</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {isLecturer && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-5 py-2.5 ${accentBtn} text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:-translate-y-0.5`}
            >
              {showForm ? 'Cancel' : 'Create Task'}
            </button>
          )}
        </div>
      </div>

      {showForm && isLecturer && (
        <Card className="animate-fade-in">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Input
              label="Title"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextArea
              label="Description"
              placeholder="Task description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>
            <Select
              label="Assign to Student (optional)"
              options={studentOptions}
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            />
            <Button type="submit" variant="primary">Create Task</Button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <Card key={task._id} hover>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-bold text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Due: {formatDate(task.deadline)}</p>
              {!isLecturer && task.status !== 'completed' && (
                <div className="flex gap-2">
                  {task.status === 'not_started' && (
                    <Button size="sm" variant="primary" onClick={() => handleStatusChange(task._id, 'in_progress')}>
                      Start Task
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button size="sm" variant="success" onClick={() => handleStatusChange(task._id, 'completed')}>
                      Mark Complete
                    </Button>
                  )}
                </div>
              )}
              {task.status === 'completed' && (
                <p className="text-xs text-emerald-600 font-medium">Completed</p>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-gray-400 text-center text-sm py-4">No tasks in this category</p>
          </Card>
        )}
      </div>
    </div>
  );
}
