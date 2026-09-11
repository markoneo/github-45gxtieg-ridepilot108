import React from 'react';
import { Plus } from 'lucide-react';
import DispatchLayout from '../dispatch/DispatchLayout';

interface SettingsLayoutProps {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addButtonText?: string;
}

export default function SettingsLayout({ title, children, onAdd, addButtonText }: SettingsLayoutProps) {
  return (
    <DispatchLayout pageTitle={title}>
      <div style={{ maxWidth: 1100 }} className="mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="font-heading"
              style={{ fontSize: 22, color: 'var(--dp-text)' }}
            >
              {title}
            </h1>
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                background: 'var(--dp-accent)',
                color: 'var(--dp-on-accent)',
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                minHeight: 40,
              }}
            >
              <Plus className="w-4 h-4" />
              {addButtonText || 'Add New'}
            </button>
          )}
        </div>

        {children}
      </div>
    </DispatchLayout>
  );
}
