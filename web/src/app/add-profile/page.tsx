import { Suspense } from "react";
import AddProfileForm from "@/components/AddProfileForm";

export default function AddProfilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display font-bold text-3xl text-board text-center mb-1.5">Add a profile</h1>
      <p className="text-ink-soft text-sm text-center mb-8">
        Takes about a minute. You can update this anytime by re-verifying your school email.
      </p>
      <Suspense fallback={null}>
        <AddProfileForm />
      </Suspense>
    </div>
  );
}
