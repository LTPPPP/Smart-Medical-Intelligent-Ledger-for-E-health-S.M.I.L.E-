'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import type { Role, Permission } from '@/features/admin/types/admin.type';
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
    } catch {
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
    } catch {
      alert('Failed to update role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete role "${role.roleName}"?`)) return;

    try {
      await deleteRole(role.roleId);
    } catch {
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
    } catch {
      alert('Failed to update permissions');
    }
  };

  if (isLoadingRoles) return <Loading fullScreen text="Loading roles..." />;
  if (rolesError) return <ErrorMessage message="Failed to load roles" onRetry={refetch} />;

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
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-violet-500 to-purple-600" />
        <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />
        <div className="relative flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Icon icon="lucide:shield-half" width={20} className="text-violet-500" />
            </div>
            <div>
              <h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">Role Management</h1>
              <p className="font-inter text-xs text-smile-description">Manage system roles and permissions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-smile-primary/90 hover:shadow-[0_4px_14px_rgba(65,126,170,0.4)]"
          >
            <Icon icon="lucide:plus" width={15} />
            Create Role
          </button>
        </div>
      </div>

      {/* Roles grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role: Role) => (
          <div
            key={role.roleId}
            className="group relative overflow-hidden rounded-[22px] border backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(65,126,170,0.15)]"
            style={{
              background: "var(--surface-card-bg)",
              borderColor: "var(--surface-card-border)",
              boxShadow: "var(--surface-card-shadow)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px] bg-gradient-to-r from-violet-500 to-purple-500" />
            <div className="pointer-events-none absolute inset-0 rounded-[22px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)" }} />

            <div className="relative p-5">
              {/* Role header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                    <Icon icon="lucide:shield-half" width={17} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-poppins text-sm font-semibold text-smile-primary-dark">{role.roleName}</h3>
                    <p className="font-inter text-[11px] text-smile-description">{role.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { setSelectedRole(role); setFormData({ roleName: role.roleName, description: role.description }); setShowEditDialog(true); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-smile-primary-light text-smile-description hover:text-smile-primary"
                  >
                    <Icon icon="lucide:pencil" width={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(role)}
                    disabled={isDeletingRole}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-red-100 text-smile-description hover:text-red-600 dark:hover:bg-red-900/30 disabled:opacity-40"
                  >
                    <Icon icon="lucide:trash-2" width={14} />
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <p className="mb-2 font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">
                  Permissions ({role.permissions.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {role.permissions.slice(0, 5).map((perm) => (
                    <span
                      key={perm}
                      className="rounded-lg bg-smile-primary-light px-2 py-0.5 font-inter text-[10px] font-medium text-smile-primary"
                    >
                      {perm}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="rounded-lg bg-smile-primary/10 px-2 py-0.5 font-inter text-[10px] font-medium text-smile-primary">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                  {role.permissions.length === 0 && (
                    <span className="font-inter text-[11px] text-smile-description">No permissions</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setSelectedRole(role); setSelectedPermissions(role.permissions); setShowPermissionsDialog(true); }}
                className="w-full rounded-xl border border-smile-primary/30 py-2 font-inter text-sm font-semibold text-smile-primary transition-all hover:bg-smile-primary hover:text-white hover:shadow-[0_4px_14px_rgba(65,126,170,0.35)]"
              >
                Manage Permissions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Glassy dialog helper */}
      {(showCreateDialog || showEditDialog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-[24px] border backdrop-blur-2xl"
            style={{
              background: "var(--surface-card-bg)",
              borderColor: "var(--surface-card-border)",
              boxShadow: "var(--surface-card-shadow)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-violet-500 to-purple-600" />
            <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />
            <div className="relative p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                  <Icon icon={showCreateDialog ? "lucide:plus-circle" : "lucide:pencil"} width={20} className="text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">
                  {showCreateDialog ? 'Create New Role' : 'Edit Role'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="roleName" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">Role Name</label>
                  <input
                    id="roleName"
                    className="w-full rounded-xl border px-4 py-2.5 font-inter text-sm text-smile-title backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                    style={{ background: "var(--surface-input-bg)", borderColor: "var(--surface-input-border)" }}
                    placeholder="e.g., supervisor"
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="roleDesc" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description">Description</label>
                  <textarea
                    id="roleDesc"
                    className="w-full rounded-xl border px-4 py-2.5 font-inter text-sm text-smile-title backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                    style={{ background: "var(--surface-input-bg)", borderColor: "var(--surface-input-border)" }}
                    rows={3}
                    placeholder="Describe this role..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); setSelectedRole(null); setFormData({ roleName: '', description: '' }); }}
                  className="rounded-xl border border-smile-primary/20 px-4 py-2 font-inter text-sm font-medium text-smile-title transition-all hover:bg-smile-primary-light"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={showCreateDialog ? handleCreateRole : handleUpdateRole}
                  disabled={!formData.roleName.trim() || isCreatingRole || isUpdatingRole}
                  className="flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-smile-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {(isCreatingRole || isUpdatingRole) && <Icon icon="line-md:loading-twotone-loop" width={14} />}
                  {showCreateDialog ? (isCreatingRole ? 'Creating...' : 'Create') : (isUpdatingRole ? 'Updating...' : 'Update')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPermissionsDialog && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative mx-4 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border backdrop-blur-2xl"
            style={{
              background: "var(--surface-card-bg)",
              borderColor: "var(--surface-card-border)",
              boxShadow: "var(--surface-card-shadow)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-violet-500 to-purple-600" />
            <div className="pointer-events-none absolute inset-0 rounded-[24px]" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)" }} />

            {/* Header */}
            <div className="relative shrink-0 px-6 pb-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                  <Icon icon="lucide:key-round" width={20} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">Manage Permissions</h3>
                  <p className="font-inter text-xs text-smile-description">{selectedRole.roleName}</p>
                </div>
              </div>
            </div>

            {/* Permissions list */}
            <div className="relative min-h-0 flex-1 overflow-y-auto px-6 pb-2">
              {isLoadingPermissions ? (
                <Loading text="Loading permissions..." />
              ) : (
                <div className="space-y-2">
                  {allPermissions.map((perm: Permission) => (
                    <label
                      key={perm.permissionId}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all hover:border-violet-400/30 hover:bg-violet-50/40 dark:hover:bg-violet-900/20"
                      style={{ borderColor: "var(--surface-panel-border)" }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-violet-600"
                        checked={selectedPermissions.includes(perm.permissionName)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.permissionName]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm.permissionName));
                          }
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-inter text-sm font-semibold text-smile-primary-dark">{perm.permissionName}</p>
                        <p className="font-inter text-xs text-smile-description">{perm.description}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-smile-primary-light px-2 py-1 font-inter text-[10px] font-semibold text-smile-primary">
                        {perm.resource}:{perm.action}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="relative shrink-0 flex justify-end gap-2 px-6 pb-6 pt-4"
              style={{ borderTop: "1px solid var(--surface-panel-border)" }}
            >
              <button
                type="button"
                onClick={() => { setShowPermissionsDialog(false); setSelectedRole(null); setSelectedPermissions([]); }}
                className="rounded-xl border border-smile-primary/20 px-4 py-2 font-inter text-sm font-medium text-smile-title transition-all hover:bg-smile-primary-light"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePermissions}
                disabled={isUpdatingRolePermissions}
                className="flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-smile-primary/90 disabled:opacity-50"
              >
                {isUpdatingRolePermissions && <Icon icon="line-md:loading-twotone-loop" width={14} />}
                {isUpdatingRolePermissions ? 'Updating...' : 'Update Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}