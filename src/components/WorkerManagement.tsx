import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Search, Plus, Upload, Trash2, Pencil, User, ChevronLeft, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import * as WorkerAPI from '../api/workers';
import type { Worker, WorkersResponse, WorkersQueryParams } from '../api/workers';
import EditWorkerModal from './EditWorkerModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const maskPhoneNumber = (phone: string) => {
  return phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3');
};

export default function WorkerManagement() {
  const navigate = useNavigate();
  const [workersData, setWorkersData] = useState<WorkersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem('workersSearchTerm') || '';
  });
  
  const searchTermRef = useRef(searchTerm);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWorkerId, setDeletingWorkerId] = useState<number | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isJansathi, setIsJansathi] = useState<boolean>(false);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<{
    gender: string;
    approvedDays: string;
    vcStatus: string;
  }>(() => {
    const savedFilters = sessionStorage.getItem('workersFilters');
    return savedFilters ? JSON.parse(savedFilters) : {
      gender: '',
      approvedDays: '',
      vcStatus: '',
    };
  });

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const { is_jansathi } = JSON.parse(userInfoStr);
      setIsJansathi(is_jansathi);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('workersFilters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem('workersSearchTerm', searchTerm);
  }, [searchTerm]);

  const buildQueryParams = useCallback((pageOffset: number = 0): WorkersQueryParams => {
    const params: WorkersQueryParams = {
      limit: 10,
      offset: pageOffset
    };

    if (searchTermRef.current.trim()) {
      params.search = searchTermRef.current.trim();
    }

    if (filters.gender) {
      params.gender = filters.gender as 'male' | 'female';
    }

    if (filters.approvedDays) {
      params.approved_worker_days = filters.approvedDays as 'lt_90' | 'gt_90';
    }

    if (filters.vcStatus) {
      params.vc_generated = filters.vcStatus === 'generated';
    }

    return params;
  }, [filters]);

  const fetchWorkers = useCallback(async (pageOffset?: number, isSearching: boolean = false) => {
    try {
      if (isSearching) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }

      const params = buildQueryParams(pageOffset);
      const data = await WorkerAPI.getWorkers(params);
      setWorkersData(data);
    } catch (error) {
      toast.error('Failed to fetch workers');
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [buildQueryParams]);

  const debouncedFetch = useCallback(
    debounce(() => {
      fetchWorkers(0, true);
    }, 300),
    [fetchWorkers]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    sessionStorage.setItem('workersSearchTerm', value);
    debouncedFetch();
  };

  const handleFilterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);

    try {
      setTableLoading(true);
      const params: WorkersQueryParams = {
        limit: 10,
        offset: 0
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (newFilters.gender) {
        params.gender = newFilters.gender as 'male' | 'female';
      }

      if (newFilters.approvedDays) {
        params.approved_worker_days = newFilters.approvedDays as 'lt_90' | 'gt_90';
      }

      if (newFilters.vcStatus) {
        params.vc_generated = newFilters.vcStatus === 'generated';
      }

      const data = await WorkerAPI.getWorkers(params);
      setWorkersData(data);
    } catch (error) {
      toast.error('Failed to fetch workers');
    } finally {
      setTableLoading(false);
    }
  };

  const clearFilters = async () => {
    sessionStorage.removeItem('workersSearchTerm');
    sessionStorage.removeItem('workersFilters');

    setSearchTerm('');
    setFilters({
      gender: '',
      approvedDays: '',
      vcStatus: '',
    });

    try {
      setTableLoading(true);
      const data = await WorkerAPI.getWorkers({ limit: 10, offset: 0 });
      setWorkersData(data);
    } catch (error) {
      toast.error('Failed to fetch workers');
    } finally {
      setTableLoading(false);
    }
  };

  const handleDeleteWorker = (workerId: number) => {
    setDeletingWorkerId(workerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingWorkerId) return;
    
    try {
      await WorkerAPI.deleteWorker(deletingWorkerId);
      fetchWorkers();
      toast.success('Worker deleted successfully');
    } catch (error) {
      toast.error('Failed to delete worker');
    } finally {
      setShowDeleteModal(false);
      setDeletingWorkerId(null);
    }
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
  };

  const handleWorkerUpdated = () => {
    fetchWorkers();
    setEditingWorker(null);
  };

  const handleRowClick = (workerId: number) => {
    navigate(`/workers/${workerId}`);
  };

  const togglePhoneVisibility = (workerId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newShowPhoneNumbers = new Set(showPhoneNumbers);
    if (newShowPhoneNumbers.has(workerId)) {
      newShowPhoneNumbers.delete(workerId);
    } else {
      newShowPhoneNumbers.add(workerId);
    }
    setShowPhoneNumbers(newShowPhoneNumbers);
  };

  async function handlePaginationClick(url: string) {
    try {
      const urlObj = new URL(url);
      const offset = parseInt(urlObj.searchParams.get('offset') || '0');
      fetchWorkers(offset, true);
    } catch (error) {
      toast.error('Failed to fetch workers');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="py-4 md:py-6 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Workers</h1>
              <div className="flex flex-col sm:flex-row gap-3">
                {!isJansathi && (
                  <button
                    onClick={() => navigate('/workers/add-in-bulk')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add in Bulk
                  </button>
                )}
                <button
                  onClick={() => navigate('/workers/add-worker')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Worker
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search workers..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <select
                      name="gender"
                      value={filters.gender}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>

                    <select
                      name="approvedDays"
                      value={filters.approvedDays}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Approved Work Days</option>
                      <option value="gt_90">Greater than 90 days</option>
                      <option value="lt_90">Less than 90 days</option>
                    </select>

                    <select
                      name="vcStatus"
                      value={filters.vcStatus}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">VC Status</option>
                      <option value="generated">VC Generated</option>
                      <option value="not_generated">VC Not Generated</option>
                    </select>

                    {(searchTerm || filters.gender || filters.approvedDays || filters.vcStatus) && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto relative">
                {tableLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Days</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workersData?.results.map((worker) => (
                        <tr 
                          key={worker.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(worker.id)}
                        >
                          <td className="px-4 py-3">
                            {worker.photograph ? (
                              <img
                                src={worker.photograph}
                                alt={worker.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500">{worker.age}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500">{worker.gender}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {worker.phone_number ? (
                                <>
                                  {showPhoneNumbers.has(worker.id) 
                                    ? worker.phone_number 
                                    : maskPhoneNumber(worker.phone_number)}
                                  <button
                                    onClick={(e) => togglePhoneVisibility(worker.id, e)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    {showPhoneNumbers.has(worker.id) ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                'N/A'
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500">
                              {worker.total_approved_work_days || 0}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditWorker(worker);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50"
                                title="Edit Worker"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorker(worker.id);
                                }}
                                className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                title="Delete Worker"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!workersData?.results.length && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                            No workers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {workersData && (workersData.next || workersData.previous) && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => workersData.previous && handlePaginationClick(workersData.previous)}
                      disabled={!workersData.previous}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        workersData.previous
                          ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => workersData.next && handlePaginationClick(workersData.next)}
                      disabled={!workersData.next}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        workersData.next
                          ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to{' '}
                        <span className="font-medium">{workersData.results.length}</span> of{' '}
                        <span className="font-medium">{workersData.count}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => workersData.previous && handlePaginationClick(workersData.previous)}
                          disabled={!workersData.previous}
                          className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium ${
                            workersData.previous
                              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <button
                          onClick={() => workersData.next && handlePaginationClick(workersData.next)}
                          disabled={!workersData.next}
                          className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium ${
                            workersData.next
                              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingWorker && (
        <EditWorkerModal
          worker={editingWorker}
          isOpen={!!editingWorker}
          onClose={() => setEditingWorker(null)}
          onWorkerUpdated={handleWorkerUpdated}
        />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingWorkerId(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Worker"
        message="Are you sure you want to delete this worker? This will also delete all their work history and cannot be undone."
      />
    </>
  );
}