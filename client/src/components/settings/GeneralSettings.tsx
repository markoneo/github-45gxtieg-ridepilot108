import React, { useState, useEffect } from 'react';
import { Settings2, AlertTriangle, Info } from 'lucide-react';
import SettingsLayout from './SettingsLayout';

const DAILY_CAPACITY_KEY = 'ridepilot_daily_capacity';

export default function GeneralSettings() {
  const [dailyCapacity, setDailyCapacity] = useState<number>(10);
  const [inputValue, setInputValue] = useState<string>('10');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(DAILY_CAPACITY_KEY);
    if (saved) {
      const value = parseInt(saved, 10);
      setDailyCapacity(value);
      setInputValue(value.toString());
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setDailyCapacity(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue('1');
      setDailyCapacity(1);
    } else if (numValue > 100) {
      setInputValue('100');
      setDailyCapacity(100);
    } else {
      setInputValue(numValue.toString());
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleInputBlur();
    localStorage.setItem(DAILY_CAPACITY_KEY, dailyCapacity.toString());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <SettingsLayout title="Project Capacity Settings">
      <div className="space-y-5">
        {/* Info box */}
        <div
          className="flex items-start gap-3 p-4"
          style={{
            background: 'var(--dp-accent-soft)',
            border: '1px solid var(--dp-border)',
            borderRadius: 'var(--dp-radius)',
          }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--dp-accent)' }} />
          <div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--dp-text)' }}>
              About Project Capacity Settings
            </h3>
            <p className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
              Configure your daily project capacity limits and receive warnings when approaching or exceeding your workload threshold.
            </p>
          </div>
        </div>

        {/* Success toast */}
        {showSuccess && (
          <div
            className="flex items-center gap-2 p-4"
            style={{
              background: 'var(--dp-success-bg)',
              border: '1px solid var(--dp-border)',
              borderRadius: 'var(--dp-radius)',
              color: 'var(--dp-success)',
            }}
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">Settings saved successfully!</p>
          </div>
        )}

        {/* Main card */}
        <div
          className="p-6"
          style={{
            background: 'var(--dp-surface)',
            border: '1px solid var(--dp-border)',
            borderRadius: 'var(--dp-radius)',
          }}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className="flex-shrink-0 p-3"
              style={{ background: 'var(--dp-warning-bg)', borderRadius: 10 }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: 'var(--dp-warning)' }} />
            </div>
            <div>
              <h3
                className="font-heading text-lg mb-1"
                style={{ color: 'var(--dp-text)' }}
              >
                Daily Project Capacity
              </h3>
              <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>
                Set a threshold for your daily workload to receive visual warnings on the dashboard
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}
              >
                Maximum projects per day before warning
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full sm:w-64 outline-none transition-all"
                style={{
                  background: 'var(--dp-surface)',
                  border: '1px solid var(--dp-border)',
                  borderRadius: 10,
                  padding: '9px 14px',
                  height: 40,
                  fontSize: 16,
                  color: 'var(--dp-text)',
                  fontFamily: 'var(--font-mono)',
                }}
                required
              />
              <p className="mt-2 text-sm" style={{ color: 'var(--dp-text-muted)' }}>
                Set how many projects you can handle per day. When exceeded, a warning will appear on the dashboard.
              </p>
            </div>

            {/* Warning preview */}
            <div
              className="flex items-start gap-3 p-4"
              style={{
                background: 'var(--dp-warning-bg)',
                border: '1px solid var(--dp-border)',
                borderRadius: 10,
              }}
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--dp-warning)' }} />
              <div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--dp-warning)' }}>
                  Preview Warning
                </h4>
                <p className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
                  High workload – You have <strong>{dailyCapacity + 2} projects</strong> scheduled for a date, which exceeds your daily limit of <strong>{dailyCapacity}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  const saved = localStorage.getItem(DAILY_CAPACITY_KEY);
                  if (saved) {
                    const value = parseInt(saved, 10);
                    setDailyCapacity(value);
                    setInputValue(value.toString());
                  } else {
                    setDailyCapacity(10);
                    setInputValue('10');
                  }
                }}
                className="transition-opacity hover:opacity-80"
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--dp-border-strong)',
                  background: 'transparent',
                  color: 'var(--dp-text)',
                  fontSize: 14,
                  fontWeight: 500,
                  minHeight: 40,
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                className="transition-opacity hover:opacity-90"
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  background: 'var(--dp-accent)',
                  color: 'var(--dp-on-accent)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  minHeight: 40,
                }}
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Note */}
        <div
          className="flex items-start gap-3 p-4"
          style={{
            background: 'var(--dp-surface-2)',
            border: '1px solid var(--dp-border)',
            borderRadius: 'var(--dp-radius)',
          }}
        >
          <Settings2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--dp-text-muted)' }} />
          <div>
            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--dp-text-secondary)' }}>
              Note
            </h4>
            <p className="text-sm" style={{ color: 'var(--dp-text-muted)', lineHeight: 1.5 }}>
              This is a visual warning only. You can still create projects beyond this limit. The warning helps you manage your workload and avoid overbooking.
            </p>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
