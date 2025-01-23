import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Award, User, Camera, Upload, X, Pencil, Trash2, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as WorkHistoryAPI from '../api/workHistory';
import * as OrganizationsAPI from '../api/organizations';
import * as WorkerAPI from '../api/workers';
import { getWorkHistoryDetail } from '../api/dashboard';
import type { WorkHistory, WorkHistoryResponse, CreateWorkHistoryData } from '../api/workHistory';
import type { Organization, Site } from '../api/organizations';
import type { WorkHistoryDetail } from '../api/dashboard';
import WorkHistoryDetailModal from './WorkHistoryDetailModal';
import WorkHistoryFormModal from './WorkHistoryFormModal';
import api from '../api/axiosInstance';

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
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateWorkHistoryData>({
    worker_id: workerId,
    work_name: '',
    work_type: '',
    start_date: '',
    end_date: '',
    site_id: '',
    organization_id: '',
  });

  useEffect(() => {
    fetchWorkHistory();
    fetchOrganizations();
  }, [workerId]);

  useEffect(() => {
    if (formData.organization_id) {
      fetchSites(formData.organization_id);
    }
  }, [formData.organization_id]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  const fetchSites = async (organizationId: string) => {
    try {
      const data = await OrganizationsAPI.getSitesByOrganization(organizationId);
      setSites(data);
    } catch (error) {
      toast.error('Failed to fetch sites');
    }
  };

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Unable to access camera');
      setShowCamera(false);
    }
  };

  const startCamera = () => {
    setShowCamera(true);
    initializeCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && photoRef.current) {
      const video = videoRef.current;
      const canvas = photoRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const { videoWidth, videoHeight } = video;
      const aspectRatio = videoWidth / videoHeight;
      
      const targetWidth = 800;
      const targetHeight = targetWidth / aspectRatio;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      context.drawImage(video, 0, 0, targetWidth, targetHeight);

      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      // Update the worker's photo
      api.patch(`/worker/${workerId}/update/`, {
        photograph: base64Image
      })
      .then(() => {
        toast.success('Photo updated successfully');
        fetchWorkHistory(); // Refresh worker data
      })
      .catch(() => {
        toast.error('Failed to update photo');
      });

      stopCamera();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Image = reader.result as string;
            try {
              await api.patch(`/worker/${workerId}/update/`, {
                photograph: base64Image
              });
              toast.success('Photo updated successfully');
              fetchWorkHistory(); // Refresh worker data
            } catch (error) {
              toast.error('Failed to update photo');
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          toast.error('Failed to process image');
        }
      } else {
        toast.error('Please upload an image file');
      }
    }
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
        start_date: '',
        end_date: '',
        site_id: '',
        organization_id: '',
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

  const handleEdit = (history: WorkHistory) => {
    setEditingHistory(history);
    setFormData({
      ...history,
      worker_id: workerId,
    });
    setShowForm(true);
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
                onClick={() => {
                  setEditingHistory(null);
                  setFormData({
                    worker_id: workerId,
                    work_name: '',
                    work_type: '',
                    start_date: '',
                    end_date: '',
                    site_id: '',
                    organization_id: '',
                  });
                  setShowForm(true);
                }}
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
              <div className="flex items-center gap-8">
                <div className="relative group">
                  {workHistoryData.photograph ? (
                    <img
                      src={workHistoryData.photograph}
                      alt={workHistoryData.worker_name}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                        title="Take Photo"
                      >
                        <Camera className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                        title="Upload Photo"
                      >
                        <Upload className="h-5 w-5 text-gray-600" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approver</th>
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
                        <div className="text-sm text-gray-500">{history.organization_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{history.site_name}</div>
                      </td> 
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(history.start_date).toLocaleDateString()}
                        </div>
                      </td>                     
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{history.number_of_working_days}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            history.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : history.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {history.status}
                          </span>
                          {history.approved_date && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(history.approved_date).toLocaleDateString()}
                            </div>
                          )}
                          {history.rejected_date && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(history.rejected_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{history.approved_by || history.rejected_by || 'NA'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {history.status === 'pending' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(history);
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
                          </>
                        ) : (
                          <span className="text-gray-500">NA</span>
                        )}
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

      <WorkHistoryFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingHistory(null);
          setFormData({
            worker_id: workerId,
            work_name: '',
            work_type: '',
            start_date: '',
            end_date: '',
            site_id: '',
            organization_id: '',
          });
        }}
        formData={formData}
        setFormData={setFormData}
        organizations={organizations}
        sites={sites}
        onSubmit={handleSubmit}
        isEditing={!!editingHistory}
      />

      {selectedWorkHistory && (
        <WorkHistoryDetailModal
          workHistory={selectedWorkHistory}
          onClose={() => setSelectedWorkHistory(null)}
        />
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Take Photo</h3>
              <button
                type="button"
                onClick={stopCamera}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas ref={photoRef} className="hidden" />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Capture Photo
                  </button>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 text-center">
                Position yourself in the frame and click the capture button
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}