import React, { useRef, useState, useEffect } from 'react';
import FormField from './FormField';
import { STATUS_OPTIONS } from './StatusRenderer';
import { activityService } from '../../services/activity';

// Tab configuration (info tabs - scrollable sections)
const INFO_TABS = [
  { id: 'action-items', label: 'Action Items', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 'timeline', label: 'Timeline', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'project-details', label: 'Details', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'location', label: 'Location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { id: 'billing', label: 'Billing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'system-info', label: 'System', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

// Backwards compatibility
const TABS = INFO_TABS;

const ACTIVITY_TAB = { id: 'activity', label: 'Activity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' };

// Action type colors for activity
const ACTION_TYPE_COLORS = {
  project_created: { bg: 'bg-green-100', text: 'text-green-700', label: 'Created' },
  project_updated: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Updated' },
  status_change: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Status Change' },
  field_updated: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Field Updated' },
  note_added: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Note Added' },
  inspection_scheduled: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Inspection' },
  due_date_changed: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Due Date' },
  client_changed: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Client Changed' },
  architect_changed: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Architect Changed' },
  manager_changed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Manager Changed' },
};

const PROJECT_TYPE_OPTIONS = [
  { value: 'M', label: 'Mechanical', color: 'bg-blue-100 text-blue-700' },
  { value: 'E', label: 'Electrical', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'P', label: 'Plumbing', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'EM', label: 'Energy Modelling', color: 'bg-green-100 text-green-700' },
  { value: 'FP', label: 'Fire Protection', color: 'bg-red-100 text-red-700' },
  { value: 'TI', label: 'Tenant Improvement', color: 'bg-purple-100 text-purple-700' },
  { value: 'VI', label: 'Verification Pending', color: 'bg-gray-100 text-gray-700' }
];

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  submitted: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
  on_hold: 'bg-orange-100 text-orange-700 border-orange-300',
  closed_paid: 'bg-indigo-100 text-indigo-700 border-indigo-300'
};

// Section Header Component
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-600">
    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wide">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

// Info Card for read-only display
const InfoCard = ({ label, value, icon }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-100 dark:border-gray-600">
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || '—'}</div>
  </div>
);

