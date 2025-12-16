# PlayCast UI Design System

This directory contains reusable UI components that ensure consistency across the PlayCast IPTV application.

## Design Principles

- **Consistency**: Unified look and feel across all screens
- **Accessibility**: Proper contrast ratios and screen reader support
- **Responsiveness**: Adapts to different screen sizes
- **Performance**: Optimized for smooth interactions

## Available Components

### Button
A versatile button component with multiple variants and sizes.

```typescript
import { Button } from '@/components/ui';

<Button
  title="Click me"
  variant="primary" // primary | secondary | outline | ghost
  size="medium" // small | medium | large
  icon="add-circle"
  onPress={() => console.log('Pressed')}
  disabled={false}
  loading={false}
/>
```

### Card
A flexible container component for content grouping.

```typescript
import { Card } from '@/components/ui';

<Card
  variant="default" // default | elevated | outlined
  padding="medium" // none | small | medium | large
  margin="small" // none | small | medium | large
  borderRadius="medium" // small | medium | large | full
  onPress={() => console.log('Card pressed')}
>
  <Text>Card content</Text>
</Card>
```

### Input
A styled input field with validation and icon support.

```typescript
import { Input } from '@/components/ui';

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  leftIcon="mail"
  rightIcon="close-circle"
  onRightIconPress={() => setEmail('')}
  error={error}
  variant="default" // default | outlined | filled
/>
```

### Chip
Compact interactive elements for filters and tags.

```typescript
import { Chip } from '@/components/ui';

<Chip
  title="Filter"
  selected={isSelected}
  onPress={() => setIsSelected(!isSelected)}
  variant="filter" // default | filter | category
  size="medium" // small | medium | large
  icon="heart"
/>
```

### Modal
A customizable modal component with multiple sizes.

```typescript
import { Modal } from '@/components/ui';

<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Modal Title"
  size="medium" // small | medium | large | full
  showCloseButton={true}
>
  <Text>Modal content</Text>
</Modal>
```

### LoadingSpinner
Consistent loading indicator with optional text.

```typescript
import { LoadingSpinner } from '@/components/ui';

<LoadingSpinner
  size="medium" // small | medium | large
  text="Loading..."
  overlay={true}
  color={Colors.primary}
/>
```

### EmptyState
Standardized empty state component with optional actions.

```typescript
import { EmptyState } from '@/components/ui';

<EmptyState
  icon="folder-open"
  title="No playlists found"
  description="Add your first playlist to get started"
  action={{
    title: "Add Playlist",
    onPress: () => navigation.navigate('AddPlaylist')
  }}
/>
```

## Theme Integration

All components automatically use the theme from `../constants/theme.ts`:

- **Colors**: Consistent color palette
- **Spacing**: Standardized spacing values
- **FontSizes**: Unified typography scale
- **BorderRadius**: Consistent border radius values

## Usage Guidelines

### 1. Component Selection
- Use **Button** for primary actions
- Use **Card** for content grouping
- Use **Chip** for filters and tags
- Use **Input** for form fields
- Use **Modal** for overlays and dialogs

### 2. Variant Guidelines
- **Primary**: For main actions
- **Secondary**: For alternative actions
- **Outline**: For less prominent actions
- **Ghost**: For subtle actions

### 3. Size Guidelines
- **Small**: For compact interfaces
- **Medium**: Default size for most cases
- **Large**: For important actions

### 4. Accessibility
- All components support screen readers
- Proper contrast ratios are maintained
- Touch targets are at least 44px

## Migration Guide

To migrate existing screens to the new design system:

1. Replace custom button styles with `Button` component
2. Replace card containers with `Card` component
3. Replace text inputs with `Input` component
4. Replace filter pills with `Chip` component
5. Replace custom modals with `Modal` component
6. Replace loading indicators with `LoadingSpinner`
7. Replace empty states with `EmptyState` component

## Best Practices

1. **Consistency**: Use the same variants and sizes across similar elements
2. **Hierarchy**: Use size and color to establish visual hierarchy
3. **Feedback**: Provide loading and error states for all interactions
4. **Accessibility**: Add proper labels and descriptions
5. **Performance**: Use the overlay prop for loading spinners when needed

## Future Enhancements

- [ ] Animation library integration
- [ ] Dark/light theme variants
- [ ] More component variants
- [ ] Advanced form components
- [ ] Data visualization components