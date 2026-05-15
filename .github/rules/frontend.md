---
applyTo: "frontend/**,web/**,app/**"
---

# 🖥️ Frontend Rules — S.M.I.L.E

> Related: [security.md](./security.md) | [docs-and-build.md](./docs-and-build.md)

## Component File Size

**HARD LIMIT**: No React / Next.js component file may exceed **1000 lines**.  
**TARGET**: Keep components at **~500 lines** or fewer.

### Splitting Guidelines

| What grows too large          | Where to extract                       |
| ----------------------------- | -------------------------------------- |
| Data-fetching / state logic   | `hooks/use<Feature>.ts`                |
| Static data, config, enums    | `constants/<feature>.constants.ts`     |
| TypeScript types & interfaces | `types/<feature>.types.ts`             |
| Repeated JSX blocks           | Named child component in `components/` |
| Utility calculations          | `utils/<feature>.utils.ts`             |

### Correct Structure

```
components/
  AppointmentCard/
    index.ts                     (re-export only)
    AppointmentCard.tsx          (~150 lines — layout only)
    AppointmentCard.hooks.ts     (~100 lines — data/state logic)
    AppointmentCard.types.ts     (~30  lines — TS types)
    AppointmentCard.constants.ts (~20  lines — static values)
```

### Wrong Structure

```
components/
  AppointmentCard.tsx   ← 900 lines mixing layout + logic + types
```

---

## Component Design Rules

1. **Single Responsibility** — one component, one concern.
2. **No prop drilling beyond 2 levels** — use React Context or Zustand store.
3. **No inline styles** — use Tailwind utility classes only.
4. **Client components** (`"use client"`) must be leaf nodes where possible; keep server components at the route level.
5. **Async data** must be fetched in a custom hook or server component, never inside a `useEffect` without a custom hook wrapper.
6. **Form state** must use `react-hook-form`; do not manage form fields with plain `useState`.
7. **Loading / error states** are mandatory for every data-fetching component.

---

## File Naming Conventions

| Type              | Convention               | Example                          |
| ----------------- | ------------------------ | -------------------------------- |
| Component         | PascalCase               | `PatientProfile.tsx`             |
| Hook              | camelCase prefixed `use` | `usePatientData.ts`              |
| Utility           | camelCase                | `formatDate.ts`                  |
| Constants         | camelCase                | `appointmentStatus.constants.ts` |
| Types             | camelCase                | `appointment.types.ts`           |
| Page (App Router) | lowercase `page.tsx`     | `app/patients/page.tsx`          |
| Layout            | lowercase `layout.tsx`   | `app/patients/layout.tsx`        |

---

## Import Order

Enforce with ESLint `import/order`:

```ts
// 1. React / Next
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party
import { useForm } from "react-hook-form";

// 3. Internal — absolute (@/)
import { Button } from "@/components/ui/button";
import { usePatientData } from "@/hooks/usePatientData";

// 4. Relative
import { AppointmentCard } from "./AppointmentCard";
import type { AppointmentCardProps } from "./AppointmentCard.types";
```

---

## Testing

- Every custom hook **must** have a `*.test.ts` file using React Testing Library.
- Page-level components **must** have at least one integration test covering the primary user flow.
- Run tests before push: `pnpm test` / `npm test`.

---

## Architecture Patterns

### Next.js App Router Layout

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (dashboard)/
    layout.tsx             ← shared shell (sidebar, header)
    patients/
      page.tsx             ← server component, fetches data
      [id]/
        page.tsx
        loading.tsx        ← Suspense fallback
        error.tsx          ← error boundary
    appointments/
      page.tsx
  api/                     ← Route Handlers only if needed
components/
  ui/                      ← shadcn/radix primitives, never feature logic
  shared/                  ← cross-feature reusable components
  <feature>/               ← feature-scoped components
hooks/
lib/
  api.ts                   ← typed axios / fetch wrapper
  queryClient.ts           ← TanStack Query client singleton
