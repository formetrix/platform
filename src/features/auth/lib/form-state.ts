/**
 * The state every authentication form passes through `useActionState`.
 *
 * One shape for all of them, because the screens differ in fields but not in
 * outcomes: still editing, rejected with a reason, or finished with something
 * to tell the user (a verification email sent, a reset requested). Actions that
 * end in navigation never return `done` — they call `redirect()` instead.
 */

export type FormErrors = Record<string, string>;

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; message: string | null; fieldErrors: FormErrors }
  | { status: "done"; heading: string; body: string };

export const initialAuthFormState: AuthFormState = { status: "idle" };

export function formError(message: string | null, fieldErrors: FormErrors = {}): AuthFormState {
  return { status: "error", message, fieldErrors };
}

export function fieldErrors(errors: FormErrors): AuthFormState {
  return { status: "error", message: null, fieldErrors: errors };
}

export function formDone(heading: string, body: string): AuthFormState {
  return { status: "done", heading, body };
}

/** Convenience for reading a text field out of a submitted form. */
export function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * Shown when the deployment has no Supabase credentials. Names the condition
 * plainly instead of failing as an unexplained error (docs/AUTH_FLOW.md §12.5).
 */
export const SUPABASE_UNCONFIGURED_MESSAGE =
  "Authentication is not configured for this environment yet. Set the Supabase environment variables and restart the server.";
