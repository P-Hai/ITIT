import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import { medicalRecordsAPI, patientsAPI } from '../services/api';

function CreateMedicalRecord() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patient_id');

  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    patient_id: patientIdFromUrl || '',
    record_type: 'consultation_note',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
  });

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsAPI.getAll({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: medicalRecordsAPI.create,
    onSuccess: (data) => {
      navigate(`/medical-records/${data.record.id}`);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to create medical record');
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Create Medical Record</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              required
              value={formData.patient_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Patient</option>
              {patientsData?.patients?.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.patient_code} - {patient.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Record Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Record Type <span className="text-red-500">*</span>
            </label>
            <select
              name="record_type"
              required
              value={formData.record_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="consultation_note">Consultation Note</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="lab_result">Lab Result</option>
              <option value="prescription">Prescription</option>
              <option value="imaging">Imaging</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Check-up Results"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Detailed description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnosis
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              rows={3}
              placeholder="Clinical diagnosis..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treatment Plan
            </label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              rows={3}
              placeholder="Prescribed treatment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {createMutation.isPending && (
                <Loader className="animate-spin mr-2" size={18} />
              )}
              Create Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMedicalRecord;