import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import CreatePatient from './pages/CreatePatient';
import MedicalRecordDetail from './pages/MedicalRecordDetail';
import CreateMedicalRecord from './pages/CreateMedicalRecord';
import AuditLogs from './pages/AuditLogs';
import useAuthStore from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/patients" replace /> : <Login />} 
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/patients" replace />
              </ProtectedRoute>
            }
          />

          {/* Patients */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'clinic_manager']}>
                <MainLayout>
                  <Patients />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}>
                <MainLayout>
                  <CreatePatient />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PatientDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Medical Records */}
          <Route
            path="/medical-records/new"
            element={
              <ProtectedRoute allowedRoles={['admin', 'doctor']}>
                <MainLayout>
                  <CreateMedicalRecord />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical-records/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MedicalRecordDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'auditor']}>
                <MainLayout>
                  <AuditLogs />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;