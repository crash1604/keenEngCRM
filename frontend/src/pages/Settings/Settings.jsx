import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Snackbar, CircularProgress, Switch } from '@mui/material';
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
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { useSnackbar } from '../../hooks/useSnackbar';
import { validateEmail, validateRequired } from '../../utils/validators';
import api from '../../services/api';

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
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();

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

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    provider: 'outlook',
    provider_display: '',
    email_address: '',
    email_password: '',
    display_name: '',
    smtp_host: '',
    smtp_port: 587,
    use_tls: true,
    has_password: false,
    last_verified_at: null,
  });
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailSettingsErrors, setEmailSettingsErrors] = useState({});
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

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

  // Fetch email settings on mount
  useEffect(() => {
    const fetchEmailSettings = async () => {
      try {
        const response = await api.get('/auth/email-settings/');
        if (response.data && response.data.configured !== false) {
          setEmailSettings({
            provider: response.data.provider || 'outlook',
            provider_display: response.data.provider_display || '',
            email_address: response.data.email_address || '',
            email_password: '', // Never returned from backend
            display_name: response.data.display_name || '',
            smtp_host: response.data.smtp_host || '',
            smtp_port: response.data.smtp_port || 587,
            use_tls: response.data.use_tls !== false,
            has_password: response.data.has_password || false,
            last_verified_at: response.data.last_verified_at || null,
          });
          setEmailConfigured(true);
          setEmailVerified(response.data.is_verified || false);
        }
      } catch (error) {
        // No email settings configured yet - that's okay
        console.log('No email settings configured');
      }
    };
    fetchEmailSettings();
  }, []);

  // Handle email settings change
  const handleEmailSettingsChange = useCallback((e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({ ...prev, [name]: value }));
    if (emailSettingsErrors[name]) {
      setEmailSettingsErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [emailSettingsErrors]);

  // Handle provider change
  const handleProviderChange = useCallback((e) => {
    const provider = e.target.value;
    setEmailSettings(prev => ({
      ...prev,
      provider,
      smtp_host: provider === 'outlook' ? 'smtp.office365.com' :
                 provider === 'gmail' ? 'smtp.gmail.com' : prev.smtp_host,
      smtp_port: 587,
      use_tls: true,
    }));
  }, []);

  // Validate email settings
  const validateEmailSettings = useCallback(() => {
    const errors = {};
    if (!validateRequired(emailSettings.email_address)) {
      errors.email_address = 'Email address is required';
    } else if (!validateEmail(emailSettings.email_address)) {
      errors.email_address = 'Please enter a valid email address';
    }
    if (!emailConfigured && !validateRequired(emailSettings.email_password)) {
      errors.email_password = 'App password is required';
    }
    if (emailSettings.provider === 'custom') {
      if (!validateRequired(emailSettings.smtp_host)) {
        errors.smtp_host = 'SMTP host is required';
      }
    }
    setEmailSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  }, [emailSettings, emailConfigured]);

  // Save email settings
  const handleEmailSettingsSave = useCallback(async () => {
    if (!validateEmailSettings()) return;

    setEmailSettingsLoading(true);
    try {
      const payload = {
        provider: emailSettings.provider,
        email_address: emailSettings.email_address,
        display_name: emailSettings.display_name,
        smtp_host: emailSettings.smtp_host,
        smtp_port: emailSettings.smtp_port,
        use_tls: emailSettings.use_tls,
      };
      if (emailSettings.email_password?.trim()) {
        payload.email_password = emailSettings.email_password;
      }

      const response = await api.put('/auth/email-settings/', payload);

      setEmailSettings(prev => ({
        ...prev,
        email_password: '',
        provider_display: response.data.provider_display || '',
        has_password: response.data.has_password || false,
        last_verified_at: response.data.last_verified_at || null,
      }));
      setEmailConfigured(true);
      setEmailVerified(response.data.is_verified || false);

      showSuccess('Email settings saved successfully. Please test your configuration.');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to save email settings');
    } finally {
      setEmailSettingsLoading(false);
    }
  }, [emailSettings, validateEmailSettings, showSuccess, showError]);

  // Test email settings
  const handleTestEmailSettings = useCallback(async () => {
    setEmailTestLoading(true);
    try {
      const response = await api.post('/auth/email-settings/test/');
      setEmailVerified(true);
      setEmailSettings(prev => ({
        ...prev,
        last_verified_at: new Date().toISOString(),
      }));
      showSuccess(response.data.message || 'Test email sent successfully!');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to send test email');
    } finally {
      setEmailTestLoading(false);
    }
  }, [showSuccess, showError]);

  // Handle profile form change
  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [profileErrors]);

  // Validate profile form
  const validateProfile = useCallback(() => {
    const errors = {};
    if (!validateRequired(profileData.first_name)) {
      errors.first_name = 'First name is required';
    }
    if (!validateRequired(profileData.last_name)) {
      errors.last_name = 'Last name is required';
    }
    if (!validateRequired(profileData.email)) {
      errors.email = 'Email is required';
    } else if (!validateEmail(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  }, [profileData]);

  // Handle profile save
  const handleProfileSave = useCallback(async () => {
    if (!validateProfile()) return;

    setProfileLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        showSuccess('Profile updated successfully');
      } else {
        showError(result.error || 'Failed to update profile');
      }
    } catch {
      showError('An error occurred while updating profile');
    } finally {
      setProfileLoading(false);
    }
  }, [profileData, validateProfile, updateProfile, showSuccess, showError]);

  // Handle password form change
  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [passwordErrors]);

  // Validate password form
  const validatePassword = useCallback(() => {
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
  }, [passwordData]);

  // Handle password save
  const handlePasswordSave = useCallback(async () => {
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      const result = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      if (result.success) {
        showSuccess('Password changed successfully');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        showError(result.error || 'Failed to change password');
      }
    } catch {
      showError('An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  }, [passwordData, validatePassword, changePassword, showSuccess, showError]);

  // Handle notification toggle
  const handleNotificationChange = useCallback((name) => (event) => {
    setNotifications(prev => ({ ...prev, [name]: event.target.checked }));
    showSuccess('Notification preference updated');
  }, [showSuccess]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Handle theme change
  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
  }, [setTheme]);

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

      {/* Email Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SectionHeader
          icon={<EmailIcon />}
          title="Email Configuration"
          subtitle="Configure your email settings to send emails from the CRM"
        />

        {/* Current Configuration Status Card */}
        <div className={`mb-6 p-4 rounded-xl border ${
          emailConfigured
            ? emailVerified
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${
              emailConfigured
                ? emailVerified
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
            }`}>
              {emailConfigured ? (
                emailVerified ? (
                  <CheckCircleIcon />
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )
              ) : (
                <EmailIcon />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${
                  emailConfigured
                    ? emailVerified
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-amber-800 dark:text-amber-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {emailConfigured
                    ? emailVerified
                      ? 'Email Configured & Verified'
                      : 'Email Configured - Verification Required'
                    : 'No Email Account Configured'}
                </h3>
              </div>
              {emailConfigured ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Sending from:</span>{' '}
                    <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                      {emailSettings.email_address}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Provider:</span>{' '}
                    {emailSettings.provider_display || (
                      emailSettings.provider === 'outlook' ? 'Microsoft Outlook / Office 365' :
                      emailSettings.provider === 'gmail' ? 'Gmail' : 'Custom SMTP'
                    )}
                  </p>
                  {emailSettings.display_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Display Name:</span> {emailSettings.display_name}
                    </p>
                  )}
                  {emailSettings.last_verified_at && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      <span className="font-medium">Last verified:</span>{' '}
                      {new Date(emailSettings.last_verified_at).toLocaleString()}
                    </p>
                  )}
                  {!emailSettings.has_password && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Password not set - please enter your app password below
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Configure your email account below to send emails directly from the CRM using your own email address.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Provider
            </label>
            <select
              value={emailSettings.provider}
              onChange={handleProviderChange}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 focus:outline-none"
            >
              <option value="outlook">Microsoft Outlook / Office 365</option>
              <option value="gmail">Gmail</option>
              <option value="custom">Custom SMTP Server</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {emailSettings.provider === 'outlook' && 'Uses smtp.office365.com - You\'ll need an App Password from your Microsoft account'}
              {emailSettings.provider === 'gmail' && 'Uses smtp.gmail.com - You\'ll need to enable 2FA and create an App Password'}
              {emailSettings.provider === 'custom' && 'Enter your own SMTP server details'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Address */}
            <FormInput
              label="Email Address"
              name="email_address"
              type="email"
              value={emailSettings.email_address}
              onChange={handleEmailSettingsChange}
              placeholder="your.email@company.com"
              disabled={emailSettingsLoading}
              error={emailSettingsErrors.email_address}
              required
            />

            {/* Display Name */}
            <FormInput
              label="Display Name"
              name="display_name"
              value={emailSettings.display_name}
              onChange={handleEmailSettingsChange}
              placeholder="John Smith"
              disabled={emailSettingsLoading}
            />
          </div>

          {/* App Password */}
          <div className="max-w-md">
            <FormInput
              label={emailConfigured ? "App Password (leave blank to keep current)" : "App Password"}
              name="email_password"
              type={showEmailPassword ? 'text' : 'password'}
              value={emailSettings.email_password}
              onChange={handleEmailSettingsChange}
              placeholder={emailConfigured ? "••••••••••••" : "Enter your app password"}
              disabled={emailSettingsLoading}
              error={emailSettingsErrors.email_password}
              required={!emailConfigured}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showEmailPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {emailSettings.provider === 'outlook' && (
                <>For Outlook/Office 365: Go to <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Security Settings</a> → App passwords</>
              )}
              {emailSettings.provider === 'gmail' && (
                <>For Gmail: Enable 2FA, then go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">App Passwords</a></>
              )}
              {emailSettings.provider === 'custom' && 'Enter the password for your SMTP server'}
            </p>
          </div>

          {/* Custom SMTP Settings */}
          {emailSettings.provider === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FormInput
                label="SMTP Host"
                name="smtp_host"
                value={emailSettings.smtp_host}
                onChange={handleEmailSettingsChange}
                placeholder="smtp.example.com"
                disabled={emailSettingsLoading}
                error={emailSettingsErrors.smtp_host}
                required
              />
              <FormInput
                label="SMTP Port"
                name="smtp_port"
                type="number"
                value={emailSettings.smtp_port}
                onChange={handleEmailSettingsChange}
                placeholder="587"
                disabled={emailSettingsLoading}
              />
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={emailSettings.use_tls}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, use_tls: e.target.checked }))}
                  color="primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Use TLS</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleEmailSettingsSave}
            disabled={emailSettingsLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {emailSettingsLoading ? (
              <>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <SaveIcon fontSize="small" />
                <span>Save Settings</span>
              </>
            )}
          </button>

          {emailConfigured && (
            <button
              onClick={handleTestEmailSettings}
              disabled={emailTestLoading || emailSettingsLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailTestLoading ? (
                <>
                  <CircularProgress size={16} />
                  <span>Sending Test...</span>
                </>
              ) : (
                <>
                  <SendIcon fontSize="small" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          )}
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
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
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
