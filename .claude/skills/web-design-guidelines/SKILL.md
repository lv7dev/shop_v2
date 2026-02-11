---
name: web-design-guidelines
description: Audit UI code against 100+ web interface best practice rules covering accessibility, focus states, forms, animations, typography, images, performance, navigation, touch, dark mode, locale, hydration, and content. Use when reviewing UI code, checking accessibility compliance, auditing design quality, or checking a site against UX best practices.
---

# Web Interface Design Guidelines

## Purpose

Audit and review UI code for compliance with web interface best practices. Contains 100+ rules across 17 categories. Based on Vercel Web Interface Guidelines.

## When to Use This Skill

- "Review my UI" or "check accessibility"
- "Audit design" or "review UX"
- "Check my site against best practices"
- Building new UI components
- Code review for frontend changes
- Pre-launch quality checks

## How to Use

1. Identify the files to audit
2. Check each file against the rules below
3. Report findings in `file:line` format
4. Mark clean files as `✓ pass`

---

## 1. Accessibility

- **Icon-only buttons must have `aria-label`**
  ```tsx
  // BAD
  <button><Icon name="close" /></button>
  // GOOD
  <button aria-label="Close dialog"><Icon name="close" /></button>
  ```

- **Form controls need `<label>` or `aria-label`**
  ```tsx
  // BAD
  <input type="text" placeholder="Search" />
  // GOOD
  <label htmlFor="search">Search</label>
  <input id="search" type="text" placeholder="Search..." />
  ```

- **Interactive elements need keyboard event handlers**
  ```tsx
  // BAD: Only mouse handler
  <div onClick={handleClick}>Click me</div>
  // GOOD: Keyboard accessible
  <button onClick={handleClick}>Click me</button>
  ```

- **Use semantic HTML before ARIA** — `<button>`, `<a>`, `<label>`, `<nav>`, `<main>`, `<header>`, `<footer>` before `role="button"` etc.

- **Headings must be hierarchical** — no skipping levels (h1 -> h3)

- **Provide skip links** for keyboard navigation

- **Heading anchors need `scroll-margin-top`** to prevent content hiding behind fixed headers

---

## 2. Focus States

- **All interactive elements need visible focus** via `focus-visible:ring-*`
  ```css
  /* GOOD */
  button:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  ```

- **Never use `outline-none` without a replacement focus indicator**

- **Prefer `:focus-visible` over `:focus`** — only shows focus ring on keyboard navigation

- **Use `:focus-within` for compound controls** (e.g., search input with button)

---

## 3. Forms

- **Inputs need `autocomplete` and `name` attributes**
  ```tsx
  <input name="email" type="email" autoComplete="email" />
  ```

- **Use correct `type` and `inputMode`**
  ```tsx
  <input type="tel" inputMode="tel" />
  <input type="email" inputMode="email" />
  <input type="number" inputMode="decimal" />
  ```

- **Never disable paste** on any input

- **Make labels clickable** — use `htmlFor` or wrap input in label

- **Disable spellcheck on emails and codes**
  ```tsx
  <input type="email" spellCheck={false} autoCapitalize="off" />
  ```

- **Checkboxes/radios share hit target** with label

- **Submit buttons stay enabled** until request starts (no pre-disabling)

- **Errors appear inline** next to the relevant field

- **Placeholders end with `...`** (e.g., "Search...")

- **Warn before leaving with unsaved changes**

---

## 4. Animation

- **Honor `prefers-reduced-motion`**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; }
  }
  ```

- **Animate only `transform` and `opacity`** — avoid animating layout properties

- **Never use `transition: all`** — be explicit about which properties transition
  ```css
  /* BAD */  transition: all 0.3s ease;
  /* GOOD */ transition: opacity 0.2s ease, transform 0.2s ease;
  ```

- **Set correct `transform-origin`** for scale/rotate animations

- **Make animations interruptible** — don't block user interaction during transitions

---

## 5. Typography

- **Use `...` (ellipsis character) not `...` (three dots)**

- **Use curly quotes** `""` `''` not straight quotes `""` `''`

- **Non-breaking spaces** (`&nbsp;`) for measurements ("100&nbsp;kg") and brand names

- **Loading states end with `...`** (e.g., "Loading...")

- **Use `font-variant-numeric: tabular-nums`** for numbers in tables/counters
  ```css
  .price, .counter, .table-cell { font-variant-numeric: tabular-nums; }
  ```

- **Apply `text-wrap: balance`** on headings
  ```css
  h1, h2, h3 { text-wrap: balance; }
  ```

---

## 6. Content Handling

- **Text containers need truncation or line-clamping**
  ```css
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  ```

- **Flex children need `min-w-0`** to prevent overflow
  ```css
  .flex-child { min-width: 0; }
  ```

- **Handle empty states** — never show blank screens

- **Anticipate variable content lengths** — test with short and long strings

---

## 7. Images

- **Explicit `width` and `height` required** to prevent layout shift
  ```tsx
  <Image src={src} alt={alt} width={400} height={300} />
  ```

- **Use `loading="lazy"` for below-fold images**

- **`priority` or `fetchpriority="high"` for LCP images** (hero, above-fold)

---

## 8. Performance

- **Virtualize lists over 50 items**

- **Avoid layout reads in render** — batch DOM reads/writes separately

- **Batch DOM operations** to prevent layout thrashing

- **Prefer uncontrolled inputs** for better performance on large forms

- **Add `preconnect` links** for external domains
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  ```

