import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { XCircle, Clock, AlertCircle, User, MapPin, CheckCircle, ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react';
import * as CredentialsAPI from '../api/credentials';
import type { VerifyCredentialResponse, VCData } from '../api/credentials';
import Footer from './Footer';

const formatAddress = (addressFields: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) => {
  const parts = [
    addressFields.line1,
    addressFields.line2,
    addressFields.city,
    addressFields.state,
    addressFields.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
};

export default function VerifyCredential() {
  const { cert_hash } = useParams<{ cert_hash: string }>();
  const [data, setData] = useState<VerifyCredentialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusAnimation, setShowStatusAnimation] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    if (cert_hash) {
      fetchCredentialData(cert_hash);
    }
  }, [cert_hash]);

  useEffect(() => {
    // Hide status animation after 5 seconds
    const timer = setTimeout(() => {
      setShowStatusAnimation(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [data]);

  const fetchCredentialData = async (hash: string) => {
    try {
      setLoading(true);
      const response = await CredentialsAPI.verifyCredential(hash);
      setData(response);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify credential';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: VCData['verification_status']) => {
    switch (status) {
      case 'Valid':
        return {
          icon: CheckCircle,
          color: 'bg-[#e6f4ea] text-[#137333]',
          iconColor: 'text-[#34a853]',
          animation: 'animate-[scaleIn_0.5s_ease-out]'
        };
      case 'Invalid':
        return {
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-500',
          animation: 'animate-[shake_0.5s_ease-in-out]'
        };
      case 'Revoked':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800',
          iconColor: 'text-red-500',
          animation: 'animate-[shake_0.5s_ease-in-out]'
        };
      case 'Expired':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800',
          iconColor: 'text-yellow-500',
          animation: 'animate-[pulse_1s_ease-in-out]'
        };
      case 'Failed':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800',
          iconColor: 'text-red-500',
          animation: 'animate-[shake_0.5s_ease-in-out]'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-800',
          iconColor: 'text-gray-500',
          animation: ''
        };
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!data?.related_vc_data) return;
    setCurrentIndex((prev) => Math.min(data.related_vc_data.length - 1, prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Verifying Credential</h2>
          <p className="text-gray-600">{error || 'Failed to load credential data'}</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(data.vc_data.verification_status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">90 Days Employment Certificate</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className={`mb-8 p-6 rounded-lg text-center ${statusInfo.color}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <StatusIcon 
                className={`h-12 w-12 ${statusInfo.iconColor} ${showStatusAnimation ? statusInfo.animation : ''} stroke-[2]`} 
              />
              {data.vc_data.verification_status === 'Valid' && showStatusAnimation && (
                <div className="absolute inset-0 animate-[fadeOut_5s_ease-out]">
                  <div className="absolute inset-0 animate-[ripple_5s_ease-out]">
                    <div className={`absolute inset-0 rounded-full border-4 ${statusInfo.iconColor} opacity-0`} />
                  </div>
                </div>
              )}
            </div>
            <span className="text-xl font-medium">
              {data.vc_data.verification_status} 90 Days Employment Certificate of {data.worker_details.name}
            </span>
          </div>
        </div>

        {/* Worker Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Basic Info Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-8">
              <div className="relative group">
                {data.worker_details.photograph ? (
                  <img
                    src={data.worker_details.photograph}
                    alt={data.worker_details.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{data.worker_details.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="text-sm font-medium text-gray-900">{data.worker_details.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="text-sm font-medium text-gray-900">{data.worker_details.sex}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-sm font-medium text-gray-900">{data.worker_details.phone_number}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Card - Hidden on mobile */}
          <div className="hidden md:block bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              Address Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Present Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatAddress({
                    line1: data.worker_details.present_address_line1,
                    line2: data.worker_details.present_address_line2,
                    city: data.worker_details.present_city,
                    state: data.worker_details.present_state,
                    pincode: data.worker_details.present_pincode
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Permanent Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatAddress({
                    line1: data.worker_details.permanent_address_line1,
                    line2: data.worker_details.permanent_address_line2,
                    city: data.worker_details.permanent_city,
                    state: data.worker_details.permanent_state,
                    pincode: data.worker_details.permanent_pincode
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Working Days Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col justify-between h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 self-start">
              Total Approved Working Days
            </h3>
            <div className="flex flex-col items-center justify-center flex-grow">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-green-600">
                  {data.worker_details.total_approved_work_days || 0}
                </span>
                <span className="text-lg text-gray-500">days</span>
              </div>
            </div>
          </div>
        </div>        

        {/* Organization Blocks */}
        {data.related_vc_data.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Form No - V(A) Employment Certificates</h2>
            
            {/* Desktop View */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-full ${
                    currentIndex === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="flex-1 flex justify-center gap-6">
                  {data.related_vc_data.slice(currentIndex, currentIndex + 3).map((vc) => (
                    <button
                      key={vc.credential_id}
                      onClick={() => setShowPreview(vc.svg_url)}
                      className="relative w-[300px] h-[400px] bg-gray-100 border border-gray-400 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all group overflow-hidden"
                    >
                      {/* Certificate Preview */}
                      <iframe
                        src={vc.svg_url}
                        className="w-full h-full pointer-events-none"
                        title={`${vc.org_name} Certificate Preview`}
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {vc.org_logo ? (
                          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg p-3 bg-white mb-4">
                            <img
                              src={vc.org_logo}
                              alt={vc.org_name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg p-3 bg-white mb-4 flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <p className="text-lg font-medium text-white text-center">
                          {vc.org_name}
                        </p>
                        <p className="text-sm text-gray-200 mt-2">
                          Click to view certificate
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= data.related_vc_data.length - 3}
                  className={`p-2 rounded-full ${
                    currentIndex >= data.related_vc_data.length - 3
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-4">
                {/* Previous Button */}
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-2 rounded-full ${
                    currentIndex === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                {/* Certificate Preview */}
                <div className="flex-1 flex flex-col items-center">
                  {data.related_vc_data[currentIndex] && (
                    <>
                      <button
                        onClick={() => setShowPreview(data.related_vc_data[currentIndex].svg_url)}
                        className="relative w-full max-w-[300px] h-[400px] bg-gray-100 border border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden"
                      >
                        <iframe
                          src={data.related_vc_data[currentIndex].svg_url}
                          className="w-full h-full pointer-events-none"
                          title={`${data.related_vc_data[currentIndex].org_name} Certificate Preview`}
                        />
                        
                        {/* Always Visible Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                          {data.related_vc_data[currentIndex].org_logo ? (
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg p-3 bg-white mb-4">
                              <img
                                src={data.related_vc_data[currentIndex].org_logo}
                                alt={data.related_vc_data[currentIndex].org_name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg p-3 bg-white mb-4 flex items-center justify-center">
                              <Building2 className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <p className="text-lg font-medium text-white text-center">
                            {data.related_vc_data[currentIndex].org_name}
                          </p>
                          <p className="text-sm text-gray-200 mt-2">
                            Tap to view certificate
                          </p>
                        </div>
                      </button>

                      {/* Pagination Count Display */}
                      <p className="mt-2 text-sm text-gray-600">
                        {currentIndex + 1} of {data.related_vc_data.length}
                      </p>
                    </>
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= data.related_vc_data.length - 1}
                  className={`p-2 rounded-full ${
                    currentIndex >= data.related_vc_data.length - 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Display - Moved to bottom */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">90 Days Employment Certificate</h2>
          <div className="flex justify-center">
            <button
              onClick={() => setShowPreview(data.vc_data.svg_url)}
              className="relative w-[300px] h-[400px] bg-gray-100 border border-gray-400 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all group overflow-hidden"
            >
              {/* Certificate Preview */}
              <iframe
                src={data.vc_data.svg_url}
                className="w-full h-full pointer-events-none"
                title="90 Days Employment Certificate"
              />
              
              {/* Desktop Hover Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {data.vc_data.org_logo ? (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg p-3 bg-white mb-4">
                    <img
                      src={data.vc_data.org_logo}
                      alt={data.vc_data.org_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg p-3 bg-white mb-4 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <p className="text-lg font-medium text-white text-center">
                  {data.vc_data.org_name}
                </p>
                <p className="text-sm text-gray-200 mt-2">
                  {/* Show different text for mobile/desktop */}
                  <span className="hidden md:inline">Click to view certificate</span>
                  <span className="md:hidden">Tap to view certificate</span>
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Certificate Preview</h3>
              <button
                onClick={() => setShowPreview(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <iframe
                src={showPreview}
                className="w-full h-[70vh] border-0"
                title="Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}