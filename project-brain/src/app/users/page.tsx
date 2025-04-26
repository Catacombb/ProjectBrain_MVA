import { getUsersWithRoles } from '@/lib/actions/role-management';
import PermissionGate from '@/components/auth/PermissionGate';
import UserRoleSelector from '@/components/users/UserRoleSelector';

export default async function UsersPage() {
  const { users, error } = await getUsersWithRoles();
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">User Management</h1>
      
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users?.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'director' ? 'bg-blue-100 text-blue-800' : 
                            user.role === 'team' ? 'bg-green-100 text-green-800' : 
                            user.role === 'client' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <PermissionGate requiredPermission="manage:roles">
                            <UserRoleSelector userId={user.id} currentRole={user.role} />
                          </PermissionGate>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Role Permissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-purple-700 mb-2">Admin</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Manage users and roles</li>
                  <li>• Manage projects</li>
                  <li>• View analytics</li>
                  <li>• Manage content</li>
                  <li>• Manage settings</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-blue-700 mb-2">Director</h3>
                <ul className="space-y-1 text-sm">
                  <li>• View users</li>
                  <li>• Manage projects</li>
                  <li>• View analytics</li>
                  <li>• Manage content</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-green-700 mb-2">Team</h3>
                <ul className="space-y-1 text-sm">
                  <li>• View projects</li>
                  <li>• Manage content</li>
                  <li>• View analytics</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-yellow-700 mb-2">Client</h3>
                <ul className="space-y-1 text-sm">
                  <li>• View projects</li>
                  <li>• Submit content</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-gray-700 mb-2">Builder</h3>
                <ul className="space-y-1 text-sm">
                  <li>• View projects</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 