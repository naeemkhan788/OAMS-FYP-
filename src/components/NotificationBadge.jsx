import React from 'react';

/**
 * Notification Badge Component
 * Displays a green dot on sidebar menu items when there are unread notifications
 */
const NotificationBadge = ({ count }) => {
  if (!count || count === 0) return null;

  return (
    <span className="ml-2 inline-flex items-center justify-center">
      <span className="flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
      </span>
    </span>
  );
};

export default NotificationBadge;
