import React, { useState } from 'react';
import { Download, ArrowLeft, FileUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axiosInstance';
import * as XLSX from 'xlsx';

interface TableData {
  headers: string[];
  rows: string[][];
}

interface BulkUploadProps {
  onBack: () => void;
}

export default function BulkUpload({ onBack }: BulkUploadProps) {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadSampleCSV = async () => {
    try {
      const response = await api.get('/worker/create/bulk', {
        responseType: 'blob'
      });
      
      // Get the filename from Content-Disposition header or use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'worker_template';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Get the file extension from Content-Type header or use the original
      const contentType = response.headers['content-type'];
      let extension = '';
      
      if (contentType) {
        switch (contentType.toLowerCase()) {
          case 'text/csv':
            extension = '.csv';
            break;
          case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            extension = '.xlsx';
            break;
          case 'application/vnd.ms-excel':
            extension = '.xls';
            break;
          default:
            // If no matching content type, try to extract extension from filename
            const extensionMatch = filename.match(/\.[0-9a-z]+$/i);
            extension = extensionMatch ? extensionMatch[0] : '.csv';
        }
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Sample template downloaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download sample template';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const parseCSV = (content: string): TableData => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const rows = lines.slice(1)
      .filter(line => line.trim())
      .map(line => line.split(',').map(cell => cell.trim()));
    return { headers, rows };
  };

  const parseExcel = (data: ArrayBuffer): TableData => {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1) as string[][];
    
    return { headers, rows };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setError('Please upload a CSV or Excel file (xlsx/xls)');
      toast.error('Please upload a CSV or Excel file (xlsx/xls)');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();

    if (fileExtension === 'csv') {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = parseCSV(content);
          setTableData(data);
          toast.success('File loaded successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
          setError(errorMessage);
          toast.error(errorMessage);
          setTableData(null);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const content = e.target?.result as ArrayBuffer;
          const data = parseExcel(content);
          setTableData(data);
          toast.success('File loaded successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to parse Excel file';
          setError(errorMessage);
          toast.error(errorMessage);
          setTableData(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      toast.error('Please select a file first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await api.post('/worker/create/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Workers uploaded successfully');
      onBack(); // This will trigger the refresh in the parent component
    } catch (error: any) {
      let errorMessage = 'Failed to upload workers';
      
      // Check for error response with error message
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setTableData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="py-4 px-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Workers
          </button>
        </div>
      </div>

      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Bulk Upload Workers</h1>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Download Template</h2>
                  <p className="text-gray-600 mb-4">
                    Download our template to ensure your worker data is formatted correctly.
                  </p>
                  <button
                    onClick={handleDownloadSampleCSV}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Template
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Workers</h2>
                  <p className="text-gray-600 mb-4">
                    Upload your completed CSV or Excel file (xlsx/xls) to add multiple workers at once.
                  </p>
                  
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {!tableData ? (
                    <div className="mt-2">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                          <div className="space-y-1 text-center">
                            <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="sr-only"
                                onChange={handleFileUpload}
                              />
                            </div>
                            <p className="text-xs text-gray-500">CSV or Excel files up to 10MB</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {selectedFile?.name}
                          </span>
                          <button
                            onClick={clearFile}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <button
                          onClick={handleUpload}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Upload Workers
                        </button>
                      </div>

                      <div className="mt-4 border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {tableData.headers.map((header, index) => (
                                  <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {tableData.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}