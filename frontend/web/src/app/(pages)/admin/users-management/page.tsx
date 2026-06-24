'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';

import { fadeUpSpring, rowVariants } from '@/features/admin/animations/variants';
import { Avatar } from '@/features/admin/components/users/Avatar';
import { BanDialog } from '@/features/admin/components/users/BanDialog';
import { GenderBadge } from '@/features/admin/components/users/GenderBadge';
import { ManageRolesDialog } from '@/features/admin/components/users/ManageRolesDialog';
import { StatusBadge } from '@/features/admin/components/users/StatusBadge';
import { GENDER_OPTIONS } from '@/features/admin/constants/users.constants';
import { useAdmin } from '@/features/admin/hooks/useAdmin';
import type { UserProfile, RoleApi } from '@/features/admin/types/admin.type';

const columnHelper = createColumnHelper<UserProfile>();

export default function AdminUsersPage() {
  const {
    useUserProfiles,
    banUser,
    unbanUser,
    isBanningUser,
    isUnbanningUser,
    useRolesApi,
    useUserRoles,
    assignUserRole,
    revokeUserRole,
    isAssigningRole,
    isRevokingRole,
  } = useAdmin();

  const [nameSearch, setNameSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [skeletonIds] = useState(() => Array.from({ length: 6 }, () => Math.random().toString(36).slice(2)));

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedName(nameSearch); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [nameSearch]);

  const handleGenderChange = (val: string) => { setGenderFilter(val); setPage(1); };

  const { data, isLoading, isError, refetch } = useUserProfiles({
    page,
    limit,
    full_name: debouncedName || undefined,
    gender: genderFilter || undefined,
  });

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Ban state
  const [banTarget, setBanTarget] = useState<UserProfile | null>(null);

  // Manage Roles state
  const [manageRolesUser, setManageRolesUser] = useState<UserProfile | null>(null);

  const { data: allRolesData } = useRolesApi({ limit: 100 });
  const {
    data: userRolesData,
    isLoading: isLoadingUserRoles,
    refetch: refetchUserRoles,
  } = useUserRoles(manageRolesUser?.user_id ?? null);

  const allRoles = allRolesData?.data ?? [];
  const userRoles = (userRolesData ?? []) as RoleApi[];
  const userRoleIds = new Set(userRoles.map((r) => r.role_id));

  const handleToggleRole = async (roleId: string, hasRole: boolean) => {
    if (!manageRolesUser) return;
    try {
      if (hasRole) {
        await revokeUserRole({ userId: manageRolesUser.user_id, roleId });
      } else {
        await assignUserRole({ userId: manageRolesUser.user_id, roleId });
      }
      refetchUserRoles();
    } catch {
      // silently ignore
    }
  };

  const handleBan = async (reason: string) => {
    if (!banTarget) return;
    await banUser({ id: banTarget.user_id, request: { reason: reason || undefined } });
    setBanTarget(null);
  };

  const handleUnban = useCallback(async (user: UserProfile) => {
    await unbanUser(user.user_id);
  }, [unbanUser]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'avatar',
      header: '',
      cell: ({ row }) => <Avatar profile={row.original} />,
      size: 52,
    }),
    columnHelper.accessor('full_name', {
      header: 'User',
      cell: ({ row }) => (
        <div>
          <p className="font-inter text-sm font-semibold text-smile-primary-dark">{row.original.full_name}</p>
          <p className="font-inter text-[11px] text-smile-description">{row.original.email ?? '—'}</p>
        </div>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="font-inter text-xs text-smile-title">{getValue() ?? '—'}</span>
      ),
    }),
    columnHelper.accessor('gender', {
      header: 'Gender',
      cell: ({ getValue }) => <GenderBadge gender={getValue()} />,
    }),
    columnHelper.accessor('is_banned', {
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge isBanned={getValue()} />,
    }),
    columnHelper.accessor('created_at', {
      header: 'Joined',
      cell: ({ getValue }) => (
        <span className="font-inter text-xs text-smile-description">
          {new Date(getValue()).toLocaleDateString('vi-VN')}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setManageRolesUser(user)}
              className="flex items-center gap-1.5 rounded-lg border border-violet-300/60 bg-violet-50 px-3 py-1.5 font-inter text-xs font-semibold text-violet-700 shadow-sm transition-all hover:border-violet-400 hover:bg-violet-500 hover:text-white hover:shadow-md dark:border-violet-700/40 dark:bg-violet-950/40 dark:text-violet-400"
            >
              <Icon icon="lucide:shield-half" width={12} />
              Roles
            </button>
            {user.is_banned ? (
              <button
                type="button"
                onClick={() => handleUnban(user)}
                disabled={isUnbanningUser}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-emerald-50 px-3 py-1.5 font-inter text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-md disabled:opacity-50 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                {isUnbanningUser
                  ? <Icon icon="line-md:loading-twotone-loop" width={12} />
                  : <Icon icon="lucide:shield-check" width={12} />}
                Unban
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setBanTarget(user)}
                disabled={isBanningUser}
                className="flex items-center gap-1.5 rounded-lg border border-red-300/60 bg-red-50 px-3 py-1.5 font-inter text-xs font-semibold text-red-600 shadow-sm transition-all hover:border-red-400 hover:bg-red-500 hover:text-white hover:shadow-md disabled:opacity-50 dark:border-red-700/40 dark:bg-red-950/40 dark:text-red-400"
              >
                <Icon icon="lucide:ban" width={12} />
                Ban
              </button>
            )}
          </div>
        );
      },
    }),
  ], [isBanningUser, isUnbanningUser, handleUnban]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const glassCard = {
    background: 'var(--surface-card-bg)',
    borderColor: 'var(--surface-card-border)',
    boxShadow: 'var(--surface-card-shadow)',
  };
  const glassPanel = {
    background: 'var(--surface-panel-bg)',
    borderColor: 'var(--surface-panel-border)',
    boxShadow: 'var(--surface-panel-shadow)',
  };
  const inputStyle = {
    background: 'var(--surface-input-bg)',
    borderColor: 'var(--surface-input-border)',
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <motion.div {...fadeUpSpring(0)}>
        <div className="relative overflow-hidden rounded-[24px] border backdrop-blur-xl" style={glassPanel}>
          <div className="absolute inset-x-0 top-0 h-[2.5px] rounded-t-[24px] bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-500" />
          <div className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)' }} />
          <div className="relative flex flex-wrap items-center justify-between gap-3 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_4px_12px_rgba(59,130,246,0.35)]">
                <Icon icon="lucide:users" width={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">User Management</h1>
                <p className="font-inter text-xs text-smile-description">
                  {total > 0
                    ? <><span className="font-semibold text-smile-primary">{total}</span> users total</>
                    : 'Manage system users'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-xl border border-smile-primary/25 bg-smile-primary/5 px-4 py-2 font-inter text-sm font-semibold text-smile-primary backdrop-blur-sm transition-all hover:bg-smile-primary hover:text-white"
            >
              <Icon icon="lucide:refresh-cw" width={14} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUpSpring(0.1)}>
        <div className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl" style={glassCard}>
          <div className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 50%)' }} />
          <div className="relative p-5">
            <p className="mb-3 font-inter text-[10px] font-bold uppercase tracking-[2.5px] text-smile-description">
              Search &amp; Filter
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Icon icon="lucide:search" width={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description" />
                <input
                  className="w-full rounded-xl border py-2.5 pl-8 pr-8 font-inter text-sm text-smile-title placeholder:text-smile-description/60 transition-all focus:outline-none focus:ring-2 focus:ring-smile-primary/30"
                  style={inputStyle}
                  placeholder="Search by name..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                />
                {nameSearch && (
                  <button
                    type="button"
                    onClick={() => { setNameSearch(''); setDebouncedName(''); setPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-smile-description/60 transition-colors hover:text-smile-primary"
                  >
                    <Icon icon="lucide:x" width={12} />
                  </button>
                )}
              </div>
              <div className="relative">
                <Icon icon="lucide:user-round" width={13} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${genderFilter ? 'text-white/80' : 'text-smile-description'}`} />
                <select
                  className="cursor-pointer appearance-none rounded-xl border py-2.5 pl-8 pr-8 font-inter text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-smile-primary/30"
                  style={genderFilter ? { background: '#417EAA', borderColor: '#417EAA', color: '#fff' } : inputStyle}
                  value={genderFilter}
                  onChange={(e) => handleGenderChange(e.target.value)}
                >
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: '#fff', color: '#1a1a1a' }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Icon icon="lucide:chevron-down" width={12} className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors ${genderFilter ? 'text-white/80' : 'text-smile-description'}`} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div {...fadeUpSpring(0.2)}>
        <div className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl" style={glassCard}>
          <div className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 50%)' }} />

          <div className="relative w-full overflow-x-auto">
            {isLoading ? (
              <table className="w-full min-w-[640px]">
                <tbody>
                  {skeletonIds.map((id) => (
                    <tr key={id} className="border-b last:border-b-0" style={{ borderColor: 'var(--surface-panel-border)' }}>
                      <td className="px-4 py-3.5">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-3.5 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="mt-1.5 h-3 w-44 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
                  <Icon icon="lucide:wifi-off" width={24} className="text-red-500" />
                </div>
                <p className="font-inter text-sm font-medium text-smile-title">Failed to load users</p>
                <button type="button" onClick={() => refetch()}
                  className="rounded-xl bg-smile-primary px-4 py-2 font-inter text-xs font-semibold text-white transition-all active:scale-[0.98] hover:bg-smile-primary/90">
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-smile-primary/5">
                  <Icon icon="lucide:users" width={24} className="text-smile-description/40" />
                </div>
                <p className="font-inter text-sm text-smile-description">No users found</p>
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id} className="border-b" style={{ borderColor: 'var(--surface-panel-border)', background: 'rgba(65,126,170,0.05)' }}>
                      {hg.headers.map(h => (
                        <th key={h.id} className="whitespace-nowrap px-4 py-3.5 text-left font-inter text-[10px] font-bold uppercase tracking-[2px] text-smile-primary/70">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {table.getRowModel().rows.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: 8 }}
                        className="group border-b last:border-b-0 transition-colors duration-150 hover:bg-smile-primary/[0.04]"
                        style={{ borderColor: 'var(--surface-panel-border)' }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && !isError && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              style={{ borderTop: '1px solid var(--surface-panel-border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-smile-primary/10 px-2.5 py-1 font-inter text-xs font-semibold text-smile-primary">{total}</span>
                <span className="font-inter text-xs text-smile-description">users</span>
                <span className="text-smile-description/40">·</span>
                <span className="font-inter text-xs text-smile-description">
                  Page <span className="font-semibold text-smile-primary-dark">{page}</span>
                  {' / '}
                  <span className="font-semibold text-smile-primary-dark">{totalPages}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-smile-primary/20 text-smile-primary transition-all hover:bg-smile-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <Icon icon="lucide:chevron-left" width={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                  const p = idx + 1;
                  return (
                    <button key={p} type="button" onClick={() => setPage(p)} className={`flex h-8 w-8 items-center justify-center rounded-lg font-inter text-xs font-semibold transition-all ${page === p ? 'bg-smile-primary text-white shadow-sm' : 'border border-smile-primary/20 text-smile-primary hover:bg-smile-primary/10'}`}>
                      {p}
                    </button>
                  );
                })}
                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-smile-primary/20 text-smile-primary transition-all hover:bg-smile-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <Icon icon="lucide:chevron-right" width={14} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Ban Dialog */}
      <AnimatePresence>
        {banTarget && (
          <BanDialog
            target={banTarget}
            isBanning={isBanningUser}
            onConfirm={handleBan}
            onClose={() => setBanTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Manage Roles Dialog */}
      <AnimatePresence>
        {manageRolesUser && (
          <ManageRolesDialog
            user={manageRolesUser}
            allRoles={allRoles}
            userRoleIds={userRoleIds}
            isLoadingUserRoles={isLoadingUserRoles}
            isAssigningRole={isAssigningRole}
            isRevokingRole={isRevokingRole}
            onToggle={handleToggleRole}
            onClose={() => setManageRolesUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
