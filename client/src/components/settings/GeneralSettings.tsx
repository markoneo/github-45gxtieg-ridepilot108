import React, { useState, useEffect } from 'react';
import { Settings2, AlertTriangle } from 'lucide-react';
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
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About Project Capacity Settings
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Configure your daily project capacity limits and receive warnings when approaching or exceeding your workload threshold.
                </p>
              </div>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 bg-amber-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Daily Project Capacity
              </h3>
              <p className="text-sm text-gray-600">
                Set a threshold for your daily workload to receive visual warnings on the dashboard
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum projects per day before warning
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Set how many projects you can handle per day. When exceeded, a warning will appear on the dashboard.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">
                    Preview Warning
                  </h4>
                  <p className="text-sm text-amber-700">
                    High workload – You have <strong>{dailyCapacity + 2} projects</strong> scheduled for a date, which exceeds your daily limit of <strong>{dailyCapacity}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <Settings2 className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Note
              </h4>
              <p className="text-sm text-gray-600">
                This is a visual warning only. You can still create projects beyond this limit. The warning helps you manage your workload and avoid overbooking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
