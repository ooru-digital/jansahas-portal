import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, Plus, FileUp, History, Trash2, Pencil } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import * as WorkerAPI from '../api/workers';
import type { Worker } from '../api/workers';
import WorkHistoryModal from './WorkHistoryModal';
import BulkUpload from './BulkUpload';
import AddWorker from './AddWorker';
import EditWorkerModal from './EditWorkerModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWorkerId, setDeletingWorkerId] = useState<number | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const data = await WorkerAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      toast.error('Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerAdded = () => {
    fetchWorkers();
    setShowAddWorker(false);
  };

  const handleDeleteWorker = (workerId: number) => {
    setDeletingWorkerId(workerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingWorkerId) return;
    
    try {
      await WorkerAPI.deleteWorker(deletingWorkerId);
      setWorkers(workers.filter(worker => worker.id !== deletingWorkerId));
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

  const filteredWorkers = workers.filter(worker => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (worker.name?.toLowerCase() || '').includes(searchLower) ||
      (worker.phone_number || '').includes(searchTerm)
    );
  });

  if (showBulkUpload) {
    return <BulkUpload onBack={() => setShowBulkUpload(false)} />;
  }

  if (showAddWorker) {
    return <AddWorker onBack={() => setShowAddWorker(false)} onWorkerAdded={handleWorkerAdded} />;
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
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Add in Bulk
                </button>
                <button
                  onClick={() => setShowAddWorker(true)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Single Worker
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
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                        <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                        <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWorkers.map((worker) => (
                        <tr key={worker.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                            <div className="sm:hidden text-xs text-gray-500 mt-1">Site Name</div>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">Site Name</div>
                          </td>
                          <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">2023-01-01</div>
                          </td>
                          <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">2023-12-31</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{worker.phone_number}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEditWorker(worker)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                title="Edit Worker"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => setSelectedWorkerId(worker.id)}
                                className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                                title="Work History"
                              >
                                <History className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWorker(worker.id)}
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
            </div>
          </div>
        </div>
      </div>

      {selectedWorkerId && (
        <WorkHistoryModal
          workerId={selectedWorkerId}
          onClose={() => setSelectedWorkerId(null)}
        />
      )}

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

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}