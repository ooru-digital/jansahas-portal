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
    const savedFilters = sessionStorage.getItem("workersFilters");
    return savedFilters
      ? JSON.parse(savedFilters)
      : {
          gender: "",
          approvedDays: "",
          vcStatus: "",
        };
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      const { is_jansathi } = JSON.parse(userInfoStr);
      setIsJansathi(is_jansathi);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("workersFilters", JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    sessionStorage.setItem("workersSearchTerm", searchTerm);
  }, [searchTerm]);

  const buildQueryParams = useCallback((pageOffset = 0, currentFilters = filters): WorkersQueryParams => {
    const params: WorkersQueryParams = {
      limit: 10,
      offset: pageOffset,
    }

    if (searchTermRef.current.trim()) {
      params.search = searchTermRef.current.trim();
    }

    if (currentFilters.gender) {
      params.gender = currentFilters.gender as "male" | "female";
    }

    if (currentFilters.approvedDays) {
      params.approved_worker_days = currentFilters.approvedDays as "lt_90" | "gt_90";
    }

    if (currentFilters.vcStatus) {
      params.vc_generated = currentFilters.vcStatus === "generated";
    }

    return params;
  }, []);

  const fetchWorkers = useCallback(
    async (page = 1, isSearching = false) => {
      try {
        if (isSearching) {
          setTableLoading(true);
        } else {
          setLoading(true);
        }

        const params = buildQueryParams((page - 1) * 10, filters);
        const data = await WorkerAPI.getWorkers(params);
        setWorkersData(data);
        setCurrentPage(page);
      } catch (error) {
        toast.error("Failed to fetch workers");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [buildQueryParams, filters],
  );

  const debouncedFetch = useCallback(
    debounce(() => {
      fetchWorkers(1, true);
    }, 300),
    [fetchWorkers],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    sessionStorage.setItem("workersSearchTerm", value);
    debouncedFetch();
  };

  const handleFilterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const newFilters = {
      ...filters,
      [name]: value,
    };
    setFilters(newFilters);

    setCurrentPage(1);
    setTableLoading(true);

    try {
      const params = buildQueryParams(0, newFilters);
      const data = await WorkerAPI.getWorkers(params);
      setWorkersData(data);
    } catch (error) {
      toast.error("Failed to fetch workers");
    } finally {
      setTableLoading(false);
    }
  };

  const clearFilters = async () => {
    sessionStorage.removeItem("workersSearchTerm");
    sessionStorage.removeItem("workersFilters");

    setSearchTerm("");
    setFilters({
      gender: "",
      approvedDays: "",
      vcStatus: "",
    });
    setCurrentPage(1)

    try {
      setTableLoading(true);
      const data = await WorkerAPI.getWorkers({ limit: 10, offset: 0 });
      setWorkersData(data);
    } catch (error) {
      toast.error("Failed to fetch workers");
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
      toast.success("Worker deleted successfully");
    } catch (error) {
      toast.error("Failed to delete worker");
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
      const offset = Number.parseInt(urlObj.searchParams.get("offset") || "0");
      const page = Math.floor(offset / 10) + 1;
      fetchWorkers(page, true);
    } catch (error) {
      toast.error("Failed to fetch workers");
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Workers</h1>
              <div className="flex flex-col sm:flex-row gap-3">
                {!isJansathi && (
                  <button
                    onClick={() => navigate("/workers/add-in-bulk")}
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Add in Bulk
                  </button>
                )}
                <button
                  onClick={() => navigate("/workers/add-worker")}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Worker
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-64">
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

                {/* Desktop view (table) */}
                <div className="hidden lg:block min-w-full">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Days</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
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
                                src={worker.photograph || "/placeholder.svg"}
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
                                "NA"
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500">{worker.total_approved_work_days || 0}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-500">{worker.created_by || "NA"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditWorker(worker)
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
                    </tbody>
                  </table>
                </div>

                {/* Mobile and Tablet view (cards) */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-1 gap-2 p-2">
                    {" "}
                    {/* Updated grid class */}
                    {workersData?.results.map((worker) => (
                      <div
                        key={worker.id}
                        className="bg-white shadow rounded-md overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                        onClick={() => handleRowClick(worker.id)}
                      >
                        <div className="p-3 flex items-center space-x-3">
                          {" "}
                          {/* Updated padding and spacing */}
                          {worker.photograph ? (
                            <img
                              src={worker.photograph || "/placeholder.svg"}
                              alt={worker.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate">{worker.name}</p>
                                <p className="text-xs text-gray-500">
                                  {worker.gender}, {worker.age} yrs | Days: {worker.total_approved_work_days || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Created by: {worker.created_by || "NA"}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditWorker(worker)
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                  title="Edit Worker"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteWorker(worker.id)
                                  }}
                                  className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                  title="Delete Worker"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              {worker.phone_number ? (
                                <>
                                  {showPhoneNumbers.has(worker.id)
                                    ? worker.phone_number
                                    : maskPhoneNumber(worker.phone_number)}
                                  <button
                                    onClick={(e) => togglePhoneVisibility(worker.id, e)}
                                    className="ml-1 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPhoneNumbers.has(worker.id) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                "N/A"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!workersData?.results.length && <div className="text-center py-8 text-gray-500">No workers found</div>}
              </div>

              {workersData && (workersData.next || workersData.previous) && (
                <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => workersData.previous && handlePaginationClick(workersData.previous)}
                        disabled={!workersData.previous}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                          workersData.previous
                            ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            : "text-gray-400 bg-gray-100 cursor-not-allowed"
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => workersData.next && handlePaginationClick(workersData.next)}
                        disabled={!workersData.next}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                          workersData.next
                            ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            : "text-gray-400 bg-gray-100 cursor-not-allowed"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">
                            {workersData.results.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
                          </span>{" "}
                          to <span className="font-medium">{(currentPage - 1) * 10 + workersData.results.length}</span>{" "}
                          of <span className="font-medium">{workersData.count}</span> results
                        </p>
                      </div>
                      <div>
                        <nav
                          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() => workersData.previous && handlePaginationClick(workersData.previous)}
                            disabled={!workersData.previous}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                              !workersData.previous && "cursor-not-allowed"
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => workersData.next && handlePaginationClick(workersData.next)}
                            disabled={!workersData.next}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                              !workersData.next && "cursor-not-allowed"
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