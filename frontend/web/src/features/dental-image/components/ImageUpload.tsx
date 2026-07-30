"use client";

import { useState, useRef } from "react";

import { Icon } from "@iconify/react";

import { useDentalImage } from "@/features/dental-image/hooks/useDentalImage";
import type { ImageCategory } from "@/features/dental-image/types/dental-image.type";
import { logApiError, toast } from "@/shared/lib/toast";

interface ImageUploadProps {
	patientId: string;
	onUploadSuccess?: () => void;
	categories: ImageCategory[];
}

export const ImageUpload = ({
	patientId,
	onUploadSuccess,
	categories,
}: ImageUploadProps) => {
	const { uploadImage, uploadBatch, isUploading, isBatchUploading } =
		useDentalImage();

	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [categoryId, setCategoryId] = useState("");
	const [description, setDescription] = useState("");
	const [dragActive, setDragActive] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = Array.from(e.dataTransfer.files);
		const imageFiles = files.filter((file) => file.type.startsWith("image/"));
		setSelectedFiles((prev) => [...prev, ...imageFiles]);
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			setSelectedFiles((prev) => [...prev, ...files]);
		}
	};

	const handleRemoveFile = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleUpload = async () => {
		if (!categoryId || selectedFiles.length === 0) {
			toast.error("Please select category and at least one file");
			return;
		}

		try {
			if (selectedFiles.length === 1) {
				await uploadImage({
					file: selectedFiles[0],
					patientId,
					categoryId,
					description: description || undefined,
				});
			} else {
				await uploadBatch({
					files: selectedFiles,
					patientId,
					categoryId,
				});
			}

			// Reset form
			setSelectedFiles([]);
			setCategoryId("");
			setDescription("");
			onUploadSuccess?.();
		} catch (error) {
			logApiError(error, "upload dental image");
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	return (
		<div className="bg-white rounded-xl shadow-md p-6">
			<h3 className="text-xl font-bold mb-4">Upload Dental Images</h3>

			{/* Category Select */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">Category *</label>
				<select
					value={categoryId}
					onChange={(e) => setCategoryId(e.target.value)}
					className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option value="">Select category</option>
					{categories.map((cat) => (
						<option key={cat.categoryId} value={cat.categoryId}>
							{cat.categoryName}
						</option>
					))}
				</select>
			</div>

			{/* Description */}
			<div className="mb-4">
				<label className="block text-sm font-medium mb-2">Description</label>
				<textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					rows={3}
					placeholder="Enter image description..."
				/>
			</div>

			{/* Drop Zone */}
			<div
				className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
					dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
				}`}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<Icon
					icon="mdi:cloud-upload"
					className="mx-auto text-gray-400 mb-4"
					width={48}
				/>
				<p className="text-gray-600 mb-2">
					Drag and drop images here, or click to select
				</p>
				<p className="text-sm text-gray-500 mb-4">
					Supported: JPG, PNG, DICOM (Max 50MB)
				</p>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
				>
					Select Files
				</button>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*,.dcm,.dicom"
					onChange={handleFileSelect}
					className="hidden"
				/>
			</div>

			{/* Selected Files */}
			{selectedFiles.length > 0 && (
				<div className="mt-4">
					<h4 className="font-medium mb-2">
						Selected Files ({selectedFiles.length})
					</h4>
					<div className="space-y-2 max-h-60 overflow-y-auto">
						{selectedFiles.map((file, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-3 border rounded-lg"
							>
								<div className="flex items-center gap-3 flex-1">
									<Icon
										icon="mdi:file-image"
										className="text-blue-500"
										width={24}
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{file.name}</p>
										<p className="text-xs text-gray-500">
											{formatFileSize(file.size)}
										</p>
									</div>
								</div>
								<button
									onClick={() => handleRemoveFile(index)}
									className="p-1 text-red-600 hover:bg-red-50 rounded"
								>
									<Icon icon="mdi:close" width={20} />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Upload Button */}
			<div className="flex gap-2 justify-end mt-4">
				<button
					onClick={() => {
						setSelectedFiles([]);
						setCategoryId("");
						setDescription("");
					}}
					className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					onClick={handleUpload}
					disabled={
						isUploading ||
						isBatchUploading ||
						!categoryId ||
						selectedFiles.length === 0
					}
					className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
				>
					{(isUploading || isBatchUploading) && (
						<Icon icon="line-md:loading-twotone-loop" width={20} />
					)}
					Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
				</button>
			</div>
		</div>
	);
};
