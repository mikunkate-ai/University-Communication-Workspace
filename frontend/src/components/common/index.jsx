import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getStatusColor, getPriorityColor } from '../../utils/helpers';

// Reads role from AuthContext without throwing outside the provider
const useIsLecturer = () => {
  const ctx = useContext(AuthContext);
  return ctx?.user?.role === 'lecturer';
};

export const Badge = ({ label, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    error: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-blue-50 text-blue-700',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
      {label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusColor(status)}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  );
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const isLecturer = useIsLecturer();
  const variants = {
    primary: isLecturer
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30'
      : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md shadow-red-500/20',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20',
    outline: 'border border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      disabled={disabled}
      className={`rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Input = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const isLecturer = useIsLecturer();
  const focusRing = isLecturer
    ? 'focus:ring-emerald-500/40 focus:border-emerald-500'
    : 'focus:ring-indigo-500/40 focus:border-indigo-500';
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <input
        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 ${focusRing} focus:bg-white transition-all duration-200 ${error ? 'border-red-400' : 'border-gray-200'
          } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export const TextArea = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const isLecturer = useIsLecturer();
  const focusRing = isLecturer
    ? 'focus:ring-emerald-500/40 focus:border-emerald-500'
    : 'focus:ring-indigo-500/40 focus:border-indigo-500';
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <textarea
        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 ${focusRing} focus:bg-white transition-all duration-200 ${error ? 'border-red-400' : 'border-gray-200'
          } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export const Select = ({
  label,
  options = [],
  error,
  className = '',
  ...props
}) => {
  const isLecturer = useIsLecturer();
  const focusRing = isLecturer
    ? 'focus:ring-emerald-500/40 focus:border-emerald-500'
    : 'focus:ring-indigo-500/40 focus:border-indigo-500';
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <select
        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 ${focusRing} focus:bg-white transition-all duration-200 ${error ? 'border-red-400' : 'border-gray-200'
          } ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};

export const Spinner = ({ size = 'md' }) => {
  const isLecturer = useIsLecturer();
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  const spinnerColor = isLecturer ? 'border-t-emerald-600' : 'border-t-indigo-600';

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-3 border-gray-200 ${spinnerColor} rounded-full animate-spin`} />
    </div>
  );
};

export const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className={`border-l-4 p-4 mb-4 rounded-xl ${types[type]} animate-fade-in`}>
      <div className="flex justify-between items-start">
        <p className="text-sm">{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-xl cursor-pointer ml-3 opacity-60 hover:opacity-100">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export const Modal = ({ isOpen, title, children, onClose, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-2xl cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
        {actions && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export const SearchableSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Search...',
  error,
  className = '',
}) => {
  const isLecturer = useIsLecturer();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const openRing = isLecturer ? 'ring-emerald-500/40 border-emerald-500' : 'ring-indigo-500/40 border-indigo-500';
  const avatarGradient = isLecturer ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-purple-600';
  const hoverBg = isLecturer ? 'hover:bg-emerald-50' : 'hover:bg-indigo-50';
  const selectedBg = isLecturer ? 'bg-emerald-50' : 'bg-indigo-50';
  const searchRing = isLecturer ? 'focus:ring-emerald-500/40' : 'focus:ring-indigo-500/40';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`mb-4 relative ${className}`} ref={wrapperRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div
        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl cursor-pointer flex items-center justify-between transition-all duration-200 ${isOpen ? `ring-2 ${openRing} bg-white` : error ? 'border-red-400' : 'border-gray-200'
          }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? (
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 bg-gradient-to-br ${avatarGradient} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
              {getInitials(selectedOption.label)}
            </div>
            <span className="text-gray-800 font-medium">{selectedOption.label}</span>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {selectedOption && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); setSearch(''); }}
              className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            >
              ✕
            </button>
          )}
          <span className="text-gray-300">▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl max-h-64 overflow-hidden animate-fade-in">
          <div className="p-2.5 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${searchRing} text-sm`}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${hoverBg} ${opt.value === value ? `${selectedBg} font-medium` : ''
                    }`}
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradient} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {getInitials(opt.label)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">{opt.label}</p>
                    {opt.subtitle && <p className="text-xs text-gray-500">{opt.subtitle}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No results found</div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    </div>
  );
};
