// ============================================================
// PageTransition — slide + fade animation between routes
// Keyed by pathname so AnimatePresence triggers on nav change
// ============================================================

"use client";

import { usePathname } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

interface PageTransitionProps {
    children: React.ReactNode;
}

const variants = {
    initial: { opacity: 0, x: 18, scale: 0.99 },
    enter:   { opacity: 1, x: 0,  scale: 1 },
    exit:    { opacity: 0, x: -18, scale: 0.99 },
};

export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="enter"
                exit="exit"
                transition={{
                    duration: 0.22,
                    ease: [0.4, 0, 0.2, 1],
                }}
                className="flex h-full flex-col"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
