import { notFound } from "next/navigation";
import GiftGrid from "@/components/GiftGrid";
import { getSchoolBySlug } from "@/lib/schools";
import { getProfileBySlugId } from "@/lib/profiles";
import { getPublicGiftsForProfile } from "@/lib/publicGifts";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfileBySlugId(id);
  if (!profile || !profile.emailVerified) notFound();

  const [school, gifts] = await Promise.all([
    getSchoolBySlug(profile.school),
    getPublicGiftsForProfile(profile),
  ]);

  const f = profile.favorites;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-card border hairline rounded-[4px] shadow-[0_3px_0_rgba(34,37,43,0.14)] relative mb-8">
        <span
          className="absolute top-3.5 left-3.5 w-3 h-3 rounded-full"
          style={{ background: "radial-gradient(circle at 35% 35%, #cfc9b0, #9c9678)" }}
        />
        <div className="px-6 sm:px-7 pt-5 pb-4 pl-11 border-b-2 border-dashed hairline">
          <div className="font-display font-bold text-2xl sm:text-[26px] text-board">{profile.name}</div>
          <div className="text-sm text-ink-soft mt-0.5">
            {profile.gradeOrRole} · {school?.name ?? profile.school}
            <span className="ml-2 text-[11px] font-bold text-green-800">✓ verified school email</span>
          </div>
        </div>
        <div className="px-6 sm:px-7 py-4.5 pl-11 grid sm:grid-cols-2 gap-3.5">
          <FavItem label="Favorite Color" value={f.color} />
          <FavItem label="Favorite Treat" value={f.treat} />
          <FavItem label="Go-to Drink" value={f.drink} />
          <FavItem label="Favorite Scent" value={f.scent} />
          <FavItem label="Favorite Store" value={f.store} />
          <FavItem label="Favorite Restaurant" value={f.restaurant} />
          <FavItem label="Favorite Flower" value={f.flower} />
          <FavItem label="Favorite Sports Team" value={f.sportsTeam} />
          <FavItem label="Shirt Size" value={f.shirtSize} />
          <FavItem label="Hobbies" value={f.hobbies.join(", ")} />
          {f.avoid && <FavItem label="Please Avoid" value={f.avoid} full />}
          {f.wishlist && <FavItem label="Wishlist Note" value={f.wishlist} full />}
        </div>
      </div>

      <h2 className="font-display font-semibold text-2xl text-board mb-1">Gift ideas for {profile.name}</h2>
      <p className="text-ink-soft text-[14.5px] mb-5">
        Matched from their favorites — top picks get a gold star. Claim one so nobody doubles up.
      </p>

      <GiftGrid profileId={profile.id} gifts={gifts} />
    </div>
  );
}

function FavItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  if (!value) return null;
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <span className="block text-[11.5px] uppercase tracking-wide text-ink-soft mb-0.5">{label}</span>
      <span className="font-semibold text-ink text-sm">{value}</span>
    </div>
  );
}
