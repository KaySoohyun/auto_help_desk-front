export const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? (process.env.URL_BACKEND_PROD ?? "http://localhost:8000")
    : (process.env.URL_BACKEND_DEV ?? "http://localhost:8000");
