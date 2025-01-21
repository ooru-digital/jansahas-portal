import React, { useState, useEffect } from 'react';
import { X, Check, Award, Trash2, Pencil, Calendar, MapPin, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as WorkHistoryAPI from '../api/workHistory';
import * as OrganizationsAPI from '../api/organizations';
import type { WorkHistory, WorkHistoryResponse, CreateWorkHistoryData } from '../api/workHistory';
import type { Organization, Site } from '../api/organizations';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

interface WorkHistoryModalProps {
  workerId: number;
  onClose: () => void;
}

export default function WorkHistoryModal({ workerId, onClose }: WorkHistoryModalProps) {
  const [workHistoryData, setWorkHistoryData] = useState<WorkHistoryResponse | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHistory, setEditingHistory] = useState<WorkHistory | null>(null);
  const [formData, setFormData] = useState<CreateWorkHistoryData>({
    worker_id: workerId,
    work_name: '',
    work_type: '',
    location: '',
    start_date: '',
    end_date: '',
    site_id: '',
    organization_id: '',
    avg_daily_wages: 0
  });

  useEffect(() => {
    fetchWorkHistory();
    fetchOrganizations();
  }, [workerId]);

  useEffect(() => {
    if (formData.organization_id) {
      fetchSites(formData.organization_id);
    } else {
      setSites([]);
    }
  }, [formData.organization_id]);

  const fetchWorkHistory = async () => {
    try {
      const response = await WorkHistoryAPI.getWorkerWorkHistory(workerId);
      setWorkHistoryData(response);
    } catch (error) {
      toast.error('Failed to fetch work history');
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

  const fetchSites = async (organizationId: string) => {
    try {
      const data = await OrganizationsAPI.getSitesByOrganization(organizationId);
      setSites(data);
    } catch (error) {
      toast.error('Failed to fetch sites');
      setSites([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'avg_daily_wages' ? parseFloat(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      worker_id: workerId,
      work_name: '',
      work_type: '',
      location: '',
      start_date: '',
      end_date: '',
      site_id: '',
      organization_id: '',
      avg_daily_wages: 0
    });
    setEditingHistory(null);
    setShowForm(false);
    setSites([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHistory) {
        await WorkHistoryAPI.updateWorkHistory(editingHistory.id, formData);
        toast.success('Work history updated successfully');
      } else {
        await WorkHistoryAPI.createWorkHistory(formData);
        toast.success('Work history created successfully');
      }
      fetchWorkHistory();
      resetForm();
    } catch (error) {
      toast.error(editingHistory ? 'Failed to update work history' : 'Failed to create work history');
    }
  };

  const handleEdit = (history: WorkHistory) => {
    setEditingHistory(history);
    setFormData({
      ...history,
      worker_id: workerId,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this work history?')) return;
    
    try {
      await WorkHistoryAPI.deleteWorkHistory(id);
      fetchWorkHistory();
      toast.success('Work history deleted successfully');
    } catch (error) {
      toast.error('Failed to delete work history');
    }
  };

  const handleGenerateVC = async () => {
    try {
      await WorkHistoryAPI.generateVC(workerId);
      toast.success('Verifiable Credential generated successfully');
    } catch (error) {
      toast.error('Failed to generate Verifiable Credential');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              {workHistoryData?.worker_name}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {workHistoryData?.total_no_of_approved_working_days && 
             workHistoryData.total_no_of_approved_working_days >= 90 && (
              <button
                onClick={handleGenerateVC}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Award className="h-5 w-5" />
                Generate VC
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Worker Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Present Address</span>
              </div>
              <p className="text-gray-800">{workHistoryData?.present_address}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Permanent Address</span>
              </div>
              <p className="text-gray-800">{workHistoryData?.permanent_address}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Working Days</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{workHistoryData?.total_number_of_working_days || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-xl font-bold text-green-600">{workHistoryData?.total_no_of_approved_working_days || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              Add Work History
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <select
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <select
                    name="site_id"
                    value={formData.site_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!formData.organization_id}
                  >
                    <option value="">Select Site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Name</label>
                  <input
                    type="text"
                    name="work_name"
                    value={formData.work_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                  <select
                    name="work_type"
                    value={formData.work_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Work Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Daily Wages (₹)</label>
                  <input
                    type="number"
                    name="avg_daily_wages"
                    value={formData.avg_daily_wages}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Check className="h-5 w-5" />
                  {editingHistory ? 'Update' : 'Add'} Work History
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Wages</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workHistoryData?.data.map((history) => (
                    <tr key={history.id} className="hover:bg-gray-50">
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
                          {formatDate(history.start_date)} - {formatDate(history.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{history.number_of_working_days}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{history.avg_daily_wages}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(history.status || '')}`}>
                            {history.status || 'N/A'}
                          </span>
                          {(history.status === 'approved' || history.status === 'rejected') && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {history.status === 'approved' && history.approved_date && (
                                <span>{formatDate(history.approved_date)}</span>
                              )}
                              {history.status === 'rejected' && history.rejected_date && (
                                <span>{formatDate(history.rejected_date)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(history)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(history.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!workHistoryData?.data.length && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
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
    </div>
  );
}