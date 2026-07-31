export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:8000/api/v1`
  : 'http://localhost:8000/api/v1');

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'API request failed');
  }

  return response.json();
}
