---
name: react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. 40+ rules across 8 categories covering waterfalls, bundle size, server performance, client data, re-renders, rendering, JS perf, and advanced patterns. Use when writing React components, implementing data fetching, reviewing code for performance, or optimizing Next.js applications.
---

# React & Next.js Performance Best Practices

## Purpose

Comprehensive performance optimization guide for React and Next.js applications, organized by impact priority. Based on Vercel Engineering guidelines (v1.0.0, January 2026).

## When to Use This Skill

- Writing new React components or Next.js pages
- Implementing data fetching patterns
- Reviewing code for performance issues
- Optimizing bundle size
- Fixing render waterfalls or slow page loads
- Code review for React/Next.js projects

---

## Category 1: Eliminating Waterfalls (CRITICAL)

Sequential async operations are the #1 performance killer. Fixing waterfalls yields **2-10x improvement**.

### Rule 1.1: Defer Awaits — Start Fetches Early, Await Late

```typescript
// BAD: Sequential fetches
async function Page() {
  const user = await getUser();
  const posts = await getPosts(user.id);
  const comments = await getComments(posts[0].id);
  return <View user={user} posts={posts} comments={comments} />;
}

// GOOD: Start independent fetches in parallel
async function Page() {
  const userPromise = getUser();
  const postsPromise = getPosts();

  const user = await userPromise;
  const posts = await postsPromise;
  // Only await sequentially when there's a true dependency
  const comments = await getComments(posts[0].id);
  return <View user={user} posts={posts} comments={comments} />;
}
```

### Rule 1.2: Use Promise.all for Independent Fetches

```typescript
// BAD: Sequential
const user = await fetchUser(id);
const orders = await fetchOrders(id);
const notifications = await fetchNotifications(id);

// GOOD: Parallel
const [user, orders, notifications] = await Promise.all([
  fetchUser(id),
  fetchOrders(id),
  fetchNotifications(id),
]);
```

### Rule 1.3: Use Suspense Boundaries to Unblock Rendering

```tsx
// BAD: Entire page blocked by slowest fetch
async function Page() {
  const [fast, slow] = await Promise.all([getFast(), getSlow()]);
  return (
    <div>
      <FastSection data={fast} />
      <SlowSection data={slow} />
    </div>
  );
}

// GOOD: Fast content renders immediately, slow streams in
function Page() {
  return (
    <div>
      <FastSection />
      <Suspense fallback={<Skeleton />}>
        <SlowSection />
      </Suspense>
    </div>
  );
}
```

### Rule 1.4: Preload Data at the Router Level

```tsx
// GOOD: Kick off fetches before component renders
// In Next.js, use generateMetadata or page-level fetch
export async function generateMetadata({ params }) {
  // This runs in parallel with the page component
  const product = await getProduct(params.id);
  return { title: product.name };
}
```

### Rule 1.5: Avoid Client-Server Waterfalls

```tsx
// BAD: Component mounts, THEN fetches
function ProductPage({ id }: { id: string }) {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(setProduct);
  }, [id]);
  return product ? <Product data={product} /> : <Loading />;
}

// GOOD: Fetch on the server, pass data to client
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductClient data={product} />;
}
```

---

## Category 2: Bundle Size Optimization (CRITICAL)

### Rule 2.1: Use Direct Imports, Avoid Barrel Files

```typescript
// BAD: Barrel import pulls in entire library (200-800ms)
import { Calendar } from '@/components';
import { format } from 'date-fns';

// GOOD: Direct path imports
import Calendar from '@/components/Calendar';
import format from 'date-fns/format';
```

### Rule 2.2: Dynamic Import Heavy Components

```tsx
// BAD: Chart library in main bundle
import { LineChart } from 'recharts';

// GOOD: Load on demand
import dynamic from 'next/dynamic';
const LineChart = dynamic(() =>
  import('recharts').then(mod => mod.LineChart),
  { loading: () => <ChartSkeleton /> }
);
```

### Rule 2.3: Use `next/dynamic` with `ssr: false` for Client-Only Libraries

```tsx
// GOOD: Skip SSR for browser-only code
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
```

### Rule 2.4: Tree-Shake with Conditional Imports

```typescript
// BAD: Import entire library
import _ from 'lodash';
const sorted = _.sortBy(items, 'name');

// GOOD: Import only what you need
import sortBy from 'lodash/sortBy';
const sorted = sortBy(items, 'name');
```

### Rule 2.5: Audit Bundle Size Regularly

Use `@next/bundle-analyzer` to identify large dependencies. Target < 100KB First Load JS per route.

---

## Category 3: Server-Side Performance (HIGH)

### Rule 3.1: Authenticate Inside Server Actions

