import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		ignores: [
			"node_modules/**",
			".next/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
			"src/components/ui/**",
		],
	},
	{
		rules: {
			// Enforce consistent import ordering
			"import/order": [
				"warn",
				{
					groups: [
						"builtin",
						"external",
						"internal",
						["parent", "sibling", "index"],
					],
					pathGroups: [
						{
							pattern: "react",
							group: "builtin",
							position: "before",
						},
						{
							pattern: "next/**",
							group: "builtin",
							position: "before",
						},
						{
							pattern: "@/**",
							group: "internal",
							position: "before",
						},
					],
					pathGroupsExcludedImportTypes: ["react"],
					"newlines-between": "always",
					alphabetize: {
						order: "asc",
						caseInsensitive: true,
					},
				},
			],
			// Prefer named exports for better tree-shaking
			"import/no-default-export": "off",
			// Accessibility
			"jsx-a11y/alt-text": "error",
			"jsx-a11y/aria-role": "error",
		},
	},
];

export default eslintConfig;
