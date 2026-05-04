import type { ProcessedDocument } from "../../backend/models/documentTypes";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message?: string;
  };
};

function getApiErrorMessage(data: ApiResponse<unknown>, fallback: string) {
  return data.message || data.error?.message || fallback;
}

export async function fetchDocuments() {
  const res = await fetch("/api/documents");
  const data: ApiResponse<ProcessedDocument[]> = await res.json();

  if (!res.ok || !data.success || !data.data) {
    throw new Error(getApiErrorMessage(data, "Failed to fetch documents."));
  }

  return data.data;
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/documents/upload", {
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
  const res = await fetch(`/api/documents/${id}`, {
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

export async function deleteDocument(id: string) {
  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
  });

  const data: ApiResponse<ProcessedDocument> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(getApiErrorMessage(data, "Failed to delete document."));
  }

  return data.data;
}
