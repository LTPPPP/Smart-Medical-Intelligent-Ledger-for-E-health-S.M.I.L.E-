'use client';

import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import type { RoleApi, UserProfile } from '@/features/admin/types/admin.type';

interface ManageRolesDialogProps {
    user: UserProfile;
    allRoles: RoleApi[];
    userRoleIds: Set<string>;
    isLoadingUserRoles: boolean;
    isAssigningRole: boolean;
    isRevokingRole: boolean;
    onToggle: (roleId: string, hasRole: boolean) => Promise<void>;
    onClose: () => void;
}

export function ManageRolesDialog({
    user,
    allRoles,
    userRoleIds,
    isLoadingUserRoles,
    isAssigningRole,
    isRevokingRole,
    onToggle,
    onClose,
}: ManageRolesDialogProps) {
    const isBusy = isAssigningRole || isRevokingRole;

    return (
        <motion.div
            key="roles-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                key="roles-modal"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-md overflow-hidden rounded-[24px] border backdrop-blur-2xl"
                style={{
                    background: 'var(--surface-card-bg)',
                    borderColor: 'var(--surface-card-border)',
                    boxShadow: 'var(--surface-card-shadow)',
                }}
            >
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-violet-500 to-purple-600" />
                <div
                    className="pointer-events-none absolute inset-0 rounded-[24px]"
                    style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0) 50%)' }}
                />

                {/* Header */}
                <div
                    className="relative flex items-center justify-between border-b px-6 py-4"
                    style={{ borderColor: 'var(--surface-card-border)' }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                            <Icon icon="lucide:shield-half" width={18} className="text-violet-500" />
                        </div>
                        <div>
                            <h3 className="font-poppins text-base font-semibold text-smile-primary-dark">Manage Roles</h3>
                            <p className="font-inter text-[11px] text-smile-description">{user.full_name}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-smile-description hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <Icon icon="lucide:x" width={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="relative max-h-[60vh] overflow-y-auto px-6 py-4">
                    {isLoadingUserRoles ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                            <span className="ml-2 font-inter text-sm text-smile-description">Loading roles…</span>
                        </div>
                    ) : allRoles.length === 0 ? (
                        <p className="py-8 text-center font-inter text-sm text-smile-description">No roles available</p>
                    ) : (
                        <div className="space-y-2">
                            {allRoles.map((role) => {
                                const hasRole = userRoleIds.has(role.role_id);
                                return (
                                    <div
                                        key={role.role_id}
                                        className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${hasRole
                                                ? 'border-violet-300/60 bg-violet-50 dark:border-violet-700/40 dark:bg-violet-950/30'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`flex h-7 w-7 items-center justify-center rounded-lg ${hasRole ? 'bg-violet-500/15' : 'bg-gray-100 dark:bg-white/10'
                                                    }`}
                                            >
                                                <Icon
                                                    icon="lucide:shield-half"
                                                    width={14}
                                                    className={hasRole ? 'text-violet-600 dark:text-violet-400' : 'text-smile-description'}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-inter text-sm font-semibold text-smile-primary-dark">{role.role_name}</p>
                                                {role.description && (
                                                    <p className="font-inter text-[11px] text-smile-description line-clamp-1">
                                                        {role.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => onToggle(role.role_id, hasRole)}
                                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${hasRole
                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-400'
                                                    : 'bg-violet-100 text-violet-600 hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-400'
                                                }`}
                                            title={hasRole ? 'Revoke role' : 'Assign role'}
                                        >
                                            {isBusy ? (
                                                <Icon icon="line-md:loading-twotone-loop" width={13} />
                                            ) : hasRole ? (
                                                <Icon icon="lucide:minus" width={13} />
                                            ) : (
                                                <Icon icon="lucide:plus" width={13} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="relative border-t px-6 py-4"
                    style={{ borderColor: 'var(--surface-card-border)' }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl border border-smile-primary/20 py-2 font-inter text-sm font-medium text-smile-title transition-all hover:bg-smile-primary-light"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
