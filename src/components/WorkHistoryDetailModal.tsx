import { X, User, MapPin, Briefcase, Clock, Check, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { WorkHistoryDetail } from '../api/dashboard';
import { bulkUpdateApprovalStatus } from '../api/dashboard';
import RejectionModal from './RejectionModal';
import { useState } from 'react';

interface WorkHistoryDetailModalProps {
  workHistory: WorkHistoryDetail;
  onClose: () => void;
  isFromApprovals?: boolean;
  isJansathi?: boolean;
  onStatusUpdate?: () => void;
}

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

export default function WorkHistoryDetailModal({ 
  workHistory, 
  onClose,
  isFromApprovals = false,
  isJansathi = false,
  onStatusUpdate
}: WorkHistoryDetailModalProps) {
  
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
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

  const handleApprovalAction = async (status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      await bulkUpdateApprovalStatus([{ 
        id: workHistory.id, 
        status,
        rejection_reason: rejectionReason 
      }]);
      toast.success(`Work history ${status} successfully`);
      onStatusUpdate?.();
      onClose();
    } catch (error) {
      toast.error(`Failed to ${status} work history`);
    }
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };
  
  const handleRejectionSubmit = async (reason: string) => {
    await handleApprovalAction('rejected', reason);
    setShowRejectionModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold">Work History Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Worker Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-base sm:text-lg font-medium mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              Worker Information
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex-shrink-0 flex items-center justify-center">
                {workHistory.photograph ? (
                  <img
                    src={workHistory.photograph}
                    alt={workHistory.worker_name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Name</p>
                    <p className="text-sm sm:text-base font-medium">{workHistory.worker_name}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Phone Number</p>
                    <p className="text-sm sm:text-base font-medium">{workHistory.phone_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Age</p>
                    <p className="text-sm sm:text-base font-medium">{workHistory.age || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Gender</p>
                    <p className="text-sm sm:text-base font-medium">{workHistory.sex || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Present Address</p>
                    <p className="text-sm sm:text-base font-medium">
                      {formatAddress({
                        line1: workHistory.present_address_line1,
                        line2: workHistory.present_address_line2,
                        city: workHistory.present_city,
                        state: workHistory.present_state,
                        pincode: workHistory.present_pincode,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Permanent Address</p>
                    <p className="text-sm sm:text-base font-medium">
                      {formatAddress({
                        line1: workHistory.permanent_address_line1,
                        line2: workHistory.permanent_address_line2,
                        city: workHistory.permanent_city,
                        state: workHistory.permanent_state,
                        pincode: workHistory.permanent_pincode,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-500" />
                Work Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Nature of Work</p>
                  <p className="text-sm sm:text-base font-medium">{workHistory.work_name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Duration</p>
                  <p className="text-sm sm:text-base font-medium">
                    {formatDate(workHistory.start_date)} - {formatDate(workHistory.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Working Days</p>
                  <p className="text-sm sm:text-base font-medium">{workHistory.number_of_working_days}</p>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Location Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Organization</p>
                  <p className="text-sm sm:text-base font-medium">{workHistory.organization_name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Site</p>
                  <p className="text-sm sm:text-base font-medium">{workHistory.site_name}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Site Location</p>
                  <p className="text-sm sm:text-base font-medium">{workHistory.location}</p>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
              <h3 className="text-base sm:text-lg font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Status Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs sm:text-sm font-medium rounded-full mt-1 ${getStatusColor(workHistory.status)}`}
                  >
                    {workHistory.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Created At</p>
                  <p className="text-sm sm:text-base font-medium">{formatDate(workHistory.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Created By</p>
                  <p className="text-sm sm:text-base font-medium">{workHistory.created_by || "NA"}</p>
                </div>
                {workHistory.approved_date && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Approved At</p>
                    <p className="text-sm sm:text-base font-medium">{formatDate(workHistory.approved_date)}</p>
                  </div>
                )}
                {workHistory.rejected_date && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Rejected At</p>
                    <p className="text-sm sm:text-base font-medium">{formatDate(workHistory.rejected_date)}</p>
                  </div>
                )}
                {workHistory.status === "approved" && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Approved By</p>
                    <p className="text-sm sm:text-base font-medium">{workHistory.approved_by || "NA"}</p>
                  </div>
                )}
                {workHistory.status === "rejected" && (
                  <>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Rejected By</p>
                      <p className="text-sm sm:text-base font-medium">{workHistory.rejected_by || "NA"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs sm:text-sm text-gray-500">Rejection Reason</p>
                      <p className="text-sm sm:text-base font-medium whitespace-pre-wrap">{workHistory.rejection_reason || "NA"}</p>
                    </div>
                  </>
                )}                
              </div>
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        {isFromApprovals && !isJansathi && workHistory.status === 'pending' && (
          <div className="flex justify-end gap-4 p-6 border-t mt-auto">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <XCircle className="h-5 w-5" />
              Reject
            </button>
            <button
              onClick={() => handleApprovalAction('approved')}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Check className="h-5 w-5" />
              Approve
            </button>
          </div>
        )}

        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          onSubmit={handleRejectionSubmit}
        />
      </div>
    </div>
  );
}