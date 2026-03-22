import React, { useEffect, useState } from 'react';
import { useProject } from '../hooks';
import { useUser } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Spinner, Input, TextArea, StatusBadge, Alert } from '../components/common';
import { formatDate, getInitials } from '../utils/helpers';
import { FiUpload, FiChevronDown, FiChevronUp, FiSearch, FiX } from 'react-icons/fi';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projects, fetchProjects, createProject, submitProject } = useProject();
  const { fetchStudents } = useUser();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    groupName: '', projectTitle: '', description: '', deadline: '', members: [],
  });

  // Student picker state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Per-project submission panel state
  const [submitState, setSubmitState] = useState({});

  const isLecturer = user?.role === 'lecturer';

  useEffect(() => {
    if (!user) return;
    const loadProjects = async () => {
      setLoading(true);
      await fetchProjects();
      setLoading(false);
    };
    loadProjects();
  }, [user?._id]);

  // Load students when form is opened
  useEffect(() => {
    if (!showForm || !isLecturer) return;
    const load = async () => {
      setStudentsLoading(true);
      const list = await fetchStudents();
      setStudents(list);
      setStudentsLoading(false);
    };
    load();
  }, [showForm]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const toggleStudent = (studentId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(studentId)
        ? prev.members.filter(id => id !== studentId)
        : [...prev.members, studentId],
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.groupName || !formData.projectTitle) {
      showError('Please fill in the group name and project title.');
      return;
    }
    const result = await createProject(formData);
    if (result) {
      setFormData({ groupName: '', projectTitle: '', description: '', deadline: '', members: [] });
      setStudentSearch('');
      setShowForm(false);
      showSuccess('Project created successfully!');
    } else {
      showError('Failed to create project. Please try again.');
    }
  };

  const toggleSubmitPanel = (projectId) => {
    setSubmitState(prev => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || {}),
        open: !prev[projectId]?.open,
        title: '',
        fileUrl: '',
        description: '',
      },
    }));
  };

  const handleSubmitProject = async (e, projectId) => {
    e.preventDefault();
    const s = submitState[projectId] || {};
    if (!s.title || !s.fileUrl) {
      showError('Please provide a submission title and link.');
      return;
    }
    setSubmitState(prev => ({ ...prev, [projectId]: { ...prev[projectId], loading: true } }));
    const result = await submitProject(projectId, {
      title: s.title,
      description: s.description,
      fileUrl: s.fileUrl,
      fileName: s.title,
    });
    setSubmitState(prev => ({ ...prev, [projectId]: { ...prev[projectId], loading: false } }));
    if (result) {
      showSuccess('Project submitted successfully!');
      setSubmitState(prev => ({ ...prev, [projectId]: { open: false } }));
    } else {
      showError('Failed to submit. Please check your link and try again.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  const accentBtn = isLecturer
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20'
    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/20';

  const filteredStudents = students.filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return name.includes(studentSearch.toLowerCase());
  });

  const selectedStudents = students.filter(s => formData.members.includes(s._id));

  return (
    <div className="space-y-6 animate-fade-in">
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        {isLecturer && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setFormData({ groupName: '', projectTitle: '', description: '', deadline: '', members: [] });
                setStudentSearch('');
              }
            }}
            className={`px-5 py-2.5 ${accentBtn} text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:-translate-y-0.5`}
          >
            {showForm ? 'Cancel' : 'Create Project'}
          </button>
        )}
      </div>

      {showForm && isLecturer && (
        <Card className="animate-fade-in">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Group Name"
                placeholder="e.g., Group A"
                value={formData.groupName}
                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
              />
              <Input
                label="Project Title"
                placeholder="e.g., Web Application Development"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
              />
            </div>
            <TextArea
              label="Description"
              placeholder="Project description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Input
              label="Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />

            {/* Student Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Students
                <span className="ml-2 text-xs text-gray-400 font-normal">(select one or more)</span>
              </label>

              {/* Selected students chips */}
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedStudents.map(s => (
                    <span
                      key={s._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full"
                    >
                      {s.firstName} {s.lastName}
                      <button
                        type="button"
                        onClick={() => toggleStudent(s._id)}
                        className="hover:text-emerald-900 transition-colors"
                      >
                        <FiX size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search box */}
              <div className="relative mb-2">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                />
              </div>

              {/* Student list */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">
                    {studentSearch ? 'No students match your search.' : 'No students found.'}
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {filteredStudents.map(s => {
                      const selected = formData.members.includes(s._id);
                      return (
                        <label
                          key={s._id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            selected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleStudent(s._id)}
                            className="accent-emerald-600 w-4 h-4 rounded flex-shrink-0"
                          />
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {getInitials(s.firstName, s.lastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{s.email}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              {formData.members.length > 0 && (
                <p className="text-xs text-emerald-600 font-medium mt-1.5">
                  {formData.members.length} student{formData.members.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <Button type="submit" variant="primary">Create Project</Button>
          </form>
        </Card>
      )}

      {!isLecturer && projects.length === 0 && (
        <Card>
          <p className="text-gray-500 text-center text-sm py-4">
            You have not been assigned to any projects yet. Your lecturer will add you when a project is created.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length > 0 ? (
          projects.map(project => {
            const ps = submitState[project._id] || {};
            return (
              <Card key={project._id} hover>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{project.projectTitle}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{project.groupName}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                )}

                {/* Member avatars */}
                {project.members?.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex -space-x-1.5">
                      {project.members.slice(0, 5).map(m => (
                        <div
                          key={m._id}
                          title={`${m.firstName} ${m.lastName}`}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white flex-shrink-0 ${
                            isLecturer ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {getInitials(m.firstName, m.lastName)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                      {project.members.length > 5 && ` (+${project.members.length - 5} more)`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  {project.members?.length === 0 && (
                    <span className="text-gray-400 italic">No members assigned</span>
                  )}
                  {project.deadline && <span>Due: {formatDate(project.deadline)}</span>}
                </div>

                {/* Student: Submit Work panel */}
                {!isLecturer && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleSubmitPanel(project._id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <FiUpload size={12} />
                      Submit Work
                      {ps.open ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                    </button>

                    {ps.open && (
                      <form onSubmit={(e) => handleSubmitProject(e, project._id)} className="mt-3 space-y-3 animate-fade-in">
                        <Input
                          label="Submission Title"
                          placeholder="e.g., Final Report v1"
                          value={ps.title || ''}
                          onChange={(e) => setSubmitState(prev => ({
                            ...prev, [project._id]: { ...prev[project._id], title: e.target.value },
                          }))}
                        />
                        <Input
                          label="Submission Link (Google Drive, GitHub, etc.)"
                          placeholder="https://drive.google.com/..."
                          value={ps.fileUrl || ''}
                          onChange={(e) => setSubmitState(prev => ({
                            ...prev, [project._id]: { ...prev[project._id], fileUrl: e.target.value },
                          }))}
                        />
                        <TextArea
                          label="Notes (optional)"
                          placeholder="Any notes for your lecturer..."
                          value={ps.description || ''}
                          onChange={(e) => setSubmitState(prev => ({
                            ...prev, [project._id]: { ...prev[project._id], description: e.target.value },
                          }))}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" variant="primary" size="sm" disabled={ps.loading}>
                            {ps.loading ? 'Submitting...' : 'Submit'}
                          </Button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => toggleSubmitPanel(project._id)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        ) : isLecturer ? (
          <Card className="col-span-2">
            <p className="text-gray-400 text-center text-sm py-4">No projects yet. Create one to get started.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
