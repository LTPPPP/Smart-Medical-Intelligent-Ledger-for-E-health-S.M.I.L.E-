'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

import type { RoleApi } from '@/features/admin/types/admin.type';
import { useAdmin } from '@/features/admin/hooks/useAdmin';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
};

const dialogAnim = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.18 } },
};

const colHelper = createColumnHelper<RoleApi>();

export default function AdminRolesManagementPage() {
  const { useRolesApi, createRoleApi, deleteRoleApi, isCreatingRole, isDeletingRole } = useAdmin();

  // ── Pagination & search state
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useRolesApi({
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
  });

  const roles = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Create-role dialog
  const [showCreate, setShowCreate] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [createError, setCreateError] = useState('');

  const openCreate = () => {
    setRoleName('');
    setRoleDesc('');
    setCreateError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!roleName.trim()) { setCreateError('Role name is required'); return; }
    try {
      await createRoleApi({ role_name: roleName.trim(), description: roleDesc.trim() || undefined });
      setShowCreate(false);
      refetch();
    } catch {
      setCreateError('Failed to create role. Name may already exist.');
    }
  };

  // Delete role
  const handleDelete = useCallback(async (role: RoleApi) => {
    if (!confirm(`Delete role "${role.role_name}"? This cannot be undone.`)) return;
    try {
      await deleteRoleApi(role.role_id);
      refetch();
    } catch {
      alert('Failed to delete role.');
    }
  }, [deleteRoleApi, refetch]);

  // TanStack Table columns
  const columns = [
    colHelper.accessor('role_name', {
      header: 'Role Name',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-2.5 py-1 font-inter text-xs font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
          <Icon icon="lucide:shield-half" width={11} />
          {getValue()}
        </span>
      ),
    }),
    colHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="font-inter text-sm text-smile-description line-clamp-2">
          {getValue() ?? <span className="italic opacity-50">No description</span>}
        </span>
      ),
    }),
    colHelper.accessor('created_at', {
      header: 'Created',
      cell: ({ getValue }) => (
        <span className="font-inter text-sm text-smile-description">{formatDate(getValue())}</span>
      ),
    }),
    colHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleDelete(row.original)}
          disabled={isDeletingRole}
          className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
          title="Delete role"
        >
          <Icon icon="lucide:trash-2" width={15} />
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  // Pagination helpers
  const pageNums = (): number[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <div
          className="relative overflow-hidden rounded-[24px] border backdrop-blur-xl"
          style={{
            background: 'var(--surface-panel-bg)',
            borderColor: 'var(--surface-panel-border)',
            boxShadow: 'var(--surface-panel-shadow)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-violet-500 to-purple-600" />
          <div
            className="pointer-events-none absolute inset-0 rounded-[24px]"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0) 50%)' }}
          />
          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Icon icon="lucide:shield-half" width={20} className="text-violet-500" />
              </div>
              <div>
                <h1 className="font-poppins text-xl font-semibold text-smile-primary-dark">
                  Role Management
                </h1>
                <p className="font-inter text-xs text-smile-description">
                  {total} role{total !== 1 ? 's' : ''} in the system
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-smile-primary/90 hover:shadow-[0_4px_14px_rgba(65,126,170,0.4)]"
            >
              <Icon icon="lucide:plus" width={15} />
              Create Role
            </button>
          </div>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div
          className="flex items-center gap-3 rounded-[18px] border px-4 py-3 backdrop-blur-xl"
          style={{
            background: 'var(--surface-card-bg)',
            borderColor: 'var(--surface-card-border)',
            boxShadow: 'var(--surface-card-shadow)',
          }}
        >
          <div className="relative flex-1">
            <Icon
              icon="lucide:search"
              width={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-smile-description"
            />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg py-2 pl-9 pr-3 font-inter text-sm outline-none"
              style={{
                background: 'var(--surface-input-bg)',
                border: '1px solid var(--surface-input-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <div
          className="overflow-hidden rounded-[22px] border backdrop-blur-xl"
          style={{
            background: 'var(--surface-card-bg)',
            borderColor: 'var(--surface-card-border)',
            boxShadow: 'var(--surface-card-shadow)',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-smile-primary border-t-transparent" />
              <span className="ml-3 font-inter text-sm text-smile-description">Loading roles…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Icon icon="lucide:alert-circle" width={32} className="text-red-400" />
              <p className="font-inter text-sm text-red-500">Failed to load roles</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Icon icon="lucide:shield-off" width={32} className="text-smile-description opacity-40" />
              <p className="font-inter text-sm text-smile-description">
                {debouncedSearch ? `No roles match "${debouncedSearch}"` : 'No roles found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr
                      key={hg.id}
                      className="border-b"
                      style={{ borderColor: 'var(--surface-card-border)' }}
                    >
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-5 py-3.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wider text-smile-description"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  <AnimatePresence>
                    {table.getRowModel().rows.map((row) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b transition-colors last:border-0 hover:bg-smile-primary/5"
                        style={{ borderColor: 'var(--surface-card-border)' }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-5 py-3.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!isLoading && !error && total > LIMIT && (
            <div
              className="flex items-center justify-between border-t px-5 py-3"
              style={{ borderColor: 'var(--surface-card-border)' }}
            >
              <p className="font-inter text-xs text-smile-description">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg p-1.5 text-smile-description transition-colors hover:bg-smile-primary/10 hover:text-smile-primary disabled:opacity-40"
                >
                  <Icon icon="lucide:chevron-left" width={16} />
                </button>
                {pageNums().map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setPage(n)}
                    className="h-7 w-7 rounded-lg font-inter text-xs font-medium transition-colors"
                    style={
                      n === page
                        ? { background: '#417EAA', color: '#fff' }
                        : { color: 'var(--color-text-secondary)' }
                    }
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg p-1.5 text-smile-description transition-colors hover:bg-smile-primary/10 hover:text-smile-primary disabled:opacity-40"
                >
                  <Icon icon="lucide:chevron-right" width={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Create Role Dialog */}
      <AnimatePresence>
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          >
            {/* clickable backdrop */}
            <button
              type="button"
              aria-label="Close dialog"
              className="absolute inset-0 cursor-default"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              variants={dialogAnim}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-[22px] border backdrop-blur-xl"
              style={{
                background: 'var(--surface-panel-bg)',
                borderColor: 'var(--surface-panel-border)',
                boxShadow: 'var(--surface-panel-shadow)',
              }}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px] bg-gradient-to-r from-violet-500 to-purple-600" />

              {/* Dialog header */}
              <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <Icon icon="lucide:shield-plus" width={16} className="text-violet-500" />
                  </div>
                  <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Create Role</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1.5 text-smile-description hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <Icon icon="lucide:x" width={16} />
                </button>
              </div>

              {/* Dialog body */}
              <div className="space-y-4 px-6 py-5">
                {createError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <Icon icon="lucide:alert-circle" width={15} className="shrink-0 text-red-500" />
                    <p className="font-inter text-xs text-red-600 dark:text-red-400">{createError}</p>
                  </div>
                )}
                <div>
                  <label htmlFor="create-role-name" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="create-role-name"
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. DOCTOR"
                    maxLength={50}
                    className="w-full rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                    style={{
                      background: 'var(--surface-input-bg)',
                      border: '1px solid var(--surface-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="create-role-desc" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                    Description
                  </label>
                  <textarea
                    id="create-role-desc"
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full resize-none rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                    style={{
                      background: 'var(--surface-input-bg)',
                      border: '1px solid var(--surface-input-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Dialog footer */}
              <div className="flex justify-end gap-2.5 border-t px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl px-4 py-2 font-inter text-sm font-medium text-smile-description transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreatingRole || !roleName.trim()}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 font-inter text-sm font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-60"
                >
                  {isCreatingRole ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Icon icon="lucide:plus" width={14} />
                  )}
                  Create Role
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