// Date Card Component
const DateCard = ({ label, value, note, noteValue, isEditing, editingField, onEdit, onSave, onCancel, onChange, formData }) => {
  const formattedDate = value ? new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : null;

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
      <FormField
        label={label}
        fieldName={value ? label.toLowerCase().replace(/ /g, '_') : label.toLowerCase().replace(/ /g, '_')}
        value={formData[label.toLowerCase().replace(/ /g, '_')]}
        isEditing={editingField === label.toLowerCase().replace(/ /g, '_')}
        type="date"
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onChange={onChange}
      />
      {note && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
          <FormField
            label="Note"
            fieldName={note}
            value={formData[note]}
            isEditing={editingField === note}
            type="textarea"
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
};

const DetailPanel = ({
  selectedProject,
  formData,
  editingField,
  savingField,
  saveStatus,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onChange
}) => {
  const scrollContainerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('action-items');
  const [viewMode, setViewMode] = useState('info'); // 'info' or 'activity'
  const [projectActivity, setProjectActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Fetch activity for this project
  const fetchProjectActivity = async () => {
    if (!selectedProject?.id) return;

    setLoadingActivity(true);
    try {
      const response = await activityService.getActivityLogs({ entity_type: 'project' });
      const allActivity = response.results || response || [];
      // Filter to only this project's activity
      const activity = allActivity.filter(a => a.project === selectedProject.id);
      setProjectActivity(activity);
    } catch (error) {
      console.error('Failed to fetch project activity:', error);
      setProjectActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchProjectActivity();
  }, [selectedProject?.id]);

  // Handle tab click
  const handleTabClick = (tabId) => {
    if (tabId === 'activity') {
      setViewMode('activity');
      setActiveTab('activity');
      // Re-fetch activity to get latest changes
      fetchProjectActivity();
    } else {
      setViewMode('info');
      scrollToSection(tabId);
    }
  };

  // Scroll to section when tab is clicked
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    const container = scrollContainerRef.current;
    if (section && container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = section.getBoundingClientRect().top;
      const offset = sectionTop - containerTop + container.scrollTop - 12;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      setActiveTab(sectionId);
    }
  };

  // Update active tab based on scroll position (only in info view)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !selectedProject || viewMode !== 'info') return;

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let currentSection = 'action-items';

      INFO_TABS.forEach(tab => {
        const section = document.getElementById(tab.id);
        if (section) {
          const sectionTop = section.getBoundingClientRect().top - containerTop;
          if (sectionTop <= 50) {
            currentSection = tab.id;
          }
        }
      });

      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedProject, viewMode]);

  if (!selectedProject) return null;

  const getStatusLabel = (status) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getProjectTypeChips = () => {
    const types = formData.project_types_list || [];
    return types.map(type => {
      const option = PROJECT_TYPE_OPTIONS.find(opt => opt.value === type);
      return option || { value: type, label: type, color: 'bg-gray-100 text-gray-700' };
    });
  };

  // Statuses where due date warnings don't apply (project is finished)
  const COMPLETED_STATUSES = ['completed', 'closed_paid', 'cancelled'];
  const isProjectCompleted = COMPLETED_STATUSES.includes(formData.status);

  const getDaysUntilDue = () => {
    if (!formData.due_date || isProjectCompleted) return null;
    const today = new Date();
    const dueDate = new Date(formData.due_date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="w-2/3 p-4 animate-slide-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 relative">

        {/* Save Status Toast */}
        {saveStatus?.show && (
          <div className={`absolute top-4 right-16 z-10 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
            saveStatus.success
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}>
            {saveStatus.success ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saveStatus.message}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {saveStatus.message}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {formData.job_number}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[formData.status] || STATUS_COLORS.not_started}`}>
                  {getStatusLabel(formData.status)}
                </span>
                {daysUntilDue !== null && (
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    daysUntilDue < 0 ? 'bg-red-100 text-red-700' :
                    daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` :
                     daysUntilDue === 0 ? 'Due today' :
                     `${daysUntilDue}d remaining`}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{formData.project_name}</h2>
              <div className="flex flex-wrap gap-2">
                {getProjectTypeChips().map((type, idx) => (
                  <span key={idx} className={`px-2.5 py-1 text-xs font-medium rounded-md ${type.color}`}>
                    {type.label}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Info Bar */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <InfoCard
              label="Client"
              value={formData.client_name}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <InfoCard
              label="Manager"
              value={formData.manager_name}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            <InfoCard
              label="Due Date"
              value={formData.due_date ? new Date(formData.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-1 overflow-x-auto sticky top-0 z-10">
          {/* Info Tabs */}
          {INFO_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id && viewMode === 'info'
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}

          {/* Separator */}
          <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

          {/* Activity Tab */}
          <button
            onClick={() => handleTabClick('activity')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              viewMode === 'activity'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ACTIVITY_TAB.icon} />
            </svg>
            {ACTIVITY_TAB.label}
            {projectActivity.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full">
                {projectActivity.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">

          {viewMode === 'activity' ? (
            /* Activity View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity History</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{projectActivity.length} activit{projectActivity.length !== 1 ? 'ies' : 'y'} recorded</p>
                  </div>
                </div>
              </div>

              {loadingActivity ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading activity...</span>
                </div>
              ) : projectActivity.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-600">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-300 text-lg font-medium">No activity recorded</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Changes to this project will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectActivity.map((activity) => {
                    const actionConfig = ACTION_TYPE_COLORS[activity.action_type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: activity.action_type };
                    const timestamp = new Date(activity.timestamp);
                    return (
                      <div
                        key={activity.id}
                        className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${actionConfig.bg} ${actionConfig.text}`}>
                                {actionConfig.label}
                              </span>
                              {activity.changed_field && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                                  {activity.changed_field}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">{activity.description}</p>
                            {(activity.old_value || activity.new_value) && (
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                {activity.old_value && (
                                  <span className="text-red-600 dark:text-red-400 line-through bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded max-w-xs truncate">
                                    {activity.old_value}
                                  </span>
                                )}
                                {activity.old_value && activity.new_value && (
                                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                )}
                                {activity.new_value && (
                                  <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded font-medium max-w-xs truncate">
                                    {activity.new_value}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {activity.user_name && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">by {activity.user_name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Info View */
            <>
          {/* Action Items Section - Most Important First */}
          <section id="action-items" className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              title="Action Items"
              subtitle="Current tasks and open items"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
                <FormField
                  label="Open Items"
                  fieldName="current_open_items"
                  value={formData.current_open_items}
                  isEditing={editingField === 'current_open_items'}
                  saving={savingField === 'current_open_items'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
                <FormField
                  label="Action Items"
                  fieldName="current_action_items"
                  value={formData.current_action_items}
                  isEditing={editingField === 'current_action_items'}
                  saving={savingField === 'current_action_items'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Timeline Section */}
          <section id="timeline" className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              title="Timeline & Dates"
              subtitle="Important project milestones"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <FormField
                  label="Due Date"
                  fieldName="due_date"
                  value={formData.due_date}
                  isEditing={editingField === 'due_date'}
                  saving={savingField === 'due_date'}
                  type="date"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
                <FormField
                  label="Notes"
                  fieldName="due_date_note"
                  value={formData.due_date_note}
                  isEditing={editingField === 'due_date_note'}
                  saving={savingField === 'due_date_note'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <FormField
                  label="Rough-In Date"
                  fieldName="rough_in_date"
                  value={formData.rough_in_date}
                  isEditing={editingField === 'rough_in_date'}
                  saving={savingField === 'rough_in_date'}
                  type="date"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
                <FormField
                  label="Notes"
                  fieldName="rough_in_note"
                  value={formData.rough_in_note}
                  isEditing={editingField === 'rough_in_note'}
                  saving={savingField === 'rough_in_note'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <FormField
                  label="Final Inspection Date"
                  fieldName="final_inspection_date"
                  value={formData.final_inspection_date}
                  isEditing={editingField === 'final_inspection_date'}
                  saving={savingField === 'final_inspection_date'}
                  type="date"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
                <FormField
                  label="Notes"
                  fieldName="final_inspection_note"
                  value={formData.final_inspection_note}
                  isEditing={editingField === 'final_inspection_note'}
                  saving={savingField === 'final_inspection_note'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Project Details Section */}
          <section id="project-details" className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              title="Project Details"
              subtitle="Core project information"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Project Name"
                fieldName="project_name"
                value={formData.project_name}
                isEditing={editingField === 'project_name'}
                saving={savingField === 'project_name'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Job Number"
                fieldName="job_number"
                value={formData.job_number}
                isEditing={editingField === 'job_number'}
                saving={savingField === 'job_number'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Status"
                fieldName="status"
                value={formData.status}
                isEditing={editingField === 'status'}
                saving={savingField === 'status'}
                type="select"
                options={STATUS_OPTIONS}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Sub Status"
                fieldName="current_sub_status"
                value={formData.current_sub_status}
                isEditing={editingField === 'current_sub_status'}
                saving={savingField === 'current_sub_status'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Project Types"
                  fieldName="project_types_list"
                  value={formData.project_types_list}
                  isEditing={editingField === 'project_types_list'}
                  saving={savingField === 'project_types_list'}
                  type="multiselect"
                  options={PROJECT_TYPE_OPTIONS}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section id="team" className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              title="Team & Stakeholders"
              subtitle="People involved in this project"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Client"
                fieldName="client_name"
                value={formData.client_name}
                isEditing={editingField === 'client_name'}
                saving={savingField === 'client_name'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Manager"
                fieldName="manager_name"
                value={formData.manager_name}
                isEditing={editingField === 'manager_name'}
                saving={savingField === 'manager_name'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Architect / Designer"
                  fieldName="architect_name"
                  value={formData.architect_name}
                  isEditing={editingField === 'architect_name'}
                  saving={savingField === 'architect_name'}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section id="location" className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              title="Location"
              subtitle="Project address and legal information"
            />
            <div className="space-y-4">
              <FormField
                label="Address"
                fieldName="address"
                value={formData.address}
                isEditing={editingField === 'address'}
                saving={savingField === 'address'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Legal Address (Parcel, Block, Lot)"
                fieldName="legal_address"
                value={formData.legal_address}
                isEditing={editingField === 'legal_address'}
                saving={savingField === 'legal_address'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>
          </section>

          {/* Billing Section */}
          <section id="billing" className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="Billing"
              subtitle="Payment and billing information"
            />
            <FormField
              label="Billing Information"
              fieldName="billing_info"
              value={formData.billing_info}
              isEditing={editingField === 'billing_info'}
              saving={savingField === 'billing_info'}
              type="textarea"
              onEdit={onEdit}
              onSave={onSave}
              onCancel={onCancel}
              onChange={onChange}
            />
          </section>

          {/* System Info Section */}
          <section id="system-info" className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="System Information"
              subtitle="Record timestamps"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedProject.created_at && (
                <InfoCard
                  label="Created"
                  value={new Date(selectedProject.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
              {selectedProject.updated_at && (
                <InfoCard
                  label="Last Updated"
                  value={new Date(selectedProject.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
              {selectedProject.last_status_change && (
                <InfoCard
                  label="Status Changed"
                  value={new Date(selectedProject.last_status_change).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
            </div>
          </section>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
