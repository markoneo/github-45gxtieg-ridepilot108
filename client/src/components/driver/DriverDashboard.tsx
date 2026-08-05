import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MapPin, Users, Clock, DollarSign, Phone, Car, RefreshCw, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, CircleCheck as CheckCircle2, Calendar, User, Building2, ExternalLink, ArrowRight, Bell, TrendingUp, Activity, Circle as XCircle, CirclePlay as PlayCircle, CirclePause as PauseCircle, Copy, Check, Plus, X, Wallet } from 'lucide-react';
import { DriverDataProvider, useDriverData } from '../../contexts/DriverDataContext';

interface DriverDashboardProps {
  driverId: string;
  driverName: string;
  driverUuid: string;
  onLogout: () => void;
}

// Project Card Component for Driver Portal
const DriverProjectCard = ({ project, companyName, carTypeName }: { 
  project: any; 
  companyName: string;
  carTypeName: string;
}) => {
  const { updateProjectStatus } = useDriverData();
  const [updating, setUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleStatusUpdate = async (status: 'accepted' | 'started' | 'declined') => {
    setUpdating(true);
    try {
      await updateProjectStatus(project.id, status);
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('Failed to update project status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'started': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgency = () => {
    const projectDateTime = new Date(`${project.date}T${project.time}`);
    const now = new Date();
    const diffHours = (projectDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { type: 'past', color: 'bg-gray-200' };
    if (diffHours <= 2) return { type: 'urgent', color: 'bg-red-500' };
    if (diffHours <= 24) return { type: 'soon', color: 'bg-orange-500' };
    return { type: 'scheduled', color: 'bg-blue-500' };
  };

  const urgency = getUrgency();
  const displayPrice = project.driver_fee && project.driver_fee > 0 ? project.driver_fee : project.price;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Header with urgency indicator */}
      <div className={`h-2 ${urgency.color}`}></div>
      
      <div className="p-6">
        {/* Trip Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{project.client_name}</h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                {companyName}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              €{displayPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-medium">{formatDate(project.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="font-bold text-lg">{formatTime(project.time)}</span>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 p-2 rounded-lg mt-1">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Pickup</p>
              <button
                onClick={() => {
                  const pickupUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.pickup_location)}`;
                  window.open(pickupUrl, '_blank');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 leading-relaxed text-left underline decoration-dotted hover:decoration-solid transition-all duration-200"
                title="Open in Google Maps"
              >
                {project.pickup_location}
              </button>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 p-2 rounded-lg mt-1">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Dropoff</p>
              <button
                onClick={() => {
                  const dropoffUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.dropoff_location)}`;
                  window.open(dropoffUrl, '_blank');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 leading-relaxed text-left underline decoration-dotted hover:decoration-solid transition-all duration-200"
                title="Open in Google Maps"
              >
                {project.dropoff_location}
              </button>
            </div>
          </div>
          
          {/* Route Navigation Button */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(project.pickup_location)}&destination=${encodeURIComponent(project.dropoff_location)}`;
                window.open(routeUrl, '_blank');
              }}
              className="w-full flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              title="Get directions from pickup to dropoff"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Get Directions</span>
            </button>
          </div>
            </div>
          </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">{project.passengers} passenger{project.passengers !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <a 
              href={`tel:${project.client_phone}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Call Client
            </a>
            {project.client_phone && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(project.client_phone || '');
                  setCopiedId(project.id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className="p-1 rounded hover:bg-blue-100 transition-colors text-blue-500 hover:text-blue-700"
                title="Copy contact number"
              >
                {copiedId === project.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">{carTypeName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className={`text-sm font-medium ${
              project.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
            }`}>
              {project.payment_status === 'paid' ? 'Already Paid' : 'Charge the Client'}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.acceptance_status)}`}>
            {project.acceptance_status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
            {project.acceptance_status === 'accepted' && <CheckCircle className="w-4 h-4 mr-1" />}
            {project.acceptance_status === 'started' && <PlayCircle className="w-4 h-4 mr-1" />}
            {project.acceptance_status === 'declined' && <XCircle className="w-4 h-4 mr-1" />}
            {project.acceptance_status.charAt(0).toUpperCase() + project.acceptance_status.slice(1)}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs font-medium text-yellow-700 uppercase tracking-wider mb-1">
              Special Instructions
            </p>
            <p className="text-sm text-yellow-800">{project.description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {project.acceptance_status === 'pending' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusUpdate('accepted')}
                disabled={updating}
                className="flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{updating ? 'Accepting...' : 'Accept Trip'}</span>
              </button>
              <button
                onClick={() => handleStatusUpdate('declined')}
                disabled={updating}
                className="flex items-center justify-center space-x-2 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>{updating ? 'Declining...' : 'Decline'}</span>
              </button>
            </div>
          )}
          
          {project.acceptance_status === 'accepted' && (
            <button
              onClick={() => handleStatusUpdate('started')}
              disabled={updating}
              className="flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <PlayCircle className="w-5 h-5" />
              <span>{updating ? 'Starting...' : 'Start Trip'}</span>
            </button>
          )}

          {project.acceptance_status === 'started' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={updating}
              className="flex items-center justify-center space-x-2 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{updating ? 'Completing...' : 'Complete Trip'}</span>
            </button>
          )}
          {project.acceptance_status === 'completed' && (
            <div className="flex items-center justify-center space-x-2 bg-blue-100 text-blue-800 py-3 px-4 rounded-xl font-medium">
              <CheckCircle2 className="w-5 h-5" />
              <span>Trip Completed</span>
            </div>
          )}

          {project.acceptance_status === 'declined' && (
            <div className="flex items-center justify-center space-x-2 bg-red-100 text-red-800 py-3 px-4 rounded-xl font-medium">
              <XCircle className="w-5 h-5" />
              <span>Trip Declined</span>
            </div>
          )}
        </div>

        {/* Booking ID */}
        {project.booking_id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Booking Reference: <span className="font-mono">{project.booking_id}</span>
            </p>
          </div>
        )}
    </motion.div>
  );
};

// Dashboard Content Component
const DashboardContent = ({ driverName, onLogout }: { 
  driverName: string; 
  onLogout: () => void;
}) => {
  const { projects, companies, carTypes, payments, loading, error, refreshProjects, updateProjectStatus, addDriverPayment, retryCount, driverInfo } = useDriverData();
  const [refreshing, setRefreshing] = useState(false);
  const [showEarningsForm, setShowEarningsForm] = useState(false);
  const [paymentsExpanded, setPaymentsExpanded] = useState(false);
  const [earningsForm, setEarningsForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [submittingEarnings, setSubmittingEarnings] = useState(false);
  const [earningsError, setEarningsError] = useState('');
  const [earningsSuccess, setEarningsSuccess] = useState('');
  
  // Debug info
  useEffect(() => {
    console.log('DriverDashboard - Projects loaded:', projects.length);
    console.log('DriverDashboard - Driver info:', driverInfo);
    console.log('DriverDashboard - Loading:', loading);
    console.log('DriverDashboard - Error:', error);
  }, [projects, driverInfo, loading, error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProjects();
    } finally {
      setRefreshing(false);
    }
  };

  // Get company name helper
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  // Get car type name helper
  const getCarTypeName = (carTypeId: string) => {
    const carType = carTypes.find(ct => ct.id === carTypeId);
    return carType?.name || 'Standard Vehicle';
  };

  // Organize projects by status and urgency
  const organizedProjects = useMemo(() => {
    const now = new Date();
    
    const categorized = {
      urgent: [] as any[],
      today: [] as any[],
      upcoming: [] as any[],
      completed: [] as any[]
    };

    projects.forEach(project => {
      if (project.status === 'completed') {
        categorized.completed.push(project);
        return;
      }

      const projectDateTime = new Date(`${project.date}T${project.time}`);
      const diffHours = (projectDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isToday = projectDateTime.toDateString() === now.toDateString();

      if (diffHours <= 2 && diffHours > 0) {
        categorized.urgent.push(project);
      } else if (isToday) {
        categorized.today.push(project);
      } else {
        categorized.upcoming.push(project);
      }
    });

    // Sort each category
    Object.keys(categorized).forEach(key => {
      categorized[key as keyof typeof categorized].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
    });

    return categorized;
  }, [projects]);

  const getDateLabel = useCallback((dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.getTime() === today.getTime();
    const isTomorrow = date.getTime() === tomorrow.getTime();

    return {
      main: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' }),
      sub: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, []);

  const groupByDate = useCallback((items: any[]) => {
    const map = new Map<string, any[]>();
    items.forEach(p => {
      const key = p.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries());
  }, []);

  const stats = useMemo(() => {
    const pending = projects.filter(p => p.acceptance_status === 'pending').length;
    const accepted = projects.filter(p => p.acceptance_status === 'accepted').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const tripEarnings = projects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.driver_fee || p.price), 0);
    const paymentEarnings = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = tripEarnings + paymentEarnings;

    return { pending, accepted, completed, totalEarnings };
  }, [projects, payments]);

  const [earningsYear, setEarningsYear] = useState(new Date().getFullYear());

  const monthlyEarnings = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      label: new Date(earningsYear, i).toLocaleDateString('en-US', { month: 'short' }),
      fullLabel: new Date(earningsYear, i).toLocaleDateString('en-US', { month: 'long' }),
      trips: 0,
      tripEarnings: 0,
      paymentEarnings: 0,
      total: 0,
    }));

    projects
      .filter(p => p.status === 'completed')
      .forEach(p => {
        const d = new Date(p.date);
        if (d.getFullYear() === earningsYear) {
          const m = d.getMonth();
          months[m].trips += 1;
          months[m].tripEarnings += p.driver_fee || p.price;
        }
      });

    payments
      .filter(p => p.status === 'paid')
      .forEach(p => {
        const d = new Date(p.date);
        if (d.getFullYear() === earningsYear) {
          const m = d.getMonth();
          months[m].paymentEarnings += p.amount;
        }
      });

    months.forEach(m => { m.total = m.tripEarnings + m.paymentEarnings; });
    return months;
  }, [projects, payments, earningsYear]);

  const yearTotal = useMemo(() => monthlyEarnings.reduce((s, m) => s + m.total, 0), [monthlyEarnings]);
  const maxMonthly = useMemo(() => Math.max(...monthlyEarnings.map(m => m.total), 1), [monthlyEarnings]);
  const [earningsExpanded, setEarningsExpanded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const selectedMonthTrips = useMemo(() => {
    if (selectedMonth === null) return [];
    return projects
      .filter(p => {
        const d = new Date(p.date);
        return p.status === 'completed' && d.getFullYear() === earningsYear && d.getMonth() === selectedMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projects, earningsYear, selectedMonth]);

  const selectedMonthPayments = useMemo(() => {
    if (selectedMonth === null) return [];
    return payments
      .filter(p => {
        const d = new Date(p.date);
        return p.status === 'paid' && d.getFullYear() === earningsYear && d.getMonth() === selectedMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, earningsYear, selectedMonth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Projects</h2>
          <p className="text-gray-600">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Please wait while we fetch your assigned trips'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Projects</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {refreshing ? 'Retrying...' : 'Try Again'}
            </button>
            <button
              onClick={onLogout}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {driverName}!
              </h1>
              <p className="text-gray-600">Your driver portal dashboard</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg transition-colors ${
                  refreshing 
                    ? 'text-gray-400' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Refresh projects"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Earnings</p>
                <p className="text-xl font-bold text-green-600">€{stats.totalEarnings.toFixed(0)}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="w-8 h-8 text-green-500" />
                <button
                  onClick={() => setShowEarningsForm(true)}
                  className="flex items-center gap-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {earningsSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">{earningsSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly Earnings Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => { setEarningsExpanded(e => !e); if (earningsExpanded) setSelectedMonth(null); }}
            className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Earnings</h3>
                <p className="text-sm text-gray-500">Total {earningsYear}: {'\u20AC'}{yearTotal.toFixed(2)}</p>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${earningsExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${earningsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-5 pt-3 pb-1 flex items-center justify-center gap-2">
              <button
                onClick={() => { setEarningsYear(y => y - 1); setSelectedMonth(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-center">{earningsYear}</span>
              <button
                onClick={() => { setEarningsYear(y => y + 1); setSelectedMonth(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="p-5 pt-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {monthlyEarnings.map((m) => {
                  const barHeight = m.total > 0 ? Math.max((m.total / maxMonthly) * 100, 8) : 0;
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  const isCurrent = earningsYear === currentYear && m.month === currentMonth;
                  const isSelected = selectedMonth === m.month;
                  return (
                    <button
                      key={m.month}
                      onClick={() => setSelectedMonth(isSelected ? null : m.month)}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                        isSelected ? 'bg-green-100 ring-2 ring-green-400 scale-105' :
                        isCurrent ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs font-medium text-gray-500 mb-2">{m.label}</span>
                      <div className="w-full h-20 flex items-end justify-center mb-2">
                        <div
                          className={`w-6 rounded-t-md transition-all duration-500 ${m.total > 0 ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gray-100'}`}
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${m.total > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {'\u20AC'}{m.total.toFixed(0)}
                      </span>
                      {m.trips > 0 && (
                        <span className="text-[10px] text-gray-400 mt-0.5">{m.trips} trip{m.trips !== 1 ? 's' : ''}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expanded month detail */}
            {selectedMonth !== null && (
              <div className="px-5 pb-5 border-t border-gray-100">
                <div className="pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    {monthlyEarnings[selectedMonth].fullLabel} {earningsYear} Details
                  </h4>

                  {selectedMonthTrips.length === 0 && selectedMonthPayments.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No earnings this month</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedMonthTrips.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Completed Trips</p>
                          <div className="space-y-1.5">
                            {selectedMonthTrips.map((trip) => (
                              <div key={trip.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-800 truncate">
                                      {trip.pickup_location || 'Pickup'} → {trip.dropoff_location || 'Dropoff'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {new Date(trip.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                      {trip.time ? ` at ${trip.time}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold text-green-700 shrink-0 ml-2">
                                  {'\u20AC'}{(trip.driver_fee || trip.price).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedMonthPayments.length > 0 && (
                        <div className={selectedMonthTrips.length > 0 ? 'mt-3' : ''}>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Payments</p>
                          <div className="space-y-1.5">
                            {selectedMonthPayments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Wallet className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-800 truncate">{payment.description || 'Payment'}</p>
                                    <p className="text-xs text-gray-400">
                                      {new Date(payment.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold text-green-700 shrink-0 ml-2">
                                  {'\u20AC'}{payment.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Month Total</span>
                        <span className="text-base font-bold text-green-700">
                          {'\u20AC'}{monthlyEarnings[selectedMonth].total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Categories */}
        {organizedProjects.urgent.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-700">Urgent - Starting Soon!</h2>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {organizedProjects.urgent.length} trip{organizedProjects.urgent.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {groupByDate(organizedProjects.urgent).map(([dateKey, trips]) => {
                const dl = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-xl px-4 py-3 shadow-md border border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">{dl.main}</h3>
                          <p className="text-white/80 text-sm">{dl.sub}</p>
                        </div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center">
                        <span className="text-lg font-bold text-white">{trips.length}</span>
                        <p className="text-white/80 text-xs">trip{trips.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {trips.map((project: any) => (
                        <DriverProjectCard key={project.id} project={project} companyName={getCompanyName(project.company_id)} carTypeName={getCarTypeName(project.car_type_id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {organizedProjects.today.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-blue-700">Today's Trips</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {organizedProjects.today.length} trip{organizedProjects.today.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {groupByDate(organizedProjects.today).map(([dateKey, trips]) => {
                const dl = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-xl px-4 py-3 shadow-md border border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">{dl.main}</h3>
                          <p className="text-white/80 text-sm">{dl.sub}</p>
                        </div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center">
                        <span className="text-lg font-bold text-white">{trips.length}</span>
                        <p className="text-white/80 text-xs">trip{trips.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {trips.map((project: any) => (
                        <DriverProjectCard key={project.id} project={project} companyName={getCompanyName(project.company_id)} carTypeName={getCarTypeName(project.car_type_id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {organizedProjects.upcoming.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-green-700">Upcoming Trips</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {organizedProjects.upcoming.length} trip{organizedProjects.upcoming.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {groupByDate(organizedProjects.upcoming).map(([dateKey, trips]) => {
                const dl = getDateLabel(dateKey);
                return (
                  <div key={dateKey} className="space-y-3">
                    <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-xl px-4 py-3 shadow-md border border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight">{dl.main}</h3>
                          <p className="text-white/80 text-sm">{dl.sub}</p>
                        </div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-center">
                        <span className="text-lg font-bold text-white">{trips.length}</span>
                        <p className="text-white/80 text-xs">trip{trips.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {trips.map((project: any) => (
                        <DriverProjectCard key={project.id} project={project} companyName={getCompanyName(project.company_id)} carTypeName={getCarTypeName(project.car_type_id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Projects State */}
        {projects.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips assigned yet</h3>
            <p className="text-gray-600 mb-6">
              Your dispatcher hasn't assigned any trips to you yet. Check back later or contact them directly.
            </p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {refreshing ? 'Checking...' : 'Check for New Trips'}
            </button>
          </div>
        )}

        {/* Completed Trips Summary */}
        {organizedProjects.completed.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gray-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-700">Recently Completed</h2>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {organizedProjects.completed.length} trip{organizedProjects.completed.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Show only last 3 completed trips */}
            <div className="grid gap-4 md:grid-cols-2">
              {organizedProjects.completed.slice(0, 3).map(project => (
                <div key={project.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{project.client_name}</h4>
                    <span className="text-green-600 font-bold">€{(project.driver_fee || project.price).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(project.date)} at {formatTime(project.time)}</p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">Completed</span>
                  </div>
                </div>
              ))}
            </div>
            
            {organizedProjects.completed.length > 3 && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">
                  {organizedProjects.completed.length - 3} more completed trips
                </span>
              </div>
            )}
          </div>
        )}

        {/* Earnings / Payments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPaymentsExpanded(e => !e)}
              className="flex-1 px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="bg-green-100 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Earnings & Payments</h2>
                <p className="text-sm text-gray-500">{payments.length} record{payments.length !== 1 ? 's' : ''}</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ml-auto ${paymentsExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="pr-4">
              <button
                onClick={() => {
                  setShowEarningsForm(true);
                  setEarningsError('');
                  setEarningsForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
                }}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Add Earnings Modal */}
          {showEarningsForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Add Manual Earnings</h3>
                  <button onClick={() => setShowEarningsForm(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {earningsError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {earningsError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={earningsForm.amount}
                      onChange={(e) => setEarningsForm({ ...earningsForm, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={earningsForm.date}
                      onChange={(e) => setEarningsForm({ ...earningsForm, date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={earningsForm.description}
                      onChange={(e) => setEarningsForm({ ...earningsForm, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. Cash tip, Private ride"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowEarningsForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const amount = parseFloat(earningsForm.amount);
                      if (!amount || amount <= 0) {
                        setEarningsError('Please enter a valid amount');
                        return;
                      }
                      if (!earningsForm.date) {
                        setEarningsError('Please select a date');
                        return;
                      }
                      setSubmittingEarnings(true);
                      setEarningsError('');
                      setEarningsSuccess('');
                      try {
                        await addDriverPayment(amount, earningsForm.date, earningsForm.description || 'Manual earnings');
                        setEarningsForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
                        setShowEarningsForm(false);
                        setEarningsSuccess('Earnings added successfully!');
                        setTimeout(() => setEarningsSuccess(''), 3000);
                      } catch (err: any) {
                        console.error('Earnings submit error:', err);
                        setEarningsError(err?.message || 'Failed to add earnings. Please try again.');
                      } finally {
                        setSubmittingEarnings(false);
                      }
                    }}
                    disabled={submittingEarnings}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submittingEarnings ? 'Adding...' : 'Add Earnings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Payments List */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${paymentsExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="border-t border-gray-100">
              {payments.length > 0 ? (
                <div className="p-4 space-y-2">
                  {payments.slice(0, 10).map(payment => (
                    <div key={payment.id} className="bg-gray-50 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm truncate">{payment.description || 'Payment'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              payment.source === 'driver' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {payment.source === 'driver' ? 'Added by you' : 'From dispatcher'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-base font-bold text-green-600">{'\u20AC'}{payment.amount.toFixed(2)}</span>
                          <p className={`text-xs font-medium ${payment.status === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                            {payment.status === 'paid' ? 'Paid' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {payments.length > 10 && (
                    <div className="text-center pt-1">
                      <span className="text-sm text-gray-500">{payments.length - 10} more payments</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No payment records yet. Add your earnings manually or wait for dispatcher payments.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for date formatting
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (time: string) => {
  return time.substring(0, 5);
};

// Main Dashboard Component
export default function DriverDashboard({ driverId, driverName, driverUuid, onLogout }: DriverDashboardProps) {
  return (
    <DriverDataProvider driverId={driverId} driverUuid={driverUuid}>
      <DashboardContent driverName={driverName} onLogout={onLogout} />
    </DriverDataProvider>
  );
}