export async function readApiError(
  response: Response,
  fallback: string
): Promise<string> {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return payload?.error || fallback;
}
