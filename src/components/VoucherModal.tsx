import { useState } from 'react';
import { X, Ticket } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VoucherCategory {
  id: string;
  name: string;
  description: string;
  amount: string;
}

const voucherCategories: VoucherCategory[] = [
  {
    id: 'marriage',
    name: 'Marriage Assistance',
    description: 'Financial assistance provided to workers for their marriage expenses. This benefit helps workers cover marriage-related costs and celebrates this important life event.',
    amount: '₹50,000'
  },
  {
    id: 'education',
    name: 'Education Assistance',
    description: 'Educational support for workers or their children to pursue higher education. This includes tuition fees, books, and other educational expenses.',
    amount: '₹25,000'
  },
  {
    id: 'maternity',
    name: 'Maternity Benefit',
    description: 'Support provided to female workers during maternity period. Covers medical expenses and provides financial assistance during the pre and post-natal period.',
    amount: '₹30,000'
  },
  {
    id: 'disability',
    name: 'Disability Pension',
    description: 'Monthly pension support for workers who have sustained disabilities during work. Provides long-term financial security and assistance for medical care.',
    amount: '₹5,000/month'
  },
  {
    id: 'skill-dev',
    name: 'Skill Development Allowance',
    description: 'Training support for workers to upgrade skills (e.g., masonry, electrical, plumbing, machine operation). Helps improve employability and wage potential.',
    amount: '₹5,000/training program'
  },
  {
    id: 'pension',
    name: 'Pension Scheme',
    description: 'Monthly pension provided to workers after they reach retirement age. Ensures financial stability during old age.',
    amount: '₹3,000/month'
  },
  {
    id: 'tools',
    name: 'Tool & Safety Gear Assistance',
    description: 'Provision of essential tools, safety shoes, helmets, gloves, and other protective gear to ensure worker safety and reduce injuries.',
    amount: '₹3,000 (one-time)'
  },
  {
    id: 'accidental_death',
    name: 'Accidental Death Benefit',
    description: 'Financial support provided to the family of a worker in case of accidental death at the construction site. This helps ensure long-term stability for dependents.',
    amount: '₹5,00,000 (one-time payout)'
  }
];

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  workerId: number;
}

export default function VoucherModal({ isOpen, onClose, workerName, workerId }: VoucherModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedVoucher = voucherCategories.find(cat => cat.id === selectedCategory);

  const handleSendVoucher = async () => {
    if (!selectedCategory) {
      toast.error('Please select a voucher category');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`Voucher sent successfully to ${workerName}!`);
      onClose();
      setSelectedCategory('');
    } catch (error) {
      toast.error('Failed to send voucher. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCategory('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Send Voucher</h3>
                  <p className="text-sm text-gray-500">To: {workerName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Voucher Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Choose a category...</option>
                {voucherCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedVoucher && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-semibold text-blue-900">
                    {selectedVoucher.name}
                  </h4>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedVoucher.amount}
                  </span>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {selectedVoucher.description}
                </p>
              </div>
            )}

            {!selectedCategory && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">
                  Please select a voucher category to view details and amount
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <button
              onClick={handleSendVoucher}
              disabled={!selectedCategory || isSubmitting}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send Voucher'
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
