import type { Metadata } from "next";
import { Fraunces, Inter, Caveat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Teacher's List",
  description:
    "Look up your kid's teachers and school staff, find gift ideas they'll actually like, and claim one so nobody doubles up.",
  icons: {
    icon: "/circular-logo.png",
    apple: "/circular-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <SetupBanner />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="bg-board border-b-4 border-gold">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/circular-logo.png"
            alt=""
            width={44}
            height={44}
            priority
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0"
          />
          <span className="font-display font-bold text-xl sm:text-2xl text-paper">
            The Teacher&apos;s List
          </span>
          <span className="hidden md:inline font-hand text-gold text-base -rotate-2">
            gifts, sorted.
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium text-paper-dark">
          <Link href="/" className="hover:text-gold hidden sm:inline">
            Home
          </Link>
          <Link href="/about" className="hover:text-gold hidden md:inline">
            About
          </Link>
          <Link href="/contact" className="hover:text-gold hidden md:inline">
            Contact
          </Link>
          <Link
            href="/add-profile"
            className="bg-brick hover:bg-brick-dark text-white rounded-[4px] px-3 py-2 text-sm font-semibold whitespace-nowrap shrink-0"
          >
            Add my profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SetupBanner() {
  const missing: string[] = [];
  if (!process.env.AIRTABLE_API_KEY) missing.push("AIRTABLE_API_KEY");
  if (!process.env.RESEND_API_KEY) missing.push("RESEND_API_KEY (codes will show on-screen instead of emailing)");
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET (using an insecure dev default)");
  if (missing.length === 0) return null;
  return (
    <div className="bg-[#FDECEC] border-b border-brick text-brick-dark text-[13px] px-4 py-2 text-center">
      Setup needed: {missing.join(" · ")}. See <code className="font-mono">.env.local.example</code>.
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t hairline mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-soft">
        <div className="flex items-center gap-2.5">
          <Image src="/logo-horizontal.png" alt="The Teacher's List" width={160} height={56} className="h-7 w-auto" />
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/about" className="hover:text-brick">
            About
          </Link>
          <Link href="/contact" className="hover:text-brick">
            Contact
          </Link>
          <Link href="/manage-gifts" className="hover:text-brick">
            Staff: manage my gifts
          </Link>
        </div>
      </div>
    </footer>
  );
}
