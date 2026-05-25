const GENDER_CONFIG: Record<string, { label: string; cls: string }> = {
    male: {
        label: 'Male',
        cls: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40',
    },
    female: {
        label: 'Female',
        cls: 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800/40',
    },
    other: {
        label: 'Other',
        cls: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40',
    },
};

export function GenderBadge({ gender }: { gender: string | null }) {
    if (!gender) return <span className="font-inter text-xs text-smile-description/50">—</span>;
    const c = GENDER_CONFIG[gender.toLowerCase()] ?? {
        label: gender,
        cls: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-inter text-[10px] font-semibold capitalize ${c.cls}`}
        >
            {c.label}
        </span>
    );
}
