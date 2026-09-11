import React, { useState, useEffect } from 'react';
import { Download, Calendar, Building2, DollarSign, FileText, TrendingUp, ChartBar as BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { saveAs } from 'file-saver';
import DispatchLayout from './dispatch/DispatchLayout';

interface NetProfitData {
  [month: string]: {
    revenue: number;
    driverPayments: number;
    netProfit: number;
  };
}

interface MonthlyData {
  [month: string]: {
    [companyId: string]: number;
    total: number;
  };
}

interface DailyData {
  [date: string]: {
    [companyId: string]: number;
    total: number;
  };
}

interface CompanyData {
  id: string;
  name: string;
  total: number;
  monthlyBreakdown: {
    [month: string]: number;
  };
  dailyBreakdown: {
    [date: string]: number;
  };
}

interface DriverEarningsData {
  id: string;
  name: string;
  total: number;
  monthlyEarnings: {
    [month: string]: number;
  };
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

const thBase: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '.05em',
  color: 'var(--dp-text-muted)',
  background: 'var(--dp-surface-2)',
  padding: '10px 16px',
  whiteSpace: 'nowrap' as const,
  textAlign: 'left' as const,
};

const tdBase: React.CSSProperties = {
  padding: '10px 16px',
  whiteSpace: 'nowrap' as const,
  fontSize: 14,
};

export default function FinancialReport() {
  const navigate = useNavigate();
  const { projects, companies, payments, drivers } = useData();
  const [yearToDate, setYearToDate] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [netProfitData, setNetProfitData] = useState<NetProfitData>({});
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [driverEarningsData, setDriverEarningsData] = useState<DriverEarningsData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [years, setYears] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily' | 'profit' | 'drivers'>('monthly');
  const [loading, setLoading] = useState(true);

  // Get all available years from project data
  useEffect(() => {
    const projectYears = projects.map(project => new Date(project.date).getFullYear());
    const uniqueYears = Array.from(new Set(projectYears)).sort((a, b) => b - a); // Sort descending
    setYears(uniqueYears.length ? uniqueYears : [new Date().getFullYear()]);
  }, [projects]);

  // Process data when projects or selected filters change
  useEffect(() => {
    if (projects.length === 0 || companies.length === 0 || payments.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Filter projects for selected year
      const yearProjects = projects.filter(project => {
        const projectYear = new Date(project.date).getFullYear();
        return projectYear === selectedYear;
      });

      // Calculate monthly data
      const months: MonthlyData = {};
      const daily: DailyData = {};
      const companyTotals: { [key: string]: { total: number, months: { [key: string]: number }, days: { [key: string]: number } } } = {};
      const profitData: NetProfitData = {};
      let ytdTotal = 0;

      // Initialize company totals
      companies.forEach(company => {
        companyTotals[company.id] = {
          total: 0,
          months: {},
          days: {}
        };
      });

      // Process each project
      yearProjects.forEach(project => {
        const date = new Date(project.date);
        const monthKey = date.toLocaleString('default', { month: 'long' });
        const dateKey = project.date; // YYYY-MM-DD format
        
        // Initialize month if not exists
        if (!months[monthKey]) {
          months[monthKey] = { total: 0 };
          companies.forEach(company => {
            months[monthKey][company.id] = 0;
          });
        }

        // Initialize day if not exists
        if (!daily[dateKey]) {
          daily[dateKey] = { total: 0 };
          companies.forEach(company => {
            daily[dateKey][company.id] = 0;
          });
        }

        // Add to monthly company total
        months[monthKey][project.company] = (months[monthKey][project.company] || 0) + project.price;
        months[monthKey].total += project.price;

        // Add to daily company total
        daily[dateKey][project.company] = (daily[dateKey][project.company] || 0) + project.price;
        daily[dateKey].total += project.price;
        
        // Add to company total
        companyTotals[project.company] = companyTotals[project.company] || { total: 0, months: {}, days: {} };
        companyTotals[project.company].total += project.price;
        companyTotals[project.company].months[monthKey] = (companyTotals[project.company].months[monthKey] || 0) + project.price;
        companyTotals[project.company].days[dateKey] = (companyTotals[project.company].days[dateKey] || 0) + project.price;
        
        // Add to YTD
        ytdTotal += project.price;
      });
      
      // Calculate net profit (revenue - payments) by month
      const yearPayments = payments.filter(payment => 
        new Date(payment.date).getFullYear() === selectedYear
      );
      
      // Initialize profit data with the revenue we've already calculated
      Object.keys(months).forEach(monthKey => {
        profitData[monthKey] = {
          revenue: months[monthKey].total,
          driverPayments: 0,
          netProfit: 0
        };
      });
      
      // Add only completed (paid) driver payments as costs
      yearPayments.forEach(payment => {
        if (payment.status !== 'paid') return;
        const date = new Date(payment.date);
        const monthKey = date.toLocaleString('default', { month: 'long' });
        
        if (!profitData[monthKey]) {
          profitData[monthKey] = {
            revenue: 0,
            driverPayments: 0,
            netProfit: 0
          };
        }
        
        profitData[monthKey].driverPayments += payment.amount;
      });
      
      // Net Profit = Revenue - Driver Payments
      Object.keys(profitData).forEach(month => {
        profitData[month].netProfit = 
          profitData[month].revenue - 
          profitData[month].driverPayments;
      });

      // Convert to sorted array for display
      const monthNames = Object.keys(months).sort((a, b) => {
        const monthOrder = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });

      // Sort months chronologically
      const orderedMonths: MonthlyData = {};
      monthNames.forEach(month => {
        orderedMonths[month] = months[month];
      });

      // Sort daily data chronologically
      const orderedDaily: DailyData = {};
      Object.keys(daily).sort().forEach(date => {
        orderedDaily[date] = daily[date];
      });

      // Format company data for display
      const formattedCompanyData = companies
        .map(company => ({
          id: company.id,
          name: company.name,
          total: companyTotals[company.id]?.total || 0,
          monthlyBreakdown: companyTotals[company.id]?.months || {},
          dailyBreakdown: companyTotals[company.id]?.days || {}
        }))
        .sort((a, b) => b.total - a.total); // Sort by highest total

      // Calculate driver earnings
      const driverTotals: { [key: string]: { total: number, months: { [key: string]: number } } } = {};
      
      // Initialize driver totals
      drivers.forEach(driver => {
        driverTotals[driver.id] = {
          total: 0,
          months: {}
        };
      });

      // Process completed projects for driver earnings
      yearProjects
        .filter(project => project.status === 'completed')
        .forEach(project => {
          const date = new Date(project.date);
          const monthKey = date.toLocaleString('default', { month: 'long' });
          const driverFee = project.driver_fee > 0 ? project.driver_fee : project.price;
          
          if (project.driver && driverTotals[project.driver]) {
            driverTotals[project.driver].total += driverFee;
            driverTotals[project.driver].months[monthKey] = (driverTotals[project.driver].months[monthKey] || 0) + driverFee;
          }
        });

      // Format driver earnings data for display
      const formattedDriverEarnings = drivers
        .map(driver => ({
          id: driver.id,
          name: driver.name,
          total: driverTotals[driver.id]?.total || 0,
          monthlyEarnings: driverTotals[driver.id]?.months || {}
        }))
        .filter(driver => driver.total > 0) // Only show drivers with earnings
        .sort((a, b) => b.total - a.total); // Sort by highest earnings

      setMonthlyData(orderedMonths);
      setDailyData(orderedDaily);
      setCompanyData(formattedCompanyData);
      setDriverEarningsData(formattedDriverEarnings);
      setNetProfitData(profitData);
      setYearToDate(ytdTotal);
      setLoading(false);
    } catch (error) {
      console.error('Error processing financial data:', error);
      setLoading(false);
    }
  }, [projects, companies, payments, selectedYear]);

  // Filter daily data for selected month if in daily view
  const filteredDailyData = React.useMemo(() => {
    if (viewMode !== 'daily') return {};
    
    return Object.keys(dailyData)
      .filter(date => {
        const dateObj = new Date(date);
        return dateObj.getMonth() + 1 === selectedMonth && dateObj.getFullYear() === selectedYear;
      })
      .reduce((acc, date) => {
        acc[date] = dailyData[date];
        return acc;
      }, {} as DailyData);
  }, [dailyData, selectedMonth, selectedYear, viewMode]);

  // Generate CSV for download
  const generateCsv = () => {
    const isDaily = viewMode === 'daily';
    const isProfitView = viewMode === 'profit';
    const isDriverView = viewMode === 'drivers';
    
    if (isDriverView) {
      // Driver earnings CSV format
      let csvContent = 'Driver,';
      
      // Get all months that have driver earnings
      const monthsWithEarnings = new Set<string>();
      driverEarningsData.forEach(driver => {
        Object.keys(driver.monthlyEarnings).forEach(month => {
          monthsWithEarnings.add(month);
        });
      });
      
      const sortedMonths = Array.from(monthsWithEarnings).sort((a, b) => {
        const monthOrder = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });
      
      // Add month headers
      sortedMonths.forEach(month => {
        csvContent += `"${month}",`;
      });
      csvContent += 'Year Total\n';
      
      // Add driver data
      driverEarningsData.forEach(driver => {
        csvContent += `"${driver.name}",`;
        
        // Add monthly values
        sortedMonths.forEach(month => {
          const value = driver.monthlyEarnings[month] || 0;
          csvContent += `€${value.toFixed(2)},`;
        });
        
        // Add driver total
        csvContent += `€${driver.total.toFixed(2)}\n`;
      });
      
      // Add total row
      csvContent += 'Monthly Total,';
      sortedMonths.forEach(month => {
        const monthTotal = driverEarningsData.reduce((sum, driver) => 
          sum + (driver.monthlyEarnings[month] || 0), 0);
        csvContent += `€${monthTotal.toFixed(2)},`;
      });
      const yearTotal = driverEarningsData.reduce((sum, driver) => sum + driver.total, 0);
      csvContent += `€${yearTotal.toFixed(2)}\n`;
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `driver_earnings_${selectedYear}.csv`);
    } else if (isProfitView) {
      // Profit analysis CSV format
      let csvContent = 'Month,Revenue,Driver Payments,Net Profit\n';
      
      // Sort months chronologically
      const months = Object.keys(netProfitData).sort((a, b) => {
        const monthOrder = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });
      
      // Add data for each month
      months.forEach(month => {
        const data = netProfitData[month];
        csvContent += `"${month}",€${data.revenue.toFixed(2)},€${data.driverPayments.toFixed(2)},€${data.netProfit.toFixed(2)}\n`;
      });
      
      // Calculate totals
      const totalRevenue = Object.values(netProfitData).reduce((sum, data) => sum + data.revenue, 0);
      const totalDriverPayments = Object.values(netProfitData).reduce((sum, data) => sum + data.driverPayments, 0);
      const totalNetProfit = Object.values(netProfitData).reduce((sum, data) => sum + data.netProfit, 0);
      
      csvContent += `"TOTAL",€${totalRevenue.toFixed(2)},€${totalDriverPayments.toFixed(2)},€${totalNetProfit.toFixed(2)}\n`;
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `net_profit_analysis_${selectedYear}.csv`);
    } else {
      const dataToExport = isDaily ? filteredDailyData : monthlyData;
      const periods = Object.keys(dataToExport);
      
      // Create header row
      let csvContent = isDaily ? 'Company,Date,Amount\n' : 'Company,';
      
      if (!isDaily) {
        // Add month headers for monthly view
        periods.forEach(period => {
          csvContent += `"${period}",`;
        });
        csvContent += 'Year Total\n';
      }
  
      if (isDaily) {
        // Daily CSV format - one row per company per day
        companyData.forEach(company => {
          periods.forEach(date => {
            const amount = company.dailyBreakdown[date] || 0;
            if (amount > 0) {
              csvContent += `"${company.name}","${date}",€${amount.toFixed(2)}\n`;
            }
          });
        });
      } else {
        // Monthly CSV format
        companyData.forEach(company => {
          csvContent += `"${company.name}",`;
          
          // Add monthly values
          periods.forEach(month => {
            const value = company.monthlyBreakdown[month] || 0;
            csvContent += `€${value.toFixed(2)},`;
          });
          
          // Add company total
          csvContent += `€${company.total.toFixed(2)}\n`;
        });
  
        // Add total row
        csvContent += 'Monthly Total,';
        periods.forEach(month => {
          csvContent += `€${monthlyData[month].total.toFixed(2)},`;
        });
        csvContent += `€${yearToDate.toFixed(2)}\n`;
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const filename = isDaily 
        ? `daily_report_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`
        : `financial_report_${selectedYear}.csv`;
      saveAs(blob, filename);
    }
  };

  // Helper: get sorted months from driver earnings
  const getSortedDriverMonths = () => {
    const monthsWithEarnings = new Set<string>();
    driverEarningsData.forEach(driver => {
      Object.keys(driver.monthlyEarnings).forEach(month => {
        monthsWithEarnings.add(month);
      });
    });
    return Array.from(monthsWithEarnings).sort((a, b) => {
      const monthOrder = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });
  };

  // Helper: sorted profit months
  const getSortedProfitMonths = () => {
    return Object.keys(netProfitData).sort((a, b) => {
      const monthOrder = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });
  };

  const stickyLeft: React.CSSProperties = {
    position: 'sticky',
    left: 0,
    zIndex: 2,
    borderRight: '1px solid var(--dp-border)',
  };

  return (
    <DispatchLayout pageTitle="Financial Report">
      <div style={{ maxWidth: 1100 }} className="mx-auto space-y-5">
        {/* Page header + controls */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-heading" style={{ fontSize: 22, color: 'var(--dp-text)' }}>Financial Report</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--dp-text-muted)' }}>Revenue breakdown by company, driver and period</p>
            </div>
          </div>

          {/* View mode + filters bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex p-1" style={{ background: 'var(--dp-surface-2)', borderRadius: 10 }}>
              {([
                { key: 'monthly', icon: BarChart2, label: 'Monthly' },
                { key: 'daily', icon: Calendar, label: 'Daily' },
                { key: 'profit', icon: TrendingUp, label: 'Net Profit' },
                { key: 'drivers', icon: Building2, label: 'Drivers' },
              ] as const).map(item => (
                <button
                  key={item.key}
                  onClick={() => setViewMode(item.key)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    borderRadius: 8,
                    background: viewMode === item.key ? 'var(--dp-surface)' : 'transparent',
                    color: viewMode === item.key ? 'var(--dp-accent)' : 'var(--dp-text-secondary)',
                    border: viewMode === item.key ? '1px solid var(--dp-border)' : '1px solid transparent',
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={selectStyle}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {viewMode === 'daily' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={selectStyle}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={generateCsv}
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
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10" style={{ borderTop: '2px solid var(--dp-accent)', borderBottom: '2px solid var(--dp-accent)', borderLeft: '2px solid transparent', borderRight: '2px solid transparent' }} />
          </div>
        ) : (
          <>
            {/* Summary header */}
            <div className="overflow-hidden" style={card}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--dp-border)', background: 'var(--dp-surface-2)' }}>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" style={{ color: 'var(--dp-text-muted)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--dp-text)' }}>
                    {viewMode === 'monthly' ? 'Year-to-Date Total' : 
                      viewMode === 'daily' ? 'Month Total' : 
                      viewMode === 'profit' ? 'Net Profit Analysis' :
                      'Driver Earnings Analysis'}: 
                    {viewMode !== 'profit' && viewMode !== 'drivers' && (
                      <span className="font-bold ml-1 tabular-nums" style={{ color: 'var(--dp-success)', fontFamily: 'var(--font-mono)' }}>
                        €{viewMode === 'monthly' 
                          ? yearToDate.toFixed(2) 
                          : Object.values(filteredDailyData).reduce((sum, day) => sum + day.total, 0).toFixed(2)
                        }
                      </span>
                    )}
                    {viewMode === 'drivers' && (
                      <span className="font-bold ml-1 tabular-nums" style={{ color: 'var(--dp-accent)', fontFamily: 'var(--font-mono)' }}>
                        €{driverEarningsData.reduce((sum, driver) => sum + driver.total, 0).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--dp-text-muted)' }}>
                  {viewMode === 'monthly' 
                    ? selectedYear 
                    : viewMode === 'daily' ? `${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`
                    : `${selectedYear} Analysis`
                  }
                </span>
              </div>

              <div className="overflow-x-auto">
                {viewMode === 'drivers' ? (
                  /* ─── Drivers Table ─── */
                  <table className="w-full" style={{ minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                        <th style={{ ...thBase, ...stickyLeft, background: 'var(--dp-surface-2)' }}>Driver</th>
                        {getSortedDriverMonths().map((month) => (
                          <th key={month} style={{ ...thBase, textAlign: 'right' }}>{month}</th>
                        ))}
                        <th style={{ ...thBase, textAlign: 'right', background: 'var(--dp-surface-2)', fontWeight: 700, color: 'var(--dp-text)' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverEarningsData.map((driver) => {
                        const sortedMonths = getSortedDriverMonths();
                        return (
                          <tr
                            key={driver.id}
                            className="transition-colors"
                            style={{ borderBottom: '1px solid var(--dp-border)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ ...tdBase, ...stickyLeft, background: 'inherit', fontWeight: 500, color: 'var(--dp-text)' }}>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--dp-text-muted)' }} />
                                {driver.name}
                              </div>
                            </td>
                            {sortedMonths.map((month) => {
                              const value = driver.monthlyEarnings[month] || 0;
                              return (
                                <td key={`${driver.id}-${month}`} className="tabular-nums" style={{ ...tdBase, textAlign: 'right', color: value > 0 ? 'var(--dp-text)' : 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {value > 0 ? `€${value.toFixed(2)}` : '—'}
                                </td>
                              );
                            })}
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)' }}>
                              €{driver.total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--dp-surface-2)', borderTop: '2px solid var(--dp-border)' }}>
                        <td style={{ ...tdBase, ...stickyLeft, background: 'var(--dp-surface-2)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--dp-text)' }}>
                          Monthly Total
                        </td>
                        {getSortedDriverMonths().map((month) => {
                          const monthTotal = driverEarningsData.reduce((sum, driver) => sum + (driver.monthlyEarnings[month] || 0), 0);
                          return (
                            <td key={`total-${month}`} className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                              €{monthTotal.toFixed(2)}
                            </td>
                          );
                        })}
                        <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)' }}>
                          €{driverEarningsData.reduce((sum, driver) => sum + driver.total, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : viewMode === 'profit' ? (
                  /* ─── Net Profit Table ─── */
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                        <th style={{ ...thBase, ...stickyLeft, background: 'var(--dp-surface-2)' }}>Month</th>
                        <th style={{ ...thBase, textAlign: 'right' }}>Revenue</th>
                        <th style={{ ...thBase, textAlign: 'right' }}>Driver Payments</th>
                        <th style={{ ...thBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text)', background: 'var(--dp-surface-2)' }}>Net Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedProfitMonths().map((month) => {
                        const data = netProfitData[month];
                        return (
                          <tr
                            key={month}
                            className="transition-colors"
                            style={{ borderBottom: '1px solid var(--dp-border)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ ...tdBase, ...stickyLeft, background: 'inherit', fontWeight: 500, color: 'var(--dp-text)' }}>
                              {month}
                            </td>
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', color: 'var(--dp-success)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                              €{data.revenue.toFixed(2)}
                            </td>
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', color: 'var(--dp-text-secondary)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                              €{data.driverPayments.toFixed(2)}
                            </td>
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)', color: data.netProfit >= 0 ? 'var(--dp-success)' : 'var(--dp-danger)' }}>
                              €{data.netProfit.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--dp-surface-2)', borderTop: '2px solid var(--dp-border)' }}>
                        <td style={{ ...tdBase, ...stickyLeft, background: 'var(--dp-surface-2)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--dp-text)' }}>
                          TOTAL
                        </td>
                        <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-success)', fontFamily: 'var(--font-mono)' }}>
                          €{Object.values(netProfitData).reduce((sum, data) => sum + data.revenue, 0).toFixed(2)}
                        </td>
                        <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          €{Object.values(netProfitData).reduce((sum, data) => sum + data.driverPayments, 0).toFixed(2)}
                        </td>
                        {(() => {
                          const total = Object.values(netProfitData).reduce((sum, data) => sum + data.netProfit, 0);
                          return (
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: total >= 0 ? 'var(--dp-success)' : 'var(--dp-danger)' }}>
                              €{total.toFixed(2)}
                            </td>
                          );
                        })()}
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  /* ─── Monthly / Daily Company Table ─── */
                  <table className="w-full" style={{ minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--dp-border)' }}>
                        <th style={{ ...thBase, ...stickyLeft, background: 'var(--dp-surface-2)' }}>Company</th>
                        {viewMode === 'monthly' ? (
                          <>
                            {Object.keys(monthlyData).map((month) => (
                              <th key={month} style={{ ...thBase, textAlign: 'right' }}>{month}</th>
                            ))}
                            <th style={{ ...thBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text)', background: 'var(--dp-surface-2)' }}>Total</th>
                          </>
                        ) : (
                          <>
                            {Object.keys(filteredDailyData).slice(0, 10).map((date) => (
                              <th key={date} style={{ ...thBase, textAlign: 'right' }}>
                                {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </th>
                            ))}
                            {Object.keys(filteredDailyData).length > 10 && (
                              <th style={{ ...thBase, textAlign: 'right' }}>...</th>
                            )}
                            <th style={{ ...thBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text)', background: 'var(--dp-surface-2)' }}>Month Total</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {companyData.map((company) => (
                        <tr
                          key={company.id}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid var(--dp-border)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--dp-surface-2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ ...tdBase, ...stickyLeft, background: 'inherit', fontWeight: 500, color: 'var(--dp-text)' }}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--dp-text-muted)' }} />
                              {company.name}
                            </div>
                          </td>
                          {viewMode === 'monthly' ? (
                            <>
                              {Object.keys(monthlyData).map((month) => {
                                const value = company.monthlyBreakdown[month] || 0;
                                return (
                                  <td key={`${company.id}-${month}`} className="tabular-nums" style={{ ...tdBase, textAlign: 'right', color: value > 0 ? 'var(--dp-text)' : 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {value > 0 ? `€${value.toFixed(2)}` : '—'}
                                  </td>
                                );
                              })}
                              <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)' }}>
                                €{company.total.toFixed(2)}
                              </td>
                            </>
                          ) : (
                            <>
                              {Object.keys(filteredDailyData).slice(0, 10).map((date) => {
                                const value = company.dailyBreakdown[date] || 0;
                                return (
                                  <td key={`${company.id}-${date}`} className="tabular-nums" style={{ ...tdBase, textAlign: 'right', color: value > 0 ? 'var(--dp-text)' : 'var(--dp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {value > 0 ? `€${value.toFixed(2)}` : '—'}
                                  </td>
                                );
                              })}
                              {Object.keys(filteredDailyData).length > 10 && (
                                <td style={{ ...tdBase, textAlign: 'right', color: 'var(--dp-text-muted)' }}>...</td>
                              )}
                              <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)' }}>
                                €{Object.keys(filteredDailyData).reduce((sum, date) => sum + (company.dailyBreakdown[date] || 0), 0).toFixed(2)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--dp-surface-2)', borderTop: '2px solid var(--dp-border)' }}>
                        <td style={{ ...tdBase, ...stickyLeft, background: 'var(--dp-surface-2)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--dp-text)' }}>
                          {viewMode === 'monthly' ? 'Monthly Total' : 'Daily Total'}
                        </td>
                        {viewMode === 'monthly' ? (
                          <>
                            {Object.keys(monthlyData).map((month) => (
                              <td key={`total-${month}`} className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                                €{monthlyData[month].total.toFixed(2)}
                              </td>
                            ))}
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)' }}>
                              €{yearToDate.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <>
                            {Object.keys(filteredDailyData).slice(0, 10).map((date) => (
                              <td key={`total-${date}`} className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)' }}>
                                €{filteredDailyData[date].total.toFixed(2)}
                              </td>
                            ))}
                            {Object.keys(filteredDailyData).length > 10 && (
                              <td style={{ ...tdBase, textAlign: 'right', fontWeight: 600, color: 'var(--dp-text-muted)' }}>...</td>
                            )}
                            <td className="tabular-nums" style={{ ...tdBase, textAlign: 'right', fontWeight: 700, color: 'var(--dp-text)', fontFamily: 'var(--font-mono)', background: 'var(--dp-surface-2)' }}>
                              €{Object.values(filteredDailyData).reduce((sum, day) => sum + day.total, 0).toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Report Information */}
            <div className="flex items-start gap-3 p-4" style={card}>
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--dp-text-muted)' }} />
              {viewMode === 'drivers' ? (
                <div className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
                  <p className="mb-2">
                    This report shows the monthly earnings breakdown for all drivers in {selectedYear} (EUR).
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mb-2">
                    <li>Only completed transfers are included in earnings calculations</li>
                    <li>Driver fees are used when specified, otherwise the full project price</li>
                    <li>All amounts are displayed in EUR</li>
                    <li>Only drivers with earnings &gt; €0 are shown</li>
                  </ul>
                  <p>
                    Total driver earnings for {selectedYear}: 
                    <span className="font-medium ml-1 tabular-nums" style={{ color: 'var(--dp-accent)', fontFamily: 'var(--font-mono)' }}>
                      €{driverEarningsData.reduce((sum, driver) => sum + driver.total, 0).toFixed(2)}
                    </span>
                  </p>
                </div>
              ) : viewMode === 'profit' ? (
                <div className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
                  <p className="mb-2">
                    This report shows the net profit analysis for {selectedYear}, calculated as:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mb-2">
                    <li>Revenue from all projects (regardless of payment status)</li>
                    <li>Minus: Payments made to drivers</li>
                    <li>Equals: Net Profit</li>
                  </ul>
                  <p>
                    Total net profit for {selectedYear}: 
                    <span className={`font-medium ml-1 tabular-nums`} style={{
                      color: Object.values(netProfitData).reduce((sum, data) => sum + data.netProfit, 0) >= 0 ? 'var(--dp-success)' : 'var(--dp-danger)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      €{Object.values(netProfitData).reduce((sum, data) => sum + data.netProfit, 0).toFixed(2)}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="text-sm" style={{ color: 'var(--dp-text-secondary)', lineHeight: 1.5 }}>
                  <p className="mb-2">
                    This report shows the financial breakdown of all projects by company and {viewMode === 'monthly' ? 'month' : 'day'} for {selectedYear}
                    {viewMode === 'daily' && ` - ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}`}.
                  </p>
                  <p>
                    Total revenue for {viewMode === 'monthly' ? selectedYear : `${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}: 
                    <span className="font-medium ml-1 tabular-nums" style={{ color: 'var(--dp-success)', fontFamily: 'var(--font-mono)' }}>
                      €{viewMode === 'monthly' 
                        ? yearToDate.toFixed(2) 
                        : Object.values(filteredDailyData).reduce((sum, day) => sum + day.total, 0).toFixed(2)
                      }
                    </span>
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DispatchLayout>
  );
}
