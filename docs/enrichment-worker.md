# PitchBook Enrichment Worker

Nightly Claude scheduled task. Reads the enrichment queue from Supabase, resolves
companies against the PitchBook MCP, writes normalized results to
`public.pitchbook_enrichment`. The app (EnrichmentPanel on /dealflow/:id) only
reads this table. Configured per Steve, 2026-07-08: nightly, 25 companies/run,
Active + staged deals first, Pass-only companies excluded.

## Preconditions
- PitchBook MCP connector connected in Claude (worker aborts gracefully and
  reports if not).
- Supabase MCP connected (project hkmffnxempcmbbdaicyd).

## Procedure (per run)
1. Refresh confirmed candidates first:
   `select id, company_name, pbid from pitchbook_enrichment where status='pending' and pbid is not null limit 25;`
   For each: fetch profile + deals by PBID (steps 4-5) and mark `matched`.
2. Pull queue (remaining budget of the 25):
   `select * from enrichment_queue limit N;`
   (View excludes Pass-only companies and rows fetched < 30 days ago;
   Active/staged sort first.)
3. For each company: `pitchbook_search(name)` (entity_types business_entity).
   - 0 results → retry once with simplified name (strip suffixes like SA/Inc/AI);
     still 0 → upsert status `not_found`.
   - 1 result, or one whose website domain matches the deal's website → proceed.
   - multiple plausible → upsert status `ambiguous` with candidates
     [{pbid,name,description,location}] and stop for this company (an admin
     confirms in the app; picked ones re-enter via step 1).
4. `pitchbook_get_profile(pbid)` → description, year founded, employees (+as-of),
   HQ, business/ownership status, total raised, last financing.
5. `pitchbook_get_company_deals(pbid, limit 10)` → funding_rounds array:
   {date, type (Deal Type 2 or Deal Type), amount_usd, investors[] (from
   synopsis/lead), synopsis}; last-round fields and post_valuation from the
   most recent priced round. Collect distinct investors.
6. Upsert into pitchbook_enrichment keyed on company_key
   (status `matched`, fetched_at now()). Never write PitchBook data anywhere else.
7. Report: counts of matched / ambiguous / not_found / skipped, remaining queue
   size, and any MCP errors. If the PitchBook connector is invalidated, say so
   explicitly and do nothing else.

## Budget
Roughly 3 MCP calls per company (search + profile + deals) ≈ 75 calls/night at
the 25-company cap. Do not exceed the cap even if the queue is larger.
