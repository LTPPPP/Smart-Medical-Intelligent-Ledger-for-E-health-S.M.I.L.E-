'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { dialogVariants } from '@/features/admin/animations/variants';
import { useEscapeToClose } from '@/shared/hooks/useEscapeToClose';

interface CreateRoleDialogProps {
    isLoading: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string) => Promise<void>;
}

export function CreateRoleDialog({ isLoading, onClose, onCreate }: CreateRoleDialogProps) {
    const [roleName, setRoleName] = useState('');
    const [roleDesc, setRoleDesc] = useState('');
    const [error, setError] = useState('');
    const roleNameInputRef = useRef<HTMLInputElement>(null);

    useEscapeToClose(onClose);

    useEffect(() => {
        roleNameInputRef.current?.focus();
    }, []);

    const handleCreate = async () => {
        if (!roleName.trim()) { setError('Role name is required'); return; }
        try {
            await onCreate(roleName.trim(), roleDesc.trim());
            onClose();
        } catch {
            setError('Failed to create role. Name may already exist.');
        }
    };

    const inputStyle = {
        background: 'var(--surface-input-bg)',
        border: '1px solid var(--surface-input-border)',
        color: 'var(--color-smile-title)',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
            <button type="button" aria-label="Close dialog" className="absolute inset-0 cursor-default" onClick={onClose} />
            <motion.div
                variants={dialogVariants}
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

                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                            <Icon icon="lucide:shield-plus" width={16} className="text-violet-500" />
                        </div>
                        <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Create Role</h2>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-smile-description hover:bg-gray-100 dark:hover:bg-white/10">
                        <Icon icon="lucide:x" width={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                            <Icon icon="lucide:alert-circle" width={15} className="shrink-0 text-red-500" />
                            <p className="font-inter text-xs text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="create-role-name" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                            Role Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="create-role-name"
                            ref={roleNameInputRef}
                            type="text"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="e.g. DOCTOR"
                            maxLength={50}
                            className="w-full rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                            style={inputStyle}
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
                            placeholder="Optional description…"
                            rows={3}
                            className="w-full resize-none rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2.5 border-t px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 font-inter text-sm font-medium text-smile-description transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={isLoading || !roleName.trim()}
                        className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 font-inter text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-violet-700 disabled:opacity-60"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Icon icon="lucide:plus" width={14} />
                        )}
                        Create Role
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
