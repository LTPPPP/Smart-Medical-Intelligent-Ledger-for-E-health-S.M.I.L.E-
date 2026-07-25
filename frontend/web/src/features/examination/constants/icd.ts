// Common ICD-10 codes for dental conditions. There is no backend ICD catalog —
// this list is the only source for code suggestions; free-text codes stay valid.
export interface IcdCode {
	code: string;
	description: string;
}

export const COMMON_ICD_CODES: IcdCode[] = [
	{ code: "K02.1", description: "Dental caries of dentin" },
	{ code: "K02.9", description: "Dental caries, unspecified" },
	{ code: "K04.0", description: "Pulpitis" },
	{ code: "K04.1", description: "Necrosis of pulp" },
	{ code: "K05.0", description: "Acute gingivitis" },
	{ code: "K05.1", description: "Chronic gingivitis" },
	{ code: "K05.2", description: "Acute periodontitis" },
	{ code: "K05.3", description: "Chronic periodontitis" },
	{
		code: "K08.1",
		description:
			"Loss of teeth due to accident, extraction or local periodontal disease",
	},
];
