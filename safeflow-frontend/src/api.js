const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function loginWithEmail(email) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getDraft(userId) {
  return request(`/drafts/${userId}`, { method: "GET" });
}

export async function saveDraft(userId, data) {
  return request(`/drafts/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

export async function deleteDraft(userId) {
  return request(`/drafts/${userId}`, { method: "DELETE" });
}
