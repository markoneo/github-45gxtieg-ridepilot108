import React, { useState, useEffect, useMemo } from 'react';
import { ChartBar as BarChart2, DollarSign, Calendar, TrendingUp, Building2, Download, Users, Clock, Activity, ChartPie as PieChart, ChartLine as LineChart, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import DispatchLayout from './dispatch/DispatchLayout';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function dp(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const card: React.CSSProperties = {
  background: 'var(--dp-surface)',
  border: '1px solid var(--dp-border)',
  borderRadius: 'var(--dp-radius)',
};

const selectStyle: React.CSSProperties = {
  background: 'var(--dp-surface)',
  border: '1px solid var(--dp-border)',
  borderRadius: 10,
  padding: '9px 14px',
  height: 40,
  fontSize: 14,
  color: 'var(--dp-text)',
  outline: 'none',
};

const thStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '.05em',
  color: 'var(--dp-text-muted)',
  background: 'var(--dp-surface-2)',
};

interface CompanyEarnings {
  companyId: string;
  companyName: string;
  totalEarnings: number;
  dailyBreakdown: { [date: string]: number };
  weeklyBreakdown: { [week: string]: number };
  monthlyBreakdown: { [month: string]: number };
  projectCount: number;
}

interface TimePeriodsData {
  daily: { [date: string]: number };
  weekly: { [week: string]: number };
  monthly: { [month: string]: number };
}

export default function Statistics() {
  const navigate = useNavigate();
  const { projects, companies, drivers, carTypes, loading, refreshData } = useData();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get available years from project data
  const availableYears = useMemo(() => {
    const years = [...new Set(projects.map(p => new Date(p.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [projects]);

  // Calculate company earnings data
  const companyEarningsData = useMemo(() => {
    const earningsMap = new Map<string, CompanyEarnings>();

    // Initialize all companies
    companies.forEach(company => {
      earningsMap.set(company.id, {
        companyId: company.id,
        companyName: company.name,
        totalEarnings: 0,
        dailyBreakdown: {},
        weeklyBreakdown: {},
        monthlyBreakdown: {},
        projectCount: 0
      });
    });

    // Filter projects by selected year
    const yearProjects = projects.filter(project => {
      const projectYear = new Date(project.date).getFullYear();
      return projectYear === selectedYear;
    });

    // Process each project
    yearProjects.forEach(project => {
      const companyData = earningsMap.get(project.company);
      if (!companyData) return;

      const date = new Date(project.date);
      const dateKey = project.date; // YYYY-MM-DD format
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      // Calculate week of year for weekly breakdown
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      const weekKey = `Week ${weekNumber}, ${date.getFullYear()}`;

      // Update earnings
      companyData.totalEarnings += project.price;
      companyData.projectCount += 1;
      
      // Daily breakdown
      companyData.dailyBreakdown[dateKey] = (companyData.dailyBreakdown[dateKey] || 0) + project.price;
      
      // Weekly breakdown
      companyData.weeklyBreakdown[weekKey] = (companyData.weeklyBreakdown[weekKey] || 0) + project.price;
      
      // Monthly breakdown
      companyData.monthlyBreakdown[monthKey] = (companyData.monthlyBreakdown[monthKey] || 0) + project.price;
    });

    return Array.from(earningsMap.values()).filter(company => company.totalEarnings > 0);
  }, [projects, companies, selectedYear]);

  // Get selected company data
  const selectedCompanyData = useMemo(() => {
    if (!selectedCompany) return null;
    return companyEarningsData.find(company => company.companyId === selectedCompany) || null;
  }, [companyEarningsData, selectedCompany]);

  // Get time period data for selected company
  const timePeriodData = useMemo(() => {
    if (!selectedCompanyData) return { data: {}, labels: [], totals: [] };

    let breakdown: { [key: string]: number } = {};
    
    switch (timePeriod) {
      case 'daily':
        // For daily view, filter by selected month
        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonth, 0);
        
        breakdown = Object.keys(selectedCompanyData.dailyBreakdown)
          .filter(dateKey => {
            const date = new Date(dateKey);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((acc, dateKey) => {
            acc[dateKey] = selectedCompanyData.dailyBreakdown[dateKey];
            return acc;
          }, {} as { [key: string]: number });
        break;
      
      case 'weekly':
        breakdown = selectedCompanyData.weeklyBreakdown;
        break;
      
      case 'monthly':
        breakdown = selectedCompanyData.monthlyBreakdown;
        break;
    }

    const sortedEntries = Object.entries(breakdown).sort((a, b) => {
      if (timePeriod === 'daily') {
        return new Date(a[0]).getTime() - new Date(b[0]).getTime();
      }
      if (timePeriod === 'weekly') {
        const weekA = parseInt(a[0].match(/Week (\d+)/)?.[1] || '0');
        const weekB = parseInt(b[0].match(/Week (\d+)/)?.[1] || '0');
        return weekA - weekB;
      }
      // Monthly
      return new Date(a[0]).getTime() - new Date(b[0]).getTime();
    });

    return {
      data: breakdown,
      labels: sortedEntries.map(([key]) => key),
      totals: sortedEntries.map(([, value]) => value)
    };
  }, [selectedCompanyData, timePeriod, selectedYear, selectedMonth]);

  // Calculate completed projects by driver
  const driverCompletedStats = useMemo(() => {
    const yearProjects = projects.filter(p => {
      const projectYear = new Date(p.date).getFullYear();
      return projectYear === selectedYear && p.status === 'completed';
    });

    const driverNameMap = new Map<string, string>();
    drivers.forEach(d => driverNameMap.set(d.id, d.name));

    const driverMap = new Map<string, { name: string; count: number; earnings: number }>();

    yearProjects.forEach(project => {
      if (!project.driver) return;
      const driverName = driverNameMap.get(project.driver) || project.driver;
      const existing = driverMap.get(project.driver) || { name: driverName, count: 0, earnings: 0 };
      existing.count += 1;
      existing.earnings += project.price;
      driverMap.set(project.driver, existing);
    });

    return Array.from(driverMap.values()).sort((a, b) => b.count - a.count);
  }, [projects, selectedYear, drivers]);

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    const yearProjects = projects.filter(p => new Date(p.date).getFullYear() === selectedYear);
    const totalRevenue = yearProjects.reduce((sum, p) => sum + p.price, 0);
    const totalTrips = yearProjects.length;
    const totalCompanies = new Set(yearProjects.map(p => p.company)).size;
    const avgTripValue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    return {
      totalRevenue,
      totalTrips,
      totalCompanies,
      avgTripValue
    };
  }, [projects, selectedYear]);

  // Calculate orders by car type
  const carTypeStats = useMemo(() => {
    const yearProjects = projects.filter(p => new Date(p.date).getFullYear() === selectedYear);
    const carTypeMap = new Map<string, { name: string; count: number; revenue: number }>();

    carTypes.forEach(ct => {
      carTypeMap.set(ct.id, { name: ct.name, count: 0, revenue: 0 });
    });

    yearProjects.forEach(project => {
      if (project.carType && carTypeMap.has(project.carType)) {
        const entry = carTypeMap.get(project.carType)!;
        entry.count += 1;
        entry.revenue += project.price || 0;
      }
    });

    return Array.from(carTypeMap.values())
      .filter(ct => ct.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [projects, carTypes, selectedYear]);

  const carTypeChartData = useMemo(() => {
    const accent = dp('--dp-accent') || '#3B82F6';
    const success = dp('--dp-success') || '#10B981';
    const warning = dp('--dp-warning') || '#F59E0B';
    const charge = dp('--dp-charge') || '#EF4444';
    const colors = [accent, success, warning, charge, '#6366F1', '#EC4899', '#14B8A6', '#F97316'];
    return {
      labels: carTypeStats.map(ct => ct.name),
      datasets: [{
        data: carTypeStats.map(ct => ct.count),
        backgroundColor: carTypeStats.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: dp('--dp-surface') || '#ffffff'
      }]
    };
  }, [carTypeStats]);

  // Calculate projects by company (count) for the selected year
  const companyProjectStats = useMemo(() => {
    const yearProjects = projects.filter(p => new Date(p.date).getFullYear() === selectedYear);
    const companyMap = new Map<string, { name: string; count: number; revenue: number }>();

    companies.forEach(c => {
      companyMap.set(c.id, { name: c.name, count: 0, revenue: 0 });
    });

    yearProjects.forEach(project => {
      const entry = companyMap.get(project.company);
      if (!entry) return;
      entry.count += 1;
      entry.revenue += project.price || 0;
    });

    return Array.from(companyMap.values())
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [projects, companies, selectedYear]);

  const companyProjectChartData = useMemo(() => {
    const accent = dp('--dp-accent') || '#3B82F6';
    const success = dp('--dp-success') || '#10B981';
    const warning = dp('--dp-warning') || '#F59E0B';
    const charge = dp('--dp-charge') || '#EF4444';
    const colors = [accent, success, warning, charge, '#6366F1', '#EC4899', '#14B8A6', '#F97316'];
    return {
      labels: companyProjectStats.map(c => c.name),
      datasets: [{
        data: companyProjectStats.map(c => c.count),
        backgroundColor: companyProjectStats.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: dp('--dp-surface') || '#ffffff'
      }]
    };
  }, [companyProjectStats]);

  // Chart configuration
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: dp('--dp-text-muted') || '#888', font: { family: dp('--font-body') || 'sans-serif' } },
      },
      title: {
        display: true,
        text: `${selectedCompanyData?.companyName || 'All Companies'} - ${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Earnings`,
        color: dp('--dp-text') || '#333',
        font: { family: dp('--font-body') || 'sans-serif' },
      },
      tooltip: {
        backgroundColor: dp('--dp-surface') || '#fff',
        titleColor: dp('--dp-text') || '#333',
        bodyColor: dp('--dp-text-secondary') || '#666',
        borderColor: dp('--dp-border') || '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: dp('--dp-text-muted') || '#888',
          font: { family: dp('--font-body') || 'sans-serif' },
          callback: function(value: any) {
            return '€' + value.toFixed(0);
          }
        },
        grid: { color: dp('--dp-border') || '#e5e7eb' },
      },
      x: {
        ticks: { color: dp('--dp-text-muted') || '#888', font: { family: dp('--font-body') || 'sans-serif' } },
        grid: { color: dp('--dp-border') || '#e5e7eb' },
      },
    }
  };

  const accentColor = dp('--dp-accent') || '#3B82F6';
  const chartData = {
    labels: timePeriodData.labels,
    datasets: [
      {
        label: 'Earnings (€)',
        data: timePeriodData.totals,
        backgroundColor: accentColor + '80',
        borderColor: accentColor,
        borderWidth: 2,
      },
    ],
  };

  // Company distribution chart
  const companyDistributionData = {
    labels: companyEarningsData.map(company => company.companyName),
    datasets: [
      {
        data: companyEarningsData.map(company => company.totalEarnings),
        backgroundColor: [
          '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', 
          '#10B981', '#6366F1', '#F97316', '#EC4899', '#84CC16'
        ],
        borderWidth: 2,
        borderColor: dp('--dp-surface') || '#ffffff'
      },
    ],
  };

  // Export data as CSV
  const exportData = () => {
    if (!selectedCompanyData) {
      alert('Please select a company to export data');
      return;
    }

    let csvContent = '';
    let filename = '';

    switch (timePeriod) {
      case 'daily':
        csvContent = 'Date,Earnings\n';
        filename = `${selectedCompanyData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_daily_earnings_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`;
        Object.entries(timePeriodData.data).forEach(([date, earnings]) => {
          csvContent += `"${date}",€${earnings.toFixed(2)}\n`;
        });
        break;
      
      case 'weekly':
        csvContent = 'Week,Earnings\n';
        filename = `${selectedCompanyData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_weekly_earnings_${selectedYear}.csv`;
        Object.entries(selectedCompanyData.weeklyBreakdown).forEach(([week, earnings]) => {
          csvContent += `"${week}",€${earnings.toFixed(2)}\n`;
        });
        break;
      
      case 'monthly':
        csvContent = 'Month,Earnings\n';
        filename = `${selectedCompanyData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_monthly_earnings_${selectedYear}.csv`;
        Object.entries(selectedCompanyData.monthlyBreakdown).forEach(([month, earnings]) => {
          csvContent += `"${month}",€${earnings.toFixed(2)}\n`;
        });
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, filename);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format label for display
  const formatLabel = (label: string) => {
    if (timePeriod === 'daily') {
      return new Date(label).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    if (timePeriod === 'weekly') {
      return label.replace('Week ', 'W');
    }
    return label;
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: dp('--dp-text-muted') || '#888', font: { family: dp('--font-body') || 'sans-serif' } },
      },
      tooltip: {
        backgroundColor: dp('--dp-surface') || '#fff',
        titleColor: dp('--dp-text') || '#333',
        bodyColor: dp('--dp-text-secondary') || '#666',
        borderColor: dp('--dp-border') || '#e5e7eb',
        borderWidth: 1,
      },
    },
  };

  const barNoLegendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dp('--dp-surface') || '#fff',
        titleColor: dp('--dp-text') || '#333',
        bodyColor: dp('--dp-text-secondary') || '#666',
        borderColor: dp('--dp-border') || '#e5e7eb',
        borderWidth: 1,
        callbacks: { label: (ctx: any) => `${ctx.parsed.y} projects` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: dp('--dp-text-muted') || '#888', font: { family: dp('--font-body') || 'sans-serif' } },
        grid: { color: dp('--dp-border') || '#e5e7eb' },
      },
      x: {
        ticks: { color: dp('--dp-text-muted') || '#888', font: { family: dp('--font-body') || 'sans-serif' } },
        grid: { color: dp('--dp-border') || '#e5e7eb' },
      },
    },
  };

  const barOrdersOptions = {
    ...barNoLegendOptions,
    plugins: {
      ...barNoLegendOptions.plugins,
      tooltip: {
        ...barNoLegendOptions.plugins.tooltip,
        callbacks: { label: (ctx: any) => `${ctx.parsed.y} orders` },
      },
    },
  };

  return (
    <DispatchLayout pageTitle="Statistics">
      <div style={{ maxWidth: 1100 }} className="mx-auto space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading" style={{ fontSize: 22, color: 'var(--dp-text)' }}>Statistics & Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>
              Detailed earnings breakdown by company and time period
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              padding: '9px 14px',
              borderRadius: 10,
              border: '1px solid var(--dp-border-strong)',
              background: 'transparent',
              color: 'var(--dp-text)',
              height: 40,
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* KPI Tiles */}
        <div
          className="rounded-[var(--dp-radius)] kpi-grid"
          style={{ background: 'var(--dp-surface)', border: '1px solid var(--dp-border)' }}
        >
          <style>{`
            .kpi-grid > .kpi-inner {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
            }
            @media (max-width: 768px) {
              .kpi-grid > .kpi-inner { grid-template-columns: repeat(2, 1fr); }
            }
            .kpi-grid .kpi-tile {
              padding: 16px 20px;
              position: relative;
            }
            .kpi-grid .kpi-tile:not(:last-child)::after {
              content: '';
              position: absolute;
              right: 0;
              top: 12px;
              bottom: 12px;
              width: 1px;
              background: var(--dp-border);
            }
            @media (max-width: 768px) {
              .kpi-grid .kpi-tile:nth-child(even)::after { display: none; }
            }
          `}</style>
          <div className="kpi-inner">
            <KpiTile label={`Total Revenue (${selectedYear})`} value={`€${overviewStats.totalRevenue.toFixed(2)}`} mono />
            <KpiTile label="Total Trips" value={String(overviewStats.totalTrips)} />
            <KpiTile label="Active Companies" value={String(overviewStats.totalCompanies)} />
            <KpiTile label="Avg Trip Value" value={`€${overviewStats.avgTripValue.toFixed(2)}`} mono />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 flex flex-col lg:flex-row lg:items-end gap-4" style={card}>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--dp-text-muted)' }}>
              Company
            </label>
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
              <option value="">All Companies Overview</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--dp-text-muted)' }}>
              Time Period
            </label>
            <div className="flex p-1" style={{ background: 'var(--dp-surface-2)', borderRadius: 10 }}>
              {['daily', 'weekly', 'monthly'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period as 'daily' | 'weekly' | 'monthly')}
                  className="px-4 py-2 text-sm font-medium transition-colors flex-1"
                  style={{
                    borderRadius: 8,
                    background: timePeriod === period ? 'var(--dp-surface)' : 'transparent',
                    color: timePeriod === period ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                    border: timePeriod === period ? '1px solid var(--dp-border)' : '1px solid transparent',
                  }}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--dp-text-muted)' }}>Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={selectStyle}>
              {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>

          {timePeriod === 'daily' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--dp-text-muted)' }}>Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={selectStyle}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
          )}

          {selectedCompany && (
            <button
              onClick={exportData}
              className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: '1px solid var(--dp-border-strong)',
                background: 'transparent',
                color: 'var(--dp-text)',
                height: 40,
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10" style={{ borderTop: '2px solid var(--dp-accent)', borderBottom: '2px solid var(--dp-accent)', borderLeft: '2px solid transparent', borderRight: '2px solid transparent' }} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Overview or Specific Company Analysis */}
            {!selectedCompany ? (
              <>
                {/* All Companies Overview */}
                <div className="p-5" style={card}>
                  <h2 className="font-heading text-base mb-5 flex items-center gap-2" style={{ color: 'var(--dp-text)' }}>
                    <PieChart className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
                    Company Revenue Distribution ({selectedYear})
                  </h2>
                  
                  {companyEarningsData.length > 0 ? (
                    <div className="grid lg:grid-cols-2 gap-8">
                      <div className="h-80">
                        <Pie data={companyDistributionData} options={pieOptions} />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--dp-text-muted)' }}>Company Breakdown</h3>
                        {companyEarningsData.map((company, index) => {
                          const percentage = (company.totalEarnings / overviewStats.totalRevenue) * 100;
                          return (
                            <div
                              key={company.companyId}
                              className="flex items-center justify-between p-3 transition-colors"
                              style={{ background: 'var(--dp-surface-2)', borderRadius: 8 }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: companyDistributionData.datasets[0].backgroundColor[index] }}
                                />
                                <div>
                                  <button
                                    onClick={() => setSelectedCompany(company.companyId)}
                                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                                    style={{ color: 'var(--dp-text)' }}
                                  >
                                    {company.companyName}
                                  </button>
                                  <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>{company.projectCount} trips</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium tabular-nums" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>€{company.totalEarnings.toFixed(2)}</div>
                                <div className="text-xs tabular-nums" style={{ color: 'var(--dp-text-muted)' }}>{percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <PieChart className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--dp-text-muted)' }} />
                      <h3 className="text-sm font-medium" style={{ color: 'var(--dp-text)' }}>No data available</h3>
                      <p className="text-sm mt-1" style={{ color: 'var(--dp-text-muted)' }}>No earnings data found for {selectedYear}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Selected Company Analysis */}
                {selectedCompanyData && (
                  <>
                    {/* Company Stats Header */}
                    <div className="p-5" style={card}>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="font-heading text-lg" style={{ color: 'var(--dp-text)' }}>
                            {selectedCompanyData.companyName}
                          </h2>
                          <p className="text-sm mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>
                            {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} earnings analysis for {selectedYear}
                            {timePeriod === 'daily' && ` - ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}`}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedCompany('')}
                          className="text-sm font-medium transition-opacity hover:opacity-80"
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--dp-border-strong)',
                            background: 'transparent',
                            color: 'var(--dp-text)',
                          }}
                        >
                          View All Companies
                        </button>
                      </div>

                      <div
                        className="rounded-[var(--dp-radius)] company-kpi-grid"
                        style={{ background: 'var(--dp-surface-2)', border: '1px solid var(--dp-border)' }}
                      >
                        <style>{`
                          .company-kpi-grid > .ckpi-inner { display: grid; grid-template-columns: repeat(3, 1fr); }
                          @media (max-width: 640px) { .company-kpi-grid > .ckpi-inner { grid-template-columns: 1fr; } }
                          .company-kpi-grid .ckpi-tile { padding: 16px 20px; position: relative; }
                          .company-kpi-grid .ckpi-tile:not(:last-child)::after {
                            content: '';
                            position: absolute;
                            right: 0;
                            top: 12px;
                            bottom: 12px;
                            width: 1px;
                            background: var(--dp-border);
                          }
                          @media (max-width: 640px) { .company-kpi-grid .ckpi-tile::after { display: none !important; } }
                        `}</style>
                        <div className="ckpi-inner">
                          <KpiTile label="Total Earnings" value={`€${selectedCompanyData.totalEarnings.toFixed(2)}`} mono />
                          <KpiTile label="Total Projects" value={String(selectedCompanyData.projectCount)} />
                          <KpiTile label="Avg Per Trip" value={`€${selectedCompanyData.projectCount > 0 ? (selectedCompanyData.totalEarnings / selectedCompanyData.projectCount).toFixed(2) : '0.00'}`} mono />
                        </div>
                      </div>
                    </div>

                    {/* Earnings Chart */}
                    <div className="p-5" style={card}>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-heading text-base flex items-center gap-2" style={{ color: 'var(--dp-text)' }}>
                          <BarChart2 className="w-5 h-5" style={{ color: 'var(--dp-text-muted)' }} />
                          {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Earnings Breakdown
                        </h3>
                        {timePeriod === 'daily' && (
                          <span className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>
                            {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
                          </span>
                        )}
                      </div>
                      
                      {timePeriodData.labels.length > 0 ? (
                        <div className="h-96">
                          <Bar 
                            data={chartData} 
                            options={{
                              ...chartOptions,
                              maintainAspectRatio: false,
                              scales: {
                                ...chartOptions.scales,
                                x: {
                                  ...chartOptions.scales.x,
                                  ticks: {
                                    ...chartOptions.scales.x.ticks,
                                    callback: function(value: any, index: number) {
                                      return formatLabel(timePeriodData.labels[index]);
                                    }
                                  }
                                }
                              }
                            }} 
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <BarChart2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--dp-text-muted)' }} />
                          <h4 className="text-sm font-medium" style={{ color: 'var(--dp-text)' }}>No data for this period</h4>
                          <p className="text-sm mt-1" style={{ color: 'var(--dp-text-muted)' }}>
                            No earnings data found for {selectedCompanyData.companyName} in this time period
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Detailed Data Table */}
                    {timePeriodData.labels.length > 0 && (
                      <div className="overflow-hidden" style={card}>
                        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--dp-border)' }}>
                          <LineChart className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text-muted)' }}>
                            Detailed {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)} Breakdown
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                                <th className="px-4 py-3 text-left" style={thStyle}>
                                  {timePeriod === 'daily' ? 'Date' : timePeriod === 'weekly' ? 'Week' : 'Month'}
                                </th>
                                <th className="px-4 py-3 text-right" style={thStyle}>Earnings</th>
                                <th className="px-4 py-3 text-left" style={{ ...thStyle, minWidth: 200 }}>% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {timePeriodData.labels.map((label, index) => {
                                const earnings = timePeriodData.totals[index];
                                const percentage = (earnings / selectedCompanyData.totalEarnings) * 100;
                                
                                return (
                                  <tr
                                    key={label}
                                    className="transition-colors"
                                    style={{ borderBottom: '1px solid var(--dp-border)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--dp-text)' }}>
                                      {timePeriod === 'daily' 
                                        ? new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                        : label
                                      }
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold whitespace-nowrap tabular-nums" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                                      €{earnings.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dp-surface-2)' }}>
                                          <div
                                            className="h-full rounded-full"
                                            style={{ width: `${percentage}%`, background: 'var(--dp-accent)' }}
                                          />
                                        </div>
                                        <span className="text-xs tabular-nums" style={{ color: 'var(--dp-text-muted)', minWidth: 40, textAlign: 'right' }}>{percentage.toFixed(1)}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ background: 'var(--dp-surface-2)', borderTop: '2px solid var(--dp-border)' }}>
                                <td className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text)' }}>Total</td>
                                <td className="px-4 py-3 text-sm text-right font-bold tabular-nums" style={{ color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                                  €{selectedCompanyData.totalEarnings.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--dp-text)' }}>100%</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* No data state for selected company */}
                {selectedCompany && !selectedCompanyData && (
                  <div className="p-12 text-center" style={card}>
                    <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--dp-text-muted)' }} />
                    <h3 className="text-base font-semibold" style={{ color: 'var(--dp-text)' }}>No data found</h3>
                    <p className="text-sm mt-1 mb-5" style={{ color: 'var(--dp-text-muted)' }}>
                      No earnings data found for the selected company in {selectedYear}
                    </p>
                    <button
                      onClick={() => setSelectedCompany('')}
                      className="text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{
                        padding: '9px 18px',
                        borderRadius: 10,
                        background: 'var(--dp-accent)',
                        color: 'var(--dp-on-accent)',
                        border: 'none',
                      }}
                    >
                      View All Companies
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Completed Projects by Driver */}
        <div className="overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--dp-border)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text-muted)' }}>
                Completed Projects by Driver
              </span>
              <span className="ml-2 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                {selectedYear} - {driverCompletedStats.reduce((s, d) => s + d.count, 0)} total completed
              </span>
            </div>
          </div>
          {driverCompletedStats.length > 0 ? (
            <div>
              {driverCompletedStats.map((driver, index) => {
                const maxCount = driverCompletedStats[0]?.count || 1;
                const barWidth = (driver.count / maxCount) * 100;
                return (
                  <div
                    key={driver.name}
                    className="px-5 py-3 transition-colors"
                    style={{ borderBottom: '1px solid var(--dp-border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: index < 3 ? 'var(--dp-accent-soft)' : 'var(--dp-surface-2)',
                            color: index < 3 ? 'var(--dp-accent)' : 'var(--dp-text-muted)',
                          }}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--dp-text)' }}>{driver.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs tabular-nums" style={{ color: 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          €{driver.earnings.toFixed(0)} earned
                        </span>
                        <span className="text-base font-bold tabular-nums" style={{ color: 'var(--dp-accent)' }}>{driver.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dp-surface-2)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, background: 'var(--dp-accent)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>No completed projects for {selectedYear}</p>
            </div>
          )}
        </div>

        {/* Projects by Company */}
        <div className="overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--dp-border)' }}>
            <Building2 className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text-muted)' }}>
                Projects by Company
              </span>
              <span className="ml-2 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                {selectedYear} - {companyProjectStats.reduce((s, c) => s + c.count, 0)} total projects
              </span>
            </div>
          </div>
          {companyProjectStats.length > 0 ? (
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
                {companyProjectStats.map((c) => (
                  <div
                    key={c.name}
                    className="p-3 text-center"
                    style={{ background: 'var(--dp-surface-2)', borderRadius: 10, border: '1px solid var(--dp-border)' }}
                  >
                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--dp-text)' }}>{c.count}</p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--dp-text-secondary)' }}>{c.name}</p>
                    <p className="text-xs font-semibold mt-1 tabular-nums" style={{ color: 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {c.revenue.toLocaleString('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-64">
                <Bar data={companyProjectChartData} options={barNoLegendOptions} />
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>No company data available for {selectedYear}</p>
            </div>
          )}
        </div>

        {/* Orders by Car Type */}
        <div className="overflow-hidden" style={card}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--dp-border)' }}>
            <Activity className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dp-text-muted)' }}>
                Orders by Car Type
              </span>
              <span className="ml-2 text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                {selectedYear} - {carTypeStats.reduce((s, ct) => s + ct.count, 0)} total orders
              </span>
            </div>
          </div>
          {carTypeStats.length > 0 ? (
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
                {carTypeStats.map((ct) => (
                  <div
                    key={ct.name}
                    className="p-3 text-center"
                    style={{ background: 'var(--dp-surface-2)', borderRadius: 10, border: '1px solid var(--dp-border)' }}
                  >
                    <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--dp-text)' }}>{ct.count}</p>
                    <p className="text-xs font-medium mt-1 capitalize" style={{ color: 'var(--dp-text-secondary)' }}>{ct.name}</p>
                    <p className="text-xs font-semibold mt-1 tabular-nums" style={{ color: 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {ct.revenue.toLocaleString('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-64">
                <Bar data={carTypeChartData} options={barOrdersOptions} />
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm" style={{ color: 'var(--dp-text-muted)' }}>No car type data available for {selectedYear}</p>
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="p-5" style={{ ...card, background: 'var(--dp-surface-2)' }}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--dp-text-muted)' }}>Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { path: '/financial-report', icon: BarChart2, title: 'Financial Reports', desc: 'Detailed financial analysis' },
              { path: '/completed-projects', icon: Activity, title: 'Completed Projects', desc: 'View project history' },
              { path: '/settings/payments', icon: Users, title: 'Driver Payments', desc: 'Manage driver earnings' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-3 transition-colors text-left"
                style={{ background: 'var(--dp-surface)', borderRadius: 10, border: '1px solid var(--dp-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--dp-surface)')}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--dp-text-muted)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--dp-text)' }}>{item.title}</p>
                  <p className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DispatchLayout>
  );
}

function KpiTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="kpi-tile ckpi-tile">
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--dp-text-muted)', lineHeight: 1.2 }}>
        {label}
      </div>
      <span
        className="font-heading text-2xl tabular-nums leading-none"
        style={{ color: 'var(--dp-text)', fontFamily: mono ? 'var(--font-mono)' : undefined }}
      >
        {value}
      </span>
    </div>
  );
}
