"use client";

import { useState } from "react";

import Image from "next/image";

import { Icon } from "@iconify/react";

import { useDentalImage } from "@/features/dental-image/hooks/useDentalImage";
import type { DentalImage } from "@/features/dental-image/types/dental-image.type";

interface ImageGalleryProps {
	images: DentalImage[];
	onImageSelect?: (image: DentalImage) => void;
	onDeleteSuccess?: () => void;
}

export const ImageGallery = ({
	images,
	onImageSelect,
	onDeleteSuccess,
}: ImageGalleryProps) => {
	const { deleteImage, isDeleting } = useDentalImage();
	const [selectedImage, setSelectedImage] = useState<DentalImage | null>(null);

	const handleImageClick = (image: DentalImage) => {
		setSelectedImage(image);
		onImageSelect?.(image);
	};

	const handleDelete = async (imageId: string) => {
		if (!confirm("Are you sure you want to delete this image?")) return;

		try {
			await deleteImage(imageId);
			setSelectedImage(null);
			onDeleteSuccess?.();
		} catch {
			/* handled by hook */
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (images.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<Icon
					icon="mdi:image-off"
					className="mx-auto mb-3 text-gray-300"
					width={64}
				/>
				<p>No images found</p>
			</div>
		);
	}

	return (
		<>
			{/* Grid View */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{images.map((image) => (
					<div
						key={image.id}
						className="group relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
						onClick={() => handleImageClick(image)}
						aria-current={selectedImage?.id === image.id ? "true" : undefined}
					>
						{/* Thumbnail */}
						<div className="relative aspect-square bg-gray-100">
							<Image
								src={image.thumbnailUrl}
								alt={image.description || image.filename}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
							/>

							{/* Overlay */}
							<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
								<Icon icon="mdi:eye" className="text-white" width={32} />
							</div>

							{/* Category Badge */}
							<div className="absolute top-2 left-2">
								<span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
									{image.categoryName}
								</span>
							</div>
						</div>

						{/* Info */}
						<div className="p-3">
							<p className="text-sm font-medium truncate">
								{image.description || image.filename}
							</p>
							<p className="text-xs text-gray-500 mt-1">
								{formatDate(image.uploadedAt)}
							</p>
							{image.tags && image.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-2">
									{image.tags.slice(0, 2).map((tag, i) => (
										<span
											key={i}
											className="px-2 py-0.5 text-xs bg-gray-100 rounded"
										>
											{tag}
										</span>
									))}
									{image.tags.length > 2 && (
										<span className="text-xs text-gray-500">
											+{image.tags.length - 2}
										</span>
									)}
								</div>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Inline Detail Panel */}
			{selectedImage && (
				<section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b">
						<div>
							<h3 className="font-bold">
								{selectedImage.description || selectedImage.filename}
							</h3>
							<p className="text-sm text-gray-500">
								{formatDate(selectedImage.uploadedAt)}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setSelectedImage(null)}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
							aria-label="Close image details"
						>
							<Icon icon="mdi:close" width={24} />
						</button>
					</div>

					{/* Image */}
					<div className="relative min-h-[20rem] bg-gray-100 md:min-h-[32.5rem]">
						<Image
							src={selectedImage.url}
							alt={selectedImage.description || selectedImage.filename}
							fill
							className="object-contain"
							sizes="100vw"
						/>
					</div>

					{/* Actions */}
					<div className="p-4 border-t flex flex-col gap-3 sm:flex-row sm:justify-between">
						<p className="text-sm text-gray-500">
							Image details are shown inline so the list remains in context.
						</p>
						<button
							type="button"
							onClick={() => handleDelete(selectedImage.id)}
							disabled={isDeleting}
							className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
						>
							{isDeleting && (
								<Icon icon="line-md:loading-twotone-loop" width={20} />
							)}
							<Icon icon="mdi:delete" width={20} />
							Delete
						</button>
					</div>

					{/* Metadata */}
					<div className="p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div>
							<p className="text-gray-500">Category</p>
							<p className="font-medium">{selectedImage.categoryName}</p>
						</div>
						<div>
							<p className="text-gray-500">File Size</p>
							<p className="font-medium">
								{(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB
							</p>
						</div>
						<div>
							<p className="text-gray-500">Dimensions</p>
							<p className="font-medium">
								{selectedImage.width} × {selectedImage.height}
							</p>
						</div>
						<div>
							<p className="text-gray-500">Uploaded By</p>
							<p className="font-medium">{selectedImage.uploadedBy}</p>
						</div>
					</div>

					{/* Tags */}
					{selectedImage.tags && selectedImage.tags.length > 0 && (
						<div className="p-4 border-t">
							<p className="text-sm text-gray-500 mb-2">Tags</p>
							<div className="flex flex-wrap gap-2">
								{selectedImage.tags.map((tag, i) => (
									<span
										key={i}
										className="px-3 py-1 bg-gray-100 rounded-full text-sm"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}
				</section>
			)}
		</>
	);
};
