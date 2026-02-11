---
name: react-native-guidelines
description: React Native and Expo performance optimization guidelines. 35+ rules across 14 categories covering rendering, list performance, animations, navigation, state management, UI patterns, and monorepo architecture. Use when building React Native/Expo apps, optimizing mobile performance, implementing animations, or reviewing React Native code.
---

# React Native Performance Guidelines

## Purpose

Comprehensive performance optimization guide for React Native and Expo applications, organized by impact priority. Based on Vercel Engineering guidelines (v1.0.0, January 2026).

## When to Use This Skill

- Building new React Native screens or components
- Optimizing list/scroll performance
- Implementing animations with Reanimated
- Reviewing React Native code for performance
- Setting up navigation with Expo Router
- Working with React Native Gesture Handler
- Mobile UI pattern decisions

---

## Category 1: Core Rendering (CRITICAL)

### Rule 1.1: Never Use && with Potentially Falsy Values

This causes **production crashes** in React Native (not just rendering bugs).

```tsx
// BAD: If count is 0, this CRASHES the app
{count && <Text>{count} items</Text>}

// BAD: Empty string crashes too
{name && <Text>{name}</Text>}

// GOOD: Explicit boolean check
{count > 0 && <Text>{count} items</Text>}
{count ? <Text>{count} items</Text> : null}

// GOOD: Boolean cast
{!!name && <Text>{name}</Text>}
```

### Rule 1.2: Always Wrap Strings in `<Text>`

Direct string children in `<View>` crash the app.

```tsx
// BAD: Crashes on native
<View>Hello World</View>
<View>{user.name}</View>

// GOOD: Always use Text
<View><Text>Hello World</Text></View>
<View><Text>{user.name}</Text></View>
```

---

## Category 2: List Performance (HIGH)

### Rule 2.1: Use List Virtualizers for All Scrollable Lists

```tsx
// BAD: ScrollView renders ALL items at once
<ScrollView>
  {items.map(item => <Item key={item.id} {...item} />)}
</ScrollView>

// GOOD: Virtualized — only visible items rendered
import { FlashList } from '@shopify/flash-list';
// or LegendList

<FlashList
  data={items}
  renderItem={({ item }) => <Item {...item} />}
  estimatedItemSize={80}
/>
```

### Rule 2.2: Avoid Inline Objects in renderItem

```tsx
// BAD: New object every render — breaks memoization
renderItem={({ item }) => (
  <View style={{ padding: 16, margin: 8 }}>
    <Text style={{ fontSize: 16 }}>{item.name}</Text>
  </View>
)}

// GOOD: Stable references
const styles = StyleSheet.create({
  container: { padding: 16, margin: 8 },
  text: { fontSize: 16 },
});

renderItem={({ item }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{item.name}</Text>
  </View>
)}
```

### Rule 2.3: Hoist Callbacks to List Root

```tsx
// BAD: New function per item render
renderItem={({ item }) => (
  <Pressable onPress={() => handlePress(item.id)}>
    <Text>{item.name}</Text>
  </Pressable>
)}

// GOOD: Stable callback, pass id via props
const handlePress = useCallback((id: string) => {
  navigation.navigate('Detail', { id });
}, []);

renderItem={({ item }) => (
  <ListItem item={item} onPress={handlePress} />
)}
```

### Rule 2.4: Keep List Items Lightweight

No queries, heavy computations, or expensive operations inside list items.

```tsx
// BAD: Each item fetches its own data
function ListItem({ id }) {
  const { data } = useQuery(['item', id], fetchItem);
  return <Text>{data?.name}</Text>;
}

// GOOD: Fetch all data at list level, pass primitives
function ListItem({ name, price }: { name: string; price: number }) {
  return <Text>{name} - ${price}</Text>;
}
```

### Rule 2.5: Pass Primitives to List Items for Effective memo()

```tsx
// BAD: Object reference changes break memo
<ListItem item={item} />

// GOOD: Primitives are cheaply compared
const ListItem = memo(({ id, name, price }: ItemProps) => (
  <View><Text>{name}</Text></View>
));

renderItem={({ item }) => (
  <ListItem id={item.id} name={item.name} price={item.price} />
)}
```

### Rule 2.6: Use Compressed, Appropriately-Sized Images

```tsx
// GOOD: Use expo-image with CDN resize
import { Image } from 'expo-image';

<Image
  source={{ uri: `${imageUrl}?w=${width * 2}&q=80` }}
  style={{ width, height }}
  placeholder={{ blurhash }}
  transition={200}
/>
```