types/
utils/
```

### Server vs. Client Components

| Use Server Component          | Use Client Component (`"use client"`)  |
| ----------------------------- | -------------------------------------- |
| Data fetching from API / DB   | User interaction, event handlers       |
| Static rendering, SEO pages   | `useState`, `useEffect`, `useRef`      |
| Heavy computation on server   | Browser-only APIs (localStorage, etc.) |
| Sensitive token/data handling | Real-time updates, WebSocket           |

- Default to **Server Component**; add `"use client"` only when required.
- Never put `"use client"` on a layout or a page that can remain server-rendered.

---

## State Management

Follow this tiered approach — use the simplest option that meets the need:

| Scope                                     | Solution                                       |
| ----------------------------------------- | ---------------------------------------------- |
| Local UI state (open/close, hover)        | `useState`                                     |
| Derived / computed values                 | `useMemo` / `useCallback`                      |
| Server cache (list, detail, mutations)    | **TanStack Query** (`useQuery`, `useMutation`) |
| Cross-component UI state (modal, sidebar) | **Zustand** store                              |
| URL state (filters, pagination, tab)      | `useSearchParams` / `nuqs`                     |
| Auth session                              | Next.js `session` (server) + Zustand (client)  |

### Zustand Store Rules

- One store file per domain: `stores/useAppointmentStore.ts`.
- Stores hold **only UI state** — never server/API data (that belongs in TanStack Query).
- Export typed selectors, never expose the full store object.
- Stores must be reset on logout.

```ts
// ✅ CORRECT — typed selectors
export const useModalOpen = () => useAppointmentStore((s) => s.isModalOpen);

// ❌ WRONG — consuming entire store
const store = useAppointmentStore();
```

### TanStack Query Rules

- Query keys must use a **factory** pattern:

```ts
// lib/queryKeys.ts
export const appointmentKeys = {
  all: ["appointments"] as const,
  list: (filters: AppointmentFilters) =>
    ["appointments", "list", filters] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
};
```

- `staleTime` must be configured per query — never rely on default 0.
- Mutations must call `queryClient.invalidateQueries` on success.
- Handle `isLoading`, `isError`, and empty states in every consumer.

---

## Data Fetching Patterns

### Server Component (preferred for initial page data)

```tsx
// app/patients/page.tsx — server component
export default async function PatientsPage() {
  const patients = await fetchPatients(); // direct API call, no useEffect
  return <PatientList patients={patients} />;
}
```

### Client Component (interactive / real-time data)

```tsx
"use client";
// Always wrap in a custom hook, never bare useEffect
function AppointmentDetail({ id }: { id: string }) {
  const { data, isLoading, isError } = useAppointmentDetail(id);
  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage />;
  return <AppointmentCard appointment={data} />;
}
```

---

## Routing & Navigation

- Use Next.js `<Link>` for internal navigation — never `<a>` or `router.push` for static links.
- Dynamic routes: typed with `params: { id: string }` — add a `generateStaticParams` where applicable.
- Protect authenticated routes with middleware (`middleware.ts`) — never with client-side checks alone.
- Redirects for unauthenticated access must happen server-side in `middleware.ts`.

---

## Performance

1. **Code splitting**: Use `next/dynamic` for heavy components (charts, rich-text editors, maps).

   ```ts
   const DentalChart = dynamic(() => import("./DentalChart"), { ssr: false });
   ```

2. **Images**: Always use `next/image`; provide `width`, `height`, and `alt`.

3. **Fonts**: Use `next/font` — never `@import` in CSS.

4. **Bundle analysis**: Run `ANALYZE=true pnpm build` before any release PR; new dependency addition must be justified.

5. **Memoisation**: Use `React.memo` only with measured data — do not pre-optimise unconditionally.

6. **Core Web Vitals targets** (measured in CI with Lighthouse):
   - LCP < 2.5 s
   - CLS < 0.1
   - INP < 200 ms

---

## Accessibility (a11y)

- All interactive elements must be keyboard-navigable (`tabIndex`, `onKeyDown`).
- Every `<img>` must have a descriptive `alt` (or `alt=""` for decorative).
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, `<form>` for forms.
- Colour contrast ratio ≥ 4.5:1 (WCAG AA).
- Modal / dialog must trap focus and announce with `aria-modal`, `role="dialog"`.
- Run `axe-core` in CI: zero critical a11y violations allowed.

---

## API Layer

- All API calls go through `lib/api.ts` — never raw `fetch`/`axios` inside components.
- The API client must attach the Authorization header from the session token automatically.
- Errors from the API must be parsed into a typed `ApiError` and surfaced via TanStack Query's `onError`.

```ts
// lib/api.ts
export const api = axios.create({ baseURL: env.NEXT_PUBLIC_API_URL });
api.interceptors.request.use((cfg) => {
  cfg.headers.Authorization = `Bearer ${getAccessToken()}`;
  return cfg;
});
api.interceptors.response.use(undefined, handleApiError);
```

---

## Security (FE-specific)

- Never store JWT tokens in `localStorage` — use `httpOnly` cookies or in-memory.
- Never log user PII to the browser console in any environment.
- Sanitise any HTML rendered via `dangerouslySetInnerHTML` with DOMPurify.
- Content Security Policy headers must be configured in `next.config.ts`.
- See [security.md](./security.md) for the full security policy.
