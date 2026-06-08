export interface Transaction {
  id: string;
  date: string;
  patient: string;
  service: string;
  method: "visa" | "mastercard" | "bank" | "cash";
  status: "paid" | "pending" | "failed" | "refunded";
  amount: string;
}

export const TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-20240615-0042",
    date: "Jun 15, 2025 · 10:23",
    patient: "Nguyen Van A",
    service: "Orthodontics Consultation",
    method: "visa",
    status: "paid",
    amount: "350,000 ₫",
  },
  {
    id: "TXN-20240612-0039",
    date: "Jun 12, 2025 · 14:05",
    patient: "Tran Thi B",
    service: "Dental Cleaning",
    method: "mastercard",
    status: "pending",
    amount: "200,000 ₫",
  },
  {
    id: "TXN-20240610-0037",
    date: "Jun 10, 2025 · 09:15",
    patient: "Le Van C",
    service: "X-Ray & Examination",
    method: "bank",
    status: "failed",
    amount: "450,000 ₫",
  },
  {
    id: "TXN-20240608-0035",
    date: "Jun 8, 2025 · 16:40",
    patient: "Pham Thi D",
    service: "Root Canal Treatment",
    method: "cash",
    status: "refunded",
    amount: "1,200,000 ₫",
  },
];

export const STATUS_STYLES: Record<
  Transaction["status"],
  { bg: string; dot: string; label: string }
> = {
  paid: { bg: "rgba(69,240,207,0.1)", dot: "#45F0CF", label: "Paid" },
  pending: { bg: "rgba(247,188,104,0.1)", dot: "#F7BC68", label: "Pending" },
  failed: { bg: "rgba(255,180,171,0.1)", dot: "#FFB4AB", label: "Failed" },
  refunded: { bg: "rgba(139,145,153,0.2)", dot: "#8B9199", label: "Refunded" },
};

export const METHOD_LABELS: Record<Transaction["method"], string> = {
  visa: "VISA",
  mastercard: "MC",
  bank: "BANK",
  cash: "CASH",
};

export const METHOD_COLORS: Record<Transaction["method"], string> = {
  visa: "#0065B3",
  mastercard: "#92CDFD",
  bank: "#5B96C4",
  cash: "#45F0CF",
};
