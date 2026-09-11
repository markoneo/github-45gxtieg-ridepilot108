import React from 'react';
import SettingsLayout from './settings/SettingsLayout';
import { Info } from 'lucide-react';

export default function NotificationSettings() {
  return (
    <SettingsLayout title="Notification Settings">
      <div
        className="flex items-start gap-3 p-4"
        style={{
          background: 'var(--dp-warning-bg)',
          border: '1px solid var(--dp-border)',
          borderRadius: 'var(--dp-radius)',
        }}
      >
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--dp-warning)' }} />
        <div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--dp-warning)' }}>Notifications Disabled</h3>
          <p className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
            Notifications have been disabled in this version of the application.
          </p>
        </div>
      </div>
    </SettingsLayout>
  );
}
