interface ExportProject {
  pickupLocation: string;
  dropoffLocation: string;
  time: string;
  date: string;
  clientName: string;
  carType: string;
  passengers: number;
  driverAssigned: string;
  price?: number;
  paymentStatus?: string;
  bookingId?: string;
  company?: string;
}

export function exportProjectsToCSV(
  projects: ExportProject[],
  filename: string = 'daily-active-projects.csv'
): void {
  if (projects.length === 0) {
    alert('No projects to export');
    return;
  }

  const headers = [
    'Booking ID',
    'Date',
    'Time',
    'Customer Name',
    'Pick-up Location',
    'Drop-off Location',
    'Car Type',
    'Number of Passengers',
    'Driver Assigned',
    'Price',
    'Payment Status',
    'Company'
  ];

  const csvRows = [
    headers.join(','),
    ...projects.map(project => {
      const row = [
        project.bookingId || 'N/A',
        project.date,
        project.time,
        escapeCSVValue(project.clientName),
        escapeCSVValue(project.pickupLocation),
        escapeCSVValue(project.dropoffLocation),
        escapeCSVValue(project.carType),
        project.passengers,
        escapeCSVValue(project.driverAssigned),
        project.price ? `€${project.price.toFixed(2)}` : 'N/A',
        project.paymentStatus || 'N/A',
        escapeCSVValue(project.company || 'N/A')
      ];
      return row.join(',');
    })
  ];

  const csvContent = csvRows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function getTodayActiveProjects(
  projects: any[],
  getCompanyName: (id: string) => string,
  getDriverName: (id: string) => string,
  getCarTypeName: (id: string) => string
): ExportProject[] {
  const today = new Date().toISOString().split('T')[0];

  return projects
    .filter(project =>
      project.status === 'active' &&
      project.date === today
    )
    .map(project => ({
      bookingId: project.bookingId,
      pickupLocation: project.pickupLocation,
      dropoffLocation: project.dropoffLocation,
      time: project.time,
      date: project.date,
      clientName: project.clientName,
      carType: getCarTypeName(project.carType),
      passengers: project.passengers,
      driverAssigned: getDriverName(project.driver),
      price: project.price,
      paymentStatus: project.paymentStatus,
      company: getCompanyName(project.company)
    }));
}

export function getActiveProjects(
  projects: any[],
  getCompanyName: (id: string) => string,
  getDriverName: (id: string) => string,
  getCarTypeName: (id: string) => string
): ExportProject[] {
  return projects
    .filter(project => project.status === 'active')
    .map(project => ({
      bookingId: project.bookingId,
      pickupLocation: project.pickupLocation,
      dropoffLocation: project.dropoffLocation,
      time: project.time,
      date: project.date,
      clientName: project.clientName,
      carType: getCarTypeName(project.carType),
      passengers: project.passengers,
      driverAssigned: getDriverName(project.driver),
      price: project.price,
      paymentStatus: project.paymentStatus,
      company: getCompanyName(project.company)
    }));
}
