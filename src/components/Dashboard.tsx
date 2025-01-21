import React, { useEffect, useState } from 'react';
import { Building2, Users, UserRound, CheckSquare, Clock, XCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getDashboardCounts, getRecentWorkDetails, getWorkHistoryDetail, DashboardCounts, WorkDetail, WorkHistoryDetail } from '../api/dashboard';
import { getAllSites, Site } from '../api/sites';
import { getOrganizations, Organization } from '../api/organizations';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';

type ActiveView = 'dashboard' | 'workers' | 'approvals';

interface DashboardProps {
  onNavigate: (view: ActiveView) => void;
}

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: Array<{ id: string; name: string; created_at: string }>;
}

const WorkList = ({ title, works, icon: Icon, colorClass, onWorkClick }: { 
  title: string;
  works: WorkDetail[];
  icon: React.ElementType;
  colorClass: string;
  onWorkClick: (workId: number) => void;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-2xl font-bold mb-6">{title}</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left pb-3 text-gray-600 font-medium">Image</th>
            <th className="text-left pb-3 text-gray-600 font-medium">Worker</th>
            <th className="text-left pb-3 text-gray-600 font-medium">Work Name</th>
            <th className="text-center pb-3 text-gray-600 font-medium">Created At</th>
            <th className="text-center pb-3 text-gray-600 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {works.map((work) => (
            <tr 
              key={work.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onWorkClick(work.id)}
            >
              <td className="py-4 pr-4">
                {work.photograph ? (
                  <img
                    src={work.photograph}
                    alt={work.worker_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserRound className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </td>
              <td className="py-4">
                <p className="font-medium text-gray-900">{work.worker_name}</p>
                <p className="text-xs text-gray-500">{work.site_name} - {work.organization_name}</p>
              </td>
              <td className="py-4">
                <p className="text-sm text-gray-900">{work.work_name}</p>
                <p className="text-xs text-gray-500">{work.work_type}</p>
              </td>
              <td className="py-4 text-center">
                <p className="text-sm text-gray-500">
                  {new Date(work.created_at).toLocaleDateString()}
                </p>
              </td>
              <td className="py-4">
                <div className="flex justify-center">
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                    work.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : work.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
          {works.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-500">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ListModal: React.FC<ListModalProps> = ({ isOpen, onClose, title, items }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [pendingWorks, setPendingWorks] = useState<WorkDetail[]>([]);
  const [approvedWorks, setApprovedWorks] = useState<WorkDetail[]>([]);
  const [rejectedWorks, setRejectedWorks] = useState<WorkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkHistory, setSelectedWorkHistory] = useState<WorkHistoryDetail | null>(null);
  const [showSitesModal, setShowSitesModal] = useState(false);
  const [showOrganizationsModal, setShowOrganizationsModal] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [countsData, pendingData, approvedData, rejectedData] = await Promise.all([
        getDashboardCounts(),
        getRecentWorkDetails('pending'),
        getRecentWorkDetails('approved'),
        getRecentWorkDetails('rejected')
      ]);

      setCounts(countsData);
      setPendingWorks(pendingData || []);
      setApprovedWorks(approvedData || []);
      setRejectedWorks(rejectedData || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSitesClick = async () => {
    try {
      const data = await getAllSites();
      setSites(data);
      setShowSitesModal(true);
    } catch (error) {
      toast.error('Failed to fetch sites');
    }
  };

  const handleOrganizationsClick = async () => {
    try {
      const data = await getOrganizations();
      setOrganizations(data);
      setShowOrganizationsModal(true);
    } catch (error) {
      toast.error('Failed to fetch organizations');
    }
  };

  const handleWorkClick = async (workId: number) => {
    try {
      const workHistory = await getWorkHistoryDetail(workId);
      setSelectedWorkHistory(workHistory);
    } catch (error) {
      toast.error('Failed to fetch work history details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts?.pending_approval_count || 0}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Approved Works</p>
                <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts?.approved_work_count || 0}</p>
              </div>
              <CheckSquare className="h-10 w-10 text-green-600 flex-shrink-0" />
            </div>
          </div>

          {counts?.total_rejections !== undefined && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Rejections</p>
                  <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts.total_rejections}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-600 flex-shrink-0" />
              </div>
            </div>
          )}

          <button
            onClick={handleSitesClick}
            className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts?.total_sites || 0}</p>
              </div>
              <Building2 className="h-10 w-10 text-blue-600 flex-shrink-0" />
            </div>
          </button>

          <button
            onClick={handleOrganizationsClick}
            className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts?.total_organizations || 0}</p>
              </div>
              <Building2 className="h-10 w-10 text-orange-600 flex-shrink-0" />
            </div>
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Authorized Signatories</p>
                <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts?.total_authorized_signatories || 0}</p>
              </div>
              <Users className="h-10 w-10 text-purple-600 flex-shrink-0" />
            </div>
          </div>

          <button
            onClick={() => onNavigate('workers')}
            className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-2xl font-bold text-gray-900 text-center mt-1">{counts?.total_workers || 0}</p>
              </div>
              <UserRound className="h-10 w-10 text-indigo-600 flex-shrink-0" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <WorkList
            title="Recent Pending Approvals"
            works={pendingWorks}
            icon={Clock}
            colorClass="text-yellow-600"
            onWorkClick={handleWorkClick}
          />
          <WorkList
            title="Recent Approved Works"
            works={approvedWorks}
            icon={CheckSquare}
            colorClass="text-green-600"
            onWorkClick={handleWorkClick}
          />
          <WorkList
            title="Recent Rejected Works"
            works={rejectedWorks}
            icon={XCircle}
            colorClass="text-red-600"
            onWorkClick={handleWorkClick}
          />
        </div>

        <ListModal
          isOpen={showSitesModal}
          onClose={() => setShowSitesModal(false)}
          title="All Sites"
          items={sites}
        />

        <ListModal
          isOpen={showOrganizationsModal}
          onClose={() => setShowOrganizationsModal(false)}
          title="All Organizations"
          items={organizations}
        />

        {selectedWorkHistory && (
          <WorkHistoryDetailModal
            workHistory={selectedWorkHistory}
            onClose={() => setSelectedWorkHistory(null)}
          />
        )}
      </div>
    </div>
  );
}