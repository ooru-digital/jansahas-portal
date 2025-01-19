import React, { useEffect, useState } from 'react';
import { Building2, Users, UserRound, CheckSquare, Clock, XCircle, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getDashboardCounts, getRecentWorkDetails, DashboardCounts, WorkDetail } from '../api/dashboard';

interface WorkListProps {
  title: string;
  works: WorkDetail[];
  icon: React.ElementType;
  colorClass: string;
}

export default function Dashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [pendingWorks, setPendingWorks] = useState<WorkDetail[]>([]);
  const [approvedWorks, setApprovedWorks] = useState<WorkDetail[]>([]);
  const [rejectedWorks, setRejectedWorks] = useState<WorkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [countsData, pendingData, approvedData, rejectedData] = await Promise.all([
          getDashboardCounts(),
          getRecentWorkDetails('pending'),
          getRecentWorkDetails('approved'),
          getRecentWorkDetails('rejected')
        ]);

        if (mounted) {
          setCounts(countsData);
          setPendingWorks(pendingData);
          setApprovedWorks(approvedData);
          setRejectedWorks(rejectedData);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const WorkList: React.FC<WorkListProps> = ({ title, works = [], icon: Icon, colorClass }) => (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{title}</h2>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="border-b">
                <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-600">Image</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-600">Worker</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-600">Work Name</th>
                <th scope="col" className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-600">Created At</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {works.map((work) => (
                <tr key={work.id} className="hover:bg-gray-50">
                  <td className="hidden md:table-cell px-3 py-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full"></div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900">{work.worker}</p>
                      <p className="text-xs text-gray-500 mt-1">{work.site}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-sm text-gray-900">{work.work_name}</p>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-4">
                    <p className="text-sm text-gray-600">{formatDate(work.created_at)}</p>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      work.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : work.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
                    </span>
                    <span className="block sm:hidden text-xs text-gray-500 mt-1">
                      {formatDate(work.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
              {works.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-gray-500 text-sm">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{counts?.pending_approval_count || 0}</p>
              </div>
              <Clock className="h-8 w-8 md:h-10 md:w-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Works</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{counts?.approved_work_count || 0}</p>
              </div>
              <CheckSquare className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{counts?.total_sites || 0}</p>
              </div>
              <Building2 className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Authorized Signatories</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{counts?.total_authorized_signatories || 0}</p>
              </div>
              <Users className="h-8 w-8 md:h-10 md:w-10 text-purple-600" />
            </div>
          </div>

          <button
            onClick={() => onNavigate('workers')}
            className="bg-white rounded-xl shadow-sm p-4 md:p-6 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{counts?.total_workers || 0}</p>
              </div>
              <UserRound className="h-8 w-8 md:h-10 md:w-10 text-indigo-600" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <WorkList
            title="Recent Pending Approvals"
            works={pendingWorks}
            icon={Clock}
            colorClass="text-yellow-600"
          />
          <WorkList
            title="Recent Approved Works"
            works={approvedWorks}
            icon={CheckSquare}
            colorClass="text-green-600"
          />
          <WorkList
            title="Recent Rejected Works"
            works={rejectedWorks}
            icon={XCircle}
            colorClass="text-red-600"
          />
        </div>
      </div>
    </div>
  );
}