'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import { UserManagement } from '@/features/admin/types/admin.type';
import { useAdmin } from '@/features/admin/hooks/useAdmin';

import { UsersTable } from '@/features/admin/components/UsersTable';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { Loading } from '@/shared/components/common/Loading';

export default function AdminUsersPage() {
  const { useUsers, lockUser, unlockUser, updateUserRoles, isLockingUser, isUnlockingUser } = useAdmin();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data, isLoading, error, refetch } = useUsers({ page, size });
  const { useRoles } = useAdmin();
  const { data: rolesData } = useRoles();

  const availableRoles = rolesData?.data || [];

  const handleLockUser = async () => {
    if (!selectedUser || !lockReason.trim()) return;

    try {
      await lockUser({ userId: selectedUser.userId, request: { reason: lockReason } });
      setShowLockDialog(false);
      setLockReason('');
      setSelectedUser(null);
    } catch (err) {
      alert('Failed to lock user');
    }
  };

  const handleUnlockUser = async (user: UserManagement) => {
    try {
      await unlockUser(user.userId);
    } catch (err) {
      alert('Failed to unlock user');
    }
  };

  const handleOpenRolesDialog = (user: UserManagement) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles);
    setShowRolesDialog(true);
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;

    try {
      await updateUserRoles({ 
        userId: selectedUser.userId, 
        request: { roleNames: selectedRoles } 
      });
      setShowRolesDialog(false);
      setSelectedUser(null);
      setSelectedRoles([]);
    } catch (err) {
      alert('Failed to update roles');
    }
  };

  if (isLoading) return <Loading fullScreen text="Loading users..." />;
  if (error) return <ErrorMessage message="Failed to load users" onRetry={refetch} />;

  const users = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and permissions</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => refetch()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <Icon icon="mdi:refresh" width={20} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <UsersTable
            data={users}
            onLock={(user) => {
              setSelectedUser(user);
              setShowLockDialog(true);
            }}
            onUnlock={handleUnlockUser}
            onEditRoles={handleOpenRolesDialog}
            isLocking={isLockingUser}
            isUnlocking={isUnlockingUser}
          />

          <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing <strong>{users.length}</strong> of <strong>{data?.data?.totalElements || 0}</strong> users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Dialog */}
      {showLockDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Icon icon="mdi:lock" className="text-red-600" width={24} />
              </div>
              <h3 className="text-xl font-bold">Lock User Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to lock <strong>{selectedUser.fullName}</strong>?
            </p>
            <textarea
              className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder="Enter reason for locking..."
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowLockDialog(false);
                  setLockReason('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLockUser}
                disabled={!lockReason.trim() || isLockingUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLockingUser ? 'Locking...' : 'Lock User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Roles Dialog */}
      {showRolesDialog && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon icon="mdi:account-edit" className="text-blue-600" width={24} />
              </div>
              <h3 className="text-xl font-bold">Edit User Roles</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Update roles for <strong>{selectedUser.fullName}</strong>
            </p>
            
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {availableRoles.map((role) => (
                <label key={role.roleId} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600"
                    checked={selectedRoles.includes(role.roleName)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.roleName]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== role.roleName));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{role.roleName}</div>
                    <div className="text-sm text-gray-500">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRolesDialog(false);
                  setSelectedUser(null);
                  setSelectedRoles([]);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRoles}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}