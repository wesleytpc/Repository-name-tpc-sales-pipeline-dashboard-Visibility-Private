import { toInputDate } from "@/lib/format";

export type ReportDateBasis = "updatedAt" | "createdAt" | "expectedCloseDate" | "lastContactDate" | "nextStepDate";
export type ReportPeriod = "all" | "this-month" | "last-month" | "this-quarter" | "this-year" | "next-30" | "custom";

export type ReportFilterParams = {
  period?: ReportPeriod;
  dateBasis?: ReportDateBasis;
  from?: string;
  to?: string;
  industry?: string;
  product?: string;
  status?: string;
};

export type FilterableOpportunity = {
  updatedAt: Date;
  createdAt: Date;
  expectedCloseDate: Date | null;
  lastContactDate: Date | null;
  nextStepDate: Date | null;
  industry: string | null;
  product: string | null;
  status: string;
};

export function normaliseReportFilters(params?: ReportFilterParams) {
  const period = params?.period ?? "all";
  const dateBasis = params?.dateBasis ?? "updatedAt";

  return {
    period,
    dateBasis,
    from: params?.from ?? "",
    to: params?.to ?? "",
    industry: params?.industry ?? "",
    product: params?.product ?? "",
    status: params?.status ?? "",
  };
}

export function filterOpportunitiesForReport<T extends FilterableOpportunity>(
  opportunities: T[],
  params?: ReportFilterParams,
) {
  const filters = normaliseReportFilters(params);
  const { startDate, endDate } = getReportDateRange(filters.period, filters.from, filters.to);

  return opportunities.filter((item) => {
    const date = getOpportunityDate(item, filters.dateBasis);

    return (!filters.industry || item.industry === filters.industry)
      && (!filters.product || item.product === filters.product)
      && (!filters.status || item.status === filters.status)
      && (!startDate || (date && date >= startDate))
      && (!endDate || (date && date < endDate));
  });
}

export function getReportFilterOptions(opportunities: FilterableOpportunity[]) {
  return {
    industries: Array.from(new Set(opportunities.map((item) => item.industry).filter(Boolean))).sort() as string[],
    products: Array.from(new Set(opportunities.map((item) => item.product).filter(Boolean))).sort() as string[],
  };
}

export function getDefaultFromDate(params?: ReportFilterParams) {
  const filters = normaliseReportFilters(params);
  if (filters.period === "custom") return filters.from;
  return filters.from || toInputDate(getReportDateRange(filters.period, filters.from, filters.to).startDate);
}

export function getReportFilterQuery(params?: ReportFilterParams) {
  const filters = normaliseReportFilters(params);
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && !(key === "period" && value === "all") && !(key === "dateBasis" && value === "updatedAt")) {
      query.set(key, value);
    }
  });

  return query.toString();
}

function getReportDateRange(period: ReportPeriod, from?: string, to?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (period === "this-month") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else if (period === "last-month") {
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (period === "this-quarter") {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
    endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 1);
  } else if (period === "this-year") {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today.getFullYear() + 1, 0, 1);
  } else if (period === "next-30") {
    startDate = today;
    endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 31);
  } else if (period === "custom") {
    startDate = from ? parseInputDate(from) : null;
    endDate = to ? parseInputDate(to, true) : null;
  }

  return { startDate, endDate };
}

function parseInputDate(value: string, endOfDay = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  if (endOfDay) date.setDate(date.getDate() + 1);
  return date;
}

function getOpportunityDate(opportunity: FilterableOpportunity, basis: ReportDateBasis) {
  return opportunity[basis] ?? null;
}
