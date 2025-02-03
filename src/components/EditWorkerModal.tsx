import React, { useEffect, useState } from 'react';
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

type FormFields = keyof Omit<UpdateWorkerData, 'age'> | 'age';

type FormData = {
  name: string;
  phone_number: string;
  present_address_line1: string;
  present_address_line2: string;
  present_city: string;
  present_state: string;
  present_pincode: string;
  permanent_address_line1: string;
  permanent_address_line2: string;
  permanent_city: string;
  permanent_state: string;
  permanent_pincode: string;
  age: string;
  gender: string;
  organization_id: string;
};

export default function EditWorkerModal({ worker, isOpen, onClose, onWorkerUpdated }: EditWorkerModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: worker.name,
    phone_number: worker.phone_number,
    present_address_line1: worker.present_address_line1,
    present_address_line2: worker.present_address_line2,
    present_city: worker.present_city,
    present_state: worker.present_state,
    present_pincode: worker.present_pincode,
    permanent_address_line1: worker.permanent_address_line1,
    permanent_address_line2: worker.permanent_address_line2,
    permanent_city: worker.permanent_city,
    permanent_state: worker.permanent_state,
    permanent_pincode: worker.permanent_pincode,
    age: worker.age.toString(),
    gender: worker.gender.charAt(0).toUpperCase() + worker.gender.slice(1).toLowerCase(),
    organization_id: worker.organization_id,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyAddress, setCopyAddress] = useState(false);

  useEffect(() => {
    if (copyAddress) {
      setFormData((prev) => ({
        ...prev,
        permanent_address_line1: prev.present_address_line1,
        permanent_address_line2: prev.present_address_line2,
        permanent_city: prev.present_city,
        permanent_state: prev.present_state,
        permanent_pincode: prev.present_pincode,
      }))
    }
  }, [
    copyAddress,
    formData.present_address_line1,
    formData.present_address_line2,
    formData.present_city,
    formData.present_state,
    formData.present_pincode,
  ]);

  useEffect(() => {
    const addressFieldsMatch = ["address_line1", "address_line2", "city", "state", "pincode"].every(
      (field) => formData[`present_${field}` as keyof FormData] === formData[`permanent_${field}` as keyof FormData],
    )

    setCopyAddress(addressFieldsMatch)
  }, [formData]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Apply character limits for address fields
    if (name.includes("line1") || name.includes("line2") || name.includes("city")) {
      if (value.length > 30) return;
    }
    if (name.includes("state")) {
      if (value.length > 17) return;
    }

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name as FormFields]: value,
      }

      if (copyAddress && name.startsWith("present_")) {
        const permanentField = name.replace("present_", "permanent_") as FormFields
        newData[permanentField] = value
      }

      return newData
    })
  }

  const handleCopyAddress = (checked: boolean) => {
    setCopyAddress(checked)
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permanent_address_line1: prev.present_address_line1,
        permanent_address_line2: prev.present_address_line2,
        permanent_city: prev.present_city,
        permanent_state: prev.present_state,
        permanent_pincode: prev.present_pincode,
      }))
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Get only modified fields
    const modifiedFields: UpdateWorkerData = {};

    // Check each field for modifications
    Object.entries(formData).forEach(([key, value]) => {
      const workerKey = key as keyof Worker;
      const workerValue = worker[workerKey];

      if (value !== workerValue?.toString()) {
        if (key === "age") {
          const ageNum = Number.parseInt(value, 10);
          if (isNaN(ageNum) || ageNum < 18 || ageNum > 60) {
            throw new Error("Please enter a valid age between 18 and 60");
          }
          modifiedFields.age = ageNum;
        } else if (key === "gender") {
          // Only add gender if it's different from the original value
          if (value !== worker.gender) {
            modifiedFields.gender = value;
          }
        } else {
          // For all other fields, only add them if they're different
          const typedKey = key as keyof UpdateWorkerData;
          if (typedKey !== "gender" && typedKey !== "age") {
            modifiedFields[typedKey] = value;
          }
        }
      }
    });

    // If no fields were modified, show a message and return
    if (Object.keys(modifiedFields).length === 0) {
      toast.error("No changes were made");
      return;
    }

    // Validate pincode if modified
    if (modifiedFields.present_pincode || modifiedFields.permanent_pincode) {
      const presentPincodeValid = /^[0-9]{6}$/.test(formData.present_pincode);
      const permanentPincodeValid = /^[0-9]{6}$/.test(formData.permanent_pincode);

      if (!presentPincodeValid || !permanentPincodeValid) {
        toast.error("Please enter valid 6-digit pincodes");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await WorkerAPI.updateWorker(worker.id, modifiedFields);
      toast.success("Worker updated successfully");
      onWorkerUpdated();
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Edit Worker</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  disabled
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            {/* Present Address Fields */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Present Address</h4>
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
                <h4 className="text-sm font-medium text-gray-900">Permanent Address</h4>
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
                      copyAddress ? "bg-gray-100 cursor-not-allowed" : ""
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
                      copyAddress ? "bg-gray-100 cursor-not-allowed" : ""
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
                      copyAddress ? "bg-gray-100 cursor-not-allowed" : ""
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
                      copyAddress ? "bg-gray-100 cursor-not-allowed" : ""
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
                      copyAddress ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    required
                    disabled={copyAddress}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              "Update Worker"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}