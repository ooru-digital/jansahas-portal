import React, { useEffect, useState } from 'react';
import { Building2, UserRound, CheckSquare, Clock, XCircle, X, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getDashboardCounts, getRecentWorkDetails, getWorkHistoryDetail, DashboardCounts, WorkDetail, WorkHistoryDetail } from '../api/dashboard';
import { getAllSites, Site } from '../api/sites';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';

type ActiveView = "dashboard" | "workers" | "approvals" | "workers/add-worker";

interface DashboardProps {
  onNavigate: (view: ActiveView) => void;
}

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'sites';
  items: Array<Site>;
}

const WorkList = ({
  title,
  works,
  onWorkClick,
}: {
  title: string;
  works: WorkDetail[];
  icon: React.ElementType;
  colorClass: string;
  onWorkClick: (workId: number) => void;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{title}</h2>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sr-only sm:not-sr-only">
          <tr className="border-b">
            <th className="text-left pb-3 text-gray-600 font-medium w-16">Image</th>
            <th className="text-left pb-3 text-gray-600 font-medium">Worker</th>
            <th className="text-left pb-3 text-gray-600 font-medium hidden sm:table-cell">Work Name</th>
            <th className="text-left pb-3 text-gray-600 font-medium hidden md:table-cell">Created At</th>
            <th className="text-left pb-3 text-gray-600 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {works.map((work) => (
            <tr key={work.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onWorkClick(work.id)}>
              <td className="py-4 pr-4 align-top">
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
                <p className="text-xs text-gray-500 sm:hidden">
                  {work.work_name}
                </p>
                <p className="text-xs text-gray-500">
                  {work.site_name} - {work.organization_name}
                </p>
              </td>
              <td className="py-4 hidden sm:table-cell">
                <p className="text-sm text-gray-900">{work.work_name}</p>
              </td>
              <td className="py-4 hidden md:table-cell">
                <p className="text-sm text-gray-500">{new Date(work.created_at).toLocaleDateString("en-GB")}</p>
              </td>
              <td className="py-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    work.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : work.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
                </span>
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
const ListModal: React.FC<ListModalProps> = ({ isOpen, onClose, title, type, items }) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {type === "sites" ? (
                    <>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Site Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Organization
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Site Location
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Created At
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Location
                      </th>
                      <th
                        scope="col"
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Created At
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(item as Site).name}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item as Site).organization_name}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item as Site).location}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate((item as Site).created_at)}
                      </td>
                    </>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-4 text-center text-gray-500">
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
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [countsData, pendingData, approvedData, rejectedData] = await Promise.all([
        getDashboardCounts(),
        getRecentWorkDetails("pending"),
        getRecentWorkDetails("approved"),
        getRecentWorkDetails("rejected"),
      ])

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
      toast.error("Failed to fetch sites");
    }
  };

  const handleWorkClick = async (workId: number) => {
    try {
      const workHistory = await getWorkHistoryDetail(workId);
      setSelectedWorkHistory(workHistory);
    } catch (error) {
      toast.error("Failed to fetch work history details");
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
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={() => onNavigate('workers/add-worker')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Worker
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                    {counts?.pending_approval_count || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-600">Approved Works</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{counts?.approved_work_count || 0}</p>
                </div>
                <CheckSquare className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 flex-shrink-0" />
              </div>
            </div>

            {counts?.rejected_work_count !== undefined && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-sm font-medium text-gray-600">Total Rejections</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{counts.rejected_work_count}</p>
                  </div>
                  <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600 flex-shrink-0" />
                </div>
              </div>
            )}

            <button
              onClick={handleSitesClick}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Sites</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{counts?.total_sites || 0}</p>
                </div>
                <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 flex-shrink-0" />
              </div>
            </button>

            <button
              onClick={() => onNavigate("workers")}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Workers</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{counts?.total_workers || 0}</p>
                </div>
                <UserRound className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600 flex-shrink-0" />
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
            type="sites"
            items={sites}
          />

          {selectedWorkHistory && (
            <WorkHistoryDetailModal workHistory={selectedWorkHistory} onClose={() => setSelectedWorkHistory(null)} />
          )}
        </div>
      </div>
    </>
  );
}