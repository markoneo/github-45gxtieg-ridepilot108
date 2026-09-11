import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Palette, Info, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import SettingsLayout from './SettingsLayout';

// Color options for companies
const colorOptions = [
  { name: 'Blue', value: 'blue', tailwindClass: 'bg-blue-500' },
  { name: 'Green', value: 'green', tailwindClass: 'bg-green-500' },
  { name: 'Purple', value: 'purple', tailwindClass: 'bg-purple-500' },
  { name: 'Amber', value: 'amber', tailwindClass: 'bg-amber-500' },
  { name: 'Teal', value: 'teal', tailwindClass: 'bg-teal-500' },
  { name: 'Red', value: 'red', tailwindClass: 'bg-red-500' },
  { name: 'Indigo', value: 'indigo', tailwindClass: 'bg-indigo-500' },
  { name: 'Pink', value: 'pink', tailwindClass: 'bg-pink-500' },
  { name: 'Orange', value: 'orange', tailwindClass: 'bg-orange-500' },
  { name: 'Emerald', value: 'emerald', tailwindClass: 'bg-emerald-500' },
  // Custom colors for specific companies
  { name: 'Viator', value: 'viator', tailwindClass: 'bg-[#328E6E]' },
  { name: 'Booking', value: 'booking', tailwindClass: 'bg-[#3D365C]' },
  { name: 'RideConnect', value: 'rideconnect', tailwindClass: 'bg-[#BF3131]' },
];

// Custom color input options
const customColorOptions = [
  { label: 'Viator Green', value: '#328E6E' },
  { label: 'Booking Purple', value: '#3D365C' },
  { label: 'RideConnect Red', value: '#BF3131' },
];

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

