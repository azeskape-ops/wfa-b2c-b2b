# CRM API – Supabase schema

The booking flow and CRM API routes expect the following tables. Create them in Supabase (SQL Editor) if they don’t exist. Adjust table/column names in the route files if your schema differs.

## 1. Leads (clients)

Table name used in code: **`leads`**

```sql
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text,
  status text default 'active',
  status_stage text,
  raw_answers jsonb,
  consultation_time timestamptz,
  created_at timestamptz default now()
);

-- Optional: index for fast lookup by phone (store digits-only for best matching)
create index if not exists idx_leads_phone on public.leads (phone);
```

- **phone**: Client phone (digits-only recommended, e.g. `421900000000`, so check-client matches reliably).
- **status**: Any value; API only checks that a row exists.
- **consultation_time**: Set by `POST /api/crm/book-slot` when a slot is booked (ISO `YYYY-MM-DDTHH:mm:ss`, suitable for `timestamptz` / `timestamp` / `text`).
- **name**, **status_stage**, **raw_answers**: Set by `POST /api/crm/submit-lead` (main quiz). Phone is stored **digits-only** for reliable matching with `check-client` / `book-slot`.

### Quiz → lead

`POST /api/crm/submit-lead` with JSON body `{ name, phone, city, email, answers }` inserts a row and returns `{ status: "ok", status_stage, phone, id }`. Adjust `computeStatusStageFromQuiz` in `src/lib/quiz-lead.ts` if your funnel rules differ.

## 2. Schedule slots (График – free slots)

Table name used in code: **`schedule_slots`**

```sql
create table if not exists public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text not null,
  is_available boolean default true,
  client_id uuid references public.leads(id),
  created_at timestamptz default now(),
  unique (date, time)
);

create index if not exists idx_schedule_slots_date_available on public.schedule_slots (date, is_available) where is_available = true and client_id is null;
```

- **date**: Slot date (`YYYY-MM-DD`).
- **time**: Time label, e.g. `09:00`, `09:30`.
- **is_available**: `true` = slot exists; set to `false` when booked if you use it.
- **client_id**: `null` = free; set to the lead’s `id` when booked.

To add free slots from your CRM admin: insert rows with `is_available = true` and `client_id = null` for the desired `date` and `time` values. The booking page will show them via `GET /api/crm/get-slots?date=YYYY-MM-DD`.
