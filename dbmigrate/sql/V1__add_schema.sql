CREATE SCHEMA IF NOT EXISTS des;

------ Create DDL : original release ---
CREATE TABLE IF NOT EXISTS des.holder_credentials
(
    "holderCredentialsId" uuid,
    email character varying(64) COLLATE pg_catalog."default" NOT NULL,
    "orgId" character varying(10) COLLATE pg_catalog."default" NOT NULL,
    "fileName" character varying(64) COLLATE pg_catalog."default",
    "firstName" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "lastName" character varying(100) COLLATE pg_catalog."default" NOT NULL,
    "cvxCode" character varying(32) COLLATE pg_catalog."default",
    "marketingAuthorizationHolder" character varying(100) COLLATE pg_catalog."default",
    "employeeType" character varying(15) COLLATE pg_catalog."default",
    "dateOfVaccination" date NOT NULL,
    "vaccineStatus" character varying(5) COLLATE pg_catalog."default" NOT NULL,
    "idCredentials" json,
    "consentReceipt" json,
    "vaccinationCredentials" json,
    "sentStatusChs" character varying(5) COLLATE pg_catalog."default" NOT NULL,
    "sentStatusTririga" character varying(5) COLLATE pg_catalog."default" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT holder_credentials_pkey PRIMARY KEY (email, "orgId")
);

CREATE TABLE IF NOT EXISTS des.jobs
(
    "jobId" character varying(64) COLLATE pg_catalog."default" NOT NULL,
    "orgId" character varying(10) COLLATE pg_catalog."default" NOT NULL,
    status character varying(10) COLLATE pg_catalog."default" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT jobs_pkey PRIMARY KEY ("jobId", "orgId")
);

CREATE TABLE IF NOT EXISTS des.organizations
(
    "orgId" character varying(10) COLLATE pg_catalog."default" NOT NULL,
    config json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT organizations_pkey PRIMARY KEY ("orgId")
);