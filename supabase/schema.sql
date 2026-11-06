-- Ejecutar en un proyecto Supabase dedicado a la agenda.
create extension if not exists pgcrypto;
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(),
 client_name text not null check (length(client_name) between 2 and 120),
 phone text not null check (length(phone) between 8 and 30),
 session_type text not null default 'Navideña',
 session_date date not null,
 start_time time not null,
 status text not null default 'solicitada' check(status in ('solicitada','confirmada','cancelada')),
 payment_status text not null default 'pendiente' check(payment_status in ('pendiente','anticipo','pagado')),
 amount numeric(10,2) not null default 500 check(amount>=0),
 paid_amount numeric(10,2) not null default 0 check(paid_amount>=0),
 notes text not null default '',
 created_at timestamptz not null default now(),
 constraint half_hour check (extract(minute from start_time) in (0,30) and extract(second from start_time)=0)
);
create unique index if not exists one_active_booking_per_slot on public.bookings(session_date,start_time) where status <> 'cancelada';
create table if not exists public.day_overrides (
 day date primary key,
 closed boolean not null default false,
 start_time time,
 end_time time,
 updated_at timestamptz not null default now(),
 constraint valid_override check (closed or (start_time is not null and end_time is not null and start_time<end_time))
);
alter table public.bookings enable row level security;
alter table public.day_overrides enable row level security;
-- Sin políticas públicas: acceso exclusivamente desde rutas del servidor usando service role.
