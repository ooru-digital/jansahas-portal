import { X, CheckCircle, Calendar, CreditCard, Building2, Hash, User, Ticket } from 'lucide-react';
import { VoucherDisbursement } from '../api/vouchers';

interface RedemptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  disbursement: VoucherDisbursement;
}

export default function RedemptionDetailsModal({ isOpen, onClose, disbursement }: RedemptionDetailsModalProps) {
  if (!isOpen || !disbursement.redeemed_at) return null;

  const redeemedDate = new Date(disbursement.redeemed_at);
  const depositedDate = new Date(redeemedDate.getTime() + 60 * 60 * 1000);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const maskAccountNumber = (accountNum: string) => {
    return `XXXX XXXX ${accountNum.slice(-4)}`;
  };

  const mockAccountNumber = `${Math.floor(10000000 + Math.random() * 90000000)}${Math.floor(1000 + Math.random() * 9000)}`;
  const mockIfscCode = `SBIN000${Math.floor(1000 + Math.random() * 9000)}`;
  const mockTransactionId = `TXN${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Redemption Details</h2>
                <p className="text-sm text-gray-500">Voucher ID: {disbursement.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
                <CheckCircle className="h-5 w-5" />
                <span>Amount Successfully Deposited</span>
              </div>
              <p className="text-sm text-green-700 ml-7">
                The voucher amount has been successfully transferred to the worker's bank account.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Worker Name</label>
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <User className="h-4 w-4 text-gray-400" />
                    {disbursement.worker.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                  <div className="text-gray-900 font-medium">
                    {disbursement.category_name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Amount</label>
                  <div className="text-gray-900 font-medium">
                    {disbursement.amount}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Transaction Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Ticket className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900">Voucher Redeemed</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(redeemedDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Amount Deposited</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(depositedDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Bank Account Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Account Number</p>
                      <p className="text-sm font-mono text-gray-900 mt-0.5">{maskAccountNumber(mockAccountNumber)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">IFSC Code</p>
                      <p className="text-sm font-mono text-gray-900 mt-0.5">{mockIfscCode}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Transaction ID</p>
                      <p className="text-sm font-mono text-gray-900 mt-0.5">{mockTransactionId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
