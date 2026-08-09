import Link from "next/link";
import { notFound } from "next/navigation";
import SchoolRoster from "@/components/SchoolRoster";
import { getSchoolBySlug } from "@/lib/schools";
import { listProfilesForSchool } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = await getSchoolBySlug(id);
  if (!school) notFound();

  const profiles = await listProfilesForSchool(id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-board">{school.name}</h1>
      <p className="text-ink-soft text-[14.5px] mb-5">
        {school.city}
        {school.parish ? ` · ${school.parish}` : ""}
      </p>

      <SchoolRoster school={school} profiles={profiles} />

      <div className="mt-4 text-right">
        <Link
          href={`/add-profile?school=${school.id}`}
          className="text-sm border border-board text-board hover:bg-board hover:text-white rounded-[4px] px-3.5 py-2 inline-block"
        >
          + Add a profile to this school
        </Link>
      </div>
    </div>
  );
}
