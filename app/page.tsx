import { SiteNav } from "@/components/landing/SiteNav";
import { LandingExperience } from "@/components/landing/LandingExperience";
import { Categories } from "@/components/landing/Categories";
import { Showcase } from "@/components/landing/Showcase";
import { Features } from "@/components/landing/Features";
import { Venues } from "@/components/landing/Venues";
import { Process } from "@/components/landing/Process";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { getPublicEvents } from "@/lib/events";
import { MOCK_CLUBS, MOCK_VENUES } from "@/lib/mock/events";

import { prisma } from "@/src/lib/prisma";

export default async function HomePage() {
  const [events, venuesCount, usersCount] = await Promise.all([
    getPublicEvents(),
    prisma.venue.count().catch(() => 5),
    prisma.user.count().catch(() => 25),
  ]);

  const stats = [
    { value: events.length, label: "Verified events" },
    { value: Math.max(5, Math.round(usersCount / 4)), label: "Active clubs" },
    { value: venuesCount, label: "Venues" },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="flex-1">
        <LandingExperience events={events} stats={stats} between={<Categories />}>
          <Showcase />
          <Features />
          <Venues />
          <Process />
          <Faq />
          <Cta />
        </LandingExperience>
      </main>
      <SiteFooter />
    </div>
  );
}
