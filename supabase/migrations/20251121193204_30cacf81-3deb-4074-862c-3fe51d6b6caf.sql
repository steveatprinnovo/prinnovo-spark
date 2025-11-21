-- Add columns for investment round 2
ALTER TABLE "Company Detail"
ADD COLUMN "Invested Amount Round 2" text,
ADD COLUMN "Invested Amount 2" numeric,
ADD COLUMN "Invested Amount Date 2" date,
ADD COLUMN "Invested Amount Valuation 2" numeric,
ADD COLUMN "Invested Amount Valuation Date 2" date;

-- Add columns for investment round 3
ALTER TABLE "Company Detail"
ADD COLUMN "Invested Amount Round 3" text,
ADD COLUMN "Invested Amount 3" numeric,
ADD COLUMN "Invested Amount Date 3" date,
ADD COLUMN "Invested Amount Valuation 3" numeric,
ADD COLUMN "Invested Amount Valuation Date 3" date;