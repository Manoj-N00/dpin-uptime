import { Prisma, WebsiteStatus, UptimePeriod } from '@prisma/client';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { prismaClient } from 'db/client';

// Define interfaces used by uptime calculations
export interface WebsiteTick {
  status: WebsiteStatus;
  total: number | null;
  createdAt: Date;
}

export interface UptimeHistoryData {
  uptimePercentage: number;
  averageResponse: number | null;
  incidents: number;
  downtime: number;
  period: UptimePeriod;
  startDate: Date;
  endDate: Date;
  totalIncidents: number;
  totalDowntime: number;
}

export async function calculateHistoricalUptime(
  websiteId: string,
  period: UptimePeriod,
  startDate: Date
): Promise<UptimeHistoryData | null> {
  const endDate = new Date(startDate);
  let durationInHours: number;

  switch (period) {
    case UptimePeriod.DAILY:
      endDate.setDate(endDate.getDate() + 1);
      durationInHours = 24;
      break;
    case UptimePeriod.WEEKLY:
      endDate.setDate(endDate.getDate() + 7);
      durationInHours = 168;
      break;
    case UptimePeriod.MONTHLY:
      endDate.setMonth(endDate.getMonth() + 1);
      durationInHours = endDate.getDate() * 24; // Approximation
      break;
  }

  const ticks = await prismaClient.websiteTick.findMany({
    where: {
      websiteId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (ticks.length === 0) return null;

  const totalTicks = ticks.length;
  const upTicks = ticks.filter(
    (tick: WebsiteTick) => tick.status === WebsiteStatus.ONLINE
  ).length;
  const uptimePercentage = (upTicks / totalTicks) * 100;

  const validResponseTimes = ticks.filter(
    (tick: WebsiteTick) => tick.total != null
  );
  const averageResponse =
    validResponseTimes.length > 0
      ? validResponseTimes.reduce(
          (sum: number, tick: WebsiteTick) => sum + (tick.total || 0),
          0
        ) / validResponseTimes.length
      : null;

  const incidents = ticks.reduce(
    (acc: number, tick: WebsiteTick, index: number) => {
      if (
        tick.status === WebsiteStatus.OFFLINE &&
        (index === 0 || ticks[index - 1].status !== WebsiteStatus.OFFLINE)
      ) {
        acc++;
      }
      return acc;
    },
    0
  );

  const downtime = ticks.reduce((acc: number, tick: WebsiteTick) => {
    if (tick.status === WebsiteStatus.OFFLINE) {
      acc += 60; // Assuming 60-second check frequency
    }
    return acc;
  }, 0);

  return {
    period,
    startDate,
    endDate,
    uptimePercentage,
    averageResponse,
    incidents,
    downtime,
    totalIncidents: incidents,
    totalDowntime: downtime,
  };
}

export async function computeHistoricalDataPayloads(
  websiteId: string
): Promise<{
  daily: any | null;
  weekly: any | null;
  monthly: any | null;
  websiteUpdate: any;
}> {
  const now = new Date();
  const dailyStartDate = startOfDay(now);
  const weeklyStartDate = startOfWeek(now);
  const monthlyStartDate = startOfMonth(now);

  const daily = await calculateHistoricalUptime(
    websiteId,
    UptimePeriod.DAILY,
    dailyStartDate
  );
  const weekly = await calculateHistoricalUptime(
    websiteId,
    UptimePeriod.WEEKLY,
    weeklyStartDate
  );
  const monthly = await calculateHistoricalUptime(
    websiteId,
    UptimePeriod.MONTHLY,
    monthlyStartDate
  );

  return {
    daily: daily
      ? {
          where: {
            websiteId_period_startDate: {
              websiteId,
              period: UptimePeriod.DAILY,
              startDate: dailyStartDate,
            },
          },
          create: {
            websiteId,
            period: UptimePeriod.DAILY,
            startDate: dailyStartDate,
            endDate: now,
            uptimePercentage: daily.uptimePercentage,
            averageResponse: daily.averageResponse,
            totalIncidents: daily.totalIncidents,
            totalDowntime: daily.totalDowntime,
          },
          update: {
            endDate: now,
            uptimePercentage: daily.uptimePercentage,
            averageResponse: daily.averageResponse,
            totalIncidents: daily.totalIncidents,
            totalDowntime: daily.totalDowntime,
          },
        }
      : null,
    weekly: weekly
      ? {
          where: {
            websiteId_period_startDate: {
              websiteId,
              period: UptimePeriod.WEEKLY,
              startDate: weeklyStartDate,
            },
          },
          create: {
            websiteId,
            period: UptimePeriod.WEEKLY,
            startDate: weeklyStartDate,
            endDate: now,
            uptimePercentage: weekly.uptimePercentage,
            averageResponse: weekly.averageResponse,
            totalIncidents: weekly.totalIncidents,
            totalDowntime: weekly.totalDowntime,
          },
          update: {
            endDate: now,
            uptimePercentage: weekly.uptimePercentage,
            averageResponse: weekly.averageResponse,
            totalIncidents: weekly.totalIncidents,
            totalDowntime: weekly.totalDowntime,
          },
        }
      : null,
    monthly: monthly
      ? {
          where: {
            websiteId_period_startDate: {
              websiteId,
              period: UptimePeriod.MONTHLY,
              startDate: monthlyStartDate,
            },
          },
          create: {
            websiteId,
            period: UptimePeriod.MONTHLY,
            startDate: monthlyStartDate,
            endDate: now,
            uptimePercentage: monthly.uptimePercentage,
            averageResponse: monthly.averageResponse,
            totalIncidents: monthly.totalIncidents,
            totalDowntime: monthly.totalDowntime,
          },
          update: {
            endDate: now,
            uptimePercentage: monthly.uptimePercentage,
            averageResponse: monthly.averageResponse,
            totalIncidents: monthly.totalIncidents,
            totalDowntime: monthly.totalDowntime,
          },
        }
      : null,
    websiteUpdate: {
      where: { id: websiteId },
      data: { uptimePercentage: daily?.uptimePercentage ?? 0 },
    },
  };
}
