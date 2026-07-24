'use client';

import { useState } from 'react';

import Image from 'next/image';

import type { UserProfile } from '@/features/admin/types/admin.type';

export function Avatar({ profile }: { profile: UserProfile }) {
    const [imgError, setImgError] = useState(false);
    const initials = profile.full_name?.slice(0, 2).toUpperCase() ?? '?';
    const fallback = (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-smile-primary to-blue-400 text-xs font-bold text-white shadow-sm">
            {initials}
        </div>
    );

    if (!profile.avatar_url || imgError) return fallback;
    return (
        <Image
            src={profile.avatar_url}
            alt={profile.full_name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-smile-primary/20"
            onError={() => setImgError(true)}
        />
    );
}
