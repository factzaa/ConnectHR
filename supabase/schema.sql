-- ============================================================
--  Recruitment PWA — Supabase Schema
--  วิธีใช้: เปิด Supabase Dashboard > SQL Editor > New query
--          วางทั้งไฟล์นี้แล้วกด RUN
-- ============================================================

-- 1) ตารางผู้สมัคร ------------------------------------------------
create table if not exists public.applicants (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),

  -- ข้อมูลพื้นฐาน
  full_name      text not null,
  nickname       text,
  gender         text,                 -- เพศ
  phone          text not null,
  email          text,                 -- อีเมล / ไลน์ไอดี
  birth_date     date,
  address        text,

  -- สัญชาติ / เอกสาร (รองรับพนักงานต่างด้าว)
  nationality        text default 'ไทย',  -- สัญชาติ
  national_id        text,                -- เลขบัตรประชาชน (คนไทย)
  passport_no        text,                -- เลขหนังสือเดินทาง (ต่างด้าว)
  passport_expiry    date,                -- วันหมดอายุพาสปอร์ต
  work_permit_no     text,                -- เลขใบอนุญาตทำงาน (ต่างด้าว)
  work_permit_expiry date,                -- วันหมดอายุใบอนุญาตทำงาน

  -- ตำแหน่ง
  position        text,                -- ตำแหน่งที่สมัคร
  expected_salary numeric,
  start_date      date,                -- เริ่มงานได้เมื่อ

  -- ประวัติการทำงาน (เก็บเป็น JSON array)
  experience     jsonb default '[]'::jsonb,   -- [{company, position, years, detail}]

  -- ไฟล์แนบ (เก็บ path ใน storage bucket)
  photo_path     text,                 -- รูปถ่ายผู้สมัคร
  resume_path    text,                 -- (เดิม) เรซูเม่ไฟล์เดียว
  documents      jsonb default '[]'::jsonb,  -- เอกสารแนบหลายชนิด [{type,name,path}]

  -- การจัดการหลังบ้าน
  status         text not null default 'new',  -- new | reviewing | interview | passed | rejected
  note           text
);

-- 1.1) Migration — เผื่อเคยรันสคริปต์เวอร์ชันก่อนแล้ว (เพิ่มคอลัมน์ใหม่)
alter table public.applicants add column if not exists gender             text;
alter table public.applicants add column if not exists nationality        text default 'ไทย';
alter table public.applicants add column if not exists national_id        text;
alter table public.applicants add column if not exists passport_no        text;
alter table public.applicants add column if not exists passport_expiry    date;
alter table public.applicants add column if not exists work_permit_no     text;
alter table public.applicants add column if not exists work_permit_expiry date;
alter table public.applicants add column if not exists start_date         date;
alter table public.applicants add column if not exists documents          jsonb default '[]'::jsonb;

-- ดัชนีช่วยค้นหา/เรียง
create index if not exists idx_applicants_created  on public.applicants (created_at desc);
create index if not exists idx_applicants_status   on public.applicants (status);
create index if not exists idx_applicants_position on public.applicants (position);
create index if not exists idx_applicants_nation   on public.applicants (nationality);

-- 2) เปิด Row Level Security -----------------------------------
alter table public.applicants enable row level security;

-- (ก) ให้ "ใครก็ได้" (anon) เพิ่มใบสมัครได้ — สำหรับหน้าผู้สมัคร
drop policy if exists "public can insert applications" on public.applicants;
create policy "public can insert applications"
  on public.applicants for insert
  to anon, authenticated
  with check (true);

-- (ข) เฉพาะผู้ล็อกอิน (แอดมิน) เท่านั้นที่ดู/แก้/ลบได้ — หน้าหลังบ้าน
drop policy if exists "authenticated can read"   on public.applicants;
create policy "authenticated can read"
  on public.applicants for select
  to authenticated using (true);

drop policy if exists "authenticated can update" on public.applicants;
create policy "authenticated can update"
  on public.applicants for update
  to authenticated using (true) with check (true);

drop policy if exists "authenticated can delete" on public.applicants;
create policy "authenticated can delete"
  on public.applicants for delete
  to authenticated using (true);

-- 3) Storage bucket สำหรับไฟล์/รูป ------------------------------
insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;

-- อนุญาตให้ anon อัปโหลดไฟล์ (ตอนสมัคร)
drop policy if exists "public can upload files" on storage.objects;
create policy "public can upload files"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'applications');

-- เฉพาะผู้ล็อกอินอ่านไฟล์ได้ (แอดมินดูเรซูเม่/รูป)
drop policy if exists "authenticated can read files" on storage.objects;
create policy "authenticated can read files"
  on storage.objects for select
  to authenticated using (bucket_id = 'applications');

-- ============================================================
--  หมายเหตุ: สร้างบัญชีแอดมินได้ที่
--  Dashboard > Authentication > Users > Add user (ใส่อีเมล/รหัสผ่าน)
-- ============================================================