- **Preload critical fonts** with `font-display: swap`
  ```css
  @font-face { font-family: 'Inter'; font-display: swap; src: url(...); }
  ```

---

## 9. Navigation & State

- **URL must reflect application state** — shareable, bookmarkable URLs

- **Use `<a>` / `<Link>` for navigation** — not onClick with router.push
  ```tsx
  // BAD
  <div onClick={() => router.push('/about')}>About</div>
  // GOOD
  <Link href="/about">About</Link>
  ```

- **Deep-link stateful UI** — filters, tabs, modals should be URL-addressable

- **Require confirmation for destructive actions** — delete, discard, etc.

---

## 10. Touch & Interaction

- **Apply `touch-action: manipulation`** to prevent 300ms tap delay
  ```css
  button, a, [role="button"] { touch-action: manipulation; }
  ```

- **Set `-webkit-tap-highlight-color: transparent`** for custom tap styles

- **Use `overscroll-behavior: contain`** in modals to prevent scroll chaining
  ```css
  .modal { overscroll-behavior: contain; }
  ```

- **Disable text selection during drag** operations

---

## 11. Safe Areas

- **Full-bleed layouts need `env(safe-area-inset-*)`**
  ```css
  .full-bleed { padding-bottom: env(safe-area-inset-bottom); }
  ```

- **Manage scrollbar width** — use `scrollbar-gutter: stable` if needed

- **Prefer flex/grid over JS** for layout calculations

---

## 12. Dark Mode

- **Set `color-scheme: dark`** on `<html>` for dark mode
  ```html
  <html style="color-scheme: dark">
  ```

- **Set `<meta name="theme-color">`** for browser chrome coloring
  ```html
  <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
  ```

- **Explicit colors for native `<select>`** — browser defaults may not respect dark mode

---

## 13. Locale & Internationalization

- **Use `Intl.DateTimeFormat`** and **`Intl.NumberFormat`** — never hardcode formats

- **Detect language via `Accept-Language` header**, not IP geolocation

---

## 14. Hydration

- **Inputs with `value` need `onChange`** handler (controlled components)

- **Guard date/time rendering** — server and client may differ
  ```tsx
  // GOOD: Suppress or defer
  <time suppressHydrationWarning>{new Date().toLocaleDateString()}</time>
  ```

- **Use `suppressHydrationWarning` minimally** — only for intentional mismatches

---

## 15. Hover States

- **Buttons and links need `hover:` styling**

- **Interactive states increase contrast** — hover should be visually distinct

---

## 16. Content & Copy

- **Active voice** — "Save changes" not "Changes will be saved"
- **Title Case for headings**
- **Numerals for counts** — "3 items" not "three items"
- **Specific button labels** — "Save profile" not "Submit"
- **Error messages include fixes** — "Email is required" not just "Error"
- **Second person** — "Your cart" not "The cart"
- **Use `&` when space-constrained** — "Terms & Privacy"

---

## 17. Anti-Patterns to Flag

Always flag these issues during audit:

| Anti-Pattern | Why |
|---|---|
| `user-scalable=no` | Blocks accessibility zoom |
| Paste-blocking on inputs | Breaks password managers |
| `transition: all` | Causes unexpected animation artifacts |
| `outline-none` without replacement | Removes keyboard focus indicator |
| `<div onClick>` for navigation | Not accessible, no right-click/cmd-click |
| `<div onClick>` as button | No keyboard support, no semantics |
| Images without dimensions | Causes layout shift (CLS) |
| Large unmapped arrays without virtualization | Performance issue |
| Unlabeled inputs | Screen reader inaccessible |
| Unlabeled icon buttons | Screen reader inaccessible |
| Hardcoded date/number formats | Locale issues |
| Unjustified `autoFocus` | Disrupts screen reader flow |

---

## Audit Output Format

When auditing, group findings by file:

```
src/components/Header.tsx:14 — icon button missing aria-label
src/components/Header.tsx:28 — outline-none without focus replacement
src/components/Form.tsx:45 — input missing autocomplete attribute
src/components/Form.tsx:52 — label not associated with input
src/pages/Home.tsx ✓ pass
```