```typescript
// BAD: Authentication check in middleware for every request
// GOOD: Check auth only in actions that need it
'use server';
export async function updateProfile(data: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  // ... proceed
}
```

### Rule 3.2: Deduplicate with React.cache()

```typescript
// GOOD: Same request, same result — no duplicate DB hits
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});

// Both components call getUser(id) but only ONE query runs
```

### Rule 3.3: Fetch Data in Parallel via Component Composition

```tsx
// BAD: Parent fetches everything sequentially
async function Page() {
  const user = await getUser();
  const posts = await getPosts();
  return <Layout user={user} posts={posts} />;
}

// GOOD: Each component fetches its own data (parallel)
async function Page() {
  return (
    <Layout>
      <UserInfo />    {/* fetches user */}
      <PostList />    {/* fetches posts */}
    </Layout>
  );
}
```

### Rule 3.4: Minimize Client-Bound Serialization

```tsx
// BAD: Sending entire DB record to client
async function Page() {
  const products = await db.product.findMany();
  return <ProductList products={products} />;
}

// GOOD: Select only needed fields
async function Page() {
  const products = await db.product.findMany({
    select: { id: true, name: true, price: true, image: true },
  });
  return <ProductList products={products} />;
}
```

### Rule 3.5: Use `unstable_cache` or `revalidateTag` for Expensive Queries

```typescript
import { unstable_cache } from 'next/cache';

const getCachedProducts = unstable_cache(
  async () => db.product.findMany(),
  ['products'],
  { revalidate: 3600, tags: ['products'] }
);
```

### Rule 3.6: Use Server Components by Default

Keep components as Server Components unless they need interactivity. Only add `'use client'` when you need hooks, event handlers, or browser APIs.

### Rule 3.7: Avoid Passing Serializable Functions to Client

```tsx
// BAD: Trying to pass a function to client component
<ClientComponent onDelete={async (id) => { 'use server'; await deleteItem(id); }} />

// GOOD: Import server action in client component
'use client';
import { deleteItem } from '@/actions/items';
function ClientComponent() {
  return <button onClick={() => deleteItem(id)}>Delete</button>;
}
```

---

## Category 4: Client-Side Data Fetching (MEDIUM-HIGH)

### Rule 4.1: Use SWR/React Query for Client Fetching with Deduplication

```typescript
// BAD: Multiple components fetching same data
useEffect(() => { fetch('/api/user').then(setUser); }, []);

// GOOD: Deduplicated, cached, revalidated
const { data: user } = useSWR('/api/user', fetcher);
```

### Rule 4.2: Implement Optimistic Updates

```typescript
// GOOD: Update UI immediately, sync in background
const { trigger } = useSWRMutation('/api/todos', addTodo, {
  optimisticData: (current) => [...current, newTodo],
  rollbackOnError: true,
});
```

### Rule 4.3: Use Event Listeners Efficiently

```tsx
// BAD: Attaching listener to every list item
{items.map(item => (
  <div key={item.id} onClick={() => handleClick(item.id)}>
    {item.name}
  </div>
))}

// GOOD: Event delegation on parent
<div onClick={(e) => {
  const id = (e.target as HTMLElement).closest('[data-id]')?.dataset.id;
  if (id) handleClick(id);
}}>
  {items.map(item => (
    <div key={item.id} data-id={item.id}>{item.name}</div>
  ))}
</div>
```

### Rule 4.4: Debounce Search and Filter Inputs

```typescript
import { useDeferredValue } from 'react';

function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  // Results update without blocking input
}
```

---

## Category 5: Re-render Optimization (MEDIUM)

### Rule 5.1: Memoize Expensive Computations

```typescript
// BAD: Recomputes on every render
const sorted = items.filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name));

// GOOD: Only recomputes when items change
const sorted = useMemo(
  () => items.filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
```

### Rule 5.2: Stabilize Callback References

```typescript
// BAD: New function every render
<ChildComponent onSelect={(id) => setSelected(id)} />

// GOOD: Stable reference
const handleSelect = useCallback((id: string) => setSelected(id), []);
<ChildComponent onSelect={handleSelect} />
```

### Rule 5.3: Avoid Inline Object Literals in JSX

```tsx
// BAD: New object every render
<Box style={{ padding: 16, margin: 8 }}>

// GOOD: Stable reference
const boxStyle = useMemo(() => ({ padding: 16, margin: 8 }), []);
<Box style={boxStyle}>
```

### Rule 5.4: Split State to Minimize Re-renders

```typescript
// BAD: One big state object — any change re-renders everything
const [state, setState] = useState({ name: '', email: '', age: 0 });

// GOOD: Independent state slices
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);
```

### Rule 5.5: Use `children` Pattern to Isolate State

