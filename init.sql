--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-03-24 15:11:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16428)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5031 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16580)
-- Name: file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.file (
    id integer NOT NULL,
    filename character varying NOT NULL,
    path character varying NOT NULL,
    mimetype character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "offerId" character varying NOT NULL
);


ALTER TABLE public.file OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16579)
-- Name: file_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.file_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.file_id_seq OWNER TO postgres;

--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 227
-- Name: file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.file_id_seq OWNED BY public.file.id;


--
-- TOC entry 220 (class 1259 OID 16410)
-- Name: offer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offer (
    comment character varying DEFAULT ''::character varying NOT NULL,
    "countryCode" character varying DEFAULT ''::character varying NOT NULL,
    "yachtName" character varying DEFAULT ''::character varying NOT NULL,
    "yachtModel" character varying DEFAULT ''::character varying NOT NULL,
    services json DEFAULT '[]'::json NOT NULL,
    parts json DEFAULT '[]'::json NOT NULL,
    status character varying DEFAULT 'created'::character varying NOT NULL,
    versions json DEFAULT '[]'::json NOT NULL,
    id character varying NOT NULL,
    "customerId" character varying DEFAULT ''::character varying NOT NULL,
    "customerFullName" character varying DEFAULT ''::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "imageUrls" json DEFAULT '[]'::json,
    "videoUrls" json DEFAULT '[]'::json
);


ALTER TABLE public.offer OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16569)
-- Name: offer_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offer_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "offerId" character varying NOT NULL,
    "userId" character varying NOT NULL,
    "changeDate" timestamp without time zone DEFAULT now() NOT NULL,
    "changeDescription" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.offer_history OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16507)
-- Name: order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."order" (
    "offerId" character varying NOT NULL,
    status character varying DEFAULT 'Created'::character varying NOT NULL,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "customerId" character varying DEFAULT ''::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "processImageUrls" text,
    "processVideoUrls" text,
    "resultImageUrls" text,
    "resultVideoUrls" text,
    "tabImageUrls" text,
    "tabVideoUrls" text
);


ALTER TABLE public."order" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16527)
-- Name: order_assigned_workers_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_assigned_workers_users (
    "orderId" uuid NOT NULL,
    "usersId" character varying NOT NULL
);


ALTER TABLE public.order_assigned_workers_users OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16620)
-- Name: order_timer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_timer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderId" character varying NOT NULL,
    "userId" character varying DEFAULT ''::character varying NOT NULL,
    "startTime" timestamp without time zone DEFAULT now() NOT NULL,
    "endTime" timestamp without time zone,
    "isRunning" boolean DEFAULT true NOT NULL,
    "isPaused" boolean DEFAULT false NOT NULL,
    "pauseTime" timestamp without time zone,
    "totalPausedTime" bigint,
    "totalDuration" bigint,
    status character varying DEFAULT 'In Progress'::character varying NOT NULL
);


ALTER TABLE public.order_timer OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16449)
-- Name: pricelist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricelist (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "serviceName" character varying DEFAULT ''::character varying NOT NULL,
    "priceInEuroWithoutVAT" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "unitsOfMeasurement" character varying DEFAULT ''::character varying NOT NULL,
    description character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.pricelist OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16389)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    role character varying DEFAULT 'user'::character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    "fullName" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16397)
-- Name: warehouse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse (
    id character varying DEFAULT ''::character varying NOT NULL,
    name character varying DEFAULT ''::character varying NOT NULL,
    quantity character varying DEFAULT ''::character varying NOT NULL,
    inventory character varying DEFAULT ''::character varying NOT NULL,
    comment character varying DEFAULT ''::character varying NOT NULL,
    "countryCode" character varying DEFAULT ''::character varying NOT NULL,
    "serviceCategory" json DEFAULT '{}'::json NOT NULL,
    "pricePerUnit" character varying DEFAULT ''::character varying NOT NULL
);