### Rule 2.7: Implement Item Types for Heterogeneous Lists

```tsx
// GOOD: Different layouts recycle separately
<FlashList
  data={items}
  renderItem={renderItem}
  getItemType={(item) => item.type} // 'header' | 'product' | 'ad'
  estimatedItemSize={80}
/>
```

---

## Category 3: Animation (HIGH)

### Rule 3.1: Animate Only transform and opacity

```tsx
// BAD: Layout properties trigger recalculation
useAnimatedStyle(() => ({
  width: withTiming(expanded ? 200 : 100),   // Triggers layout
  height: withTiming(expanded ? 200 : 100),  // Triggers layout
  marginTop: withTiming(expanded ? 20 : 0),  // Triggers layout
}));

// GOOD: Transform and opacity run on UI thread
useAnimatedStyle(() => ({
  transform: [{ scale: withTiming(expanded ? 1.5 : 1) }],
  opacity: withTiming(expanded ? 1 : 0.5),
}));
```

### Rule 3.2: Use useDerivedValue Over useAnimatedReaction

```tsx
// BAD: Side-effect based
useAnimatedReaction(
  () => scrollY.value,
  (current) => { headerOpacity.value = interpolate(current, [0, 100], [1, 0]); }
);

// GOOD: Declarative derivation
const headerOpacity = useDerivedValue(() =>
  interpolate(scrollY.value, [0, 100], [1, 0])
);
```

### Rule 3.3: Use GestureDetector for Animated Press States

```tsx
// GOOD: Runs entirely on UI thread
const tap = Gesture.Tap()
  .onBegin(() => { scale.value = withTiming(0.95); })
  .onFinalize(() => { scale.value = withTiming(1); });

<GestureDetector gesture={tap}>
  <Animated.View style={animatedStyle}>
    <Text>Press me</Text>
  </Animated.View>
</GestureDetector>
```

---

## Category 4: Scroll Performance (HIGH)

### Rule 4.1: Never Track Scroll Position in useState

```tsx
// BAD: JS thread updates cause jank
const [scrollY, setScrollY] = useState(0);
onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}

// GOOD: Shared value stays on UI thread
const scrollY = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => { scrollY.value = event.contentOffset.y; },
});
```

---

## Category 5: Navigation (HIGH)

### Rule 5.1: Use Native Navigators

```tsx
// BAD: JS-based stack (animations computed in JS)
import { createStackNavigator } from '@react-navigation/stack';

// GOOD: Native stack (platform animations)
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// GOOD: Native bottom tabs
import { createNativeBottomTabNavigator } from 'react-native-bottom-tabs';
```

---

## Category 6: React State (MEDIUM)

### Rule 6.1: Minimize State — Derive Values During Render

```tsx
// BAD: Redundant state
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
  setCount(items.filter(i => i.active).length);
}, [items]);

// GOOD: Derive everything from single source
const [items, setItems] = useState([]);
const filteredItems = useMemo(() => items.filter(i => i.active), [items]);
const count = filteredItems.length;
```

### Rule 6.2: Use Fallback State Pattern

```tsx
// GOOD: undefined means "use parent's value"
function Input({ placeholder }: { placeholder?: string }) {
  const [value, setValue] = useState<string | undefined>(undefined);
  const display = value ?? placeholder ?? '';
  // When value is undefined, falls back reactively to placeholder
}
```

### Rule 6.3: Use Dispatch Updaters to Avoid Stale Closures

```tsx
// BAD: Stale closure
const increment = () => setCount(count + 1);

// GOOD: Always reads current value
const increment = () => setCount(prev => prev + 1);
```

---

## Category 7: State Architecture (MEDIUM)

### Rule 7.1: State Must Represent Ground Truth

```tsx
// BAD: Storing visual state
const [isAtTop, setIsAtTop] = useState(true);
const [progress, setProgress] = useState(0);

// GOOD: Store actual state, derive visuals
const scrollY = useSharedValue(0);
const isAtTop = useDerivedValue(() => scrollY.value < 10);
const progress = useDerivedValue(() =>
  interpolate(scrollY.value, [0, contentHeight], [0, 1])
);
```

---

## Category 8: React Compiler Compatibility (MEDIUM)

### Rule 8.1: Destructure Functions Early

```tsx
// BAD: Dotting into objects confuses the compiler
function Component({ config }) {
  return <Button onPress={config.handlers.onSubmit} />;
}

// GOOD: Destructure in render scope
function Component({ config }) {
  const { onSubmit } = config.handlers;
  return <Button onPress={onSubmit} />;
}
```

