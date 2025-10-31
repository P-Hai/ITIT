import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  MapPin,
  AlertCircle,
  FileText,
  Plus,
  Loader
} from 'lucide-react';
import { patientsAPI, medicalRecordsAPI } from '../services/api';
import { format } from 'date-fns';

function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateRecord, setShowCreateRecord] = useState(false);

  // Fetch patient details
  const { data: patientData, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsAPI.getById(id),
  });

  // Fetch medical records
  const { data: recordsData } = useQuery({
    queryKey: ['medical-records', id],
    queryFn: () => medicalRecordsAPI.getByPatientId(id),
  });

  const patient = patientData?.patient;
  const records = recordsData?.records || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading patient details</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Patients
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{patient.full_name}</h2>
              <p className="text-gray-600">Patient Code: {patient.patient_code}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/patients/${id}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Patient
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
            <div className="flex items-center text-gray-900">
              <Calendar size={18} className="mr-2 text-gray-400" />
              {format(new Date(patient.date_of_birth), 'MMMM dd, yyyy')}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Gender</p>
            <p className="text-gray-900 capitalize">{patient.gender}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Blood Type</p>
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
              {patient.blood_type || 'N/A'}
            </span>
          </div>

          {patient.users?.email && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-gray-900">{patient.users.email}</p>
            </div>
          )}

          {patient.users?.phone && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <div className="flex items-center text-gray-900">
                <Phone size={18} className="mr-2 text-gray-400" />
                {patient.users.phone}
              </div>
            </div>
          )}

          {patient.address && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Address</p>
              <div className="flex items-center text-gray-900">
                <MapPin size={18} className="mr-2 text-gray-400" />
                {patient.address}
              </div>
            </div>
          )}

          {patient.allergies && (
            <div className="col-span-full">
              <p className="text-sm text-gray-500 mb-1">Allergies</p>
              <div className="flex items-start text-red-700 bg-red-50 p-3 rounded-lg">
                <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                {patient.allergies}
              </div>
            </div>
          )}

          {patient.emergency_contact_name && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Emergency Contact</p>
              <p className="text-gray-900">{patient.emergency_contact_name}</p>
              {patient.emergency_contact_phone && (
                <p className="text-sm text-gray-600">{patient.emergency_contact_phone}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Medical Records Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Medical Records</h3>
          <button
            onClick={() => navigate(`/medical-records/new?patient_id=${id}`)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus size={20} className="mr-2" />
            Add Record
          </button>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No medical records yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => navigate(`/medical-records/${record.id}`)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{record.title}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {record.record_type.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {format(new Date(record.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>

                {record.description && (
                  <p className="text-gray-600 text-sm mb-2">{record.description}</p>
                )}

                {record.diagnosis && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-700">Diagnosis: </span>
                    <span className="text-sm text-gray-600">{record.diagnosis}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    Created by: {record.users?.full_name || 'Unknown'}
                  </div>
                  {record.files?.length > 0 && (
                    <div className="text-xs text-gray-500">
                      📎 {record.files.length} file(s) attached
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDetail;