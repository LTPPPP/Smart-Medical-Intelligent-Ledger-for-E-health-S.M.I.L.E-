export const CLINIC_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
} as const;

export type ClinicStatus = (typeof CLINIC_STATUS)[keyof typeof CLINIC_STATUS];

export const ROOM_TYPE = {
  EXAMINATION: "examination",
  SURGERY: "surgery",
  XRAY: "x-ray",
  WAITING: "waiting",
} as const;

export type RoomType = (typeof ROOM_TYPE)[keyof typeof ROOM_TYPE];

export const ROOM_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

export const CLINIC_STATUS_OPTIONS = [
  { value: CLINIC_STATUS.ACTIVE, label: "Active", color: "green" },
  { value: CLINIC_STATUS.INACTIVE, label: "Inactive", color: "gray" },
  { value: CLINIC_STATUS.MAINTENANCE, label: "Maintenance", color: "orange" },
] as const;

export const ROOM_TYPE_OPTIONS = [
  {
    value: ROOM_TYPE.EXAMINATION,
    label: "Examination",
    icon: "mdi:stethoscope",
  },
  { value: ROOM_TYPE.SURGERY, label: "Surgery", icon: "mdi:medical-bag" },
  { value: ROOM_TYPE.XRAY, label: "X-Ray", icon: "mdi:radioactive" },
  { value: ROOM_TYPE.WAITING, label: "Waiting", icon: "mdi:sofa" },
] as const;

export const ROOM_STATUS_OPTIONS = [
  { value: ROOM_STATUS.AVAILABLE, label: "Available", color: "green" },
  { value: ROOM_STATUS.OCCUPIED, label: "Occupied", color: "red" },
  { value: ROOM_STATUS.MAINTENANCE, label: "Maintenance", color: "orange" },
] as const;
