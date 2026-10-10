# ACM Resolve

Campus events platform. Next.js 16, React 19, Tailwind 4, Radix UI, FullCalendar (unchanged stack).

## Run

```bash
npm install
npm run dev
```

## Routes

| Route | What it is |
| --- | --- |
| `/` | Public landing page: navbar, swipeable event cards, live calendar, about |
| `/login` | Sign in (demo mode: any email + password opens the dashboard) |
| `/dashboard`, `/calendar`, `/events/*`, `/verification/*` | The signed-in app |

## Design system

- Tokens and glass utilities live in `app/globals.css` (`glass`, `glass-strong`, `glass-inset`, navy scale `navy-50 … navy-950`).
- Shared building blocks: `components/ui/*`, `components/shared/*`.
- Landing page: `components/landing/*`. The hero card stack is `EventCardStack.tsx`.
- Event submit and edit share one form: `components/events/EventFormFields.tsx`.
