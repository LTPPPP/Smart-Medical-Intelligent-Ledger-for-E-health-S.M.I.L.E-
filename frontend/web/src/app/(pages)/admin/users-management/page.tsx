'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import type { UserManagement } from '@/features/admin/types/admin.type';
import { useAdmin } from '@/features/admin/hooks/useAdmin';

import { UsersTable } from '@/features/admin/components/UsersTable';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { Loading } from '@/shared/components/common/Loading';

export default function AdminUsersPage() {
  const { useUsers, lockUser, unlockUser, updateUserRoles, isLockingUser, isUnlockingUser } = useAdmin();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
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
    } catch {
      alert('Failed to lock user');
    }
  };

  const handleUnlockUser = async (user: UserManagement) => {
    try {
      await unlockUser(user.userId);
    } catch {
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
    } catch {
      alert('Failed to update roles');
    }
  };

  if (isLoading) return <Loading fullScreen text="Loading users..." />;
  if (error) return <ErrorMessage message="Failed to load users" onRetry={refetch} />;

  const users = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div
        className="relative overflow-hidden rounded-[24px] border backdrop-blur-xl"
        style={{
          background: "var(--surface-panel-bg)",
          borderColor: "var(--surface-panel-border)",
          boxShadow: "var(--surface-panel-shadow)",
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-blue-500 to-cyan-500" />
        <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />
        <div className="relative flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Icon icon="lucide:users" width={20} className="text-blue-500" />
            </div>
            <div>
              <h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">User Management</h1>
              <p className="font-inter text-xs text-smile-description">Manage system users and permissions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-smile-primary/25 bg-smile-primary/5 px-4 py-2 font-inter text-sm font-semibold text-smile-primary backdrop-blur-sm transition-all hover:bg-smile-primary hover:text-white"
          >
            <Icon icon="lucide:refresh-cw" width={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table card */}
      <div
        className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl"
        style={{
          background: "var(--surface-card-bg)",
          borderColor: "var(--surface-card-border)",
          boxShadow: "var(--surface-card-shadow)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[22px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)" }} />
        <div className="relative">
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

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: "1px solid var(--surface-panel-border)" }}
          >
            <span className="font-inter text-sm text-smile-description">
              Showing <span className="font-semibold text-smile-primary-dark">{users.length}</span> of{' '}
              <span className="font-semibold text-smile-primary-dark">{data?.data?.totalElements || 0}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 rounded-xl border border-smile-primary/20 px-3 py-1.5 font-inter text-sm font-medium text-smile-primary transition-all hover:bg-smile-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon icon="lucide:chevron-left" width={14} />
                Prev
              </button>
              <span className="rounded-xl bg-smile-primary-light px-4 py-1.5 font-inter text-sm font-semibold text-smile-primary">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 rounded-xl border border-smile-primary/20 px-3 py-1.5 font-inter text-sm font-medium text-smile-primary transition-all hover:bg-smile-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <Icon icon="lucide:chevron-right" width={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lock Dialog */}
      {showLockDialog && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-[24px] border backdrop-blur-2xl"
            style={{
              background: "var(--surface-card-bg)",
              borderColor: "var(--surface-card-border)",
              boxShadow: "var(--surface-card-shadow)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-red-500 to-orange-500" />
            <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />
            <div className="relative p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                  <Icon icon="lucide:lock" className="text-red-600" width={22} />
                </div>
                <div>
                  <h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">Lock User Account</h3>
                  <p className="font-inter text-xs text-smile-description">This will restrict user access</p>
                </div>
              </div>
              <p className="mb-4 font-inter text-sm text-smile-title">
                Lock account for <span className="font-semibold text-smile-primary-dark">{selectedUser.fullName}</span>?
              </p>
              <textarea
                className="mb-4 w-full rounded-xl border px-4 py-3 font-inter text-sm text-smile-title backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-400/50"
                style={{
                  background: "var(--surface-input-bg)",
                  borderColor: "var(--surface-input-border)",
                }}
                rows={3}
                placeholder="Enter reason for locking..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowLockDialog(false); setLockReason(''); setSelectedUser(null); }}
                  className="rounded-xl border border-smile-primary/20 px-4 py-2 font-inter text-sm font-medium text-smile-title transition-all hover:bg-smile-primary-light"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLockUser}
                  disabled={!lockReason.trim() || isLockingUser}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLockingUser && <Icon icon="line-md:loading-twotone-loop" width={14} />}
                  {isLockingUser ? 'Locking...' : 'Lock User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Roles Dialog */}
      {showRolesDialog && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-[24px] border backdrop-blur-2xl"
            style={{
              background: "var(--surface-card-bg)",
              borderColor: "var(--surface-card-border)",
              boxShadow: "var(--surface-card-shadow)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-blue-500 to-violet-500" />
            <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />
            <div className="relative p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <Icon icon="lucide:user-cog" className="text-blue-600" width={22} />
                </div>
                <div>
                  <h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">Edit User Roles</h3>
                  <p className="font-inter text-xs text-smile-description">{selectedUser.fullName}</p>
                </div>
              </div>

              <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                {availableRoles.map((role) => (
                  <label
                    key={role.roleId}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all hover:border-smile-primary/30 hover:bg-smile-primary-light/40"
                    style={{ borderColor: "var(--surface-panel-border)" }}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-smile-primary"
                      checked={selectedRoles.includes(role.roleName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, role.roleName]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(r => r !== role.roleName));
                        }
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-inter text-sm font-semibold text-smile-primary-dark">{role.roleName}</p>
                      <p className="font-inter text-xs text-smile-description">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowRolesDialog(false); setSelectedUser(null); setSelectedRoles([]); }}
                  className="rounded-xl border border-smile-primary/20 px-4 py-2 font-inter text-sm font-medium text-smile-title transition-all hover:bg-smile-primary-light"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRoles}
                  className="rounded-xl bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-smile-primary/90"
                >
                  Update Roles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}