```tsx
// BAD: Parent re-renders children on every state change
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Counter count={count} onChange={setCount} />
      <ExpensiveList />  {/* re-renders unnecessarily */}
    </div>
  );
}

// GOOD: Children don't re-render when parent state changes
function Parent({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <Counter count={count} onChange={setCount} />
      {children}  {/* stable, doesn't re-render */}
    </div>
  );
}
```

### Rule 5.6: Subscribe to Specific Store Slices (Zustand)

```typescript
// BAD: Re-renders on any store change
const store = useStore();

// GOOD: Only re-renders when `count` changes
const count = useStore((s) => s.count);
```

### Rule 5.7: Use React.memo for Expensive Pure Components

```tsx
const ExpensiveList = React.memo(function ExpensiveList({ items }: Props) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
```

### Rule 5.8-5.12: Additional Re-render Rules

- Avoid creating components inside components (causes remount every render)
- Use `key` to force remount when context changes (e.g., `<Form key={userId} />`)
- Move state down — keep state in the component closest to where it's used
- Use `useRef` for values that don't need to trigger re-renders
- Avoid unnecessary context providers wrapping large trees

---

## Category 6: Rendering Performance (MEDIUM)

### Rule 6.1: Use CSS `content-visibility: auto` for Long Lists

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

### Rule 6.2: Virtualize Long Lists

```tsx
// GOOD: Only render visible items
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  // Render only virtualizer.getVirtualItems()
}
```

### Rule 6.3: Optimize SVGs

- Use `<Image>` for decorative SVGs
- Inline only interactive/animated SVGs
- Use SVGO to optimize SVG markup

### Rule 6.4: Use `loading="lazy"` for Below-Fold Images

```tsx
<Image src={src} alt={alt} loading="lazy" width={400} height={300} />
```

### Rule 6.5-6.9: Additional Rendering Rules

- Use CSS animations over JS animations when possible
- Avoid layout thrashing (batch DOM reads/writes)
- Use `will-change` sparingly and only right before animation
- Prefer `transform` over `top/left` for position changes
- Use `requestAnimationFrame` for visual updates

---

## Category 7: JavaScript Performance (LOW-MEDIUM)

### Rule 7.1: Use Map for Frequent Lookups

```typescript
// BAD: O(n) lookup every time
const user = users.find(u => u.id === targetId);

// GOOD: O(1) lookup
const userMap = new Map(users.map(u => [u.id, u]));
const user = userMap.get(targetId);
```

### Rule 7.2: Batch DOM Operations

```typescript
// BAD: Multiple reflows
element.style.width = '100px';
element.style.height = '200px';
element.style.margin = '10px';

// GOOD: Single reflow
element.style.cssText = 'width:100px;height:200px;margin:10px';
```

### Rule 7.3-7.12: Additional JS Rules

- Use `Set` for membership checks instead of `Array.includes` on large arrays
- Avoid `JSON.parse(JSON.stringify())` for deep cloning — use `structuredClone()`
- Use `AbortController` to cancel stale requests
- Prefer `for...of` over `forEach` for early exit capability
- Use `Promise.allSettled` when failures shouldn't block other results
- Cache regex instances outside of loops
- Use `WeakMap`/`WeakRef` for object caches to avoid memory leaks
- Prefer `TextEncoder`/`TextDecoder` over manual string encoding
- Use `queueMicrotask` over `setTimeout(fn, 0)` for immediate async work
- Profile before optimizing — measure, don't guess

---

## Category 8: Advanced Patterns (LOW)

### Rule 8.1: Use Event Handler Refs for Stable Callbacks

```typescript
// GOOD: Latest handler without re-renders
const handlerRef = useRef(handler);
useLayoutEffect(() => { handlerRef.current = handler; });
const stableHandler = useCallback((...args) => handlerRef.current(...args), []);
```

### Rule 8.2: Lazy Initialization for Expensive State

```typescript
// BAD: Computed on every render
const [data] = useState(expensiveComputation());

// GOOD: Computed only on first render
const [data] = useState(() => expensiveComputation());
```

### Rule 8.3: Use `startTransition` for Non-Urgent Updates

```typescript
import { startTransition } from 'react';

function handleTabChange(tab: string) {
  // Input stays responsive
  startTransition(() => {
    setActiveTab(tab);  // Lower priority
  });
}
```

---

## Quick Reference Checklist

Before shipping any React/Next.js code, verify:

- [ ] No sequential awaits that could be parallel
- [ ] Heavy components are dynamically imported
- [ ] Direct imports (no barrel files for large libraries)
- [ ] Server Components used by default
- [ ] Minimal data serialized to client
- [ ] Expensive computations memoized
- [ ] Stable callback references
- [ ] Long lists virtualized
- [ ] Images lazy-loaded below fold
- [ ] No inline objects in frequently re-rendered JSX
