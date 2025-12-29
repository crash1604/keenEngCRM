// src/pages/Settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as SystemIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';

// Section Header Component
const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
      {icon}
    </div>
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

// Form Input Component
const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  error,
  required,
  endAdornment,
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-all duration-200
          ${error
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 text-gray-900 dark:text-white'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
          }
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
          focus:outline-none`}
      />
      {endAdornment && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {endAdornment}
        </div>
      )}
    </div>
    {error && (
      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const Settings = () => {
  const { user, updateProfile, changePassword, logout } = useAuthStore();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    project_updates: true,
    activity_alerts: true,
    weekly_digest: false,
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate profile form
  const validateProfile = () => {
    const errors = {};
    if (!profileData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!profileData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile save
  const handleProfileSave = async () => {
    if (!validateProfile()) return;

    setProfileLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to update profile',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while updating profile',
        severity: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate password form
  const validatePassword = () => {
    const errors = {};
    if (!passwordData.current_password) {
      errors.current_password = 'Current password is required';
    }
    if (!passwordData.new_password) {
      errors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters';
    }
    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password save
  const handlePasswordSave = async () => {
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      const result = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Password changed successfully',
          severity: 'success',
        });
        // Clear password form
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to change password',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while changing password',
        severity: 'error',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle notification toggle
  const handleNotificationChange = (name) => (event) => {
    setNotifications(prev => ({ ...prev, [name]: event.target.checked }));
    // In a real app, you'd save this to the backend
    setSnackbar({
      open: true,
      message: 'Notification preference updated',
      severity: 'success',
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader
          icon={<PersonIcon />}
          title="Profile Information"
          subtitle="Update your personal information"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="First Name"
            name="first_name"
            value={profileData.first_name}
            onChange={handleProfileChange}
            placeholder="Enter your first name"
            disabled={profileLoading}
            error={profileErrors.first_name}
            required
          />
          <FormInput
            label="Last Name"
            name="last_name"
            value={profileData.last_name}
            onChange={handleProfileChange}
            placeholder="Enter your last name"
            disabled={profileLoading}
            error={profileErrors.last_name}
            required
          />
          <div className="md:col-span-2">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              placeholder="Enter your email"
              disabled={profileLoading}
              error={profileErrors.email}
              required
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleProfileSave}
            disabled={profileLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {profileLoading ? (
              <>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon fontSize="small" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader
          icon={<LockIcon />}
          title="Change Password"
          subtitle="Update your password to keep your account secure"
        />

        <div className="space-y-4 max-w-md">
          <FormInput
            label="Current Password"
            name="current_password"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordData.current_password}
            onChange={handlePasswordChange}
            placeholder="Enter your current password"
            disabled={passwordLoading}
            error={passwordErrors.current_password}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.current ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            }
          />
          <FormInput
            label="New Password"
            name="new_password"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            placeholder="Enter your new password"
            disabled={passwordLoading}
            error={passwordErrors.new_password}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.new ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            }
          />
          <FormInput
            label="Confirm New Password"
            name="confirm_password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordData.confirm_password}
            onChange={handlePasswordChange}
            placeholder="Confirm your new password"
            disabled={passwordLoading}
            error={passwordErrors.confirm_password}
            required
            endAdornment={
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords.confirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            }
          />
        </div>

        <div className="flex justify-start mt-6">
          <button
            onClick={handlePasswordSave}
            disabled={passwordLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {passwordLoading ? (
              <>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <LockIcon fontSize="small" />
                <span>Change Password</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader
          icon={<NotificationsIcon />}
          title="Notification Preferences"
          subtitle="Choose what notifications you receive"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications for important updates</p>
            </div>
            <Switch
              checked={notifications.email_notifications}
              onChange={handleNotificationChange('email_notifications')}
              color="primary"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Project Updates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when projects are updated</p>
            </div>
            <Switch
              checked={notifications.project_updates}
              onChange={handleNotificationChange('project_updates')}
              color="primary"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Activity Alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts for important activity</p>
            </div>
            <Switch
              checked={notifications.activity_alerts}
              onChange={handleNotificationChange('activity_alerts')}
              color="primary"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Weekly Digest</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of activity</p>
            </div>
            <Switch
              checked={notifications.weekly_digest}
              onChange={handleNotificationChange('weekly_digest')}
              color="primary"
            />
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader
          icon={<PaletteIcon />}
          title="Appearance"
          subtitle="Customize how the app looks"
        />

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose your preferred theme for the application
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-3 rounded-full ${
                theme === 'light'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                <LightModeIcon />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${
                  theme === 'light' ? 'text-blue-700' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  Light
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bright and clean
                </p>
              </div>
              {theme === 'light' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-3 rounded-full ${
                theme === 'dark'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                <DarkModeIcon />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-blue-700' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  Dark
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Easy on the eyes
                </p>
              </div>
              {theme === 'dark' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* System Mode */}
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-3 rounded-full ${
                theme === 'system'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                <SystemIcon />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${
                  theme === 'system' ? 'text-blue-700' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  System
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Match device settings
                </p>
              </div>
              {theme === 'system' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-900 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danger Zone</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Irreversible and destructive actions</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sign out of your account</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">You will need to log in again to access the app</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Settings;
