import type { Variants } from 'framer-motion';

/** Slide-up stagger used in roles-management header/cards */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const },
  }),
};

/** Modal/dialog scale-in */
export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.18 } },
};

/** Height expand/collapse for expandable table rows */
export const expandVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.28, ease: 'easeOut' as const } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

/** Inline motion props (spring feel) used in users-management */
export const fadeUpSpring = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay },
});

/** Stagger variant for table rows */
export const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.3, ease: 'easeOut' },
  }),
};
