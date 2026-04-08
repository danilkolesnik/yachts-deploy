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

-- Client messages on order (additional work / comments)
CREATE TABLE IF NOT EXISTS public.order_client_message (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  "orderId" character varying NOT NULL,
  "userId" character varying NOT NULL,
  kind character varying DEFAULT 'comment'::character varying NOT NULL,
  message text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT "PK_order_client_message_id" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_order_client_message_orderId" ON public.order_client_message ("orderId");

-- Order status history (used in /orders/:id/status-history)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  "orderId" character varying NOT NULL,
  "oldStatus" character varying NULL,
  "newStatus" character varying NOT NULL,
  "changedBy" character varying NULL,
  "changedAt" timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT "PK_order_status_history_id" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_order_status_history_orderId" ON public.order_status_history ("orderId");

-- Order assignment history (used in /orders/:id/assignment-history)
CREATE TABLE IF NOT EXISTS public.order_assignment_history (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  "orderId" character varying NOT NULL,
  "oldWorkerIds" text,
  "newWorkerIds" text NOT NULL,
  "changedBy" character varying NULL,
  "changedAt" timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT "PK_order_assignment_history_id" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_order_assignment_history_orderId" ON public.order_assignment_history ("orderId");

-- User audit history (viewed in Users -> History)
CREATE TABLE IF NOT EXISTS public.user_audit_history (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  "userId" character varying NOT NULL,
  "changedBy" character varying NULL,
  "entityType" character varying NOT NULL,
  "changeDescription" text NOT NULL,
  "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
  CONSTRAINT "PK_user_audit_history_id" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_user_audit_history_userId" ON public.user_audit_history ("userId");