### Rule 8.2: Use .get()/.set() for Reanimated Shared Values

```tsx
// BAD: .value property confuses React Compiler
scrollY.value = 100;
const current = scrollY.value;

// GOOD: Method-based access
scrollY.set(100);
const current = scrollY.get();
```

---

## Category 9: UI Patterns (MEDIUM)

### Rule 9.1: Use expo-image for All Images

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  placeholder={{ blurhash: 'LEHV6nWB2yk8' }}
  contentFit="cover"
  transition={200}
/>
```

### Rule 9.2: Native Menus with zeego

```tsx
import * as DropdownMenu from 'zeego/dropdown-menu';

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <Button>Options</Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item key="edit">
      <DropdownMenu.ItemTitle>Edit</DropdownMenu.ItemTitle>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### Rule 9.3: Native Modals Over JS Bottom Sheets

```tsx
// GOOD: Native modal with form sheet presentation
<Modal
  visible={isOpen}
  presentationStyle="formSheet"
  animationType="slide"
  onRequestClose={onClose}
>
  <SafeAreaView>{children}</SafeAreaView>
</Modal>
```

### Rule 9.4: Use Pressable, Not TouchableOpacity

```tsx
// BAD: Legacy component
<TouchableOpacity onPress={onPress}>

// GOOD: Modern, more flexible
<Pressable
  onPress={onPress}
  style={({ pressed }) => [styles.button, pressed && styles.pressed]}
>
```

### Rule 9.5: Modern Styling Patterns

```tsx
// Use borderCurve for smooth corners
style={{ borderRadius: 16, borderCurve: 'continuous' }}

// Use gap instead of margin on children
style={{ flexDirection: 'row', gap: 12 }}

// Use boxShadow string syntax
style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
```

### Rule 9.6: Safe Area Handling

```tsx
// GOOD: Automatic safe area insets
<ScrollView contentInsetAdjustmentBehavior="automatic">
  {children}
</ScrollView>
```

### Rule 9.7: View Measurement

```tsx
// GOOD: Synchronous + reactive measurement
const [size, setSize] = useState({ width: 0, height: 0 });

<View
  onLayout={(e) => {
    const { width, height } = e.nativeEvent.layout;
    // Only update if actually changed
    setSize(prev =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }}
/>
```

---

## Category 10: Design System (MEDIUM)

### Rule 10.1: Use Compound Components in Design Systems

Same patterns as composition-patterns skill — prefer compound components over boolean prop APIs for design system components.

---

## Category 11: Monorepo (LOW)

### Rule 11.1: Install Native Dependencies in App Directory

```bash
# BAD: Installing in shared package
cd packages/shared && npm install react-native-reanimated

# GOOD: Install where autolinking can find it
cd apps/mobile && npm install react-native-reanimated
```

### Rule 11.2: Enforce Single Dependency Versions

Use tools like `syncpack` or workspace protocol to prevent version conflicts.

---

## Category 12: Third-Party Dependencies (LOW)

### Rule 12.1: Re-export from Design System Folder

```tsx
// packages/design-system/src/icons/index.ts
export { default as ChevronRight } from 'lucide-react-native/dist/esm/icons/chevron-right';

// Consumer code — easy to swap libraries globally
import { ChevronRight } from '@/design-system/icons';
```

---

## Category 13: JavaScript (LOW)

### Rule 13.1: Hoist Intl Formatters to Module Scope

```tsx
// BAD: Created every render
function Price({ amount }) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  return <Text>{fmt.format(amount)}</Text>;
}

// GOOD: Created once
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function Price({ amount }) {
  return <Text>{currencyFormatter.format(amount)}</Text>;
}
```

---

## Category 14: Fonts (LOW)

### Rule 14.1: Embed Fonts at Build Time

```json
// app.json — use expo-font config plugin
{
  "plugins": [
    ["expo-font", { "fonts": ["./assets/fonts/Inter.ttf"] }]
  ]
}
```

This embeds fonts at build time instead of async loading, eliminating font flash.

---

## Key Technology Stack

| Tool | Purpose |
|------|---------|
| React Native Reanimated | UI thread animations |
| React Native Gesture Handler | Performant gestures |
| FlashList / LegendList | List virtualization |
| Expo Router | File-based navigation |
| expo-image | Optimized image loading |
| zeego | Native menus |
| Zustand | Lightweight state (preferred over Context in lists) |
