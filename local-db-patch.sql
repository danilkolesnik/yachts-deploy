-- Local dev patch to align the imported dump with current entities.
-- Safe to run multiple times.

ALTER TABLE IF EXISTS public.warehouse
  ADD COLUMN IF NOT EXISTS unofficially boolean NOT NULL DEFAULT true;

ALTER TABLE IF EXISTS public.offer
  ADD COLUMN IF NOT EXISTS location character varying NOT NULL DEFAULT '';

ALTER TABLE IF EXISTS public.offer
  ADD COLUMN IF NOT EXISTS language character varying NOT NULL DEFAULT 'en';

ALTER TABLE IF EXISTS public.offer
  ADD COLUMN IF NOT EXISTS "closedAt" timestamp without time zone NULL;

ALTER TABLE IF EXISTS public.offer
  ADD COLUMN IF NOT EXISTS "finishedAt" timestamp without time zone NULL;

ALTER TABLE IF EXISTS public.offer
  ADD COLUMN IF NOT EXISTS "closedBy" character varying NULL;

ALTER TABLE IF EXISTS public.offer
  ADD COLUMN IF NOT EXISTS yachts json NOT NULL DEFAULT '[]'::json;

ALTER TABLE IF EXISTS public."order"
  ADD COLUMN IF NOT EXISTS "startedAt" timestamp without time zone NULL;

ALTER TABLE IF EXISTS public."order"
  ADD COLUMN IF NOT EXISTS "finishedAt" timestamp without time zone NULL;

ALTER TABLE IF EXISTS public."order"
  ADD COLUMN IF NOT EXISTS "completedAt" timestamp without time zone NULL;

-- `EmployeeProfile` entity backing table (required by PermissionsGuard)
CREATE TABLE IF NOT EXISTS public.employee_profile (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  "userId" character varying NOT NULL,
  "fullName" character varying DEFAULT ''::character varying NOT NULL,
  "dateOfBirth" date,
  phone character varying DEFAULT ''::character varying NOT NULL,
  "secondaryPhone" character varying DEFAULT ''::character varying NOT NULL,
  address character varying DEFAULT ''::character varying NOT NULL,
  "contractStart" date,
  "contractEnd" date,
  position character varying DEFAULT ''::character varying NOT NULL,
  notes text,
  "responsibilityAreas" text,
  permissions text,
  "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT "PK_employee_profile_id" PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_employee_profile_userId" ON public.employee_profile ("userId");

-- `UserPermissionHistory` backing table (used by UsersService)
CREATE TABLE IF NOT EXISTS public.user_permission_history (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  "userId" character varying NOT NULL,
  "changedBy" character varying,
  "oldRole" character varying,
  "newRole" character varying,
  "oldPermissions" text,
  "newPermissions" text,
  "oldResponsibilityAreas" text,
  "newResponsibilityAreas" text,
  "changedAt" timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT "PK_user_permission_history_id" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_user_permission_history_userId" ON public.user_permission_history ("userId");

