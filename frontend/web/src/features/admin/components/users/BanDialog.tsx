'use client';

import { useEffect, useRef, useState } from 'react';

import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import type { UserProfile } from '@/features/admin/types/admin.type';
import { useEscapeToClose } from '@/shared/hooks/useEscapeToClose';

interface BanDialogProps {
    target: UserProfile;
    isBanning: boolean;
    onConfirm: (reason: string) => Promise<void>;
    onClose: () => void;
}

export function BanDialog({ target, isBanning, onConfirm, onClose }: BanDialogProps) {
    const [reason, setReason] = useState('');
    const reasonInputRef = useRef<HTMLTextAreaElement>(null);

    useEscapeToClose(onClose);

    useEffect(() => {
        reasonInputRef.current?.focus();
    }, []);

    const handleConfirm = async () => {
        await onConfirm(reason);
        onClose();
    };

    const inputStyle = {
        background: 'var(--surface-input-bg)',
        borderColor: 'var(--surface-input-border)',
    };

    return (
        <motion.div
            key="ban-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <motion.div
                key="ban-modal"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-4 w-full max-w-md overflow-hidden rounded-[24px] border backdrop-blur-2xl"
                style={{
                    background: 'var(--surface-card-bg)',
                    borderColor: 'var(--surface-card-border)',
                    boxShadow: 'var(--surface-card-shadow)',
                }}
            >
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[24px] bg-gradient-to-r from-red-500 to-orange-500" />
                <div
                    className="pointer-events-none absolute inset-0 rounded-[24px]"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)' }}
                />
                <div className="relative p-6">
                    <div className="mb-5 flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40"
                        >
                            <Icon icon="lucide:ban" width={20} className="text-red-600 dark:text-red-400" />
                        </motion.div>
                        <div>
                            <h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">Ban User</h3>
                            <p className="font-inter text-xs text-smile-description">
                                <span className="font-semibold text-red-500">{target.full_name}</span>
                                {target.email ? ` · ${target.email}` : ''}
                            </p>
                        </div>
                    </div>

                    <label
                        htmlFor="ban-reason"
                        className="mb-1.5 block font-inter text-xs font-semibold uppercase tracking-[1.5px] text-smile-description"
                    >
                        Reason{' '}
                        <span className="normal-case tracking-normal font-normal text-smile-description/50">(optional)</span>
                    </label>
                    <textarea
                        id="ban-reason"
                        ref={reasonInputRef}
                        className="mb-5 w-full rounded-xl border px-4 py-2.5 font-inter text-sm text-smile-title backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-400/40"
                        style={inputStyle}
                        rows={3}
                        placeholder="Optional — this reason will appear in the audit log"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-smile-primary/20 px-4 py-2 font-inter text-sm font-medium text-smile-title transition-all hover:bg-smile-primary-light"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isBanning}
                            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 font-inter text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isBanning && <Icon icon="line-md:loading-twotone-loop" width={14} />}
                            {isBanning ? 'Banning...' : 'Confirm Ban'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
