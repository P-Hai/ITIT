import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Trash2,
  Loader,
  FileText,
  AlertCircle
} from 'lucide-react';
import { medicalRecordsAPI, filesAPI } from '../services/api';
import { format } from 'date-fns';
import useAuthStore from '../store/authStore';

function MedicalRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Fetch medical record
  const { data, isLoading, error } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: () => medicalRecordsAPI.getById(id),
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: filesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['medical-record', id]);
    },
  });

  const record = data?.record;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      await filesAPI.upload(file, id);
      queryClient.invalidateQueries(['medical-record', id]);
      e.target.value = ''; // Reset input
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      const response = await filesAPI.download(fileId);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    deleteMutation.mutate(fileId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading medical record</p>
      </div>
    );
  }

  const canUpload = ['admin', 'doctor', 'nurse'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/patients/${record.patient_id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Patient
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Medical Record</h1>
      </div>

      {/* Record Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{record.title}</h2>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
              {record.record_type.replace('_', ' ')}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-gray-900">{format(new Date(record.created_at), 'PPP')}</p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          {/* Patient Info */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Patient</h3>
            <p className="text-gray-900">{record.patients?.full_name}</p>
            <p className="text-sm text-gray-500">Code: {record.patients?.patient_code}</p>
          </div>

          {/* Description */}
          {record.description && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{record.description}</p>
            </div>
          )}

          {/* Diagnosis */}
          {record.diagnosis && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Diagnosis</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{record.diagnosis}</p>
            </div>
          )}

          {/* Treatment */}
          {record.treatment && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Treatment</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{record.treatment}</p>
            </div>
          )}

          {/* Created By */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Created By</h3>
            <p className="text-gray-900">{record.users?.full_name}</p>
            <p className="text-sm text-gray-500 capitalize">{record.users?.role}</p>
          </div>
        </div>
      </div>

      {/* Files Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Attached Files</h3>
          {canUpload && (
            <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
              <Upload size={20} className="mr-2" />
              Upload File
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </label>
          )}
        </div>

        {uploadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{uploadError}</span>
          </div>
        )}

        {uploading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
            <Loader className="animate-spin text-blue-600 mr-2" size={20} />
            <span className="text-sm text-blue-800">Uploading and encrypting file...</span>
          </div>
        )}

        {record.files && record.files.length > 0 ? (
          <div className="space-y-3">
            {record.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center flex-1">
                  <FileText className="text-gray-400 mr-3" size={24} />
                  <div>
                    <p className="text-gray-900 font-medium">{file.original_filename}</p>
                    <p className="text-sm text-gray-500">
                      {(file.file_size / 1024).toFixed(2)} KB • 
                      Uploaded {format(new Date(file.uploaded_at), 'PPP')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFileDownload(file.id, file.original_filename)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No files attached yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicalRecordDetail;