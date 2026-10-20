import { HttpErrorResponse } from '@angular/common/http';

const MAX_BACKEND_MESSAGE_LENGTH = 200;

/**
 * Produces a user-safe message for an HTTP failure.
 * Prefers the backend `detail`/`title` only when it is a short, plain string;
 * never returns stack traces or the raw response body.
 */
export function getHttpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage = extractBackendMessage(error.error);
    if (backendMessage) {
      return backendMessage;
    }
    if (error.status === 0) {
      return 'We could not reach the server. Please check your connection and try again.';
    }
    if (error.status === 401) {
      return 'Please sign in to continue.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'The requested item could not be found.';
    }
  }
  return fallback;
}

function extractBackendMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as Record<string, unknown>;
  const candidate = record['detail'] ?? record['title'] ?? record['statusMessage'];
  if (typeof candidate !== 'string') {
    return null;
  }
  const message = candidate.trim();
  if (!message || message.length > MAX_BACKEND_MESSAGE_LENGTH) {
    return null;
  }
  // Do not surface stack traces or exception text even if the API returns it.
  if (/exception|stack\s*trace|\bat\s+\w+\(/i.test(message)) {
    return null;
  }
  return message;
}
