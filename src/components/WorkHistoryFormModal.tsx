import React, { useState } from 'react';
import { X, Pencil, Plus } from 'lucide-react';
import type { CreateWorkHistoryData } from '../api/workHistory';
import type { Organization, Site } from '../api/organizations';

interface WorkHistoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CreateWorkHistoryData;
  setFormData: React.Dispatch<React.SetStateAction<CreateWorkHistoryData>>;
  organizations: Organization[];
  sites: Site[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing: boolean;
}

export default function WorkHistoryFormModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  organizations, 
  sites, 
  onSubmit, 
  isEditing 
}: WorkHistoryFormModalProps) {
  const [dateError, setDateError] = useState<string>('');

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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
        if (formData.end_date && selectedDate > new Date(formData.end_date)) {
          setDateError('Start date cannot be after end date');
          return;
        }
      }
      
      if (name === 'end_date') {
        // Validate end date is not before start date
        if (formData.start_date && selectedDate < new Date(formData.start_date)) {
          setDateError('End date cannot be before start date');
          return;
        }
      }
      
      setDateError('');
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate date limits
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const today = new Date();

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Additional validation before submitting
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
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

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Work History' : 'Add Work History'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization <span className="text-red-500">*</span>
                </label>
                <select
                  name="organization_id"
                  value={formData.organization_id}
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
                  value={formData.site_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.organization_id}
                >
                  <option value="">Select Site</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="work_name"
                  value={formData.work_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="work_type"
                  value={formData.work_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Work Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
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
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date || formatDateForInput(oneYearAgo)}
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
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                disabled={!!dateError}
              >
                {isEditing ? (
                  <>
                    <Pencil className="h-5 w-5" />
                    Update Work History
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add Work History
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}