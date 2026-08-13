export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly correlationId?: string;

  constructor(status: number, message: string, detail?: string, correlationId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.correlationId = correlationId;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
