import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Filter, Loader, Calendar } from 'lucide-react';
import { auditAPI } from '../services/api';
import { format } from 'date-fns';

function AuditLogs() {
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    page: 1,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditAPI.getLogs(filters),
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1,
    });
  };

  const actionColors = {
    create: 'bg-green-100 text-green-800',
    read: 'bg-blue-100 text-blue-800',
    update: 'bg-yellow-100 text-yellow-800',
    delete: 'bg-red-100 text-red-800',
    download: 'bg-purple-100 text-purple-800',
    login: 'bg-gray-100 text-gray-800',
    logout: 'bg-gray-100 text-gray-800',
    access_denied: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Shield className="text-blue-600 mr-3" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <p className="text-gray-600">System activity and security monitoring</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <Filter size={20} className="text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="download">Download</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="access_denied">Access Denied</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <select
              name="resource_type"
              value={filters.resource_type}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Resources</option>
              <option value="patient">Patient</option>
              <option value="medical_record">Medical Record</option>
              <option value="file">File</option>
              <option value="auth">Authentication</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin text-blue-600" size={40} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error loading audit logs: {error.message}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.users?.full_name || 'System'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.users?.email || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {log.resource_type?.replace('_', ' ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details && typeof log.details === 'object' ? (
                          <pre className="text-xs bg-gray-50 p-2 rounded max-w-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing {data.logs.length} of {data.pagination.total} logs
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {filters.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= data.pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuditLogs;