import { cn } from "@/shared/lib/utils";


interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = ({ label, className, ...props }: Props) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      className={cn(
        "px-3 py-2 border rounded-md outline-hidden focus:ring-2 focus:ring-blue-500",
        className
      )}
      {...props}
    />
  </div>
);