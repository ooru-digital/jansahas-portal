import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as WorkerAPI from '../api/workers';
import type { Worker, UpdateWorkerData } from '../api/workers';

interface EditWorkerModalProps {
  worker: Worker;
  isOpen: boolean;
  onClose: () => void;
  onWorkerUpdated: () => void;
}

export default function EditWorkerModal({ worker, isOpen, onClose, onWorkerUpdated }: EditWorkerModalProps) {
  const [formData, setFormData] = useState<UpdateWorkerData>({
    name: worker.name || '',
    phone_number: worker.phone_number || '',
    present_address: worker.present_address || '',
    permanent_address: worker.permanent_address || '',
    age: worker.age || '',
    sex: worker.sex || ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'age') {
      const parsedAge = parseInt(value);
      setFormData(prev => ({
        ...prev,
        age: isNaN(parsedAge) ? '' : parsedAge
      }));
    } else if (name === 'gender') {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
      setFormData(prev => ({
        ...prev,
        sex: capitalizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a clean copy of the data to send
      const dataToSend = {
        name: formData.name,
        phone_number: formData.phone_number,
        present_address: formData.present_address,
        permanent_address: formData.permanent_address,
        age: formData.age,
        sex: formData.sex
      };

      await WorkerAPI.updateWorker(worker.id, dataToSend);
      toast.success('Worker updated successfully');
      onWorkerUpdated();
      onClose();
    } catch (error) {
      // Error will be handled by axios interceptor
      console.error('Update failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Edit Worker</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
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
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="18"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={(formData.sex || '').toLowerCase()}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Present Address
              </label>
              <textarea
                name="present_address"
                value={formData.present_address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permanent Address
              </label>
              <textarea
                name="permanent_address"
                value={formData.permanent_address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Update Worker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}