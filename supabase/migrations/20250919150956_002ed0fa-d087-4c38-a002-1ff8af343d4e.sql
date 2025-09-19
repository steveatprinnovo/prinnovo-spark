-- Add new columns to Company Detail table for projections
ALTER TABLE "Company Detail" 
ADD COLUMN "Target IPA Return" numeric,
ADD COLUMN "Target Cash Investment Return" numeric,
ADD COLUMN "Data Monetization Dollars" numeric,
ADD COLUMN "Data Monetization Forecast" numeric,
ADD COLUMN "Total Enterprise Value Captured" numeric;