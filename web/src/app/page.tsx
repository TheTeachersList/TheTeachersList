import Link from "next/link";
import SchoolSearch from "@/components/SchoolSearch";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center max-w-xl mx-auto mb-2">
        <h1 className="font-display font-bold text-3xl sm:text-[42px] text-board leading-tight">
          Find the perfect gift for the person shaping your kid&apos;s year.
        </h1>
        <p className="text-ink-soft text-[17px] mt-3">
          Search your child&apos;s school, find their teacher or favorite staff member, and get gift
          ideas built from what they actually like.
        </p>
      </div>

      <SchoolSearch />

      <div className="text-center mt-6">
        <Link
          href="/add-profile"
          className="inline-block border border-board text-board hover:bg-board hover:text-white rounded-[4px] px-4 py-2.5 text-sm font-semibold"
        >
          I&apos;m a teacher or staff member — add my profile
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mt-16 text-center">
        <FeatureCard title="Look them up" body="Browse by school, then by grade or role, to find who you're shopping for." />
        <FeatureCard title="See what they like" body="Favorites, a wishlist note, and gift ideas matched to their taste." />
        <FeatureCard title="Claim, don't duplicate" body="Mark a gift as taken so the whole class doesn't show up with the same candle." />
      </div>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card border hairline rounded-[4px] p-5">
      <h3 className="font-display font-semibold text-board text-lg mb-1.5">{title}</h3>
      <p className="text-ink-soft text-sm">{body}</p>
    </div>
  );
}
