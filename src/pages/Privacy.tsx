import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: January 25, 2026
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker is a simple tool built by a solo founder to
            help families keep track of their trips and memories. This page
            explains, in plain language, what data is collected, how it is
            used, and your choices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What data we collect</h2>
          <p className="text-sm leading-relaxed">
            When you use Family Travel Tracker at{" "}
            <a
              href="https://familytraveltracker.com"
              className="underline underline-offset-2"
            >
              https://familytraveltracker.com
            </a>
            , we collect:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
            <li>
              <span className="font-medium">Account information</span>: your
              email address provided through Google Sign-In (via Supabase
              authentication).
            </li>
            <li>
              <span className="font-medium">Trip data</span>: trip names,
              dates, notes, and other trip details you choose to enter.
            </li>
            <li>
              <span className="font-medium">Location data you enter</span>:
              countries, cities, and other locations you manually add to your
              travel history.
            </li>
          </ul>
          <p className="text-sm leading-relaxed">
            We do not track your physical location automatically. All location
            information in the app is entered by you.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How your data is used</h2>
          <p className="text-sm leading-relaxed">
            Your data is used only to provide the core functionality of Family
            Travel Tracker, including:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
            <li>Signing in to your account and keeping you logged in.</li>
            <li>Saving and displaying your trips, countries, and visits.</li>
            <li>Generating simple travel analytics and visualizations for you and your family.</li>
          </ul>
          <p className="text-sm leading-relaxed">
            We do not sell your personal data, and we do not use your
            information for advertising or marketing to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Authentication and hosting</h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker uses Supabase for authentication and data
            storage, including Google OAuth for sign-in. When you choose to sign in with Google, Google may process your information in line with their own privacy policy.
          </p>
          <p className="text-sm leading-relaxed">
            The web app is hosted on Vercel. That means your data may pass
            through and be stored on infrastructure operated by Supabase and
            Vercel in order to run the service.
          </p>
          <p className="text-sm leading-relaxed">
            Other than these core providers (Supabase for auth/database and
            Vercel for hosting), your data is not shared with third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Data sharing and sale of data
          </h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker does <span className="font-medium">not</span>{" "}
            sell your personal data.
          </p>
          <p className="text-sm leading-relaxed">
            Your data is only shared with:
          </p>
          <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
            <li>Supabase, to handle authentication and store your data.</li>
            <li>Vercel, to host and serve the web application.</li>
          </ul>
          <p className="text-sm leading-relaxed">
            These providers act as infrastructure for the app and do not own
            your data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your rights and choices</h2>
          <p className="text-sm leading-relaxed">
            You can sign in at any time to view, edit, or delete trips and
            locations you have added.
          </p>
          <p className="text-sm leading-relaxed">
            If you would like your account and associated data to be deleted,
            you can email{" "}
            <a
              href="mailto:support@familytraveltracker.com"
              className="underline underline-offset-2"
            >
              support@familytraveltracker.com
            </a>{" "}
            and request deletion. Deletion is a manual process, but requests
            are handled as quickly as possible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Children&apos;s privacy</h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker is designed for families, but accounts should
            be created and managed by adults. You may choose to store your
            children&apos;s names or details in the app as part of your family
            travel history, and you remain the owner of that information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker is operated by a solo founder. If you have
            questions about this Privacy Policy or how your data is handled,
            please email{" "}
            <a
              href="mailto:support@familytraveltracker.com"
              className="underline underline-offset-2"
            >
              support@familytraveltracker.com
            </a>
            .
          </p>
        </section>

        <footer className="pt-4 border-t text-xs text-muted-foreground flex flex-wrap gap-4">
          <span>© {new Date().getFullYear()} Family Travel Tracker</span>
          <span>·</span>
          <Link to="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
        </footer>
      </div>
    </main>
  );
};

export default Privacy;

