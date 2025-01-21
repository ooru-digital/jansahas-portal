import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckSquare, XCircle, Pencil, Trash2, Award, User, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as WorkHistoryAPI from '../api/workHistory';
import * as OrganizationsAPI from '../api/organizations';
import { getWorkHistoryDetail } from '../api/dashboard';
import type { WorkHistory, WorkHistoryResponse, CreateWorkHistoryData } from '../api/workHistory';
import type { Organization, Site } from '../api/organizations';
import type { WorkHistoryDetail } from '../api/dashboard';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';

interface WorkHistoryViewProps {
  workerId: number;
  onBack: () => void;
}

export default function WorkHistoryView({ workerId, onBack }: WorkHistoryViewProps) {
  const [workHistoryData, setWorkHistoryData] = useState<WorkHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHistory, setEditingHistory] = useState<WorkHistory | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedWorkHistory, setSelectedWorkHistory] = useState<WorkHistoryDetail | null>(null);
  const [formData, setFormData] = useState<CreateWorkHistoryData>({
    worker_id: workerId,
    work_name: '',
    work_type: '',
    location: '',
    start_date: '',
    end_date: '',
    site_id: '',
    organization_id: '',
    avg_daily_wages: 0,
  });

  useEffect(() => {
    fetchWorkHistory();
    fetchOrganizations();
  }, [workerId]);

  const fetchWorkHistory = async () => {
    try {
      setLoading(true);
      const response = await WorkHistoryAPI.getWorkerWorkHistory(workerId);
      setWorkHistoryData(response);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch work history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const data = await OrganizationsAPI.getOrganizations();
      setOrganizations(data);
    } catch (error) {
      toast.error('Failed to fetch organizations');
    }
  };

  useEffect(() => {
    if (formData.organization_id) {
      fetchSites(formData.organization_id);
    }
  }, [formData.organization_id]);

  const fetchSites = async (organizationId: string) => {
    try {
      const data = await OrganizationsAPI.getSitesByOrganization(organizationId);
      setSites(data);
    } catch (error) {
      toast.error('Failed to fetch sites');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHistory) {
        await WorkHistoryAPI.updateWorkHistory(editingHistory.id, formData);
        toast.success('Work history updated successfully');
      } else {
        await WorkHistoryAPI.createWorkHistory(formData);
        toast.success('Work history added successfully');
      }
      fetchWorkHistory();
      setShowForm(false);
      setEditingHistory(null);
      setFormData({
        worker_id: workerId,
        work_name: '',
        work_type: '',
        location: '',
        start_date: '',
        end_date: '',
        site_id: '',
        organization_id: '',
        avg_daily_wages: 0,
      });
    } catch (error) {
      toast.error(editingHistory ? 'Failed to update work history' : 'Failed to add work history');
    }
  };

  const handleViewWorkHistoryDetail = async (workHistoryId: number) => {
    try {
      const detail = await getWorkHistoryDetail(workHistoryId);
      setSelectedWorkHistory(detail);
    } catch (error) {
      toast.error('Failed to fetch work history details');
    }
  };

  const handleDeleteWorkHistory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this work history?')) return;
    
    try {
      await WorkHistoryAPI.deleteWorkHistory(id);
      fetchWorkHistory();
      toast.success('Work history deleted successfully');
    } catch (error) {
      toast.error('Failed to delete work history');
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
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Work History</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchWorkHistory}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!workHistoryData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="py-4 px-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Workers
          </button>
        </div>
      </div>

      <div className="py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Worker Details</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Work History
              </button>
              {workHistoryData.total_no_of_approved_working_days >= 90 && (
                <button
                  onClick={() => WorkHistoryAPI.generateVC(workerId)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Award className="h-5 w-5" />
                  Generate VC
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Worker Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                {workHistoryData.photograph ? (
                  <img
                    src={workHistoryData.photograph}
                    alt={workHistoryData.worker_name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{workHistoryData.worker_name}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="text-sm font-medium text-gray-900">{workHistoryData.age || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-sm font-medium text-gray-900">{workHistoryData.sex || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Present Address</p>
                  <p className="text-sm font-medium text-gray-900">{workHistoryData.present_address || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Permanent Address</p>
                  <p className="text-sm font-medium text-gray-900">{workHistoryData.permanent_address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Working Days Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Days Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Working Days</p>
                  <p className="text-2xl font-bold text-gray-900">{workHistoryData.total_number_of_working_days || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approved Days</p>
                  <p className="text-2xl font-bold text-green-600">{workHistoryData.total_no_of_approved_working_days || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Work History Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Work History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workHistoryData.data?.map((history) => (
                    <tr 
                      key={history.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewWorkHistoryDetail(history.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{history.work_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{history.work_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{history.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(history.start_date).toLocaleDateString()} - {new Date(history.end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{history.number_of_working_days}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          history.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : history.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {history.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingHistory(history);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkHistory(history.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!workHistoryData.data?.length && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No work history found
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
    </div>
  );
}