import { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    systemAlerts: true,
    studentEnrollments: true,
    teacherUpdates: false
  });

  const [systemSettings, setSystemSettings] = useState({
    academicYear: '2023-2024',
    currentSemester: 'Spring',
    gradingScale: '4.0',
    attendanceThreshold: '75',
    maxClassSize: '50',
    automaticGrading: false,
    allowSelfEnrollment: true,
    requireApproval: true
  });

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'academic', name: 'Academic', icon: '📚' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'backup', name: 'Backup', icon: '💾' },
  ];

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSystemSettingChange = (key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">System Settings</h1>
        <p className="text-gray-600">Configure system preferences and administrative settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-6">General Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">System Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                        <input
                          type="text"
                          defaultValue="University of Technology"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">System Version</label>
                        <input
                          type="text"
                          defaultValue="OAMS v2.1.0"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option>UTC-05:00 Eastern Time</option>
                          <option>UTC-06:00 Central Time</option>
                          <option>UTC-07:00 Mountain Time</option>
                          <option>UTC-08:00 Pacific Time</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Maintenance Mode</h3>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable Maintenance Mode</p>
                        <p className="text-xs text-gray-500">Temporarily disable user access for system maintenance</p>
                      </div>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-6">Notification Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Channels</h3>
                    <div className="space-y-3">
                      {Object.entries({
                        emailNotifications: 'Email Notifications',
                        smsNotifications: 'SMS Notifications',
                        pushNotifications: 'Push Notifications'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500">
                              {key === 'emailNotifications' && 'Receive notifications via email'}
                              {key === 'smsNotifications' && 'Receive notifications via SMS'}
                              {key === 'pushNotifications' && 'Receive push notifications in browser'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationChange(key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              notifications[key] ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              notifications[key] ? 'translate-x-6' : 'translate-x-1'
                            }`}></span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Types</h3>
                    <div className="space-y-3">
                      {Object.entries({
                        weeklyReports: 'Weekly Reports',
                        systemAlerts: 'System Alerts',
                        studentEnrollments: 'Student Enrollments',
                        teacherUpdates: 'Teacher Updates'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500">
                              {key === 'weeklyReports' && 'Get weekly summary reports'}
                              {key === 'systemAlerts' && 'Receive system maintenance alerts'}
                              {key === 'studentEnrollments' && 'Notifications for new student enrollments'}
                              {key === 'teacherUpdates' && 'Updates on teacher activities'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleNotificationChange(key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              notifications[key] ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              notifications[key] ? 'translate-x-6' : 'translate-x-1'
                            }`}></span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-6">Academic Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Academic Calendar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                        <select
                          value={systemSettings.academicYear}
                          onChange={(e) => handleSystemSettingChange('academicYear', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option>2023-2024</option>
                          <option>2024-2025</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
                        <select
                          value={systemSettings.currentSemester}
                          onChange={(e) => handleSystemSettingChange('currentSemester', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option>Fall</option>
                          <option>Spring</option>
                          <option>Summer</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Grading System</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grading Scale</label>
                        <select
                          value={systemSettings.gradingScale}
                          onChange={(e) => handleSystemSettingChange('gradingScale', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option>4.0</option>
                          <option>5.0</option>
                          <option>10.0</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Threshold (%)</label>
                        <input
                          type="number"
                          value={systemSettings.attendanceThreshold}
                          onChange={(e) => handleSystemSettingChange('attendanceThreshold', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Class Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Class Size</label>
                        <input
                          type="number"
                          value={systemSettings.maxClassSize}
                          onChange={(e) => handleSystemSettingChange('maxClassSize', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={systemSettings.automaticGrading}
                              onChange={(e) => handleSystemSettingChange('automaticGrading', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Automatic Grading</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={systemSettings.allowSelfEnrollment}
                              onChange={(e) => handleSystemSettingChange('allowSelfEnrollment', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Allow Self Enrollment</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={systemSettings.requireApproval}
                              onChange={(e) => handleSystemSettingChange('requireApproval', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Require Approval</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Password Policy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
                        <input
                          type="number"
                          defaultValue="8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                        <input
                          type="number"
                          defaultValue="90"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Session Management</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Session Timeout</p>
                          <p className="text-xs text-gray-500">Auto-logout after inactivity</p>
                        </div>
                        <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                          <option>30 minutes</option>
                          <option>1 hour</option>
                          <option>2 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div>
                <h2 className="text-lg font-semibold text-primary-900 mb-6">Backup & Recovery</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Automatic Backup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                          <option>30 days</option>
                          <option>90 days</option>
                          <option>1 year</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Backups</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">System Backup - March 7, 2024</p>
                          <p className="text-xs text-gray-500">Size: 245 MB • Status: Completed</p>
                        </div>
                        <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                          Restore
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">System Backup - March 6, 2024</p>
                          <p className="text-xs text-gray-500">Size: 242 MB • Status: Completed</p>
                        </div>
                        <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      Create Backup Now
                    </button>
                    <button className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
                      Download Backup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={saveSettings}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
