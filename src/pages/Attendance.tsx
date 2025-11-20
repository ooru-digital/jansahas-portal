import { useState, useEffect } from 'react';
import { Calendar, Filter, Search, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { getWorkers, Worker } from '../api/workers';
import { getOrganizations, Organization } from '../api/organizations';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  workerId: number;
  workerName: string;
  phoneNumber: string;
  organizationId: string;
  photograph: string | null;
  date: string;
  inTime: string;
  outTime: string;
  status: 'present' | 'absent' | 'half-day';
}

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const info = JSON.parse(userInfoStr);
      setUserInfo(info);
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      loadData();
    }
  }, [userInfo]);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, searchTerm, selectedOrganization, selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (userInfo?.is_jansathi) {
        const orgsData = await getOrganizations();
        setOrganizations(orgsData);
      }

      const workersData = await getWorkers({ limit: 10 });
      const mockAttendance = generateMockAttendance(workersData.results, selectedDate);
      setAttendanceRecords(mockAttendance);
    } catch (error) {
      toast.error('Failed to load attendance data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockAttendance = (workers: Worker[], date: string): AttendanceRecord[] => {
    const statuses: ('present' | 'absent' | 'half-day')[] = ['present', 'present', 'present', 'present', 'absent', 'half-day'];

    return workers.map((worker, index) => {
      const status = statuses[index % statuses.length];
      const baseInHour = 8 + Math.floor(Math.random() * 2);
      const inMinute = Math.floor(Math.random() * 60);
      const outHour = 17 + Math.floor(Math.random() * 2);
      const outMinute = Math.floor(Math.random() * 60);

      return {
        workerId: worker.id,
        workerName: worker.name,
        phoneNumber: worker.phone_number,
        organizationId: worker.organization_id,
        photograph: worker.photograph,
        date: date,
        inTime: status !== 'absent' ? `${baseInHour.toString().padStart(2, '0')}:${inMinute.toString().padStart(2, '0')}` : '-',
        outTime: status !== 'absent' ? `${outHour.toString().padStart(2, '0')}:${outMinute.toString().padStart(2, '0')}` : '-',
        status: status
      };
    });
  };

  const filterRecords = () => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.phoneNumber.includes(searchTerm)
      );
    }

    if (selectedOrganization !== 'all') {
      filtered = filtered.filter(record => record.organizationId === selectedOrganization);
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const handleDateChange = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = currentDate.toISOString().split('T')[0];
    setSelectedDate(newDate);

    if (attendanceRecords.length > 0) {
      const mockAttendance = generateMockAttendance(
        attendanceRecords.map(record => ({
          id: record.workerId,
          name: record.workerName,
          phone_number: record.phoneNumber,
          organization_id: record.organizationId,
          photograph: record.photograph,
        } as Worker)),
        newDate
      );
      setAttendanceRecords(mockAttendance);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Present</span>;
      case 'absent':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Absent</span>;
      case 'half-day':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Half Day</span>;
      default:
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Daily Attendance</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and track worker attendance records
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    const mockAttendance = generateMockAttendance(
                      attendanceRecords.map(record => ({
                        id: record.workerId,
                        name: record.workerName,
                        phone_number: record.phoneNumber,
                        organization_id: record.organizationId,
                        photograph: record.photograph,
                      } as Worker)),
                      e.target.value
                    );
                    setAttendanceRecords(mockAttendance);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => handleDateChange(1)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">{formatDate(selectedDate)}</p>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Worker
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {userInfo?.is_jansathi && (
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Organization
              </label>
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : currentRecords.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedOrganization !== 'all'
                ? 'No records match your filters'
                : 'No attendance records found for this date'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Out Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRecords.map((record) => (
                    <tr key={`${record.workerId}-${record.date}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {record.photograph ? (
                              <img
                                src={record.photograph}
                                alt={record.workerName}
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{record.workerName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.inTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.outTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastRecord, filteredRecords.length)}</span> of{' '}
                      <span className="font-medium">{filteredRecords.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Currently showing mock attendance data. Actual attendance API integration is pending.
        </p>
      </div>
    </div>
  );
}
