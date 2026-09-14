# GoP Copilot Admin Panel

## Techstack
- pnpm - package manager
- Next.js
- tailwind css
- shadcn - https://ui.shadcn.com/docs
- prettier
- linter

```cmd
echo 'NEXT_PUBLIC_API_URL={backendUrl}/api' > .env
pnpm build
pnpm start

pnpm dev     # run local in dev mode

pnpm format  # prettier
pnpm lint    # linter
```

## Project structure
### updatedAt: 24.10.2025
```cmd
src
├── app
│   ├── api
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── panel
│       ├── layout.tsx
│       ├── manage-permissions
│       │   ├── add
│       │   │   └── page.tsx
│       │   └── page.tsx
│       ├── page.tsx
│       ├── system-prompts
│       │   └── page.tsx
│       └── token-stats
│           └── page.tsx
├── components
│   ├── app-sidebar.tsx
│   ├── protect-route.tsx
│   └── ui
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── table.tsx
│       └── tooltip.tsx
├── constants
│   └── navigation-list.ts
├── hooks
│   └── use-mobile.ts
├── lib
│   ├── api.ts
│   └── utils.ts
└── types
    ├── auth.types.ts
    ├── token.types.ts
    └── users.types.ts
```

