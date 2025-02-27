import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, X, ChevronRight, Plus, Info, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as WorkerAPI from '../api/workers';
import * as WorkHistoryAPI from '../api/workHistory';
import * as OrganizationsAPI from '../api/organizations';
import type { CreateWorkerData } from '../api/workers';
import type { CreateWorkHistoryData } from '../api/workHistory';
import type { Organization, Site } from '../api/organizations';

interface AddWorkerProps {
  onBack: () => void;
  onWorkerAdded: () => void;
}

type Step = 'worker' | 'work-history';

type FormFields = keyof Omit<CreateWorkerData, 'age'> | 'age';

const NATURE_OF_WORK_OPTIONS = [
  'Helper',
  'Mason',
  'Welder',
  'Painter',
  'Plumbing',
  'Carpenter',
  'Labor',
  'Crain Operator',
  'Centering worker',
  'Tails worker',
  'Gang Worker',
  'Polishing',
  'Others'
];

export default function AddWorker({ onBack, onWorkerAdded }: AddWorkerProps) {
  const [step, setStep] = useState<Step>('worker');
  const [createdWorkerId, setCreatedWorkerId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<CreateWorkerData, 'age'> & { age: string }>({
    name: '',
    phone_number: '',
    present_address_line1: '',
    present_address_line2: '',
    present_city: '',
    present_state: '',
    present_pincode: '',
    permanent_address_line1: '',
    permanent_address_line2: '',
    permanent_city: '',
    permanent_state: '',
    permanent_pincode: '',
    organization_id: '',
    age: '',
    gender: 'Male',
    photograph: null,
  });

  const [workHistoryData, setWorkHistoryData] = useState<CreateWorkHistoryData>({
    worker_id: 0,
    work_name: '',
    work_type: '',
    start_date: '',
    end_date: '',
    site_id: '',
    organization_id: '',
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dateError, setDateError] = useState<string>('');
  const [copyAddress, setCopyAddress] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherWorkName, setOtherWorkName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCamera && !stream) {
      initializeCamera();
    }
    fetchOrganizations();
  }, [showCamera, stream]);

  useEffect(() => {
    if (workHistoryData.organization_id) {
      fetchSites(workHistoryData.organization_id);
    }
  }, [workHistoryData.organization_id]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (copyAddress) {
      setFormData(prev => ({
        ...prev,
        permanent_address_line1: prev.present_address_line1,
        permanent_address_line2: prev.present_address_line2,
        permanent_city: prev.present_city,
        permanent_state: prev.present_state,
        permanent_pincode: prev.present_pincode
      }));
    }
  }, [
    copyAddress,
    formData.present_address_line1,
    formData.present_address_line2,
    formData.present_city,
    formData.present_state,
    formData.present_pincode
  ]);

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
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.style.transform = facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
      }
    } catch (error) {
      toast.error('Unable to access camera');
      setShowCamera(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  useEffect(() => {
    if (showCamera) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      initializeCamera();
    }
  }, [facingMode]);  

  const handleCopyAddress = (checked: boolean) => {
    setCopyAddress(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permanent_address_line1: prev.present_address_line1,
        permanent_address_line2: prev.present_address_line2,
        permanent_city: prev.present_city,
        permanent_state: prev.present_state,
        permanent_pincode: prev.present_pincode
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Apply character limits for address fields
    if (name.includes('line1') || name.includes('line2') || name.includes('city')) {
      if (value.length > 30) return;
    }
    if (name.includes('state')) {
      if (value.length > 17) return;
    }

    if (step === 'worker') {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name as FormFields]: value
        };

        if (copyAddress && name.startsWith('present_')) {
          const permanentField = name.replace('present_', 'permanent_') as FormFields;
          newData[permanentField] = value;
        }

        return newData;
      });
    } else {
      if (name === 'start_date' || name === 'end_date') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const selectedDate = new Date(value);
        
        if (name === 'start_date') {
          // Validate start date is not older than 1 year
          if (selectedDate < oneYearAgo) {
            setDateError('Start date cannot be older than 1 year from today');
            return;
          }
          
          // Validate start date is not after end date
          if (workHistoryData.end_date && selectedDate > new Date(workHistoryData.end_date)) {
            setDateError('Start date cannot be after end date');
            return;
          }
        }
        
        if (name === 'end_date') {
          // Validate end date is not before start date
          if (workHistoryData.start_date && selectedDate < new Date(workHistoryData.start_date)) {
            setDateError('End date cannot be before start date');
            return;
          }
        }
        
        setDateError('');
      }

      if (name === 'work_name') {
        if (value === 'Others') {
          setShowOtherInput(true);
          setWorkHistoryData(prev => ({
            ...prev,
            work_name: ''
          }));
        } else {
          setShowOtherInput(false);
          setOtherWorkName('');
          setWorkHistoryData(prev => ({
            ...prev,
            work_name: value
          }));
        }
      } else {
        setWorkHistoryData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleOtherWorkNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherWorkName(value);
    setWorkHistoryData(prev => ({
      ...prev,
      work_name: value
    }));
  };

  const startCamera = () => {
    setShowCamera(true);
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

      const { videoWidth, videoHeight } = video;
      const aspectRatio = videoWidth / videoHeight;
      
      const targetWidth = 800;
      const targetHeight = targetWidth / aspectRatio;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      if (facingMode === 'user') {
        context?.scale(-1, 1);
        context?.drawImage(video, -targetWidth, 0, targetWidth, targetHeight);
      } else {
        context?.drawImage(video, 0, 0, targetWidth, targetHeight);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setFormData(prev => ({ ...prev, photograph: file }));
          setPhotoPreview(URL.createObjectURL(blob));
        }
      }, 'image/jpeg', 0.8);

      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, photograph: file }));
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        toast.error('Please upload an image file');
      }
    }
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photograph: null }));
  };

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate and convert age to number
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 60) {
      toast.error('Please enter a valid age between 18 and 60');
      return;
    }

    // Validate pincode
    const presentPincodeValid = /^\d{6}$/.test(formData.present_pincode);
    const permanentPincodeValid = /^\d{6}$/.test(formData.permanent_pincode);

    if (!presentPincodeValid || !permanentPincodeValid) {
      toast.error('Please enter valid 6-digit pincodes');
      return;
    }

    try {
      const workerData: CreateWorkerData = {
        ...formData,
        age: ageNum // Convert age to number before sending to API
      };
      
      const worker = await WorkerAPI.createWorker(workerData);
      toast.success('Worker added successfully');
      setCreatedWorkerId(worker.id);
      setWorkHistoryData(prev => ({ ...prev, worker_id: worker.id }));
      setStep('work-history');
    } catch (error) {
      toast.error('Failed to add worker');
    }
  };

  const handleWorkHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Additional validation before submitting
    const startDate = new Date(workHistoryData.start_date);
    const endDate = new Date(workHistoryData.end_date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (startDate < oneYearAgo) {
      setDateError('Start date cannot be older than 1 year from today');
      return;
    }

    if (startDate > endDate) {
      setDateError('Start date cannot be after end date');
      return;
    }

    try {
      await WorkHistoryAPI.createWorkHistory(workHistoryData);
      toast.success('Work history added successfully');
      onWorkerAdded();
    } catch (error) {
      toast.error('Failed to add work history');
    }
  };

  // Calculate date limits
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const today = new Date();

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to determine the select value
  const getWorkNameValue = () => {
    if (showOtherInput) return 'Others';
    return workHistoryData.work_name || '';
  };

  function renderWorkerForm() {
    return (
      <form onSubmit={handleWorkerSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="18"
              max="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photograph
            </label>
            <div className="mt-1 flex items-center gap-4">
              {!photoPreview && !showCamera && (
                <>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
              {photoPreview && (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Present Address Fields */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Present Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="present_address_line1"
                  value={formData.present_address_line1}
                  onChange={handleInputChange}
                  maxLength={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{formData.present_address_line1.length}/30 characters</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="present_address_line2"
                  value={formData.present_address_line2}
                  onChange={handleInputChange}
                  maxLength={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{formData.present_address_line2.length}/30 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="present_city"
                  value={formData.present_city}
                  onChange={handleInputChange}
                  maxLength={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{formData.present_city.length}/30 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="present_state"
                  value={formData.present_state}
                  onChange={handleInputChange}
                  maxLength={17}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">{formData.present_state.length}/17 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="present_pincode"
                  value={formData.present_pincode}
                  onChange={handleInputChange}
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Permanent Address Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Permanent Address</h3>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={copyAddress}
                  onChange={(e) => handleCopyAddress(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Same as Present Address
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permanent_address_line1"
                  value={formData.permanent_address_line1}
                  onChange={handleInputChange}
                  maxLength={30}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    copyAddress ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                  disabled={copyAddress}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.permanent_address_line1.length}/30 characters</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permanent_address_line2"
                  value={formData.permanent_address_line2}
                  onChange={handleInputChange}
                  maxLength={30}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    copyAddress ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                  disabled={copyAddress}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.permanent_address_line2.length}/30 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permanent_city"
                  value={formData.permanent_city}
                  onChange={handleInputChange}
                  maxLength={30}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    copyAddress ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                  disabled={copyAddress}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.permanent_city.length}/30 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permanent_state"
                  value={formData.permanent_state}
                  onChange={handleInputChange}
                  maxLength={17}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    copyAddress ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                  disabled={copyAddress}
                />
                <p className="mt-1 text-xs text-gray-500">{formData.permanent_state.length}/17 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="permanent_pincode"
                  value={formData.permanent_pincode}
                  onChange={handleInputChange}
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    copyAddress ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  required
                  disabled={copyAddress}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            Continue to Add Work History
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </form>
    );
  }

  function renderWorkHistoryForm() {
    return (
      <form onSubmit={handleWorkHistorySubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              name="organization_id"
              value={workHistoryData.organization_id}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site <span className="text-red-500">*</span>
            </label>
            <select
              name="site_id"
              value={workHistoryData.site_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!workHistoryData.organization_id}
            >
              <option value="">Select Site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nature of Work <span className="text-red-500">*</span>
            </label>
            <select
              name="work_name"
              value={getWorkNameValue()}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Nature of Work</option>
              {NATURE_OF_WORK_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>            
          </div>

          {showOtherInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specify Nature of Work <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={otherWorkName}
                onChange={handleOtherWorkNameChange}
                placeholder="Nature of Work"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}     

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="start_date"
              value={workHistoryData.start_date}
              onChange={handleInputChange}
              min={formatDateForInput(oneYearAgo)}
              max={formatDateForInput(today)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={workHistoryData.end_date}
              onChange={handleInputChange}
              min={workHistoryData.start_date || formatDateForInput(oneYearAgo)}
              max={formatDateForInput(today)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {dateError && (
          <div className="text-red-500 text-sm mt-2">
            {dateError}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onWorkerAdded}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            disabled={!!dateError}
          >
            <Plus className="h-5 w-5" />
            Add Work History
          </button>
        </div>
      </form>
    );
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
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex flex-col mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {step === 'worker' ? 'Add New Worker' : 'Add Work History'}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500 ml-4">
                    <span className={step === 'worker' ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                      Worker Details
                    </span>
                    <ChevronRight className="h-4 w-4" />
                    <span className={step === 'work-history' ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                      Work History
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-gray-400" />
                  All field values must match the details on the worker's Aadhaar card.
                </p>
              </div>              
              {step === 'worker' ? renderWorkerForm() : renderWorkHistoryForm()}
            </div>
          </div>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col overflow-auto">
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

            <div className="p-3 sm:p-4 flex flex-col flex-grow">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
                <canvas ref={photoRef} className="hidden" />
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center pb-4 px-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Rotate Camera
                </button>
              </div>

              <p className="mt-3 text-sm text-gray-500 text-center">
                Position yourself in the frame and click the capture button
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}