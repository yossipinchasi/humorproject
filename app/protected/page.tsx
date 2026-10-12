import { redirect } from "next/navigation";

// The Week 3 "protected area" grew into the profile page. The proxy still
// keeps logged-out visitors out of /protected.
export default function ProtectedPage() {
    redirect("/me");
}
