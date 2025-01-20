import React, { useEffect, useState } from 'react';
import { Building2, Users, UserRound, CheckSquare, Clock, XCircle, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getDashboardCounts, getRecentWorkDetails, getWorkHistoryDetail, DashboardCounts, WorkDetail, WorkHistoryDetail } from '../api/dashboard';
import { getAllSites, Site } from '../api/sites';
import { getOrganizations, Organization } from '../api/organizations';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';

const WorkList = ({ title, works, icon: Icon, colorClass, onWorkClick }: { 
  title: string;
  works: WorkDetail[];
  icon: React.ElementType;
  colorClass: string;
  onWorkClick?: (workId: number) => void;
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
            <th className="text-left pb-3 text-gray-600 font-medium">Created At</th>
            <th className="text-left pb-3 text-gray-600 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {works.map((work) => (
            <tr 
              key={work.id} 
              className={`hover:bg-gray-50 ${onWorkClick ? 'cursor-pointer' : ''}`}
              onClick={() => onWorkClick?.(work.id)}
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
              <td className="py-4">
                <p className="text-sm text-gray-500">
                  {new Date(work.created_at).toLocaleDateString()}
                </p>
              </td>
              <td className="py-4">
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  work.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : work.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
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

export default function Dashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [pendingWorks, setPendingWorks] = useState<WorkDetail[]>([]);
  const [approvedWorks, setApprovedWorks] = useState<WorkDetail[]>([]);
  const [rejectedWorks, setRejectedWorks] = useState<WorkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showSites, setShowSites] = useState(false);
  const [showOrganizations, setShowOrganizations] = useState(false);
  const [selectedWorkHistory, setSelectedWorkHistory] = useState<WorkHistoryDetail | null>(null);

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

  const handleSitesClick = async () => {
    try {
      const sitesData = await getAllSites();
      setSites(sitesData);
      setShowSites(true);
      setShowOrganizations(false);
    } catch (error) {
      toast.error('Failed to fetch sites');
    }
  };

  const handleOrganizationsClick = async () => {
    try {
      const organizationsData = await getOrganizations();
      setOrganizations(organizationsData);
      setShowOrganizations(true);
      setShowSites(false);
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
            onClick={() => window.location.reload()}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{counts?.pending_approval_count || 0}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Works</p>
                <p className="text-2xl font-bold text-gray-900">{counts?.approved_work_count || 0}</p>
              </div>
              <CheckSquare className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <button
            onClick={handleSitesClick}
            className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sites</p>
                <p className="text-2xl font-bold text-gray-900">{counts?.total_sites || 0}</p>
              </div>
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>
          </button>

          <button
            onClick={handleOrganizationsClick}
            className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{counts?.total_organizations || 0}</p>
              </div>
              <Building className="h-10 w-10 text-orange-600" />
            </div>
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Authorized Signatories</p>
                <p className="text-2xl font-bold text-gray-900">{counts?.total_authorized_signatories || 0}</p>
              </div>
              <Users className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          <button
            onClick={() => onNavigate('workers')}
            className="bg-white rounded-xl shadow-sm p-6 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-2xl font-bold text-gray-900">{counts?.total_workers || 0}</p>
              </div>
              <UserRound className="h-10 w-10 text-indigo-600" />
            </div>
          </button>
        </div>

        {showSites && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Sites</h2>
              <button
                onClick={() => setShowSites(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 text-gray-600 font-medium">Name</th>
                    <th className="text-left pb-3 text-gray-600 font-medium">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{site.name}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(site.created_at).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {sites.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        No sites found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showOrganizations && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Organizations</h2>
              <button
                onClick={() => setShowOrganizations(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 text-gray-600 font-medium">Name</th>
                    <th className="text-left pb-3 text-gray-600 font-medium">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <p className="font-medium text-gray-900">{org.name}</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(org.created_at).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                  {organizations.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        No organizations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!showSites && !showOrganizations && (
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
            />
            <WorkList
              title="Recent Rejected Works"
              works={rejectedWorks}
              icon={XCircle}
              colorClass="text-red-600"
            />
          </div>
        )}

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