export type MobileUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
  planCode: "free" | "pro";
};

export type SubscriptionSyncResult = {
  planCode: "free" | "pro";
  planSource: "beta" | "stripe" | "app_store" | "google_play" | "manual" | "admin" | null;
  provider: "app_store" | "google_play" | null;
  productId: string | null;
  status: string | null;
  expiresAt: string | null;
  managementUrl: string | null;
};

export type MobileCaseStatus =
  | "draft"
  | "collecting_evidence"
  | "ready_to_contact"
  | "waiting_for_reply"
  | "deadline_expired"
  | "escalation"
  | "resolved"
  | "closed";

export const mobileCaseStatuses: Array<{ value: MobileCaseStatus; label: string }> = [
  { value: "draft", label: "Entwurf" },
  { value: "collecting_evidence", label: "Belege sammeln" },
  { value: "ready_to_contact", label: "Kontakt vorbereiten" },
  { value: "waiting_for_reply", label: "Antwort ausstehend" },
  { value: "deadline_expired", label: "Frist abgelaufen" },
  { value: "escalation", label: "Eskalation prüfen" },
  { value: "resolved", label: "Gelöst" },
  { value: "closed", label: "Geschlossen" }
];

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

export type DocumentTypeValue = "invoice" | "email" | "photo" | "tracking" | "other";

export type UploadDocumentFile = {
  uri: string;
  name: string;
  mimeType: string;
};

export const mobileDocumentTypes: Array<{ value: DocumentTypeValue; label: string }> = [
  { value: "invoice", label: "Rechnung oder Bestellbeleg" },
  { value: "email", label: "E-Mail oder Schriftverkehr" },
  { value: "photo", label: "Foto oder Screenshot" },
  { value: "tracking", label: "Versand- oder Trackingbeleg" },
  { value: "other", label: "Sonstiger Beleg" }
];

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
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("Content-Type")) {
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

export function deleteAccountRequest(token: string, password: string, confirmation: string) {
  return apiRequest<void>("/api/mobile/v1/account/delete", {
    method: "POST",
    token,
    body: JSON.stringify({ password, confirmation })
  });
}

export function syncSubscriptionRequest(token: string) {
  return apiRequest<SubscriptionSyncResult>("/api/mobile/v1/subscription/sync", {
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

export function uploadDocumentRequest(
  token: string,
  caseId: string,
  documentType: DocumentTypeValue,
  file: UploadDocumentFile
) {
  const formData = new FormData();
  formData.append("documentType", documentType);
  formData.append("document", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType
  } as unknown as Blob);

  return apiRequest<{ document: MobileCaseDocument }>(
    `/api/mobile/v1/cases/${encodeURIComponent(caseId)}/documents`,
    {
      method: "POST",
      token,
      body: formData
    }
  );
}

export function documentDownloadUrl(caseId: string, documentId: string) {
  return `${API_URL}/api/mobile/v1/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}`;
}

export function deleteDocumentRequest(token: string, caseId: string, documentId: string) {
  return apiRequest<void>(
    `/api/mobile/v1/cases/${encodeURIComponent(caseId)}/documents/${encodeURIComponent(documentId)}`,
    { method: "DELETE", token }
  );
}

export function updateCaseStatusRequest(token: string, caseId: string, status: MobileCaseStatus) {
  return apiRequest<{ status: MobileCaseStatus }>(
    `/api/mobile/v1/cases/${encodeURIComponent(caseId)}/status`,
    { method: "PATCH", token, body: JSON.stringify({ status }) }
  );
}

export function createDeadlineRequest(token: string, caseId: string, title: string, dueDate: string) {
  return apiRequest<{ deadline: MobileCaseDeadline }>(
    `/api/mobile/v1/cases/${encodeURIComponent(caseId)}/deadlines`,
    { method: "POST", token, body: JSON.stringify({ title, dueDate }) }
  );
}

export function completeDeadlineRequest(token: string, caseId: string, deadlineId: string) {
  return apiRequest<{ completedAt: string }>(
    `/api/mobile/v1/cases/${encodeURIComponent(caseId)}/deadlines/${encodeURIComponent(deadlineId)}/complete`,
    { method: "PATCH", token }
  );
}

export function createEventRequest(
  token: string,
  caseId: string,
  input: { title: string; details: string; occurredAt?: string }
) {
  return apiRequest<{ event: MobileCaseEvent }>(
    `/api/mobile/v1/cases/${encodeURIComponent(caseId)}/events`,
    { method: "POST", token, body: JSON.stringify({ ...input, occurredAt: input.occurredAt || "" }) }
  );
}

export function deadlinesRequest(token: string) {
  return apiRequest<{ deadlines: MobileDeadline[] }>("/api/mobile/v1/deadlines", { token });
}
