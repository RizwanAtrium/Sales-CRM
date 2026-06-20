const DEFAULT_CST_API = "http://localhost:5000/api";
const DEFAULT_DEV_KEY = "development-sales-integration-key";

export type CstHandler = {
  id: string;
  name: string;
  email: string;
  managerId: string | null;
  activeClients: number;
};

export type SalesHandoffPayload = {
  handoffId: string;
  opportunityId: string;
  customer: {
    businessName: string;
    customerName?: string;
    phoneNumber?: string;
    mobileNumber?: string;
    email?: string;
    businessAddress?: string;
    state?: string;
    country?: string;
  };
  services: Array<{ name: string; amount: number }>;
  saleDate: string;
  paidAt: string;
  workStartDate?: string;
  totalDealValue: number;
  amountReceived: number;
  closer: { name: string; email?: string };
  teamLead?: { name: string; email?: string };
  manager?: { name: string; email?: string };
  cstHandlerId?: string;
};

type CstEnvelope<T> = { success: boolean; data?: T; error?: string };

function config() {
  return {
    apiUrl: (process.env.CST_CRM_API_URL || DEFAULT_CST_API).replace(/\/$/, ""),
    secret: process.env.CST_CRM_INTEGRATION_SECRET || (process.env.NODE_ENV === "production" ? "" : DEFAULT_DEV_KEY),
  };
}

async function cstRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiUrl, secret } = config();
  if (!secret) throw new Error("CST CRM integration secret is not configured");
  const response = await fetch(`${apiUrl}/integrations/sales${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-integration-key": secret,
      ...init?.headers,
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const result = await response.json() as CstEnvelope<T>;
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || `CST CRM returned ${response.status}`);
  }
  return result.data;
}

export function getCstHandlers() {
  return cstRequest<CstHandler[]>("/handlers");
}

export function deliverSalesHandoff(payload: SalesHandoffPayload) {
  return cstRequest<{ created: boolean; clientId: string; lifecycleStage: string }>("/handoffs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