ALTER TABLE public.warehouse OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16439)
-- Name: warehouse_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "warehouseId" character varying NOT NULL,
    action character varying NOT NULL,
    data json NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouse_history OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16487)
-- Name: work_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_order (
    id character varying NOT NULL,
    "offerId" character varying NOT NULL,
    services json NOT NULL,
    parts json NOT NULL,
    status character varying DEFAULT 'in_progress'::character varying NOT NULL,
    "assignedWorkerId" character varying NOT NULL,
    "totalWorkTime" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.work_order OWNER TO postgres;

--
-- TOC entry 4833 (class 2604 OID 16583)
-- Name: file id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file ALTER COLUMN id SET DEFAULT nextval('public.file_id_seq'::regclass);


--
-- TOC entry 5024 (class 0 OID 16580)
-- Dependencies: 228
-- Data for Name: file; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.file (id, filename, path, mimetype, "createdAt", "offerId") FROM stdin;
1	1741553007850-834851100.png	uploads\\image\\1741553007850-834851100.png	image/png	2025-03-09 20:43:27.889189	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
2	1741553293021-553680504.png	uploads\\image\\1741553293021-553680504.png	image/png	2025-03-09 20:48:13.065367	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
3	1741553729625-327641043.png	uploads\\image\\1741553729625-327641043.png	image/png	2025-03-09 20:55:29.670652	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
4	1741554463798-71983405.png	uploads\\image\\1741554463798-71983405.png	image/png	2025-03-09 21:07:43.842569	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
5	1741560118325-469867479.png	uploads\\image\\1741560118325-469867479.png	image/png	2025-03-09 22:41:58.364325	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
6	1741560716367-217876349.png	uploads\\image\\1741560716367-217876349.png	image/png	2025-03-09 22:51:56.399982	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
7	1741560778991-280756954.png	uploads\\image\\1741560778991-280756954.png	image/png	2025-03-09 22:52:59.024122	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
8	1741560780131-333289164.png	uploads\\image\\1741560780131-333289164.png	image/png	2025-03-09 22:53:00.13565	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
9	1741560843193-622061046.png	uploads\\image\\1741560843193-622061046.png	image/png	2025-03-09 22:54:03.210379	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
10	1741560900697-990350865.png	uploads\\image\\1741560900697-990350865.png	image/png	2025-03-09 22:55:00.703714	eaAw6J6hDix4YSCiV8JCeNHPBgOzEv
\.


--
-- TOC entry 5016 (class 0 OID 16410)
-- Dependencies: 220
-- Data for Name: offer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer (comment, "countryCode", "yachtName", "yachtModel", services, parts, status, versions, id, "customerId", "customerFullName", "createdAt", "imageUrls", "videoUrls") FROM stdin;
	111111111111111	test	rewrew	{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}	[{"value":"tVgxkHDphUQoRppUhX9MIfakSgH0Yk","label":"test","quantity":"1","pricePerUnit":"12"}]	created	[]	UA9N03nLE28Xd6nNuVdC8Gg7JCSsHL	zwWptuW9dKCQEz486Lx5vAPS80KY0S	Test name 2	2025-03-24 14:15:33.263	[]	[]
\.


--
-- TOC entry 5022 (class 0 OID 16569)
-- Dependencies: 226
-- Data for Name: offer_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offer_history (id, "offerId", "userId", "changeDate", "changeDescription") FROM stdin;
06ebb308-145d-4129-b146-0acb45184c12	opJEPsmUj8UZ42Y7QccZRLv7Hx10CB	zwWptuW9dKCQEz486Lx5vAPS80KY0S	2025-02-28 17:36:29.702	{"yachtName":{"oldValue":"rewrew","newValue":"rewrew123412"},"services":{"oldValue":{"id":"9508c4a2-c2b6-4286-ac45-4854a26af951","serviceName":"Mechanics","priceInEuroWithoutVAT":"70.00","unitsOfMeasurement":""},"newValue":{"id":"9508c4a2-c2b6-4286-ac45-4854a26af951","serviceName":"Mechanics","priceInEuroWithoutVAT":"70.00","unitsOfMeasurement":""}},"parts":{"oldValue":{"id":"QrcRAp7RsR1wdpYnGX90pKWKNFFd6e","name":"silkie","quantity":"1","inventory":"23","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{}},"newValue":{"id":"5drNePQPBRslK9XsUJ3nbZe9TQjRRR","name":"test123","quantity":"1","inventory":"123","comment":"trewtrew","countryCode":"432432","serviceCategory":{}}},"status":{"oldValue":"created","newValue":"confirmed"},"userId":{"newValue":"zwWptuW9dKCQEz486Lx5vAPS80KY0S"}}
6caa9905-0f70-4eff-af18-829140856fda	opJEPsmUj8UZ42Y7QccZRLv7Hx10CB	zwWptuW9dKCQEz486Lx5vAPS80KY0S	2025-02-28 17:38:41.352	{"yachtName":{"oldValue":"rewrew123412","newValue":"test"},"parts":{"oldValue":{"id":"5drNePQPBRslK9XsUJ3nbZe9TQjRRR","name":"test123","quantity":"1","inventory":"123","comment":"trewtrew","countryCode":"432432","serviceCategory":{}},"newValue":{"id":"QrcRAp7RsR1wdpYnGX90pKWKNFFd6e","name":"silkie","quantity":"1","inventory":"23","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{}}},"status":{"oldValue":"confirmed","newValue":"canceled"},"userId":{"newValue":"zwWptuW9dKCQEz486Lx5vAPS80KY0S"}}
f46ded2a-0fe4-4b64-badd-ed98eeaff407	vOgtXBEPHiFmpuDG34Mla7Ggyd8rVN		2025-03-24 13:19:21.862	{"status":{"oldValue":"created","newValue":"confirmed"},"userId":{"newValue":""}}
fd734162-7f35-4e57-ae15-d95690ba0bf0	TwPWHwdA1TvmVg7CGZCNBAqR5U9JBr	dQPTpwOA01LNUo0aaVaIWqEyepFbHH	2025-03-24 13:22:39.64	{"status":{"oldValue":"created","newValue":"canceled"},"userId":{"newValue":"dQPTpwOA01LNUo0aaVaIWqEyepFbHH"}}
\.


--
-- TOC entry 5020 (class 0 OID 16507)
-- Dependencies: 224
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."order" ("offerId", status, id, "customerId", "createdAt", "processImageUrls", "processVideoUrls", "resultImageUrls", "resultVideoUrls", "tabImageUrls", "tabVideoUrls") FROM stdin;
UA9N03nLE28Xd6nNuVdC8Gg7JCSsHL	created	b3f7743a-3389-4185-9ba1-a47d6357c60b	zwWptuW9dKCQEz486Lx5vAPS80KY0S	2025-03-24 12:22:38.155193	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5021 (class 0 OID 16527)
-- Dependencies: 225
-- Data for Name: order_assigned_workers_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_assigned_workers_users ("orderId", "usersId") FROM stdin;
b3f7743a-3389-4185-9ba1-a47d6357c60b	hxR9jRcbqGNBmTXZNySRgrqzrUeutW
\.


--
-- TOC entry 5025 (class 0 OID 16620)
-- Dependencies: 229
-- Data for Name: order_timer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_timer (id, "orderId", "userId", "startTime", "endTime", "isRunning", "isPaused", "pauseTime", "totalPausedTime", "totalDuration", status) FROM stdin;
8c522b0c-76fd-4679-b784-c846b6c29046	08e4d2ea-ff1a-43fc-8acf-25228b0641bc	dQPTpwOA01LNUo0aaVaIWqEyepFbHH	2025-03-24 13:21:36.684	2025-03-24 13:21:40.324	f	f	\N	\N	3640	Completed
ea3288e3-ec7c-43c7-8c50-d47b191a21bd	08e4d2ea-ff1a-43fc-8acf-25228b0641bc		2025-03-24 13:21:40.325	\N	f	f	\N	0	\N	Ready
\.


--
-- TOC entry 5018 (class 0 OID 16449)
-- Dependencies: 222
-- Data for Name: pricelist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricelist (id, "serviceName", "priceInEuroWithoutVAT", "unitsOfMeasurement", description) FROM stdin;
85ce1520-86ea-4fc2-b502-da1207e8d7ab	Test1	40.00	3	Test Description
\.


--
-- TOC entry 5014 (class 0 OID 16389)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, role, email, password, "fullName") FROM stdin;
ljsAwadVGM3JobyCrbKJXqCExJRaQp	user	kutuzovmaksim14@gmail.com	$2b$10$ZTUB.V1nAIezsWBLwQE9De7nh8eJQwiEcBIsI55YypjJvphmhwXiK	Test name 3
tpdeVOcfPxmgVsjj6EhnTk0MOyx78R	user	test@gmail.com	$2b$10$d76idu0PjmVC1K28m6Zr4.1c257D51X3bb/myzyVbAva4VUibpK/S	Test name 4
hxR9jRcbqGNBmTXZNySRgrqzrUeutW	electrician	test@test.com	$2b$10$/dbgqiBxs1z9Av0DByBsJeYKrXfSlF9ljHyDKVNSwFvQpcmf3f/hi	Ivan Zolo
loeOWMxwygUSRJLgZgKpHqNIas5wzy	mechanic	danill.brinko@gmail.com	$2b$10$yNPZ4O/5K.pI6/6JI92QJOOh4P7htAIZEgD7gMq8wivYgoRZk3j5e	Test name 5
zwWptuW9dKCQEz486Lx5vAPS80KY0S	user	kirill.demchenko.69@gmail.com	$2b$10$MXZo3bPeO1B/mg/pyBSISO4vi.E1sjFcJhzAwfCH1KU3PAeOpnSHa	Test name 2
dQPTpwOA01LNUo0aaVaIWqEyepFbHH	admin	kirill.demchenko.67@gmail.com	$2b$10$kKXsjXoqjCcjUcCR9TEORu8MI0clkHtEcva6efULNsVr/IC6/M9ui	Test name 1
\.


--
-- TOC entry 5015 (class 0 OID 16397)
-- Dependencies: 219
-- Data for Name: warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse (id, name, quantity, inventory, comment, "countryCode", "serviceCategory", "pricePerUnit") FROM stdin;
0xLEIU75WFTybjRUg5q6xWq1Gt2NBX	test12332321	0		tertre	111111111111111	{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}	12
kh0C2We23BtLQqpniutEnAGH0BcRiG	test543543543	0		trewtrew	53425423	{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}	12
tVgxkHDphUQoRppUhX9MIfakSgH0Yk	test	1		trewtrew	111111111111111	{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}	12
\.


--
-- TOC entry 5017 (class 0 OID 16439)
-- Dependencies: 221
-- Data for Name: warehouse_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_history (id, "warehouseId", action, data, "createdAt") FROM stdin;
68c938b2-477c-47ff-af30-8d62c48b923a	FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF	update	{"id":"FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF","name":"test2","quantity":"123","inventory":"12","comment":"trewtrew","countryCode":"53425423"}	2025-02-24 20:23:06.072834
438e1fb5-cb06-40a0-b24a-d5e884be96ee	FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF	delete	{"id":"FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF","name":"test2","quantity":"123","inventory":"12","comment":"trewtrew","countryCode":"53425423"}	2025-02-24 20:27:21.638745
e73855fa-a833-4a71-8342-e64811964ddf	FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF	delete	{"id":"FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF","name":"test2","quantity":"123","inventory":"12","comment":"trewtrew","countryCode":"53425423"}	2025-02-24 20:27:29.319536
d541c286-d99d-46ff-9454-c471a97d219a	FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF	delete	{"id":"FcnyqXUGF6OTrMaD9q1Mtfk63EB7TF","name":"test2","quantity":"123","inventory":"12","comment":"trewtrew","countryCode":"53425423"}	2025-02-24 20:28:18.226419
1988bdd7-6703-43e6-9e6f-ef8f3b6bc33f	5drNePQPBRslK9XsUJ3nbZe9TQjRRR	create	{"id":"5drNePQPBRslK9XsUJ3nbZe9TQjRRR","name":"test123","quantity":"1","inventory":"123","comment":"trewtrew","countryCode":"432432"}	2025-02-24 20:32:32.814733
05ed9c87-47fa-4f0e-88bb-09442d2449d2	QrcRAp7RsR1wdpYnGX90pKWKNFFd6e	create	{"id":"QrcRAp7RsR1wdpYnGX90pKWKNFFd6e","name":"silkie","quantity":"1","inventory":"23","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":"Electrician"}	2025-02-25 11:18:54.146645
8a7c8769-1a4e-465a-8c20-41d04d5d8e1b	fxVW3mYXRbo4uO5vTCN8LIC2uMtIND	create	{"id":"fxVW3mYXRbo4uO5vTCN8LIC2uMtIND","name":"test2","quantity":"321","inventory":"3213","comment":"куцкцукуц","countryCode":"53425423","serviceCategory":{"id":"9508c4a2-c2b6-4286-ac45-4854a26af951","serviceName":"Mechanics","priceInEuroWithoutVAT":"70.00"}}	2025-02-25 14:28:20.4928
573725c0-048d-40d7-a9d8-c3b0d1bf6714	tZ6MO5pOYIa54e9pYrVrFuITQgA90m	create	{"id":"tZ6MO5pOYIa54e9pYrVrFuITQgA90m","name":"fsdf","quantity":"43242","inventory":"rew","comment":"rewrew","countryCode":"rewrw234432","serviceCategory":{"id":"9508c4a2-c2b6-4286-ac45-4854a26af951","serviceName":"Mechanics","priceInEuroWithoutVAT":"70.00"}}	2025-02-25 14:29:27.547188
58008380-2371-4175-86e0-d8f782b78faf	ppZGWzOsp97JnCbiVm8WTQknavTukt	delete	{"id":"ppZGWzOsp97JnCbiVm8WTQknavTukt","name":"test","quantity":"1","pricePerUnit":"","inventory":"123","comment":"tertre","countryCode":"3214342432432","serviceCategory":{}}	2025-03-24 10:29:09.47679
1890e097-cf65-4d0f-a22c-78f93ac9ab98	5drNePQPBRslK9XsUJ3nbZe9TQjRRR	delete	{"id":"5drNePQPBRslK9XsUJ3nbZe9TQjRRR","name":"test123","quantity":"1","pricePerUnit":"","inventory":"123","comment":"trewtrew","countryCode":"432432","serviceCategory":{}}	2025-03-24 10:29:09.869473
e9652df4-c000-4145-b766-4a1394c893c8	QrcRAp7RsR1wdpYnGX90pKWKNFFd6e	delete	{"id":"QrcRAp7RsR1wdpYnGX90pKWKNFFd6e","name":"silkie","quantity":"1","pricePerUnit":"","inventory":"23","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{}}	2025-03-24 10:29:10.711117
af270f12-b956-4a2b-a074-d24fa0aa2c4c	fxVW3mYXRbo4uO5vTCN8LIC2uMtIND	delete	{"id":"fxVW3mYXRbo4uO5vTCN8LIC2uMtIND","name":"test2","quantity":"321","pricePerUnit":"","inventory":"3213","comment":"куцкцукуц","countryCode":"53425423","serviceCategory":{"id":"9508c4a2-c2b6-4286-ac45-4854a26af951","serviceName":"Mechanics","priceInEuroWithoutVAT":"70.00"}}	2025-03-24 10:29:14.439706
de4260d5-539f-460d-adbf-41397658bd31	tZ6MO5pOYIa54e9pYrVrFuITQgA90m	delete	{"id":"tZ6MO5pOYIa54e9pYrVrFuITQgA90m","name":"fsdf","quantity":"43242","pricePerUnit":"","inventory":"rew","comment":"rewrew","countryCode":"rewrw234432","serviceCategory":{"id":"9508c4a2-c2b6-4286-ac45-4854a26af951","serviceName":"Mechanics","priceInEuroWithoutVAT":"70.00"}}	2025-03-24 10:29:14.827439
1b246e2e-9310-417a-b16c-1220aca33f56	tVgxkHDphUQoRppUhX9MIfakSgH0Yk	create	{"id":"tVgxkHDphUQoRppUhX9MIfakSgH0Yk","name":"test","quantity":"2","pricePerUnit":"12","inventory":"","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}}	2025-03-24 10:32:02.992186
fd2ad943-23fe-4e30-87d1-6eef34951095	tVgxkHDphUQoRppUhX9MIfakSgH0Yk	update	{"id":"tVgxkHDphUQoRppUhX9MIfakSgH0Yk","name":"test","quantity":"1","pricePerUnit":"12","inventory":"","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}}	2025-03-24 10:59:31.783726
0c016db1-c900-4976-b790-2f6d65c4d3af	0xLEIU75WFTybjRUg5q6xWq1Gt2NBX	create	{"id":"0xLEIU75WFTybjRUg5q6xWq1Gt2NBX","name":"test12332321","quantity":"1","pricePerUnit":"12","inventory":"","comment":"tertre","countryCode":"111111111111111","serviceCategory":{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}}	2025-03-24 11:20:25.146318
a7929d10-1bac-4dbf-82f3-3141b13f85c6	kh0C2We23BtLQqpniutEnAGH0BcRiG	create	{"id":"kh0C2We23BtLQqpniutEnAGH0BcRiG","name":"test543543543","quantity":"1","pricePerUnit":"12","inventory":"","comment":"trewtrew","countryCode":"53425423","serviceCategory":{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}}	2025-03-24 11:47:19.911027
4df5d8a8-3123-40cc-ae1e-5c4dd44f1293	tVgxkHDphUQoRppUhX9MIfakSgH0Yk	update	{"id":"tVgxkHDphUQoRppUhX9MIfakSgH0Yk","name":"test","quantity":"1","pricePerUnit":"12","inventory":"","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}}	2025-03-24 11:50:49.607883
707c72a9-33a2-4742-bc59-89691f898f7f	tVgxkHDphUQoRppUhX9MIfakSgH0Yk	update	{"id":"tVgxkHDphUQoRppUhX9MIfakSgH0Yk","name":"test","quantity":"1","pricePerUnit":"12","inventory":"","comment":"trewtrew","countryCode":"111111111111111","serviceCategory":{"id":"85ce1520-86ea-4fc2-b502-da1207e8d7ab","serviceName":"Test1","priceInEuroWithoutVAT":"40.00","unitsOfMeasurement":"3","description":"Test Description"}}	2025-03-24 12:23:27.020753
\.


--
-- TOC entry 5019 (class 0 OID 16487)
-- Dependencies: 223
-- Data for Name: work_order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_order (id, "offerId", services, parts, status, "assignedWorkerId", "totalWorkTime", "createdAt") FROM stdin;
\.


--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 227
-- Name: file_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.file_id_seq', 10, true);


--
-- TOC entry 4852 (class 2606 OID 16496)
-- Name: work_order PK_0730e63dd523d397530859cb6d1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT "PK_0730e63dd523d397530859cb6d1" PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 16632)
-- Name: order_timer PK_0cb6cc0d26160876bcc304c528f; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_timer
    ADD CONSTRAINT "PK_0cb6cc0d26160876bcc304c528f" PRIMARY KEY (id);


--
-- TOC entry 4854 (class 2606 OID 16543)
-- Name: order PK_1031171c13130102495201e3e20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 16458)
-- Name: pricelist PK_2ae09574182aa8ed4de3ae2009c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricelist
    ADD CONSTRAINT "PK_2ae09574182aa8ed4de3ae2009c" PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 16588)
-- Name: file PK_36b46d232307066b3a2c9ea3a1d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY (id);


--
-- TOC entry 4858 (class 2606 OID 16533)
-- Name: order_assigned_workers_users PK_42eb9e1186331912f726495e6d2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_assigned_workers_users
    ADD CONSTRAINT "PK_42eb9e1186331912f726495e6d2" PRIMARY KEY ("orderId", "usersId");


--
-- TOC entry 4846 (class 2606 OID 16480)
-- Name: offer PK_57c6ae1abe49201919ef68de900; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer
    ADD CONSTRAINT "PK_57c6ae1abe49201919ef68de900" PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 16447)
-- Name: warehouse_history PK_62e77c96189b28969e0e0861074; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_history
    ADD CONSTRAINT "PK_62e77c96189b28969e0e0861074" PRIMARY KEY (id);


--
-- TOC entry 4844 (class 2606 OID 16403)
-- Name: warehouse PK_965abf9f99ae8c5983ae74ebde8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse
    ADD CONSTRAINT "PK_965abf9f99ae8c5983ae74ebde8" PRIMARY KEY (id);


--
-- TOC entry 4842 (class 2606 OID 16396)
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 16578)
-- Name: offer_history PK_f37fc79f8b462f53fe1f64a9044; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offer_history
    ADD CONSTRAINT "PK_f37fc79f8b462f53fe1f64a9044" PRIMARY KEY (id);


--
-- TOC entry 4855 (class 1259 OID 16534)
-- Name: IDX_774cb794d5801833c8da6dd293; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_774cb794d5801833c8da6dd293" ON public.order_assigned_workers_users USING btree ("orderId");


--
-- TOC entry 4856 (class 1259 OID 16535)
-- Name: IDX_9d8580f3a6f0ce1f664cdec76f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_9d8580f3a6f0ce1f664cdec76f" ON public.order_assigned_workers_users USING btree ("usersId");


--
-- TOC entry 4867 (class 2606 OID 16550)
-- Name: order_assigned_workers_users FK_774cb794d5801833c8da6dd293c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_assigned_workers_users
    ADD CONSTRAINT "FK_774cb794d5801833c8da6dd293c" FOREIGN KEY ("orderId") REFERENCES public."order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4868 (class 2606 OID 16555)
-- Name: order_assigned_workers_users FK_9d8580f3a6f0ce1f664cdec76f9; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_assigned_workers_users
    ADD CONSTRAINT "FK_9d8580f3a6f0ce1f664cdec76f9" FOREIGN KEY ("usersId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4865 (class 2606 OID 16497)
-- Name: work_order FK_ca5e98a5f17a93baec2f45f93a4; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT "FK_ca5e98a5f17a93baec2f45f93a4" FOREIGN KEY ("offerId") REFERENCES public.offer(id);


--
-- TOC entry 4866 (class 2606 OID 16502)
-- Name: work_order FK_dd54ce93c3428a8586af4b493c7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_order
    ADD CONSTRAINT "FK_dd54ce93c3428a8586af4b493c7" FOREIGN KEY ("assignedWorkerId") REFERENCES public.users(id);


-- Completed on 2025-03-24 15:11:39

--
-- PostgreSQL database dump complete
--

