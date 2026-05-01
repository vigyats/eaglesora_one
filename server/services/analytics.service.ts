import { db } from '../db';
import { donations, projects, events, projectTranslations, eventTranslations } from '@shared/schema';
import { sql, desc, gte, lte, and } from 'drizzle-orm';

export async function getAnalytics(startDate?: Date, endDate?: Date) {
  const dateFilter = startDate && endDate 
    ? and(gte(donations.createdAt, startDate), lte(donations.createdAt, endDate))
    : undefined;

  // Total donations
  const [totalDonationsResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${donations.amount}), 0)`, count: sql<number>`COUNT(*)` })
    .from(donations)
    .where(dateFilter);

  // Total projects and events
  const [projectsCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(projects);
  const [eventsCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(events);

  // Recent donations
  const recentDonations = await db
    .select()
    .from(donations)
    .orderBy(desc(donations.createdAt))
    .limit(10);

  // Donations by month (last 6 months)
  const donationsByMonth = await db
    .select({
      month: sql<string>`TO_CHAR(${donations.createdAt}, 'Mon YYYY')`,
      total: sql<number>`SUM(${donations.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(donations)
    .groupBy(sql`TO_CHAR(${donations.createdAt}, 'Mon YYYY')`)
    .orderBy(sql`MIN(${donations.createdAt}) DESC`)
    .limit(6);

  return {
    overview: {
      totalDonations: Number(totalDonationsResult.total),
      totalDonors: Number(totalDonationsResult.count),
      totalProjects: Number(projectsCount.count),
      totalEvents: Number(eventsCount.count),
    },
    recentDonations,
    donationsByMonth: donationsByMonth.reverse(),
  };
}
