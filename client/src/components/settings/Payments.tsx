import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit2, Trash2, DollarSign, Users, ChevronDown, ChevronUp, TrendingUp, Calendar, Clock, ChartBar as BarChart3, Download } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import Modal from '../Modal';
import DispatchLayout from '../dispatch/DispatchLayout';

interface Payment {
  id: string;
  driver_id: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
  description: string;
  source?: 'admin' | 'driver';
  completed_at?: string;
  created_at: string;
}

interface GroupedPayments {
  [driverId: string]: {
    pending: Payment[];
    paid: Payment[];
    totalPending: number;
    totalPaid: number;
  }
}

interface MonthlyReport {
  [month: string]: {
    [driverId: string]: {
      pending: number;
      paid: number;
      driverName: string;
    };
    totalPending: number;
    totalPaid: number;
  };
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

const btnPrimary: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 10,
  background: 'var(--dp-accent)',
  color: 'var(--dp-on-accent)',
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  minHeight: 40,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 10,
  border: '1px solid var(--dp-border-strong)',
  background: 'transparent',
  color: 'var(--dp-text)',
  fontSize: 14,
  fontWeight: 500,
  minHeight: 40,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const card: React.CSSProperties = {
  background: 'var(--dp-surface)',
  border: '1px solid var(--dp-border)',
  borderRadius: 'var(--dp-radius)',
};

const thStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  color: 'var(--dp-text-muted)',
  background: 'var(--dp-surface-2)',
};

