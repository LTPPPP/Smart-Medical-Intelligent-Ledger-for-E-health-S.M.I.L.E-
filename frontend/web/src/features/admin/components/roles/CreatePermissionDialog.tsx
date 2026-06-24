'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { dialogVariants } from '@/features/admin/animations/variants';
import type { CreatePermissionApiRequest } from '@/features/admin/types/admin.type';
import { useEscapeToClose } from '@/shared/hooks/useEscapeToClose';

const QUICK_EXAMPLES = [
    'user.read',
    'appointment.create',
    'medical_record.update',
    'payment.delete',
    'clinic.manage',
];

interface CreatePermissionDialogProps {
    isLoading: boolean;
    onClose: () => void;
    onCreate: (data: CreatePermissionApiRequest) => Promise<void>;
}

export function CreatePermissionDialog({ isLoading, onClose, onCreate }: CreatePermissionDialogProps) {
    const [permName, setPermName] = useState('');
    const [resource, setResource] = useState('');
    const [action, setAction] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const resourceInputRef = useRef<HTMLInputElement>(null);

    useEscapeToClose(onClose);

    useEffect(() => {
        resourceInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (resource.trim() && action.trim()) {
            setPermName(`${resource.trim().toLowerCase()}.${action.trim().toLowerCase()}`);
        }
    }, [resource, action]);

    const handleSubmit = async () => {
        if (!resource.trim()) { setError('Resource is required'); return; }
        if (!action.trim()) { setError('Action is required'); return; }
        setError('');
        try {
            await onCreate({
                permission_name: permName || `${resource.trim()}.${action.trim()}`,
                resource: resource.trim().toLowerCase(),
                action: action.trim().toLowerCase(),
                description: description.trim() || undefined,
            });
            onClose();
        } catch {
            setError('Failed to create permission. Name may already exist.');
        }
    };

    const inputStyle = {
        background: 'var(--surface-input-bg)',
        border: '1px solid var(--surface-input-border)',
        color: 'var(--color-text-primary)',
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
                            <Icon icon="lucide:key-round" width={16} className="text-violet-500" />
                        </div>
                        <h2 className="font-poppins text-base font-semibold text-smile-primary-dark">Create Permission</h2>
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="cp-resource" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                                Resource <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="cp-resource"
                                ref={resourceInputRef}
                                type="text"
                                value={resource}
                                onChange={(e) => setResource(e.target.value)}
                                placeholder="e.g. medical_record"
                                maxLength={50}
                                className="w-full rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label htmlFor="cp-action" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                                Action <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="cp-action"
                                type="text"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                placeholder="e.g. read"
                                maxLength={20}
                                className="w-full rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cp-perm-name" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                            Permission Name <span className="text-smile-description opacity-60">(auto-filled)</span>
                        </label>
                        <input
                            id="cp-perm-name"
                            type="text"
                            value={permName}
                            onChange={(e) => setPermName(e.target.value)}
                            placeholder="resource.action"
                            maxLength={100}
                            className="w-full rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label htmlFor="cp-description" className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-wide text-smile-description">
                            Description
                        </label>
                        <input
                            id="cp-description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Allows reading patient medical records"
                            maxLength={255}
                            className="w-full rounded-xl px-3.5 py-2.5 font-inter text-sm outline-none transition-all focus:ring-2 focus:ring-violet-400"
                            style={inputStyle}
                        />
                    </div>

                    <div className="rounded-lg bg-violet-50/60 px-3 py-2.5 dark:bg-violet-900/20">
                        <p className="mb-1.5 font-inter text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                            Quick examples
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_EXAMPLES.map((ex) => (
                                <button
                                    key={ex}
                                    type="button"
                                    onClick={() => {
                                        const [r, a] = ex.split('.');
                                        setResource(r);
                                        setAction(a);
                                    }}
                                    className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-violet-700 shadow-sm hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300 dark:hover:bg-violet-800/60"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2.5 border-t px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
                    <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 font-inter text-sm font-medium text-smile-description transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !resource.trim() || !action.trim()}
                        className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 font-inter text-sm font-semibold text-white transition-all active:scale-[0.98] hover:bg-violet-700 disabled:opacity-60"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Icon icon="lucide:plus" width={14} />
                        )}
                        Create
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
