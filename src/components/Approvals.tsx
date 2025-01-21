import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Check, X, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPendingApprovals, bulkUpdateApprovalStatus, getWorkHistoryDetail, WorkDetail, WorkHistoryDetail } from '../api/dashboard';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';

export default function Approvals() {
  const [pendingApprovals, setPendingApprovals] = useState<WorkDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingApproval, setProcessingApproval] = useState<number | null>(null);
  const [selectedApprovals, setSelectedApprovals] = useState<Set<number>>(new Set());
  const [processingBulk, setProcessingBulk] = useState(false);
  const [selectedWorkHistory, setSelectedWorkHistory] = useState<WorkHistoryDetail | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const data = await getPendingApprovals();
      setPendingApprovals(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch approvals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      setProcessingApproval(id);
      const response = await bulkUpdateApprovalStatus([{ id, status }]);
      if (response.success.length > 0) {
        setPendingApprovals(prevApprovals => prevApprovals.filter(approval => approval.id !== id));
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

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (selectedApprovals.size === 0) {
      toast.error('Please select at least one work history');
      return;
    }

    try {
      setProcessingBulk(true);
      const updates = Array.from(selectedApprovals).map(id => ({ id, status }));
      const response = await bulkUpdateApprovalStatus(updates);

      if (response.success.length > 0) {
        const successIds = new Set(response.success.map(item => item.id));
        setPendingApprovals(prevApprovals => 
          prevApprovals.filter(approval => !successIds.has(approval.id))
        );
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

  const toggleSelectAll = () => {
    if (selectedApprovals.size === getSelectableApprovals().length) {
      setSelectedApprovals(new Set());
    } else {
      const selectableIds = getSelectableApprovals().map(approval => approval.id);
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
    return pendingApprovals.filter(approval => !approval.isJansathi);
  };

  const handleRowClick = async (workId: number) => {
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
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Approvals</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchApprovals}
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
            {selectedApprovals.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedApprovals.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction('approved')}
                  disabled={processingBulk}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Approve Selected
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  disabled={processingBulk}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-5 w-5 mr-2" />
                  Reject Selected
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Details</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApprovals.map((approval) => (
                    <tr 
                      key={approval.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(approval.id)}
                    >
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        {!approval.isJansathi && (
                          <input
                            type="checkbox"
                            checked={selectedApprovals.has(approval.id)}
                            onChange={() => toggleSelect(approval.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
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
                        <div className="text-sm text-gray-500">{approval.site}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(approval.start_date).toLocaleDateString()} - {new Date(approval.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{approval.number_of_working_days || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {approval.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-3" onClick={e => e.stopPropagation()}>
                        {!approval.isJansathi && (
                          <>
                            <button
                              onClick={() => handleApprovalAction(approval.id, 'approved')}
                              disabled={processingApproval === approval.id}
                              className={`text-green-600 hover:text-green-900 ${processingApproval === approval.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-5 w-5 inline" />
                            </button>
                            <button
                              onClick={() => handleApprovalAction(approval.id, 'rejected')}
                              disabled={processingApproval === approval.id}
                              className={`text-red-600 hover:text-red-900 ${processingApproval === approval.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Reject"
                            >
                              <XCircle className="h-5 w-5 inline" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        No pending approvals
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {selectedWorkHistory && (
        <WorkHistoryDetailModal
          workHistory={selectedWorkHistory}
          onClose={() => setSelectedWorkHistory(null)}
        />
      )}
    </>
  );
}