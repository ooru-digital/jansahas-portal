import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, CheckCircle, Clock, User, Ticket } from 'lucide-react';
import { getWorkers, Worker } from '../api/workers';
import { getOrganizations, Organization } from '../api/organizations';
import toast from 'react-hot-toast';

interface VoucherRedemption {
  id: string;
  workerId: number;
  workerName: string;
  workerPhone: string;
  workerPhoto: string | null;
  organizationId: string;
  voucherCategory: string;
  voucherAmount: string;
  status: 'redeemed' | 'pending';
  issuedDate: string;
  redeemedDate: string | null;
}

const voucherCategories = [
  { id: 'marriage', name: 'Marriage Assistance', amount: '₹50,000' },
  { id: 'education', name: 'Education Assistance', amount: '₹25,000' },
  { id: 'maternity', name: 'Maternity Benefit', amount: '₹30,000' },
  { id: 'disability', name: 'Disability Pension', amount: '₹5,000/month' }
];

export default function Reconciliation() {
  const [redemptions, setRedemptions] = useState<VoucherRedemption[]>([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState<VoucherRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      const info = JSON.parse(userInfoStr);
      setUserInfo(info);
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      loadData();
    }
  }, [userInfo]);

  useEffect(() => {
    filterRedemptions();
  }, [redemptions, searchTerm, statusFilter, categoryFilter, selectedOrganization]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (userInfo?.is_jansathi) {
        const orgsData = await getOrganizations();
        setOrganizations(orgsData);
      }

      const workersData = await getWorkers({ limit: 15 });
      const mockRedemptions = generateMockRedemptions(workersData.results);
      setRedemptions(mockRedemptions);
    } catch (error) {
      toast.error('Failed to load redemption data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockRedemptions = (workers: Worker[]): VoucherRedemption[] => {
    const statuses: ('redeemed' | 'pending')[] = ['redeemed', 'redeemed', 'pending', 'redeemed', 'pending'];

    return workers.slice(0, 12).map((worker, index) => {
      const category = voucherCategories[index % voucherCategories.length];
      const status = statuses[index % statuses.length];
      const issuedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const redeemedDate = status === 'redeemed'
        ? new Date(issuedDate.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000)
        : null;

      return {
        id: `voucher-${worker.id}-${index}`,
        workerId: worker.id,
        workerName: worker.name,
        workerPhone: worker.phone_number,
        workerPhoto: worker.photograph,
        organizationId: worker.organization_id,
        voucherCategory: category.name,
        voucherAmount: category.amount,
        status: status,
        issuedDate: issuedDate.toISOString().split('T')[0],
        redeemedDate: redeemedDate ? redeemedDate.toISOString().split('T')[0] : null
      };
    });
  };

  const filterRedemptions = () => {
    let filtered = [...redemptions];

    if (searchTerm) {
      filtered = filtered.filter(redemption =>
        redemption.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        redemption.workerPhone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(redemption => redemption.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(redemption => redemption.voucherCategory === categoryFilter);
    }

    if (selectedOrganization !== 'all') {
      filtered = filtered.filter(redemption => redemption.organizationId === selectedOrganization);
    }

    setFilteredRedemptions(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'redeemed':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Redeemed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    total: redemptions.length,
    redeemed: redemptions.filter(r => r.status === 'redeemed').length,
    pending: redemptions.filter(r => r.status === 'pending').length,
    totalAmount: redemptions.reduce((sum, r) => {
      const amount = parseInt(r.voucherAmount.replace(/[^0-9]/g, ''));
      return sum + amount;
    }, 0)
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Voucher Disbursement</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track and manage voucher redemptions across all workers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vouchers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Redeemed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.redeemed}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Worker
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="redeemed">Redeemed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {voucherCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {userInfo?.is_jansathi && (
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                Organization
              </label>
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRedemptions.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No voucher redemptions</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || selectedOrganization !== 'all'
                ? 'No redemptions match your filters'
                : 'No voucher redemptions found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voucher Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redeemed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRedemptions.map((redemption) => (
                  <tr key={redemption.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {redemption.workerPhoto ? (
                            <img
                              src={redemption.workerPhoto}
                              alt={redemption.workerName}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{redemption.workerName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{redemption.workerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{redemption.voucherCategory}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{redemption.voucherAmount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(redemption.issuedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {redemption.redeemedDate ? (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(redemption.redeemedDate)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(redemption.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Currently showing mock voucher redemption data. Actual redemption API integration is pending.
        </p>
      </div>
    </div>
  );
}
