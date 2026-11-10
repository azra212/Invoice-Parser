import type { ProcessedDocument } from "@invoice-parser/shared";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  page?: number;
  limit?: number;
  total?: number;
  counts?: Record<string, number>;
  error?: {
    message?: string;
  };
};

export type DocumentQuery = {
  status?: string;
  q?: string;
  page?: number;
};

export type DocumentList = {
  documents: ProcessedDocument[];
  page: number;
  limit: number;
  total: number;
  counts: Record<string, number>;
};

function request(path: string, init: RequestInit = {}) {
  return fetch(path, { ...init, credentials: "include" });
}

function getApiErrorMessage(data: ApiResponse<unknown>, fallback: string) {
  return data.message || data.error?.message || fallback;
}

export async function fetchDocuments(
  query: DocumentQuery = {},
): Promise<DocumentList> {
  const params = new URLSearchParams();
  params.set("limit", "20");
  params.set("page", String(query.page ?? 1));
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);

  const res = await request(`/api/v1/documents?${params}`);
  const data: ApiResponse<ProcessedDocument[]> = await res.json();

  if (!res.ok || !data.success || !data.data) {
    throw new Error(getApiErrorMessage(data, "Failed to fetch documents."));
  }

  return {
    documents: data.data,
    page: data.page ?? 1,
    limit: data.limit ?? 20,
    total: data.total ?? data.data.length,
    counts: data.counts ?? {},
  };
}

export async function downloadDocuments(
  format: "csv" | "json",
  query: DocumentQuery = {},
) {
  const params = new URLSearchParams({ format });
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  const res = await request(`/api/v1/documents/export?${params}`);
  if (!res.ok) {
    throw new Error("Export failed.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = format === "csv" ? "documents.csv" : "documents.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await request("/api/v1/documents/upload", {
    method: "POST",
    body: formData,
  });

  const data: ApiResponse<ProcessedDocument> = await res.json();

  if (!res.ok || !data.success || !data.data) {
    throw new Error(
      getApiErrorMessage(
        data,
        "Document upload failed. Please try again with another file.",
      ),
    );
  }

  return data.data;
}

export async function updateDocument(
  id: string,
  updates: Partial<ProcessedDocument>,
) {
  const res = await request(`/api/v1/documents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const data: ApiResponse<ProcessedDocument> = await res.json();

  if (!res.ok || !data.success || !data.data) {
    throw new Error(getApiErrorMessage(data, "Failed to update document."));
  }

  return data.data;
}

export async function reprocessDocument(id: string) {
  const res = await request(`/api/v1/documents/${id}/reprocess`, {
    method: "POST",
  });
  const data: ApiResponse<ProcessedDocument> = await res.json();

  if (!res.ok || !data.success || !data.data) {
    throw new Error(getApiErrorMessage(data, "Failed to reprocess document."));
  }

  return data.data;
}

export async function deleteDocument(id: string) {
  const res = await request(`/api/v1/documents/${id}`, {
    method: "DELETE",
  });

  const data: ApiResponse<ProcessedDocument> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(getApiErrorMessage(data, "Failed to delete document."));
  }

  return data.data;
}
