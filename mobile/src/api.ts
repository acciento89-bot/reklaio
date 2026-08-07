export type MobileUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
};

export type MobileCase = {
  id: string;
  type: string;
  status: string;
  title: string;
  companyName: string | null;
  amountCents: number | null;
  currency: string;
  updatedAt: string;
  nextDueAt: string | null;
  documentCount: number;
};

export type MobileCaseType = {
  slug: string;
  value: string;
  title: string;
  description: string;
  icon: string;
  checklistTitle: string;
  checklist: string[];
};

export type MobileCaseEvent = {
  id: string;
  type: string;
  title: string;
  details: string | null;
  occurredAt: string;
};

export type MobileCaseDeadline = {
  id: string;
  title: string;
  dueAt: string;
  completedAt: string | null;
};

export type MobileCaseDocument = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string | null;
  createdAt: string;
};

export type MobileCaseDetail = {
  id: string;
  type: string;
  status: string;
  title: string;
  companyName: string | null;
  orderReference: string | null;
  amountCents: number | null;
  currency: string;
  incidentDate: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  events: MobileCaseEvent[];
  deadlines: MobileCaseDeadline[];
  documents: MobileCaseDocument[];
};

export type CreateCaseInput = {
  type: string;
  title: string;
  companyName: string;
  orderReference: string;
  amount: string;
  incidentDate: string;
  summary: string;
};

export type MobileDeadline = {
  id: string;
  caseId: string;
  caseTitle: string;
  companyName: string | null;
  title: string;
  dueAt: string;
  completedAt: string | null;
  state: "overdue" | "soon" | "open" | "completed";
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://reklaio.de").replace(/\/$/, "");

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error || "Die Anfrage konnte nicht abgeschlossen werden.", response.status);
  }

  return payload as T;
}

export function loginRequest(email: string, password: string) {
  return apiRequest<{
    token: string;
    expiresAt: string;
    user: MobileUser;
  }>("/api/mobile/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function meRequest(token: string) {
  return apiRequest<{ user: MobileUser }>("/api/mobile/v1/me", { token });
}

export function logoutRequest(token: string) {
  return apiRequest<void>("/api/mobile/v1/auth/logout", {
    method: "POST",
    token
  });
}

export function casesRequest(token: string) {
  return apiRequest<{ cases: MobileCase[] }>("/api/mobile/v1/cases", { token });
}

export function caseTypesRequest(token: string) {
  return apiRequest<{ caseTypes: MobileCaseType[] }>("/api/mobile/v1/case-types", { token });
}

export function caseRequest(token: string, caseId: string) {
  return apiRequest<{ case: MobileCaseDetail }>(`/api/mobile/v1/cases/${encodeURIComponent(caseId)}`, { token });
}

export function createCaseRequest(token: string, input: CreateCaseInput) {
  return apiRequest<{ case: { id: string } }>("/api/mobile/v1/cases", {
    method: "POST",
    token,
    body: JSON.stringify(input)
  });
}

export function deadlinesRequest(token: string) {
  return apiRequest<{ deadlines: MobileDeadline[] }>("/api/mobile/v1/deadlines", { token });
}
