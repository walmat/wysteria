# Frontend Documentation

This file provides frontend-specific guidance for the Wysteria React application.

For shared project documentation, see `/CLAUDE.md` at the root.

---

## Architecture

### Overview

The frontend is a React 19 SPA served as static files via `@elysiajs/static` from the Elysia backend.

**Key Features:**
- React 19 with TypeScript
- Better Auth React client for authentication
- shadcn/ui components with Tailwind CSS v4
- Type-safe API client via Elysia Eden Treaty
- React Query for data fetching and state management

### Directory Structure

```
public/
├── index.html           # HTML entry point
├── index.tsx            # React entry point
├── components/
│   ├── ui/             # shadcn/ui components
│   └── landing/        # Custom components
├── layouts/
│   ├── index.tsx       # Provider composition
│   └── query-provider.tsx  # React Query setup
├── lib/
│   ├── auth-client.ts  # Better Auth client
│   ├── api.ts          # Type-safe API client (Eden Treaty)
│   └── utils.ts        # Utility functions (cn, etc.)
├── hooks/              # Custom React hooks
└── styles/
    └── global.css      # Tailwind CSS + custom styles
```

---

## Tech Stack

- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety
- **Tailwind CSS v4**: Utility-first CSS (latest version)
- **shadcn/ui**: Accessible, customizable components
- **Better Auth**: Authentication client
- **Elysia Eden Treaty**: Type-safe API client
- **React Query**: Server state management
- **TanStack Form**: Form handling with validation

---

## Getting Started

### Development

The frontend is served by the Elysia backend:

```bash
bun sst dev              # Start dev server on :3000
# or
bun dev
```

The frontend is automatically served at `http://localhost:3000`

### File Watching

Bun automatically watches for changes in `public/` directory via the static plugin configuration in `src/server.ts:20-24`.

---

## Authentication

### Better Auth Client

The auth client is configured in `public/lib/auth-client.ts`:

```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000/api/auth'
})
```

### Using Auth in Components

```typescript
import { authClient } from '@public/lib/auth-client'

function MyComponent() {
  const { data: session, isLoading } = authClient.useSession()

  if (isLoading) return <div>Loading...</div>

  if (!session) {
    return (
      <button onClick={() => authClient.signIn.social({ provider: 'google' })}>
        Sign in with Google
      </button>
    )
  }

  return (
    <div>
      <p>Welcome {session.user.name}!</p>
      <button onClick={() => authClient.signOut()}>Sign out</button>
    </div>
  )
}
```

### Available Auth Methods

```typescript
// OAuth (Google)
authClient.signIn.social({ provider: 'google' })

// OAuth (Apple)
authClient.signIn.social({ provider: 'apple' })

// Email OTP
authClient.signIn.email({ email: 'user@example.com' })
// Then verify:
authClient.signIn.email.verify({ email: 'user@example.com', code: '123456' })

// Phone OTP
authClient.signIn.phone({ phoneNumber: '+1234567890' })
// Then verify:
authClient.signIn.phone.verify({ phoneNumber: '+1234567890', code: '123456' })

// Sign out
authClient.signOut()
```

### Session Hook

```typescript
const { data: session, isLoading, error } = authClient.useSession()

// session structure:
// {
//   user: {
//     id: string
//     name: string
//     email: string
//     image?: string
//   },
//   session: {
//     id: string
//     expiresAt: Date
//     ...
//   }
// }
```

---

## API Client (Eden Treaty)

### Type-Safe API Calls

The API client in `public/lib/api.ts` provides full type safety:

```typescript
import { api } from '@public/lib/api'

// GET request
const { data, error } = await api.v1.user.me.get()

// POST request
const { data, error } = await api.v1.posts.post({
  title: 'My Post',
  content: 'Hello world'
})

// With params
const { data, error } = await api.v1.posts[postId].get()

// With query params
const { data, error } = await api.v1.posts.get({
  query: { limit: 10, page: 1 }
})
```

### Using with React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@public/lib/api'

