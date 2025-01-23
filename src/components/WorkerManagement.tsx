import { useState, useEffect } from 'react';
import { ChevronRight, Search, Plus, Upload, History, Trash2, Pencil, User, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as WorkerAPI from '../api/workers';
import type { Worker, WorkersResponse } from '../api/workers';
import EditWorkerModal from './EditWorkerModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function WorkerManagement() {
  const navigate = useNavigate();
  const [workersData, setWorkersData] = useState<WorkersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWorkerId, setDeletingWorkerId] = useState<number | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isJansathi, setIsJansathi] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
    // Get isJansathi value from userInfo
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const { is_jansathi } = JSON.parse(userInfoStr);
      setIsJansathi(is_jansathi);
    }
  }, []);

  const fetchWorkers = async (url?: string) => {
    try {
      setLoading(true);
      const data = await WorkerAPI.getWorkers(url);
      setWorkersData(data);
      setCurrentUrl(url || null);
    } catch (error) {
      toast.error('Failed to fetch workers');
    } finally {
      setLoading(false);
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
      fetchWorkers(currentUrl || undefined);
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
    fetchWorkers(currentUrl || undefined);
    setEditingWorker(null);
  };

  const handleRowClick = (workerId: number) => {
    navigate(`/workers/${workerId}`);
  };

  const handleNextPage = () => {
    if (workersData?.next) {
      const url = new URL(workersData.next);
      fetchWorkers(url.pathname + url.search);
    }
  };

  const handlePreviousPage = () => {
    if (workersData?.previous) {
      const url = new URL(workersData.previous);
      fetchWorkers(url.pathname + url.search);
    }
  };

  const filteredWorkers = workersData?.results.filter(worker => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      worker.name.toLowerCase().includes(searchLower) ||
      (worker.phone_number || '').includes(searchTerm) ||
      (worker.gender?.toLowerCase() || '').includes(searchLower)
    );
  }) || [];

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
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search workers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                        <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWorkers.map((worker) => (
                        <tr 
                          key={worker.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRowClick(worker.id)}
                        >
                          <td className="px-3 py-4">
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
                          <td className="px-3 py-4">
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-500">{worker.age}</div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-500">{worker.gender}</div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="text-sm text-gray-500">{worker.phone_number}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditWorker(worker);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="Edit Worker"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(worker.id);
                                }}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                                title="Work History"
                              >
                                <History className="h-5 w-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorker(worker.id);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                title="Delete Worker"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredWorkers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                            No workers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {workersData && (workersData.next || workersData.previous) && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={handlePreviousPage}
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
                      onClick={handleNextPage}
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
                          onClick={handlePreviousPage}
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
                          onClick={handleNextPage}
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