export default function Companies() {
  const navigate = useNavigate();
  const { companies, addCompany, deleteCompany, updateCompany } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    color: 'blue', // Default color
  });
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [companyColors, setCompanyColors] = useState<Record<string, string>>({});

  // Load company colors from localStorage on component mount
  useEffect(() => {
    const savedColors = localStorage.getItem('companyColors');
    if (savedColors) {
      setCompanyColors(JSON.parse(savedColors));
    }
  }, []);

  // Save company colors to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(companyColors).length > 0) {
      localStorage.setItem('companyColors', JSON.stringify(companyColors));
    }
  }, [companyColors]);

  const handleEdit = (company: any) => {
    // Get the company's saved color or default to blue
    const color = companyColors[company.id] || 'blue';
    setFormData({
      name: company.name,
      address: company.address,
      phone: company.phone,
      color
    });
    setEditingCompany(company.id);
    setShowForm(true);

    if (!colorOptions.some(opt => opt.value === color) && color.startsWith('#')) {
      setShowCustomColor(true);
      setCustomColor(color);
    } else {
      setShowCustomColor(false);
      setCustomColor('');
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      // Update the company in the database without the color field
      const { color, ...companyData } = formData;
      updateCompany(editingCompany, companyData);

      // Save the color separately in localStorage
      setCompanyColors(prev => ({
        ...prev,
        [editingCompany]: showCustomColor && customColor ? customColor : formData.color
      }));
      
      setEditingCompany(null);
    }
    setFormData({ name: '', address: '', phone: '', color: 'blue' });
    setShowForm(false);
    setShowCustomColor(false);
    setCustomColor('');
  };

  const handleDeleteCompany = (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteCompany(id);
      // Also remove the company's color from localStorage
      const newColors = { ...companyColors };
      delete newColors[id];
      setCompanyColors(newColors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add the company to the database without the color field
    const { color, ...companyData } = formData;
    addCompany(companyData).then((newCompany) => {
      if (newCompany?.id) {
        // Save the color separately in localStorage
        setCompanyColors(prev => ({
          ...prev,
          [newCompany.id]: showCustomColor && customColor ? customColor : formData.color
        }));
      }
    });
    
    setFormData({ name: '', address: '', phone: '', color: 'blue' });
    setShowForm(false);
    setShowCustomColor(false);
    setCustomColor('');
  };

  const getCompanyColorClass = (companyId: string) => {
    const color = companyColors[companyId];
    if (!color) return 'bg-gray-200';
    
    // For predefined colors
    const predefinedColor = colorOptions.find(opt => opt.value === color);
    if (predefinedColor) return predefinedColor.tailwindClass;
    
    // For custom hex colors
    if (color.startsWith('#')) return `bg-[${color}]`;
    
    return 'bg-gray-200';
  };

  return (
    <SettingsLayout 
      title="Companies" 
      onAdd={() => setShowForm(true)}
      addButtonText="Add Company"
    >
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
              About Companies
            </h3>
            <p className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
              You can add multiple company sources from which you receive projects (such as Viator, Booking.com, or partner agencies), 
              or simply add your own company if you work independently. Each company can have its own color theme for easy identification 
              in your dashboard and reports.
            </p>
          </div>
        </div>

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
              {editingCompany ? 'Edit Company' : 'Add New Company'}
            </h3>
            <form onSubmit={editingCompany ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Color selection */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  <Palette className="w-3.5 h-3.5" />
                  Company Color
                </label>
                
                <div
                  className="p-3"
                  style={{
                    background: 'var(--dp-surface-2)',
                    border: '1px solid var(--dp-border)',
                    borderRadius: 10,
                  }}
                >
                  {/* Color options */}
                  <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 mb-2">
                    {colorOptions.map(color => (
                      <div 
                        key={color.value}
                        className={`h-7 w-7 rounded-md cursor-pointer border-2 ${
                          formData.color === color.value && !showCustomColor
                            ? 'border-white'
                            : 'border-transparent'
                        } ${color.tailwindClass}`}
                        onClick={() => {
                          setFormData({ ...formData, color: color.value });
                          setShowCustomColor(false);
                        }}
                        title={color.name}
                        style={{ boxShadow: formData.color === color.value && !showCustomColor ? '0 0 0 2px var(--dp-accent)' : undefined }}
                      />
                    ))}
                    
                    {/* Custom color option */}
                    <div 
                      className={`h-7 w-7 rounded-md cursor-pointer border-2 ${
                        showCustomColor ? 'border-white' : 'border-transparent'
                      } bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500`}
                      onClick={() => setShowCustomColor(true)}
                      title="Custom color"
                      style={{ boxShadow: showCustomColor ? '0 0 0 2px var(--dp-accent)' : undefined }}
                    />
                  </div>

                  {/* Custom color input */}
                  {showCustomColor && (
                    <>
                      <div className="flex items-center gap-3 mt-3 mb-2">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="w-10 h-10 p-0 border-0 rounded"
                        />
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="#HEX Color"
                          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', flex: 1 }}
                        />
                      </div>
                      
                      {/* Quick color presets */}
                      <div className="flex flex-wrap gap-2">
                        {customColorOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setCustomColor(option.value)}
                            className="text-xs px-2.5 py-1 rounded-md font-medium transition-opacity hover:opacity-80"
                            style={{
                              background: 'var(--dp-surface)',
                              border: '1px solid var(--dp-border)',
                              color: option.value,
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCompany(null);
                    setShowCustomColor(false);
                    setCustomColor('');
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
                  {editingCompany ? 'Update Company' : 'Add Company'}
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
                  {['Color', 'Company Name', 'Address', 'Phone', 'Actions'].map(h => (
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
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--dp-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <div 
                        className={`w-6 h-6 rounded-full ${getCompanyColorClass(company.id)}`}
                        title="Company color"
                      ></div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--dp-text)' }}>
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                      {company.address}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text-secondary)' }}>
                      {company.phone}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-1.5 rounded-md transition-opacity hover:opacity-70"
                          style={{ color: 'var(--dp-text-secondary)' }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
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
