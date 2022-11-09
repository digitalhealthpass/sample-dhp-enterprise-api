alter table des.organizations alter column "orgId" type character varying(30);
alter table des.holder_credentials alter column "orgId" type character varying(30);
alter table des.jobs alter column "orgId" type character varying(30);
alter table des.holder_credentials alter column "vaccineStatus" type character varying(30);
ALTER table des.holder_credentials alter column "dateOfVaccination" DROP NOT NULL