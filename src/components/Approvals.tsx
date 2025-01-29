import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Check, X, User, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPendingApprovals, bulkUpdateApprovalStatus, getWorkHistoryDetail, WorkHistoryDetail, ApprovalsResponse } from '../api/dashboard';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';
import debounce from 'lodash/debounce';

export default function Approvals() {
  const [approvalsData, setApprovalsData] = useState<ApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingApproval, setProcessingApproval] = useState<number | null>(null);
  const [selectedApprovals, setSelectedApprovals] = useState<Set<number>>(new Set());
  const [processingBulk, setProcessingBulk] = useState(false);
  const [selectedWorkHistory, setSelectedWorkHistory] = useState<WorkHistoryDetail | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isJansathi, setIsJansathi] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApprovals();
    // Get isJansathi value from userInfo
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const { is_jansathi } = JSON.parse(userInfoStr);
      setIsJansathi(is_jansathi);
    }
  }, []);

  const fetchApprovals = async (url?: string, search?: string, isSearching = false) => {
    try {
      // Use tableLoading for search and pagination, main loading for initial load
      if (isSearching) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }

      let endpoint = url || "/approvals/?limit=10&offset=0";

      // Add search parameter if provided
      if (search) {
        endpoint += `${endpoint.includes("?") ? "&" : "?"}search=${encodeURIComponent(search)}`;
      }
      
      const data = await getPendingApprovals(endpoint);
      setApprovalsData(data);
      setError(null);
      setCurrentUrl(endpoint);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch approvals";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  const debouncedSearch = debounce((term: string) => {
    fetchApprovals(undefined, term, true);
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleApprovalAction = async (id: number, status: "approved" | "rejected") => {
    try {
      setProcessingApproval(id);
      const response = await bulkUpdateApprovalStatus([{ id, status }]);
      if (response.success.length > 0) {
        fetchApprovals(currentUrl || undefined);
        toast.success(`Work history ${status} successfully`);
      } else {
        toast.error(`Failed to ${status} work history`);
      }
    } catch (error) {
      toast.error(`Failed to ${status} work history`);
    } finally {
      setProcessingApproval(null);
    }
  };

  const handleBulkAction = async (status: "approved" | "rejected") => {
    if (selectedApprovals.size === 0) {
      toast.error("Please select at least one work history");
      return;
    }

    try {
      setProcessingBulk(true);
      const updates = Array.from(selectedApprovals).map((id) => ({ id, status }));
      const response = await bulkUpdateApprovalStatus(updates);

      if (response.success.length > 0) {
        fetchApprovals(currentUrl || undefined);
        setSelectedApprovals(new Set());
        toast.success(`Successfully ${status} ${response.success.length} work histories`);
      }

      if (response.failures.length > 0) {
        toast.error(`Failed to ${status} ${response.failures.length} work histories`);
      }
    } catch (error) {
      toast.error(`Failed to process bulk ${status}`);
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleNextPage = () => {
    if (approvalsData?.next) {
      const url = new URL(approvalsData.next);
      let endpoint = url.pathname + url.search;
      if (searchTerm) {
        endpoint += `${endpoint.includes("?") ? "&" : "?"}search=${encodeURIComponent(searchTerm)}`;
      }
      fetchApprovals(endpoint, undefined, true);
    }
  };

  const handlePreviousPage = () => {
    if (approvalsData?.previous) {
      const url = new URL(approvalsData.previous);
      let endpoint = url.pathname + url.search;
      if (searchTerm) {
        endpoint += `${endpoint.includes("?") ? "&" : "?"}search=${encodeURIComponent(searchTerm)}`;
      }
      fetchApprovals(endpoint, undefined, true);
    }
  };

  const toggleSelectAll = () => {
    if (!approvalsData) return;
    
    if (selectedApprovals.size === getSelectableApprovals().length) {
      setSelectedApprovals(new Set());
    } else {
      const selectableIds = getSelectableApprovals().map((approval) => approval.id);
      setSelectedApprovals(new Set(selectableIds));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedApprovals);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApprovals(newSelected);
  };

  const getSelectableApprovals = () => {
    return approvalsData?.results.filter((approval) => !approval.isJansathi) || [];
  };

  const handleRowClick = async (workId: number) => {
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
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Approvals</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchApprovals()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectableCount = getSelectableApprovals().length;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pending Approvals</h1>
            {!isJansathi && selectedApprovals.size > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-sm text-gray-600">{selectedApprovals.size} selected</span>
                <button
                  onClick={() => handleBulkAction("approved")}
                  disabled={processingBulk}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction("rejected")}
                  disabled={processingBulk}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <X className="h-5 w-5 mr-2" />
                  Reject Selected
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="relative w-full max-w-xs mx-auto sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                <input
                  type="text"
                  placeholder="Search approvals..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto relative">
              {tableLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Desktop view */}
              <table className="min-w-full divide-y divide-gray-200 hidden lg:table">
                <thead className="bg-gray-50">
                  <tr>
                    {!isJansathi && (
                      <th className="px-6 py-3 text-left">
                        {selectableCount > 0 && (
                          <input
                            type="checkbox"
                            checked={selectedApprovals.size === selectableCount && selectableCount > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Photo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Worker
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Work Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Organization
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Site
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Start Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Working Days
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created At
                    </th>
                    {!isJansathi && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvalsData?.results.map((approval) => (
                    <tr
                      key={approval.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(approval.id)}
                    >
                      {!isJansathi && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {!approval.isJansathi && (
                            <input
                              type="checkbox"
                              checked={selectedApprovals.has(approval.id)}
                              onChange={() => toggleSelect(approval.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {approval.photograph ? (
                          <img
                            src={approval.photograph}
                            alt={approval.worker_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{approval.worker_name}</div>
                        <div className="text-sm text-gray-500">{approval.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{approval.work_name}</div>
                        <div className="text-sm text-gray-500">{approval.work_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{approval.organization_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{approval.site_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(approval.start_date).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{approval.number_of_working_days || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(approval.created_at).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      {!isJansathi && (
                        <td
                          className="px-6 py-4 whitespace-nowrap text-right space-x-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!approval.isJansathi && (
                            <>
                              <button
                                onClick={() => handleApprovalAction(approval.id, "approved")}
                                disabled={processingApproval === approval.id}
                                className={`text-green-600 hover:text-green-900 ${processingApproval === approval.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                title="Approve"
                              >
                                <CheckCircle2 className="h-5 w-5 inline" />
                              </button>
                              <button
                                onClick={() => handleApprovalAction(approval.id, "rejected")}
                                disabled={processingApproval === approval.id}
                                className={`text-red-600 hover:text-red-900 ${processingApproval === approval.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                title="Reject"
                              >
                                <XCircle className="h-5 w-5 inline" />
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile and Tablet view */}
              <div className="lg:hidden">
                {approvalsData?.results.map((approval) => (
                  <div
                    key={approval.id}
                    className="bg-white shadow-sm rounded-lg mb-2 p-3 cursor-pointer"
                    onClick={() => handleRowClick(approval.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {!isJansathi && (
                          <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                            {!approval.isJansathi && (
                              <input
                                type="checkbox"
                                checked={selectedApprovals.has(approval.id)}
                                onChange={() => toggleSelect(approval.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                          </div>
                        )}
                        {approval.photograph ? (
                          <img
                            src={approval.photograph || "/placeholder.svg"}
                            alt={approval.worker_name}
                            className="h-8 w-8 rounded-full object-cover mr-2"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{approval.worker_name}</div>
                          <div className="text-xs text-gray-500">{approval.location}</div>
                        </div>
                      </div>
                      {!isJansathi && !approval.isJansathi && (
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleApprovalAction(approval.id, "approved")}
                            disabled={processingApproval === approval.id}
                            className={`text-green-600 hover:text-green-900 ${
                              processingApproval === approval.id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Approve"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleApprovalAction(approval.id, "rejected")}
                            disabled={processingApproval === approval.id}
                            className={`text-red-600 hover:text-red-900 ${
                              processingApproval === approval.id ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title="Reject"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      <div>
                        <span className="font-medium">Work:</span> {approval.work_name}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {approval.work_type}
                      </div>
                      <div>
                        <span className="font-medium">Organization:</span> {approval.organization_name}
                      </div>
                      <div>
                        <span className="font-medium">Site:</span> {approval.site_name}
                      </div>
                      <div>
                        <span className="font-medium">Start Date:</span>{" "}
                        {new Date(approval.start_date).toLocaleDateString("en-GB")}
                      </div>
                      <div>
                        <span className="font-medium">Working Days:</span> {approval.number_of_working_days || 0}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(approval.created_at).toLocaleDateString("en-GB")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!approvalsData?.results.length && (
                <div className="text-center py-8 text-gray-500">No pending approvals</div>
              )}
            </div>

            {/* Pagination */}
            {approvalsData && (approvalsData.next || approvalsData.previous) && (
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={handlePreviousPage}
                      disabled={!approvalsData.previous}
                      className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium ${
                        approvalsData.previous
                          ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          : "text-gray-500 bg-gray-100 cursor-not-allowed"
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {Math.floor(approvalsData.results.length / 10) + 1} of {Math.ceil(approvalsData.count / 10)}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={!approvalsData.next}
                      className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium ${
                        approvalsData.next
                          ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          : "text-gray-500 bg-gray-100 cursor-not-allowed"
                      }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to{" "}
                        <span className="font-medium">{approvalsData.results.length}</span> of{" "}
                        <span className="font-medium">{approvalsData.count}</span> results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={handlePreviousPage}
                          disabled={!approvalsData.previous}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            approvalsData.previous
                              ? "text-gray-500 hover:bg-gray-50"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={!approvalsData.next}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            approvalsData.next ? "text-gray-500 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedWorkHistory && (
        <WorkHistoryDetailModal workHistory={selectedWorkHistory} onClose={() => setSelectedWorkHistory(null)} />
      )}
    </>
  );
}