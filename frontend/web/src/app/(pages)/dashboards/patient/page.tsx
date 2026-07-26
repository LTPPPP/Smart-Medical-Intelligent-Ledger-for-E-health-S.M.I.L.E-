import { redirect } from "next/navigation";

export default function PatientDashboardRedirect() {
	redirect("/dashboard");
}
