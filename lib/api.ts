import { z } from "zod";

/** Success envelope: every API route returns `{ data }`. */
export interface ApiSuccess<T> {
  data: T;
}

/** Stable error shape: `{ error: { code, message } }` — never a stack trace. */
export interface ApiFailure {
  error: {
    code: string;
    message: string;
  };
}

/** Throw/subclass for expected failures with an explicit HTTP status. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (message = "Not found") =>
  new ApiError(404, "NOT_FOUND", message);

export const forbidden = (message = "Forbidden") =>
  new ApiError(403, "FORBIDDEN", message);

export const unauthorized = (message = "Unauthorized") =>
  new ApiError(401, "UNAUTHORIZED", message);

/** 200/201 JSON success. */
export function ok<T>(data: T, status = 200): Response {
  const body: ApiSuccess<T> = { data };
  return Response.json(body, { status });
}

/** Map any thrown value to a stable `{ error }` JSON response. */
export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    const body: ApiFailure = {
      error: { code: error.code, message: error.message },
    };
    return Response.json(body, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    const body: ApiFailure = {
      error: { code: "VALIDATION_ERROR", message: "Invalid request" },
    };
    return Response.json(body, { status: 400 });
  }
  // Unknown failures: log server-side, return generic 500 (no stack leak).
  console.error("[api] unhandled error", error);
  const body: ApiFailure = {
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  };
  return Response.json(body, { status: 500 });
}

type RouteHandler = (
  req: Request,
  ctx: { params: Promise<Record<string, string | string[]>> },
) => Promise<Response>;

/** Wrap a Route Handler so thrown errors become stable error responses. */
export function withApi(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
