---
name: composition-patterns
description: React composition patterns that scale. Guides refactoring components with boolean prop proliferation through compound components, dependency injection, and state management patterns. Use when designing component APIs, refactoring complex components, creating reusable libraries, or reviewing React component architecture.
---

# React Composition Patterns

## Purpose

Guide for structuring flexible, scalable React components using composition instead of boolean props. Based on Vercel Engineering patterns (v1.0.0, January 2026).

## When to Use This Skill

- Refactoring components with many boolean props
- Designing reusable component libraries
- Creating compound component APIs
- Reviewing component architecture
- Implementing dependency injection patterns in React
- Working with React 19 APIs

---

## 1. Component Architecture (HIGH Impact)

### 1.1 Avoid Boolean Prop Proliferation

Each boolean flag doubles the number of internal states. 3 booleans = 8 combinations. 5 booleans = 32 combinations.

```tsx
// BAD: Boolean prop explosion
<Modal
  isFullScreen={false}
  hasCloseButton={true}
  hasOverlay={true}
  isDismissable={true}
  hasHeader={true}
  hasFooter={false}
  isScrollable={true}
/>

// GOOD: Compose what you need
<Modal>
  <Modal.Overlay dismissable />
  <Modal.Content scrollable>
    <Modal.Header>
      <Modal.Title>Settings</Modal.Title>
      <Modal.CloseButton />
    </Modal.Header>
    <Modal.Body>...</Modal.Body>
  </Modal.Content>
</Modal>
```

**Why:** Composition makes the component self-documenting. Each boolean removed eliminates a conditional branch. The consumer decides what to render, not the component.

### 1.2 Use Compound Components with Shared Context

Structure complex components as a family of sub-components sharing state via context.

```tsx
// Implementation
const ModalContext = createContext<ModalState | null>(null);

function Modal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ModalContext value={{ isOpen, setIsOpen }}>
      {children}
    </ModalContext>
  );
}

function ModalTrigger({ children }: { children: React.ReactNode }) {
  const { setIsOpen } = use(ModalContext)!;
  return <button onClick={() => setIsOpen(true)}>{children}</button>;
}

function ModalContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = use(ModalContext)!;
  if (!isOpen) return null;
  return <div role="dialog">{children}</div>;
}

// Attach sub-components
Modal.Trigger = ModalTrigger;
Modal.Content = ModalContent;

// Usage — consumer composes exactly what they need
<Modal>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Content>
    <h2>Hello</h2>
    <p>Content here</p>
  </Modal.Content>
</Modal>
```

---

## 2. State Management (MEDIUM Impact)

### 2.1 Lift State into Provider Components

Move state management into dedicated providers so siblings can access shared state without prop drilling.

```tsx
// BAD: State trapped in one component
function App() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  return (
    <div>
      <Sidebar filters={filters} onChange={setFilters} />
      <Content filters={filters} />
      <StatusBar filters={filters} /> {/* Need to thread props everywhere */}
    </div>
  );
}

// GOOD: Provider lifts state, any child can access
function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const reset = useCallback(() => setFilters(defaultFilters), []);
  return (
    <FilterContext value={{ filters, setFilters, reset }}>
      {children}
    </FilterContext>
  );
}

function App() {
  return (
    <FilterProvider>
      <Sidebar />    {/* uses useFilters() */}
      <Content />    {/* uses useFilters() */}
      <StatusBar />  {/* uses useFilters() */}
    </FilterProvider>
  );
}
```

### 2.2 Decouple State Implementation from UI

The provider manages state mechanics. UI components depend only on the context interface, not the implementation.

```tsx
// Define a generic interface — the contract
interface ListContext<T> {
  state: {
    items: T[];
    selected: T | null;
    isLoading: boolean;
  };
  actions: {
    select: (item: T) => void;
    add: (item: T) => void;
    remove: (id: string) => void;
  };
  meta: {
    total: number;
    hasMore: boolean;
  };
}

// Provider A: uses useState
function LocalListProvider({ children }) {
  const [items, setItems] = useState([]);
  // ... implements ListContext interface
}

// Provider B: uses Zustand
function ZustandListProvider({ children }) {
  const store = useListStore();
  // ... implements the SAME ListContext interface
}

// Provider C: syncs with server
function ServerListProvider({ children }) {
  const { data } = useSWR('/api/items');
  // ... implements the SAME ListContext interface
}

// UI components work with ANY provider — they only depend on the interface
function ItemList() {
  const { state, actions } = use(ListContext)!;
  return state.items.map(item => (
    <Item key={item.id} item={item} onSelect={actions.select} />
  ));
}
```

