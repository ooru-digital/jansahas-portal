import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { XCircle, Clock, AlertCircle, ExternalLink, User, MapPin, Info, CheckCircle, ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react';
import * as CredentialsAPI from '../api/credentials';
import type { VerifyCredentialResponse, VCData } from '../api/credentials';

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
    setCurrentIndex((prev) => Math.max(0, prev - 3));
  };

  const handleNext = () => {
    if (!data?.related_vc_data) return;
    setCurrentIndex((prev) => Math.min(data.related_vc_data.length - 3, prev + 3));
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-900">90 Days Employment Certificate</h1>
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

        {/* Worker Details */}
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

          {/* Address Information Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              Address Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Present Address</p>
                <p className="text-sm font-medium text-gray-900">{data.worker_details.present_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Permanent Address</p>
                <p className="text-sm font-medium text-gray-900">{data.worker_details.permanent_address}</p>
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-gray-500" />
              Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Approved Working Days</p>
                <p className="text-4xl mt-4 font-bold text-green-600">
                  {data.worker_details.total_approved_work_days || 0}
                </p>
              </div>
              {data.vc_data.approved_by && (
                <div>
                  <p className="text-sm text-gray-500">Approved By</p>
                  <p className="text-sm font-medium text-gray-900">{data.vc_data.approved_by}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organization Blocks */}
        {data.related_vc_data.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Form No - V(A) Employment Certificates</h2>
            <div className="relative">
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
                      className="w-48 h-48 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col items-center justify-center gap-4"
                    >
                      {vc.org_logo ? (
                        <img
                          src={vc.org_logo}
                          alt={vc.org_name}
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <Building2 className="w-24 h-24 text-gray-400" />
                      )}
                      <p className="text-sm font-medium text-gray-900 text-center line-clamp-2">
                        {vc.org_name}
                      </p>
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
          </div>
        )}

        {/* Credential Details */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">90-Days Employment Certificate</h2>
              <a
                href={data.vc_data.svg_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Certificate
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Credential ID</p>
                <p className="mt-1 font-medium">{data.vc_data.credential_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Certificate Name</p>
                <p className="mt-1 font-medium">{data.vc_data.certificate_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Recipient Name</p>
                <p className="mt-1 font-medium">{data.vc_data.recipient_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="mt-1 font-medium">{data.vc_data.org_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issuer</p>
                <p className="mt-1 font-medium">{data.vc_data.issuer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Updated At</p>
                <p className="mt-1 font-medium">{data.vc_data.updated_at}</p>
              </div>
            </div>
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
    </div>
  );
}