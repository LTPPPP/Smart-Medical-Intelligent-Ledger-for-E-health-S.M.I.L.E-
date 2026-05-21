'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import { Role, Permission } from '@/features/admin/types/admin.type';
import { useAdmin } from '@/features/admin/hooks/useAdmin';

import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { Loading } from '@/shared/components/common/Loading';

export default function AdminRolesPage() {
  const { 
    useRoles, 
    usePermissions, 
    createRole, 
    updateRole, 
    deleteRole,
    updateRolePermissions,
    isCreatingRole,
    isUpdatingRole,
    isDeletingRole,
    isUpdatingRolePermissions
  } = useAdmin();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ roleName: '', description: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: rolesData, isLoading: isLoadingRoles, error: rolesError, refetch } = useRoles();
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();

  const roles = rolesData?.data || [];
  const allPermissions = permissionsData?.data || [];

  const handleCreateRole = async () => {
    if (!formData.roleName.trim()) return;

    try {
      await createRole(formData);
      setShowCreateDialog(false);
      setFormData({ roleName: '', description: '' });
    } catch (err) {
      alert('Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !formData.roleName.trim()) return;

    try {
      await updateRole({ roleId: selectedRole.roleId, request: formData });
      setShowEditDialog(false);
      setSelectedRole(null);
      setFormData({ roleName: '', description: '' });
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete role "${role.roleName}"?`)) return;

    try {
      await deleteRole(role.roleId);
    } catch (err) {
      alert('Failed to delete role');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedRole) return;

    try {
      await updateRolePermissions({
        roleId: selectedRole.roleId,
        request: { permissionNames: selectedPermissions }
      });
      setShowPermissionsDialog(false);
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (err) {
      alert('Failed to update permissions');
    }
  };

  if (isLoadingRoles) return <Loading fullScreen text="Loading roles..." />;
  if (rolesError) return <ErrorMessage message="Failed to load roles" onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Role Management</h1>
            <p className="text-gray-600 mt-1">Manage system roles and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
          >
            <Icon icon="mdi:plus" width={20} />
            Create Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role: Role) => (
            <div key={role.roleId} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{role.roleName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setFormData({ roleName: role.roleName, description: role.description });
                      setShowEditDialog(true);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Icon icon="mdi:pencil" width={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    disabled={isDeletingRole}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Icon icon="mdi:delete" width={18} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Permissions ({role.permissions.length})
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <span key={perm} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {perm}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedRole(role);
                  setSelectedPermissions(role.permissions);
                  setShowPermissionsDialog(true);
                }}
                className="w-full border-2 border-blue-500 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-medium"
              >
                Manage Permissions
              </button>
            </div>
          ))}
        </div>
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., supervisor"
                  value={formData.roleName}
                  onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Describe this role..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setFormData({ roleName: '', description: '' });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!formData.roleName.trim() || isCreatingRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreatingRole ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditDialog && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Edit Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.roleName}
                  onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedRole(null);
                  setFormData({ roleName: '', description: '' });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={!formData.roleName.trim() || isUpdatingRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdatingRole ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsDialog && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Manage Permissions for: {selectedRole.roleName}</h3>
            
            {isLoadingPermissions ? (
              <Loading text="Loading permissions..." />
            ) : (
              <div className="space-y-2 mb-4">
                {allPermissions.map((perm: Permission) => (
                  <label key={perm.permissionId} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selectedPermissions.includes(perm.permissionName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, perm.permissionName]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== perm.permissionName));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{perm.permissionName}</div>
                      <div className="text-sm text-gray-500">{perm.description}</div>
                    </div>
                    <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {perm.resource}:{perm.action}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end border-t pt-4">
              <button
                onClick={() => {
                  setShowPermissionsDialog(false);
                  setSelectedRole(null);
                  setSelectedPermissions([]);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePermissions}
                disabled={isUpdatingRolePermissions}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdatingRolePermissions ? 'Updating...' : 'Update Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}