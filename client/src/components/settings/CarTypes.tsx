import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import SettingsLayout from './SettingsLayout';

interface CarType {
  id: string;
  name: string;
  capacity: number;
  luggage_capacity: number;
  description: string;
}

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

export default function CarTypes() {
  const navigate = useNavigate();
  const { carTypes, addCarType, deleteCarType, updateCarType } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingCarType, setEditingCarType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 4,
    luggage_capacity: 2,
    description: '',
  });

  const handleDeleteCarType = (id: string) => {
    if (window.confirm('Are you sure you want to delete this car type?')) {
      deleteCarType(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCarType(formData);
    setFormData({ name: '', capacity: 4, luggage_capacity: 2, description: '' });
    setShowForm(false);
  };

  const handleEdit = (carType: CarType) => {
    setFormData({
      name: carType.name,
      capacity: carType.capacity,
      luggage_capacity: carType.luggage_capacity,
      description: carType.description,
    });
    setEditingCarType(carType.id);
    setShowForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCarType) {
      updateCarType(editingCarType, formData);
      setEditingCarType(null);
    }
    setFormData({ name: '', capacity: 4, luggage_capacity: 2, description: '' });
    setShowForm(false);
  };

  return (
    <SettingsLayout 
      title="Car Types" 
      onAdd={() => setShowForm(true)}
      addButtonText="Add Car Type"
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
              {editingCarType ? 'Edit Car Type' : 'Add New Car Type'}
            </h3>
            <form onSubmit={editingCarType ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Car Type Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                    Passenger Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                    Luggage Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.luggage_capacity}
                    onChange={(e) => setFormData({ ...formData, luggage_capacity: parseInt(e.target.value) })}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                  className="outline-none w-full"
                  style={{
                    background: 'var(--dp-surface)',
                    border: '1px solid var(--dp-border)',
                    borderRadius: 10,
                    padding: '9px 14px',
                    fontSize: 16,
                    color: 'var(--dp-text)',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
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
                  {editingCarType ? 'Update Car Type' : 'Add Car Type'}
                </button>
              </div>
            </form>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                  {['Car Type', 'Capacity', 'Luggage', 'Description', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        color: 'var(--dp-text-muted)',
                        background: 'var(--dp-surface-2)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {carTypes.map((carType) => (
                  <tr
                    key={carType.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--dp-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--dp-text)' }}>
                      {carType.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {carType.capacity} passengers
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {carType.luggage_capacity} pieces
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-muted)', maxWidth: 260 }}>
                      {carType.description}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(carType)}
                          className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                          style={{ color: 'var(--dp-text-secondary)' }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCarType(carType.id)}
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
