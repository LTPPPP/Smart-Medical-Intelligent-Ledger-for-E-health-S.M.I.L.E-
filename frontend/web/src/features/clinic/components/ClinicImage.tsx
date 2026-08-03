"use client";

import { useEffect, useState } from "react";

import Image, { type ImageProps } from "next/image";

import { getClinicImageUrl } from "../utils/clinic-image";

type ClinicImageProps = Omit<ImageProps, "src"> & {
	logoUrl?: string | null;
	clinicCode: string;
};

export function ClinicImage({
	logoUrl,
	clinicCode,
	alt,
	...imageProps
}: ClinicImageProps) {
	const fallbackUrl = getClinicImageUrl(null, clinicCode);
	const [src, setSrc] = useState(() => getClinicImageUrl(logoUrl, clinicCode));

	useEffect(() => {
		setSrc(getClinicImageUrl(logoUrl, clinicCode));
	}, [logoUrl, clinicCode]);

	return (
		<Image
			{...imageProps}
			alt={alt}
			src={src}
			onError={() => {
				if (src !== fallbackUrl) setSrc(fallbackUrl);
			}}
		/>
	);
}