function UserProfile() {
  // Fetch data
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data, error } = await api.v1.user.me.get()
      if (error) throw error
      return data
    }
  })

  // Mutations
  const updateUser = useMutation({
    mutationFn: async (updates: { name?: string }) => {
      const { data, error } = await api.v1.user.me.patch(updates)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    }
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => updateUser.mutate({ name: 'New Name' })}>
        Update Name
      </button>
    </div>
  )
}
```

---

## shadcn/ui Components

### Configuration

shadcn/ui is configured in `components.json`:

```json
{
  "style": "new-york",
  "tailwind": {
    "css": "public/styles/global.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@public/components",
    "utils": "@public/lib/utils",
    "ui": "@public/components/ui"
  }
}
```

### Adding Components

```bash
bunx shadcn add button
bunx shadcn add card
bunx shadcn add dialog

# Add multiple at once
bunx shadcn add button card dialog form input
```

Components are added to `public/components/ui/`

### Using Components

```typescript
import { Button } from '@public/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@public/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Customizing Components

Components are copied to your project, so you can customize them directly:

```typescript
// public/components/ui/button.tsx
import { cn } from '@public/lib/utils'

// Modify variants, add new ones, etc.
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        destructive: "bg-destructive text-destructive-foreground...",
        // Add your custom variant
        custom: "bg-purple-500 text-white..."
      }
    }
  }
)
```

---

## Tailwind CSS

### Configuration

Tailwind CSS v4 is configured in `public/styles/global.css`:

```css
@import "tailwindcss";

/* shadcn/ui CSS variables */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    /* ... more variables */
  }
}
```

### Using Tailwind Classes

```typescript
function MyComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <h1 className="text-2xl font-bold text-gray-800">Hello</h1>
      </div>
    </div>
  )
}
```

### The `cn` Utility

Use `cn` from `@public/lib/utils` to merge class names:

```typescript
import { cn } from '@public/lib/utils'

function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg", // Base classes
        className // Additional classes from props
      )}
      {...props}
    />
  )
}
```

---

## Forms

### TanStack Form + Zod

TanStack Form paired with shadcn/ui components provides complete flexibility over form markup while maintaining accessibility standards.

**Installation:**
```bash
bun add @tanstack/react-form
```

**Core Approach:**
1. Use TanStack Form's `useForm` hook for state management
2. Use `form.Field` component with render props for controlled inputs
3. Use shadcn/ui `<Field />` components for accessible form structure

### Basic Form Example

**Step 1: Define Zod schema**

```typescript
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address')
})
```

**Step 2: Create the form**

```typescript
import { useForm } from '@tanstack/react-form'
import { Button } from '@public/components/ui/button'
import { Input } from '@public/components/ui/input'
import { Field, FieldLabel, FieldError } from '@public/components/ui/field'
import { api } from '@public/lib/api'

function MyForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: ''
    },
    validators: {
      onSubmit: formSchema  // Validate on submit
    },
    onSubmit: async ({ value }) => {
      const { data, error } = await api.v1.user.update.post(value)
      if (error) {
        // Handle error
        return
      }
      // Success!
    }
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="email">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
```

### Validation Modes

TanStack Form supports three validation strategies:

```typescript
// Validate on every keystroke
validators: { onChange: formSchema }

// Validate when field loses focus (recommended for better UX)
validators: { onBlur: formSchema }

// Validate on form submission
validators: { onSubmit: formSchema }

// Combine multiple modes
validators: {
  onBlur: z.string().min(1, 'Required'),
  onChange: z.string().min(5, 'Minimum 5 characters')
}
```

### Form Field Types

**Textarea with character count:**
```typescript
<form.Field name="description">
  {(field) => {
    const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
    const charCount = field.state.value.length

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        <FieldDescription>{charCount} / 500 characters</FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
</form.Field>
```

**Select component:**
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@public/components/ui/select'

