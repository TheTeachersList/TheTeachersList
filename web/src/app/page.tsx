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

      <div className="flex items-center justify-center gap-3 mt-6">
        <span className="font-hand text-lg text-ink-soft -rotate-2">follow along</span>
        <SocialLink
          href="https://www.facebook.com/profile.php?id=61579054637236"
          label="The Teacher's List on Facebook"
        >
          <path d="M13.5 9H15V6.5h-1.5C11.6 6.5 10 8.1 10 10.2V12H8v2.5h2V21h2.5v-6.5H15l.5-2.5h-3v-1.6c0-.6.4-1 1-1z" />
        </SocialLink>
        <SocialLink
          href="https://www.instagram.com/the_teachers_list/"
          label="The Teacher's List on Instagram"
        >
          <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.2" cy="7.8" r="0.9" />
        </SocialLink>
        <SocialLink href="https://www.tiktok.com/@theteacherslist" label="The Teacher's List on TikTok">
          <path d="M16.5 3h-2.6v11.9a2.6 2.6 0 1 1-1.9-2.5V9.7a5.2 5.2 0 1 0 4.5 5.2V9.1a6.6 6.6 0 0 0 3.8 1.2V7.7a4 4 0 0 1-3.8-4.7z" />
        </SocialLink>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 mt-16 text-center">
        <FeatureCard title="Look them up" body="Browse by school, then by grade or role, to find who you're shopping for." />
        <FeatureCard title="See what they like" body="Favorites, a wishlist note, and gift ideas matched to their taste." />
        <FeatureCard title="Claim, don't duplicate" body="Mark a gift as taken so the whole class doesn't show up with the same candle." />
      </div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-board text-paper hover:bg-brick transition-colors"
    >
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
        {children}
      </svg>
    </a>
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
