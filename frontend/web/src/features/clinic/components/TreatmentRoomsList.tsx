"use client";

import { useState } from "react";

import { Icon } from "@iconify/react";

import {
	ROOM_TYPE,
	ROOM_STATUS,
	ROOM_TYPE_OPTIONS,
	ROOM_STATUS_OPTIONS,
	RoomType,
	RoomStatus,
} from "@/features/clinic/constants/clinic.constant";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import {
	TreatmentRoom,
	CreateTreatmentRoomRequest,
	UpdateTreatmentRoomRequest,
} from "@/features/clinic/types/clinic.type";
import { Input } from "@/shared/components/common/Input";
import { Loading } from "@/shared/components/common/Loading";

interface TreatmentRoomsListProps {
	clinicId: string;
}

export const TreatmentRoomsList = ({ clinicId }: TreatmentRoomsListProps) => {
	const {
		useTreatmentRooms,
		createRoom,
		updateRoom,
		deleteRoom,
		isCreatingRoom,
		isUpdatingRoom,
		isDeletingRoom,
	} = useClinic();

	const { data, isLoading } = useTreatmentRooms(clinicId);

	const [showDialog, setShowDialog] = useState(false);
	const [selectedRoom, setSelectedRoom] = useState<TreatmentRoom | null>(null);

	const [formData, setFormData] = useState({
		roomName: "",
		roomCode: "",
		roomType: ROOM_TYPE.EXAMINATION as RoomType,
		floorNumber: 1,
		capacity: 1,
		status: ROOM_STATUS.AVAILABLE as RoomStatus,
	});

	const rooms = data?.data?.content || [];

	const getRoomTypeIcon = (type: string) => {
		return (
			ROOM_TYPE_OPTIONS.find((opt) => opt.value === type)?.icon || "mdi:door"
		);
	};

	const getStatusColor = (status: string) => {
		const option = ROOM_STATUS_OPTIONS.find((opt) => opt.value === status);
		switch (option?.color) {
			case "green":
				return "bg-green-100 text-green-800";
			case "red":
				return "bg-red-100 text-red-800";
			case "orange":
				return "bg-orange-100 text-orange-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const resetForm = () => {
		setFormData({
			roomName: "",
			roomCode: "",
			roomType: ROOM_TYPE.EXAMINATION,
			floorNumber: 1,
			capacity: 1,
			status: ROOM_STATUS.AVAILABLE,
		});
		setSelectedRoom(null);
	};

	const handleOpenEdit = (room: TreatmentRoom) => {
		setSelectedRoom(room);
		setFormData({
			roomName: room.roomName,
			roomCode: room.roomCode,
			roomType: room.roomType as RoomType,
			floorNumber: room.floorNumber || 1,
			capacity: room.capacity || 1,
			status: room.status as RoomStatus,
		});
		setShowDialog(true);
	};

	const handleCloseDialog = () => {
		setShowDialog(false);
		resetForm();
	};

	const handleSubmit = async () => {
		try {
			if (selectedRoom) {
				await updateRoom({
					clinicId,
					roomId: selectedRoom.roomId,
					request: formData as UpdateTreatmentRoomRequest,
				});
			} else {
				await createRoom({
					clinicId,
					request: formData as CreateTreatmentRoomRequest,
				});
			}
			handleCloseDialog();
		} catch {
			/* handled by hook */
		}
	};

	const handleDelete = async (room: TreatmentRoom) => {
		if (!confirm(`Are you sure you want to delete room "${room.roomName}"?`))
			return;
		try {
			await deleteRoom({ clinicId, roomId: room.roomId });
		} catch {
			/* handled by hook */
		}
	};

	if (isLoading) return <Loading text="Loading treatment rooms..." />;

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-bold text-gray-800">
					Treatment Rooms ({rooms.length})
				</h3>
				<button
					onClick={() => setShowDialog(true)}
					className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
				>
					<Icon icon="mdi:plus" width={20} />
					Add Room
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{rooms.map((room: TreatmentRoom) => (
					<div
						key={room.roomId}
						className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
					>
						<div className="flex justify-between items-start mb-3">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
									<Icon
										icon={getRoomTypeIcon(room.roomType)}
										className="text-blue-600"
										width={24}
									/>
								</div>
								<div>
									<h4 className="font-bold text-gray-800">{room.roomName}</h4>
									<p className="text-xs text-gray-500 font-mono">
										{room.roomCode}
									</p>
								</div>
							</div>
							<span
								className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold ${getStatusColor(room.status)}`}
							>
								{room.status}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-2 text-sm mb-4 bg-gray-50 p-2 rounded-lg">
							<div className="text-gray-500">
								Floor:{" "}
								<span className="font-medium text-gray-800">
									{room.floorNumber}
								</span>
							</div>
							<div className="text-gray-500 text-right">
								Cap:{" "}
								<span className="font-medium text-gray-800">
									{room.capacity}
								</span>
							</div>
						</div>

						<div className="flex gap-2">
							<button
								onClick={() => handleOpenEdit(room)}
								className="flex-1 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-1"
							>
								<Icon icon="mdi:pencil" width={16} /> Edit
							</button>
							<button
								onClick={() => handleDelete(room)}
								disabled={isDeletingRoom}
								className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
							>
								<Icon icon="mdi:delete" width={18} />
							</button>
						</div>
					</div>
				))}
			</div>

			{rooms.length === 0 && (
				<div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
					<Icon
						icon="mdi:door-open"
						className="mx-auto mb-3 text-gray-300"
						width={48}
					/>
					<p className="text-gray-500">
						No treatment rooms available in this clinic.
					</p>
				</div>
			)}

			{showDialog && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
						<div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
							<h3 className="text-xl font-bold text-gray-800">
								{selectedRoom ? "Update Room" : "New Treatment Room"}
							</h3>
							<button
								onClick={handleCloseDialog}
								className="text-gray-400 hover:text-gray-600"
							>
								<Icon icon="mdi:close" width={24} />
							</button>
						</div>

						<div className="p-6 space-y-4">
							<Input
								label="Room Name"
								value={formData.roomName}
								onChange={(e) =>
									setFormData({ ...formData, roomName: e.target.value })
								}
								placeholder="e.g., Surgery Room A"
							/>

							<Input
								label="Room Code"
								value={formData.roomCode}
								onChange={(e) =>
									setFormData({ ...formData, roomCode: e.target.value })
								}
								placeholder="e.g., SUR_01"
								disabled={!!selectedRoom}
							/>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-1">
									<label className="text-xs font-bold text-gray-500 uppercase">
										Room Type
									</label>
									<select
										className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
										value={formData.roomType}
										onChange={(e) =>
											setFormData({
												...formData,
												roomType: e.target.value as RoomType,
											})
										}
									>
										{ROOM_TYPE_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-1">
									<label className="text-xs font-bold text-gray-500 uppercase">
										Status
									</label>
									<select
										className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
										value={formData.status}
										onChange={(e) =>
											setFormData({
												...formData,
												status: e.target.value as RoomStatus,
											})
										}
									>
										{ROOM_STATUS_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<Input
									label="Floor"
									type="number"
									value={formData.floorNumber.toString()}
									onChange={(e) =>
										setFormData({
											...formData,
											floorNumber: parseInt(e.target.value) || 1,
										})
									}
								/>
								<Input
									label="Capacity"
									type="number"
									value={formData.capacity.toString()}
									onChange={(e) =>
										setFormData({
											...formData,
											capacity: parseInt(e.target.value) || 1,
										})
									}
								/>
							</div>
						</div>

						<div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
							<button
								onClick={handleCloseDialog}
								className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={
									!formData.roomName ||
									!formData.roomCode ||
									isCreatingRoom ||
									isUpdatingRoom
								}
								className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
							>
								{(isCreatingRoom || isUpdatingRoom) && (
									<Icon icon="line-md:loading-twotone-loop" />
								)}
								{selectedRoom ? "Save Changes" : "Create Room"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
