import React, { useRef, useState, useEffect } from 'react';
import FormField from '../projects/FormField';
import { projectService } from '../../services/project';
import { activityService } from '../../services/activity';

// Tab configuration for architects - projects and activity are separate views
const INFO_TABS = [
  { id: 'basic-info', label: 'Basic Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'contact', label: 'Contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'professional', label: 'Professional', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'notes', label: 'Notes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'system-info', label: 'System', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const PROJECTS_TAB = { id: 'projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' };
const ACTIVITY_TAB = { id: 'activity', label: 'Activity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' };

// Action type colors for activity
const ACTION_TYPE_COLORS = {
  architect_created: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300', label: 'Created' },
  architect_updated: { bg: 'bg-violet-100 dark:bg-violet-900/50', text: 'text-violet-700 dark:text-violet-300', label: 'Updated' },
  architect_deactivated: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Deactivated' },
  architect_activated: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', label: 'Activated' },
  field_updated: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-700 dark:text-yellow-300', label: 'Field Updated' },
};

// Status badge colors for projects
const STATUS_COLORS = {
  not_started: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
  in_progress: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  submitted: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  completed: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  closed_paid: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  cancelled: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  on_hold: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  completed: 'Completed',
  closed_paid: 'Closed & Paid',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

// Project type colors
const PROJECT_TYPE_COLORS = {
  M: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  E: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
  P: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
  EM: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  FP: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  TI: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  VI: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

// Section Header Component
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">{title}</h3>
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
    <div className="text-sm font-medium text-gray-900 dark:text-white">{value || '—'}</div>
  </div>
);

const ArchitectDetailPanel = ({
  selectedArchitect,
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
  const [activeTab, setActiveTab] = useState('basic-info');
  const [viewMode, setViewMode] = useState('info'); // 'info', 'projects', or 'activity'
  const [architectProjects, setArchitectProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [architectActivity, setArchitectActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Fetch projects for this architect
  useEffect(() => {
    const fetchArchitectProjects = async () => {
      if (!selectedArchitect?.id) return;

      setLoadingProjects(true);
      try {
        const response = await projectService.getProjects({ architect_designer: selectedArchitect.id });
        const projects = response.results || response || [];
        setArchitectProjects(projects);
      } catch (error) {
        console.error('Failed to fetch architect projects:', error);
        setArchitectProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchArchitectProjects();
  }, [selectedArchitect?.id]);

  // Fetch activity for this architect
  const fetchArchitectActivity = async () => {
    if (!selectedArchitect?.id) return;

    setLoadingActivity(true);
    try {
      const response = await activityService.getActivityLogs({ entity_type: 'architect' });
      const allActivity = response.results || response || [];
      // Filter to only this architect's activity
      const activity = allActivity.filter(a => a.architect === selectedArchitect.id);
      setArchitectActivity(activity);
    } catch (error) {
      console.error('Failed to fetch architect activity:', error);
      setArchitectActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchArchitectActivity();
  }, [selectedArchitect?.id]);

  // Handle tab click
  const handleTabClick = (tabId) => {
    if (tabId === 'projects') {
      setViewMode('projects');
      setActiveTab('projects');
    } else if (tabId === 'activity') {
      setViewMode('activity');
      setActiveTab('activity');
      // Re-fetch activity to get latest changes
      fetchArchitectActivity();
    } else {
      setViewMode('info');
      setActiveTab(tabId);
      // Scroll to section
      setTimeout(() => {
        const section = document.getElementById(`architect-${tabId}`);
        const container = scrollContainerRef.current;
        if (section && container) {
          const containerTop = container.getBoundingClientRect().top;
          const sectionTop = section.getBoundingClientRect().top;
          const offset = sectionTop - containerTop + container.scrollTop - 12;
          container.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  // Update active tab based on scroll position (only in info view)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !selectedArchitect || viewMode !== 'info') return;

    const handleScroll = () => {
      const containerTop = container.getBoundingClientRect().top;
      let currentSection = 'basic-info';

      INFO_TABS.forEach(tab => {
        const section = document.getElementById(`architect-${tab.id}`);
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
  }, [selectedArchitect, viewMode]);

  if (!selectedArchitect) return null;

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
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{formData.name}</h2>
                  {formData.company_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formData.company_name}</p>
                  )}
                </div>
                <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full border ${
                  formData.is_active !== false
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                }`}>
                  {formData.is_active !== false ? 'Active' : 'Inactive'}
                </span>
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
              label="Email"
              value={formData.contact_email}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <InfoCard
              label="Phone"
              value={formData.phone}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
            />
            <InfoCard
              label="License #"
              value={formData.license_number}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
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
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
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

          {/* Projects Tab */}
          <button
            onClick={() => handleTabClick('projects')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              viewMode === 'projects'
                ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={PROJECTS_TAB.icon} />
            </svg>
            {PROJECTS_TAB.label}
            {architectProjects.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-violet-200 dark:bg-violet-700 text-violet-800 dark:text-violet-200 rounded-full">
                {architectProjects.length}
              </span>
            )}
          </button>

          {/* Activity Tab */}
          <button
            onClick={() => handleTabClick('activity')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              viewMode === 'activity'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ACTIVITY_TAB.icon} />
            </svg>
            {ACTIVITY_TAB.label}
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">{architectActivity.length} activit{architectActivity.length !== 1 ? 'ies' : 'y'} recorded</p>
                  </div>
                </div>
              </div>

              {loadingActivity ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading activity...</span>
                </div>
              ) : architectActivity.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-600">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No activity recorded</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Changes to this architect will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {architectActivity.map((activity) => {
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
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{activity.description}</p>
                            {(activity.old_value || activity.new_value) && (
                              <div className="flex items-center gap-2 text-xs">
                                {activity.old_value && (
                                  <span className="text-red-600 dark:text-red-400 line-through bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
                                    {activity.old_value}
                                  </span>
                                )}
                                {activity.old_value && activity.new_value && (
                                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                )}
                                {activity.new_value && (
                                  <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded font-medium">
                                    {activity.new_value}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-medium text-gray-900 dark:text-white">
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
          ) : viewMode === 'projects' ? (
            /* Projects View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg">
                    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projects</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{architectProjects.length} project{architectProjects.length !== 1 ? 's' : ''} associated with this architect</p>
                  </div>
                </div>
              </div>

              {loadingProjects ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</span>
                </div>
              ) : architectProjects.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-600">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No projects found</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Projects associated with this architect will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {architectProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Job Number and Name */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-mono bg-violet-50 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-lg font-semibold">
                              {project.job_number || `#${project.id}`}
                            </span>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {project.project_name}
                            </h4>
                          </div>

                          {/* Project Types */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {project.project_type?.split(',').map((type, idx) => (
                              <span
                                key={idx}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${PROJECT_TYPE_COLORS[type.trim()] || 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
                              >
                                {type.trim()}
                              </span>
                            ))}
                          </div>

                          {/* Client Name */}
                          {project.client_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {project.client_name}
                            </p>
                          )}

                          {/* Address */}
                          {project.address && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mb-2">
                              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {project.address}
                            </p>
                          )}

                          {/* Due Date */}
                          {project.due_date && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due: {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${STATUS_COLORS[project.status] || STATUS_COLORS.not_started}`}>
                            {STATUS_LABELS[project.status] || project.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Info View */
            <>
              {/* Basic Information Section */}
          <section id="architect-basic-info" className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              title="Basic Information"
              subtitle="Architect and company details"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                <FormField
                  label="Name"
                  fieldName="name"
                  value={formData.name}
                  isEditing={editingField === 'name'}
                  saving={savingField === 'name'}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                <FormField
                  label="Company Name"
                  fieldName="company_name"
                  value={formData.company_name}
                  isEditing={editingField === 'company_name'}
                  saving={savingField === 'company_name'}
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="architect-contact" className="bg-white dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              title="Contact Information"
              subtitle="Email, phone, and address"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                fieldName="contact_email"
                value={formData.contact_email}
                isEditing={editingField === 'contact_email'}
                saving={savingField === 'contact_email'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Phone"
                fieldName="phone"
                value={formData.phone}
                isEditing={editingField === 'phone'}
                saving={savingField === 'phone'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <FormField
                label="Website"
                fieldName="website"
                value={formData.website}
                isEditing={editingField === 'website'}
                saving={savingField === 'website'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Address"
                  fieldName="address"
                  value={formData.address}
                  isEditing={editingField === 'address'}
                  saving={savingField === 'address'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Professional Section */}
          <section id="architect-professional" className="bg-white dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              title="Professional Information"
              subtitle="License and affiliations"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="License Number"
                fieldName="license_number"
                value={formData.license_number}
                isEditing={editingField === 'license_number'}
                saving={savingField === 'license_number'}
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
              <div className="md:col-span-2">
                <FormField
                  label="Professional Affiliations"
                  fieldName="professional_affiliations"
                  value={formData.professional_affiliations}
                  isEditing={editingField === 'professional_affiliations'}
                  saving={savingField === 'professional_affiliations'}
                  type="textarea"
                  onEdit={onEdit}
                  onSave={onSave}
                  onCancel={onCancel}
                  onChange={onChange}
                />
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section id="architect-notes" className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              title="Notes"
              subtitle="Additional information and comments"
            />
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
              <FormField
                label="Notes"
                fieldName="notes"
                value={formData.notes}
                isEditing={editingField === 'notes'}
                saving={savingField === 'notes'}
                type="textarea"
                onEdit={onEdit}
                onSave={onSave}
                onCancel={onCancel}
                onChange={onChange}
              />
            </div>
          </section>

          {/* System Info Section */}
          <section id="architect-system-info" className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600 scroll-mt-4">
            <SectionHeader
              icon={<svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="System Information"
              subtitle="Account and record details"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard
                label="Architect ID"
                value={selectedArchitect.id}
              />
              <InfoCard
                label="Has User Account"
                value={selectedArchitect.is_user ? 'Yes' : 'No'}
              />
              <InfoCard
                label="Status"
                value={selectedArchitect.is_active !== false ? 'Active' : 'Inactive'}
              />
              {selectedArchitect.created_at && (
                <InfoCard
                  label="Created"
                  value={new Date(selectedArchitect.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
              {selectedArchitect.updated_at && (
                <InfoCard
                  label="Last Updated"
                  value={new Date(selectedArchitect.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

export default ArchitectDetailPanel;
