"use client";

import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { ArrowButton } from "./ArrowButton";

export function ScrollToTopButton() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () =>
			setVisible(window.scrollY > window.innerHeight * 0.6);
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0, y: 16, scale: 0.85 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 16, scale: 0.85 }}
					transition={{ duration: 0.2, ease: "easeOut" }}
					className="fixed bottom-6 right-6 z-40"
				>
					<ArrowButton
						size="lg"
						rotation={0}
						onClick={scrollToTop}
						ariaLabel="Scroll to top"
						className="shadow-lg backdrop-blur-sm"
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
