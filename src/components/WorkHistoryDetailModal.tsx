import { X, User, MapPin, Briefcase, Clock } from 'lucide-react';
import type { WorkHistoryDetail } from '../api/dashboard';

interface WorkHistoryDetailModalProps {
  workHistory: WorkHistoryDetail;
  onClose: () => void;
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

export default function WorkHistoryDetailModal({ workHistory, onClose }: WorkHistoryDetailModalProps) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Work History Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Worker Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              Worker Information
            </h3>
            <div className="flex gap-6">
              <div className="flex-shrink-0 flex items-center">
                {workHistory.photograph ? (
                  <img
                    src={workHistory.photograph}
                    alt={workHistory.worker_name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{workHistory.worker_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{workHistory.phone_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-medium">{workHistory.age || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{workHistory.sex || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Present Address</p>
                    <p className="font-medium">{formatAddress({
                          line1: workHistory.present_address_line1,
                          line2: workHistory.present_address_line2,
                          city: workHistory.present_city,
                          state: workHistory.present_state,
                          pincode: workHistory.present_pincode
                        })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Permanent Address</p>
                    <p className="font-medium">{formatAddress({
                          line1: workHistory.permanent_address_line1,
                          line2: workHistory.permanent_address_line2,
                          city: workHistory.permanent_city,
                          state: workHistory.permanent_state,
                          pincode: workHistory.permanent_pincode
                        })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-500" />
                Work Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Work Name</p>
                  <p className="font-medium">{workHistory.work_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Type</p>
                  <p className="font-medium">{workHistory.work_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {formatDate(workHistory.start_date)} - {formatDate(workHistory.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Working Days</p>
                  <p className="font-medium">{workHistory.number_of_working_days}</p>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Location Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="font-medium">{workHistory.organization_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Site</p>
                  <p className="font-medium">{workHistory.site_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Site Location</p>
                  <p className="font-medium">{workHistory.location}</p>
                </div>               
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Status Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-1 ${getStatusColor(workHistory.status)}`}>
                    {workHistory.status}
                  </span>
                </div>
                {workHistory.approved_date && (
                  <div>
                    <p className="text-sm text-gray-500">Approved At</p>
                    <p className="font-medium">{formatDate(workHistory.approved_date)}</p>
                  </div>
                )}
                {workHistory.rejected_date && (
                  <div>
                    <p className="text-sm text-gray-500">Rejected At</p>
                    <p className="font-medium">{formatDate(workHistory.rejected_date)}</p>
                  </div>
                )}
                {workHistory.status === 'approved' && (
                  <div>
                    <p className="text-sm text-gray-500">Approved By</p>
                    <p className="font-medium">{workHistory.approved_by || 'NA'}</p>
                  </div>
                )}
                {workHistory.status === 'rejected' && (
                  <div>
                    <p className="text-sm text-gray-500">Rejected By</p>
                    <p className="font-medium">{workHistory.rejected_by || 'NA'}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{formatDate(workHistory.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}