<form.Field name="role">
  {(field) => (
    <Field>
      <FieldLabel>Role</FieldLabel>
      <Select value={field.state.value} onValueChange={field.handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  )}
</form.Field>
```

**Checkbox array (multiple selections):**
```typescript
<form.Field name="interests" mode="array">
  {(field) => (
    <Field>
      <FieldLabel>Interests</FieldLabel>
      {['coding', 'design', 'music'].map((interest) => {
        const index = field.state.value.indexOf(interest)
        const checked = index > -1

        return (
          <div key={interest} className="flex items-center gap-2">
            <Checkbox
              id={interest}
              checked={checked}
              onCheckedChange={(isChecked) => {
                if (isChecked) {
                  field.pushValue(interest)
                } else {
                  field.removeValue(index)
                }
              }}
            />
            <label htmlFor={interest}>{interest}</label>
          </div>
        )
      })}
    </Field>
  )}
</form.Field>
```

**Radio group:**
```typescript
import { RadioGroup, RadioGroupItem } from '@public/components/ui/radio-group'

<form.Field name="notification">
  {(field) => (
    <Field>
      <FieldLabel>Notifications</FieldLabel>
      <RadioGroup value={field.state.value} onValueChange={field.handleChange}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="all" />
          <label htmlFor="all">All</label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="none" id="none" />
          <label htmlFor="none">None</label>
        </div>
      </RadioGroup>
    </Field>
  )}
</form.Field>
```

**Switch (toggle):**
```typescript
import { Switch } from '@public/components/ui/switch'

<form.Field name="marketing">
  {(field) => (
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="marketing">Marketing emails</FieldLabel>
        <Switch
          id="marketing"
          checked={field.state.value}
          onCheckedChange={field.handleChange}
        />
      </div>
    </Field>
  )}
</form.Field>
```

### Array Fields (Dynamic Lists)

**Schema with array validation:**
```typescript
const formSchema = z.object({
  emails: z.array(
    z.object({
      address: z.string().email('Valid email required')
    })
  ).min(1, 'At least one email required').max(5, 'Maximum 5 emails')
})
```

**Implementation:**
```typescript
function EmailListForm() {
  const form = useForm({
    defaultValues: {
      emails: [{ address: '' }]
    },
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      console.log(value.emails)
    }
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field name="emails" mode="array">
        {(field) => (
          <div className="space-y-4">
            {field.state.value.map((_, index) => (
              <form.Field key={index} name={`emails[${index}].address`}>
                {(subField) => {
                  const isInvalid = subField.state.meta.isTouched && subField.state.meta.errors.length > 0

                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="flex gap-2">
                        <Input
                          value={subField.state.value}
                          onChange={(e) => subField.handleChange(e.target.value)}
                          onBlur={subField.handleBlur}
                          placeholder="email@example.com"
                          aria-invalid={isInvalid}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => field.removeValue(index)}
                          disabled={field.state.value.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                      {isInvalid && <FieldError errors={subField.state.meta.errors} />}
                    </Field>
                  )
                }}
              </form.Field>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => field.pushValue({ address: '' })}
              disabled={field.state.value.length >= 5}
            >
              Add Email
            </Button>
          </div>
        )}
      </form.Field>

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Form Actions

**Reset form:**
```typescript
<Button type="button" onClick={() => form.reset()}>
  Reset
</Button>
```

**Reset to specific values:**
```typescript
<Button type="button" onClick={() => form.reset({ name: 'New Default' })}>
  Reset with Values
</Button>
```

### Best Practices

1. **Validate on blur** for better UX - users can type freely without seeing errors immediately
2. **Use `aria-invalid`** on form controls for accessibility
3. **Show errors only after touched** - check `field.state.meta.isTouched`
4. **Disable submit until valid** - use `state.canSubmit` from `form.Subscribe`
5. **Add character counts** for textareas with limits
6. **Prevent adding beyond limits** - disable "Add" button when array is at max
7. **Use semantic HTML** - proper labels with `htmlFor` attributes
8. **Leverage Field components** - use `<FieldLabel>`, `<FieldDescription>`, `<FieldError>` for consistency

---

## Provider Composition

### Layout System

Providers are composed in `public/layouts/index.tsx`:

```typescript
const providers: Provider[] = [
  [QueryProvider],
  // Add more providers here:
  // [ThemeProvider, { theme: 'dark' }],
]

export const Providers = composeProviders(providers)
```

### Adding New Providers

```typescript
// 1. Create provider component
function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 2. Add to providers array
const providers: Provider[] = [
  [QueryProvider],
  [ThemeProvider],  // Add here
]
```

---

## React Query Configuration

Configured in `public/layouts/query-provider.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: 1
    }
  }
})
```

### Common Patterns

```typescript
// Fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['posts'],
  queryFn: async () => {
    const { data } = await api.v1.posts.get()
    return data
  }
})

// Mutations
const createPost = useMutation({
  mutationFn: async (post: CreatePost) => {
    const { data } = await api.v1.posts.post(post)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }
})

// Optimistic updates
const updatePost = useMutation({
  mutationFn: async ({ id, ...data }) => {
    const { data: result } = await api.v1.posts[id].patch(data)
    return result
  },
  onMutate: async (newPost) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts', newPost.id] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['posts', newPost.id])

    // Optimistically update
    queryClient.setQueryData(['posts', newPost.id], newPost)

    return { previous }
  },
  onError: (err, newPost, context) => {
    // Rollback on error
    queryClient.setQueryData(['posts', newPost.id], context?.previous)
  }
})
```

---

## Custom Hooks

Create reusable hooks in `public/hooks/`:

```typescript
// public/hooks/use-user.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@public/lib/api'

export function useUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data, error } = await api.v1.user.me.get()
      if (error) throw error
      return data
    }
  })
}

// Usage
function MyComponent() {
  const { data: user, isLoading } = useUser()
  // ...
}
```

---

## Common Patterns

### Protected Route

```typescript
import { authClient } from '@public/lib/auth-client'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = authClient.useSession()

  if (isLoading) return <div>Loading...</div>

  if (!session) return <Navigate to="/login" />

  return <>{children}</>
}
```

### Loading States

```typescript
function MyComponent() {
  const { data, isLoading, error } = useQuery({...})

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return <EmptyState />

  return <DataDisplay data={data} />
}
```

### Error Handling

```typescript
import { toast } from 'sonner'

const mutation = useMutation({
  mutationFn: async (data) => {
    const { data: result, error } = await api.v1.posts.post(data)
    if (error) throw error
    return result
  },
  onSuccess: () => {
    toast.success('Post created successfully!')
  },
  onError: (error) => {
    toast.error(`Failed to create post: ${error.message}`)
  }
})
```

---

## Styling Best Practices

1. **Use Tailwind utility classes** for most styling
2. **Use shadcn/ui components** for common UI patterns
3. **Use CSS variables** for theming (defined in global.css)
4. **Use `cn` utility** to merge class names
5. **Avoid inline styles** unless absolutely necessary

```typescript
// Good
<div className="flex items-center gap-4 p-4 bg-white rounded-lg">

// Avoid
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
```

---

## Performance Tips

1. **Use React Query caching** - avoid unnecessary API calls
2. **Memoize expensive computations** with `useMemo`
3. **Debounce user input** for search/filters
4. **Lazy load routes** with `React.lazy()`
5. **Optimize images** with proper sizing and formats

```typescript
import { useMemo } from 'react'
import { useDebounce } from '@public/hooks/use-debounce'

function SearchComponent() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => api.v1.search.get({ query: { q: debouncedSearch } }),
    enabled: debouncedSearch.length > 0
  })

  return (
    <Input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

---

## Type Safety

The frontend benefits from full type safety:

1. **API responses** are typed via Eden Treaty
2. **Form schemas** are typed via Zod
3. **Component props** are typed via TypeScript
4. **Auth session** is typed via Better Auth

```typescript
// API client knows the exact shape of responses
const { data } = await api.v1.user.me.get()
// data is typed as { id: string, name: string, email: string, ... }

// Form schema provides type inference
const schema = z.object({ name: z.string() })
type FormData = z.infer<typeof schema>
// FormData = { name: string }
```

---

## Important Notes

- **No build step required** - Files served directly as static assets
- **Hot reload works** - Changes appear immediately
- **Type safety everywhere** - API, forms, components all typed
- **shadcn components are customizable** - Modify them in your codebase
- **Better Auth handles sessions** - No need for custom auth logic
- **React Query manages server state** - Avoid useState for API data

---

## Additional Resources

- **Root Documentation**: `/CLAUDE.md`
- **Backend Documentation**: `/src/CLAUDE.md`
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **React Query**: https://tanstack.com/query
- **Better Auth**: https://better-auth.com
- **TanStack Form**: https://tanstack.com/form
