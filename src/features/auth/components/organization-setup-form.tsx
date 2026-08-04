"use client";

import { useActionState, useState } from "react";

import { Field, fieldDescribedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createOrganizationAction } from "@/features/auth/actions/organization-setup";
import { FormAlert, SubmitButton } from "@/features/auth/components/form-feedback";
import { initialAuthFormState } from "@/features/auth/lib/form-state";
import { normalizeOrganizationSlug, suggestOrganizationSlug } from "@/lib/organizations/slug";

export function OrganizationSetupForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(createOrganizationAction, initialAuthFormState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // Once the URL is typed by hand, the name stops overwriting it — otherwise a
  // deliberate choice is silently undone by the next keystroke in the name field.
  const [slugEdited, setSlugEdited] = useState(false);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const formMessage = state.status === "error" ? state.message : null;
  const effectiveSlug = slugEdited
    ? slug
    : name.trim().length > 0
      ? suggestOrganizationSlug(name)
      : "";

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {formMessage ? <FormAlert message={formMessage} /> : null}

      <Field htmlFor="name" label="Organization name" error={errors.name}>
        <Input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ellis Development Partners"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={fieldDescribedBy("name", { error: Boolean(errors.name) })}
        />
      </Field>

      <Field
        htmlFor="slug"
        label="Workspace URL"
        hint="Lowercase letters, numbers, and hyphens. This identifies your organization and cannot be changed here later."
        error={errors.slug}
      >
        <Input
          id="slug"
          name="slug"
          type="text"
          required
          maxLength={48}
          value={effectiveSlug}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(normalizeOrganizationSlug(event.target.value));
          }}
          placeholder="ellis-development"
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={Boolean(errors.slug)}
          aria-describedby={fieldDescribedBy("slug", {
            hint: true,
            error: Boolean(errors.slug),
          })}
        />
      </Field>

      <SubmitButton pendingLabel="Creating workspace">Create organization</SubmitButton>
    </form>
  );
}
