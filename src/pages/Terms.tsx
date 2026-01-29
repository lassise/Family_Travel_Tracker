import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: January 25, 2026
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Overview</h2>
          <p className="text-sm leading-relaxed">
            These Terms of Service govern your use of Family Travel Tracker
            (the &quot;Service&quot;) at{" "}
            <a
              href="https://familytraveltracker.com"
              className="underline underline-offset-2"
            >
              https://familytraveltracker.com
            </a>
            . The Service is built and operated by a solo founder and is
            intended as a simple personal tool for planning and tracking family
            travel.
          </p>
          <p className="text-sm leading-relaxed">
            By using the Service, you agree to these Terms. If you do not
            agree, please do not use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Personal use only</h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker is provided for personal and family use only.
            You may use the Service to plan, track, and review your own travel
            and your family&apos;s travel.
          </p>
          <p className="text-sm leading-relaxed">
            You may not resell the Service, use it as part of a commercial
            offering, or use it in a way that competes with Family Travel
            Tracker.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your data and ownership</h2>
          <p className="text-sm leading-relaxed">
            You own the content you add to Family Travel Tracker, including
            trips, locations, notes, and other information you choose to store.
          </p>
          <p className="text-sm leading-relaxed">
            By using the Service, you grant Family Travel Tracker the right to
            store and process this data solely for the purpose of providing the
            Service to you. This right ends when your data is deleted from the
            system.
          </p>
          <p className="text-sm leading-relaxed">
            You are responsible for ensuring that any content you upload does
            not violate the rights of others or any applicable laws.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">No warranty</h2>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker is provided on a best-effort basis by a solo
            founder. The Service is offered &quot;as is&quot; without any
            warranties, whether express or implied, including but not limited
            to availability, accuracy, or fitness for a particular purpose.
          </p>
          <p className="text-sm leading-relaxed">
            Travel plans are your responsibility. You should always confirm
            bookings, schedules, and requirements with official sources.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Limitation of liability and best effort service
          </h2>
          <p className="text-sm leading-relaxed">
            To the fullest extent permitted by law, Family Travel Tracker and
            its creator will not be liable for any indirect, incidental, or
            consequential damages arising from your use of the Service,
            including loss of data, missed trips, or travel problems.
          </p>
          <p className="text-sm leading-relaxed">
            The goal is to keep the Service stable and reliable, but outages,
            bugs, or data issues may still occur. Efforts will be made to fix
            problems, but uninterrupted service cannot be guaranteed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Abuse and suspension</h2>
          <p className="text-sm leading-relaxed">
            You agree not to misuse the Service, including (but not limited to)
            attempting to break security, scraping, spamming, or harassing
            other users.
          </p>
          <p className="text-sm leading-relaxed">
            Family Travel Tracker reserves the right to suspend or terminate
            accounts that are used for abuse, illegal activity, or behavior
            that threatens the stability or security of the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Governing law</h2>
          <p className="text-sm leading-relaxed">
            These Terms are governed by the laws of the United States. If there
            is any dispute relating to the Service or these Terms, it will be
            handled under United States law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Changes to these Terms</h2>
          <p className="text-sm leading-relaxed">
            These Terms may be updated from time to time to reflect changes in
            the Service or applicable law. When that happens, the &quot;Last
            updated&quot; date at the top of this page will be changed. If the
            changes are significant, a short notice may be shown in the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-relaxed">
            If you have any questions about these Terms, please contact{" "}
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
          <Link to="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
        </footer>
      </div>
    </main>
  );
};

export default Terms;