### 2.3 Define Generic Context Interfaces for Dependency Injection

Establish three-part interfaces: `state`, `actions`, and `meta`. This enables swapping providers without changing UI code.

```tsx
// The same <ItemList /> component works with:
// - LocalListProvider (prototyping)
// - ZustandListProvider (client state)
// - ServerListProvider (server sync)
// - MockListProvider (testing)
```

---

## 3. Implementation Patterns (MEDIUM Impact)

### 3.1 Create Explicit Component Variants

Instead of a single component with many boolean combinations, create explicit variant components.

```tsx
// BAD: One component, many modes
<Button
  variant="primary"
  isIcon={false}
  isLoading={false}
  isDisabled={false}
  hasLeftIcon={true}
  hasRightIcon={false}
/>

// GOOD: Explicit variants compose exactly what they need
function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button variant="primary">
      <Button.Icon name="check" />
      <Button.Label>{children}</Button.Label>
    </Button>
  );
}

function LoadingButton({ children }: { children: React.ReactNode }) {
  return (
    <Button variant="primary" disabled>
      <Button.Spinner />
      <Button.Label>{children}</Button.Label>
    </Button>
  );
}

function IconButton({ icon, label }: { icon: string; label: string }) {
  return (
    <Button variant="ghost" aria-label={label}>
      <Button.Icon name={icon} />
    </Button>
  );
}
```

**Why:** Each variant is self-documenting. No hidden conditional paths. Easy to test individually.

### 3.2 Prefer Composing Children Over Render Props

```tsx
// ACCEPTABLE: Render props when parent needs to pass data to child
<DataTable
  data={items}
  renderRow={(item) => (
    <Row key={item.id}>
      <Cell>{item.name}</Cell>
    </Row>
  )}
/>

// PREFERRED: Children composition for structure
<DataTable data={items}>
  <DataTable.Header>
    <DataTable.Column field="name">Name</DataTable.Column>
    <DataTable.Column field="email">Email</DataTable.Column>
  </DataTable.Header>
  <DataTable.Body />
  <DataTable.Pagination />
</DataTable>
```

**When to use render props:** Only when the parent component needs to provide data back to the consumer (e.g., virtualizer providing item index, row data).

**When to use children:** For all structural composition where the consumer decides layout and content.

---

## 4. React 19 API Changes (MEDIUM Impact)

### 4.1 Remove forwardRef — ref is Now a Standard Prop

```tsx
// OLD: React 18
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// NEW: React 19 — ref is just a prop
function Input({ ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

### 4.2 Replace useContext with use()

```tsx
// OLD: React 18
const value = useContext(MyContext);

// NEW: React 19 — use() supports conditional calling
const value = use(MyContext);

// BONUS: use() works in conditionals (useContext does not)
function Component({ shouldLoad }: { shouldLoad: boolean }) {
  if (shouldLoad) {
    const data = use(fetchData()); // Can call conditionally!
  }
}
```

---

## Decision Tree: When to Compose

```
Component has boolean props?
├── 0-1 booleans → Fine as-is
├── 2-3 booleans → Consider explicit variants
└── 4+ booleans → Refactor to compound components

Need shared state across siblings?
├── Same parent → Lift state up
├── Different tree branches → Use Provider + Context
└── Need swappable implementations → Define generic interface

Choosing between children vs render props?
├── Consumer controls structure → Use children
└── Parent provides data to consumer → Use render props
```

---

## Anti-Patterns to Avoid

1. **Boolean prop explosion** — more than 3 booleans signals need for composition
2. **Prop drilling past 2 levels** — use context/provider
3. **God components** — components over 200 lines with multiple responsibilities
4. **Hardcoded implementations** — couple UI to specific state library
5. **Implicit behavior** — boolean that changes 3 unrelated things
6. **Render props for structure** — use children instead
7. **forwardRef in React 19** — ref is a standard prop now
