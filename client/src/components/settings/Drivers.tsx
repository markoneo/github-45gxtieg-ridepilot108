import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useData } from '../../contexts/DataContext';
import SettingsLayout from './SettingsLayout';

const inputStyle: React.CSSProperties = {
  background: 'var(--dp-surface)',
  border: '1px solid var(--dp-border)',
  borderRadius: 10,
  padding: '9px 14px',
  height: 40,
  fontSize: 16,
  color: 'var(--dp-text)',
  width: '100%',
  outline: 'none',
};

export default function Drivers() {
  const { drivers, companies, refreshData } = useData();
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license: '',
    status: 'available' as 'available' | 'busy' | 'offline',
    pin: '1234'
  });

  const handleEdit = (driver: any) => {
    setEditingDriver(driver);
    setShowForm(true);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      license: driver.license || '',
      status: driver.status || 'available',
      pin: String(driver.pin || '1234')
    });
  };

  const handleSave = async () => {
    if (!editingDriver) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          name: formData.name,
          phone: formData.phone,
          license: formData.license,
          status: formData.status,
          pin: formData.pin
        })
        .eq('id', editingDriver.id);

      if (error) throw error;

      await refreshData();
      setEditingDriver(null);
      setShowForm(false);
      setFormData({
        name: '',
        phone: '',
        license: '',
        status: 'available',
        pin: '1234'
      });
    } catch (error) {
      console.error('Error updating driver:', error);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('drivers')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          license: formData.license,
          status: formData.status,
          pin: formData.pin
        }]);

      if (error) throw error;

      await refreshData();
      setShowForm(false);
      setFormData({
        name: '',
        phone: '',
        license: '',
        status: 'available',
        pin: '1234'
      });
    } catch (error) {
      console.error('Error adding driver:', error);
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting driver:', error);
    }
  };

  const statusPill = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      available: { bg: 'var(--dp-success-bg)', color: 'var(--dp-success)' },
      busy: { bg: 'var(--dp-warning-bg)', color: 'var(--dp-warning)' },
      offline: { bg: 'var(--dp-charge-bg)', color: 'var(--dp-charge)' },
    };
    const s = map[status] || map.offline;
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold"
        style={{ background: s.bg, color: s.color, borderRadius: 99 }}
      >
        {status}
      </span>
    );
  };

  return (
    <SettingsLayout
      title="Drivers"
      onAdd={() => { setEditingDriver(null); setShowForm(true); }}
      addButtonText="Add Driver"
    >
      <div className="space-y-5">
        {/* Form */}
        {showForm && (
          <div
            className="p-6"
            style={{
              background: 'var(--dp-surface)',
              border: '1px solid var(--dp-border)',
              borderRadius: 'var(--dp-radius)',
            }}
          >
            <h3 className="font-heading text-base mb-4" style={{ color: 'var(--dp-text)' }}>
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>License</label>
                <input
                  type="text"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'available' | 'busy' | 'offline' })}
                  style={inputStyle}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>PIN (4-6 digits)</label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  maxLength={6}
                  pattern="[0-9]{4,6}"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={editingDriver ? handleSave : handleAdd}
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
                {editingDriver ? 'Save Changes' : 'Add Driver'}
              </button>
              {editingDriver && (
                <button
                  onClick={() => {
                    setEditingDriver(null);
                    setShowForm(false);
                    setFormData({
                      name: '',
                      phone: '',
                      license: '',
                      status: 'available',
                      pin: '1234'
                    });
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
                  Cancel
                </button>
              )}
              {!editingDriver && (
                <button
                  onClick={() => setShowForm(false)}
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
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div
          className="overflow-hidden"
          style={{
            background: 'var(--dp-surface)',
            border: '1px solid var(--dp-border)',
            borderRadius: 'var(--dp-radius)',
          }}
        >
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--dp-border)' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--dp-text-muted)',
              }}
            >
              All Drivers
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                  {['Name', 'Phone', 'License', 'Status', 'PIN', 'Earnings', 'Actions'].map((h, i) => (
                    <th
                      key={h}
                      className="px-4 py-3"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        color: 'var(--dp-text-muted)',
                        background: 'var(--dp-surface-2)',
                        textAlign: h === 'Earnings' ? 'right' : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers?.map((driver) => (
                  <tr
                    key={driver.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--dp-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--dp-text)' }}>
                      {driver.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                      {driver.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                      {driver.license || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {statusPill(driver.status)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {String(driver.pin || '1234')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ${Number(driver.total_earnings || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                          style={{ color: 'var(--dp-text-secondary)' }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="p-1.5 rounded-md transition-colors"
                          style={{ color: 'var(--dp-text-secondary)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--dp-danger)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dp-text-secondary)')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