export default function Payments() {
  const navigate = useNavigate();
  const { drivers, payments, addPayment, updatePayment, deletePayment, completePayment } = useData();
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [groupedPayments, setGroupedPayments] = useState<GroupedPayments>({});
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport>({});
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [selectedDriverStats, setSelectedDriverStats] = useState<{
    driverId: string;
    name: string;
    stats: {
      totalEarnings: number;
      pendingAmount: number;
      paidAmount: number;
      lastPayment?: Payment;
      monthlyEarnings: { [key: string]: number };
    };
  } | null>(null);
  const [formData, setFormData] = useState({
    driver_id: '',
    amount: 0,
    date: '',
    status: 'pending' as const,
    description: '',
  });

  // Generate available years from payment data
  useEffect(() => {
    const years = Array.from(new Set(
      payments.map(payment => new Date(payment.date).getFullYear())
    )).sort((a, b) => b - a);
    
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }
    
    setAvailableYears(years);
  }, [payments]);

  useEffect(() => {
    const grouped = payments.reduce((acc, payment) => {
      if (!acc[payment.driver_id]) {
        acc[payment.driver_id] = {
          pending: [],
          paid: [],
          totalPending: 0,
          totalPaid: 0
        };
      }
      
      if (payment.status === 'pending') {
        acc[payment.driver_id].pending.push(payment);
        acc[payment.driver_id].totalPending += payment.amount;
      } else {
        acc[payment.driver_id].paid.push(payment);
        acc[payment.driver_id].totalPaid += payment.amount;
      }
      
      return acc;
    }, {} as GroupedPayments);
    
    setGroupedPayments(grouped);
  }, [payments]);

  // Generate monthly report
  useEffect(() => {
    const monthlyData: MonthlyReport = {};
    
    // Filter payments by selected year
    const yearPayments = payments.filter(payment => 
      new Date(payment.date).getFullYear() === selectedYear
    );
    
    yearPayments.forEach(payment => {
      const date = new Date(payment.date);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const driver = drivers.find(d => d.id === payment.driver_id);
      const driverName = driver?.name || 'Unknown Driver';
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          totalPending: 0,
          totalPaid: 0
        };
      }
      
      if (!monthlyData[monthKey][payment.driver_id]) {
        monthlyData[monthKey][payment.driver_id] = {
          pending: 0,
          paid: 0,
          driverName
        };
      }
      
      if (payment.status === 'pending') {
        monthlyData[monthKey][payment.driver_id].pending += payment.amount;
        monthlyData[monthKey].totalPending += payment.amount;
      } else {
        monthlyData[monthKey][payment.driver_id].paid += payment.amount;
        monthlyData[monthKey].totalPaid += payment.amount;
      }
    });
    
    setMonthlyReport(monthlyData);
  }, [payments, drivers, selectedYear]);

  // Generate CSV for monthly report
  const downloadMonthlyReport = () => {
    let csvContent = 'Month,Driver,Pending Amount,Paid Amount,Total Amount\n';
    
    // Get sorted month keys
    const sortedMonths = Object.keys(monthlyReport).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    sortedMonths.forEach(month => {
      const monthData = monthlyReport[month];
      
      // Add driver rows
      Object.keys(monthData).forEach(key => {
        if (key !== 'totalPending' && key !== 'totalPaid') {
          const driverData = monthData[key];
          const total = driverData.pending + driverData.paid;
          csvContent += `"${month}","${driverData.driverName}",€${driverData.pending.toFixed(2)},€${driverData.paid.toFixed(2)},€${total.toFixed(2)}\n`;
        }
      });
      
      // Add month total
      const monthTotal = monthData.totalPending + monthData.totalPaid;
      csvContent += `"${month}","MONTH TOTAL",€${monthData.totalPending.toFixed(2)},€${monthData.totalPaid.toFixed(2)},€${monthTotal.toFixed(2)}\n`;
      csvContent += '\n'; // Empty line between months
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = `monthly_payment_report_${selectedYear}.csv`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (payment: any) => {
    setFormData({
      driver_id: payment.driver_id,
      amount: payment.amount,
      date: payment.date,
      status: payment.status,
      description: payment.description,
    });
    setEditingPayment(payment.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      deletePayment(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPayment) {
      updatePayment(editingPayment, formData);
      setEditingPayment(null);
    } else {
      addPayment(formData);
    }
    
    setFormData({ driver_id: '', amount: 0, date: '', status: 'pending', description: '' });
    setShowForm(false);
  };

  const toggleDriverExpanded = (driverId: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(driverId)) {
      newExpanded.delete(driverId);
    } else {
      newExpanded.add(driverId);
    }
    setExpandedDrivers(newExpanded);
  };

  const calculateDriverStats = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return null;

    const driverPayments = groupedPayments[driverId];
    if (!driverPayments) return null;

    // Calculate monthly earnings
    const monthlyEarnings = driverPayments.paid.reduce((acc, payment) => {
      const month = new Date(payment.date).toLocaleString('default', { month: 'long', year: 'numeric' });
      acc[month] = (acc[month] || 0) + payment.amount;
      return acc;
    }, {} as { [key: string]: number });

    return {
      driverId,
      name: driver.name,
      stats: {
        totalEarnings: driver.total_earnings || 0,
        pendingAmount: driverPayments.totalPending,
        paidAmount: driverPayments.totalPaid,
        lastPayment: [...driverPayments.paid].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0],
        monthlyEarnings
      }
    };
  };

  const showDriverStats = (driverId: string) => {
    const stats = calculateDriverStats(driverId);
    if (stats) {
      setSelectedDriverStats(stats);
      setShowStats(true);
    }
  };

  const renderPaymentCard = (payment: Payment, showActions: boolean) => (
    <div
      key={payment.id}
      className="flex items-center justify-between p-3"
      style={{
        background: 'var(--dp-surface-2)',
        borderRadius: 10,
      }}
    >
      <div className="mr-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
            €{payment.amount.toFixed(2)}
          </span>
          {payment.source === 'driver' && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'var(--dp-accent-soft)', color: 'var(--dp-accent)' }}
            >
              Driver
            </span>
          )}
        </div>
        <div className="text-sm truncate" style={{ color: 'var(--dp-text-secondary)' }}>{payment.description}</div>
        <div className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
          {new Date(payment.date).toLocaleDateString()}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {showActions && (
          <>
            <button
              onClick={() => handleEdit(payment)}
              className="p-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--dp-text-secondary)' }}
              title="Edit payment"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => completePayment(payment.id)}
              className="p-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--dp-success)' }}
              title="Mark as paid"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={() => handleDelete(payment.id)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--dp-text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--dp-danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--dp-text-secondary)')}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderDriverGroup = (driver: any, type: 'pending' | 'paid') => {
    const driverPayments = groupedPayments[driver.id];
    const items = type === 'pending' ? driverPayments?.pending : driverPayments?.paid;
    if (!items?.length || (selectedDriver && selectedDriver !== driver.id)) return null;
    const isExpanded = expandedDrivers.has(driver.id);
    const total = type === 'pending' ? driverPayments.totalPending : driverPayments.totalPaid;
    const totalColor = type === 'pending' ? 'var(--dp-warning)' : 'var(--dp-success)';

    return (
      <div
        key={driver.id}
        className="overflow-hidden"
        style={{ border: '1px solid var(--dp-border)', borderRadius: 10 }}
      >
        <button
          onClick={() => toggleDriverExpanded(driver.id)}
          className="w-full flex justify-between items-center p-3"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                showDriverStats(driver.id);
              }}
              className="text-sm font-semibold hover:opacity-70 transition-opacity text-left"
              style={{ color: 'var(--dp-text)' }}
            >
              {driver.name}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: totalColor, fontFamily: 'var(--font-mono)' }}>
              €{total.toFixed(2)}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            )}
          </div>
        </button>
        
        <div className={`space-y-2 p-3 pt-0 ${isExpanded ? '' : 'hidden'}`}>
          {items.map(payment => renderPaymentCard(payment, type === 'pending'))}
        </div>
      </div>
    );
  };

  return (
    <DispatchLayout pageTitle="Payments">
      <div style={{ maxWidth: 1100 }} className="mx-auto space-y-5">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="font-heading" style={{ fontSize: 22, color: 'var(--dp-text)' }}>Payments</h1>
          <button
            onClick={() => setShowForm(true)}
            className="transition-opacity hover:opacity-90"
            style={btnPrimary}
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>

        {/* Driver filter */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 p-4" style={card}>
          <label className="flex items-center gap-2" style={{ color: 'var(--dp-text-secondary)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            <span className="text-sm font-medium">Filter by Driver:</span>
          </label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">All Drivers</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Report Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4" style={card}>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowMonthlyReport(!showMonthlyReport)}
              className="transition-opacity hover:opacity-90"
              style={btnSecondary}
            >
              <BarChart3 className="w-4 h-4" />
              {showMonthlyReport ? 'Hide Monthly Report' : 'Show Monthly Report'}
            </button>
            
            {showMonthlyReport && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: 'var(--dp-text-secondary)' }}>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{ ...inputStyle, width: 'auto', height: 34, fontSize: 13, padding: '4px 10px' }}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {showMonthlyReport && (
            <button
              onClick={downloadMonthlyReport}
              className="transition-opacity hover:opacity-90"
              style={btnSecondary}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>

        {/* Monthly Report Table */}
        {showMonthlyReport && (
          <div className="overflow-hidden" style={card}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--dp-border)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: 'var(--dp-accent)' }} />
              <span className="font-heading text-base" style={{ color: 'var(--dp-text)' }}>
                Monthly Payment Report - {selectedYear}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                    {['Month', 'Driver', 'Pending', 'Paid', 'Total'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left"
                        style={{
                          ...thStyle,
                          textAlign: ['Pending', 'Paid', 'Total'].includes(h) ? 'right' : 'left',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(monthlyReport)
                    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                    .map((month) => {
                      const monthData = monthlyReport[month];
                      const driverKeys = Object.keys(monthData).filter(key => 
                        key !== 'totalPending' && key !== 'totalPaid'
                      );
                      
                      return (
                        <React.Fragment key={month}>
                          {driverKeys.map((driverId, index) => {
                            const driverData = monthData[driverId];
                            const total = driverData.pending + driverData.paid;
                            
                            return (
                              <tr
                                key={`${month}-${driverId}`}
                                style={{ borderBottom: '1px solid var(--dp-border)' }}
                              >
                                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--dp-text)' }}>
                                  {index === 0 && month}
                                </td>
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--dp-text)' }}>
                                  {driverData.driverName}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: 'var(--dp-warning)', fontFamily: 'var(--font-mono)' }}>
                                  €{driverData.pending.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: 'var(--dp-success)', fontFamily: 'var(--font-mono)' }}>
                                  €{driverData.paid.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                                  €{total.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Month total row */}
                          <tr
                            style={{
                              borderBottom: '2px solid var(--dp-border)',
                              background: 'var(--dp-accent-soft)',
                            }}
                          >
                            <td className="px-4 py-3 text-sm font-bold" style={{ color: 'var(--dp-text)' }}>
                              {month}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold" style={{ color: 'var(--dp-accent)' }}>
                              MONTH TOTAL
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: 'var(--dp-warning)', fontFamily: 'var(--font-mono)' }}>
                              €{monthData.totalPending.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: 'var(--dp-success)', fontFamily: 'var(--font-mono)' }}>
                              €{monthData.totalPaid.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold" style={{ color: 'var(--dp-accent)', fontFamily: 'var(--font-mono)' }}>
                              €{(monthData.totalPending + monthData.totalPaid).toFixed(2)}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
              
              {Object.keys(monthlyReport).length === 0 && (
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto h-10 w-10" style={{ color: 'var(--dp-text-muted)' }} />
                  <h3 className="mt-3 text-sm font-medium" style={{ color: 'var(--dp-text)' }}>No payment data</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-muted)' }}>
                    No payments found for {selectedYear}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="p-6" style={card}>
            <h3 className="font-heading text-base mb-4" style={{ color: 'var(--dp-text)' }}>
              {editingPayment ? 'Edit Payment' : 'Add New Payment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Select Driver
                </label>
                <select
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Select a driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--dp-text-secondary)', fontSize: 12 }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'paid' })}
                  style={inputStyle}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
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
                  onClick={() => { setShowForm(false); setEditingPayment(null); }}
                  className="transition-opacity hover:opacity-80"
                  style={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="transition-opacity hover:opacity-90"
                  style={btnPrimary}
                >
                  {editingPayment ? 'Update Payment' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment Lists */}
        <div className="flex flex-col md:flex-row md:items-start gap-5">
          {/* Pending */}
          <div className="w-full md:w-1/2">
            <div className="p-4 sm:p-5" style={card}>
              <h2 className="flex items-center gap-2 mb-4" style={{ color: 'var(--dp-warning)' }}>
                <DollarSign className="w-5 h-5" />
                <span className="font-heading text-base">Pending Payments</span>
              </h2>
              <div className="space-y-3">
                {drivers.map(driver => renderDriverGroup(driver, 'pending'))}
              </div>
            </div>
          </div>

          {/* Paid */}
          <div className="w-full md:w-1/2">
            <div className="p-4 sm:p-5" style={card}>
              <h2 className="flex items-center gap-2 mb-4" style={{ color: 'var(--dp-success)' }}>
                <DollarSign className="w-5 h-5" />
                <span className="font-heading text-base">Paid Payments</span>
              </h2>
              <div className="space-y-3">
                {drivers.map(driver => renderDriverGroup(driver, 'paid'))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Modal */}
        <Modal
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          title={`${selectedDriverStats?.name}'s Statistics`}
        >
          {selectedDriverStats && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: DollarSign, label: 'Total Earnings', value: `€${selectedDriverStats.stats.totalEarnings.toFixed(2)}`, color: 'var(--dp-success)' },
                  { icon: Clock, label: 'Pending', value: `€${selectedDriverStats.stats.pendingAmount.toFixed(2)}`, color: 'var(--dp-warning)' },
                  { icon: TrendingUp, label: 'Paid', value: `€${selectedDriverStats.stats.paidAmount.toFixed(2)}`, color: 'var(--dp-accent)' },
                ].map(s => (
                  <div
                    key={s.label}
                    className="p-4"
                    style={{
                      background: 'var(--dp-surface-2)',
                      border: '1px solid var(--dp-border)',
                      borderRadius: 10,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <s.icon className="w-4 h-4" style={{ color: s.color }} />
                      <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>{s.label}</span>
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Earnings */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--dp-text)' }}>
                  <Calendar className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
                  Monthly Earnings
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedDriverStats.stats.monthlyEarnings)
                    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                    .map(([month, amount]) => (
                    <div key={month} className="flex items-center justify-between py-1">
                      <span className="text-sm" style={{ color: 'var(--dp-text-secondary)' }}>{month}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>€{amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Payment */}
              {selectedDriverStats.stats.lastPayment && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--dp-text)' }}>
                    <Clock className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
                    Last Payment
                  </h3>
                  <div
                    className="p-4"
                    style={{
                      background: 'var(--dp-surface-2)',
                      border: '1px solid var(--dp-border)',
                      borderRadius: 10,
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>Amount</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                        €{selectedDriverStats.stats.lastPayment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>Date</span>
                      <span className="text-sm" style={{ color: 'var(--dp-text)' }}>
                        {new Date(selectedDriverStats.stats.lastPayment.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm mt-2" style={{ color: 'var(--dp-text-muted)' }}>
                      {selectedDriverStats.stats.lastPayment.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DispatchLayout>
  );
}
