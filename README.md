# Trailblazer

Standalone intake app for the Disney Trailblazer / MagiKit submission flow.

Local repository path: `/Users/jbb/Projects/disney-trailblazer-form-page`

## Purpose

This app isolates the protected upload experience from the main
`advancedanalytica.co.uk` site while continuing to use the same downstream
Disney compliance pipeline.

## Domain

- Production: `https://trailblazer.advancedanalytica.co.uk`
- Local: `http://localhost:4321`

## Umbraco iframe handoff

The Umbraco portal should point its iframe at:

`https://trailblazer.advancedanalytica.co.uk/forms/brand-readiness-assessment/embed?uid=[UserId]&token=[GUID]`

The embed route validates `token` against the server-side GUID batch in
`src/data/trailblazer-valid-guids.json`. `uid` is stored with the submission as
the Umbraco user id.

Known MagiKit iframe submitters can also be approved by email with
`TRAILBLAZER_APPROVED_EMBED_EMAILS`. This allows named portal users through the
embed route when their `email` query/form value matches the configured list.
If MagiKit cannot pass `email` in the iframe URL, use
`TRAILBLAZER_APPROVED_EMBED_USERS` as a comma-separated
`uid=email|name|company` map.

Optional query parameters are also supported and will be carried through to the
submission metadata:

- `name`
- `email`
- `company`

The legacy Supabase OTP page is still present in the codebase, but Umbraco
should use the embed route above.

## DigitalOcean

The sample app spec lives in [.do/app.yaml](./.do/app.yaml). Update the
repository URL after creating the GitHub repository for this standalone app.

## Tracked fixes

### 2026-10-06: MagiKit pilot users showing the wrong company

- Status: fixed and deployed.
- Symptom: some MagiKit iframe users displayed the wrong company, including
  partner users falling back to `Company: Frontpage`.
- Cause: the approved MagiKit UID fallback only carried `uid=email` and used a
  hard-coded `Frontpage` company when MagiKit did not pass company metadata.
- Fix: `TRAILBLAZER_APPROVED_EMBED_USERS` now supports
  `uid=email|name|company`, populated from the Disney MagiKit pilot users
  spreadsheet.
- Commit: `350be5b` (`Map MagiKit users to pilot companies`).
- DigitalOcean deployment: `9b78360b-d034-474e-bee0-7612acbb699b`.
- GitHub issue:
  [#2](https://github.com/JonathanBowker/trailblazer.advancedanalytica.co.uk/issues/2)
  (`completed`).

Live verification run on 2026-10-06. Total time taken: 4.052 seconds.

| Checked at (BST) | UID | Name | Email | Company | Status | Time taken |
| --- | ---: | --- | --- | --- | --- | ---: |
| 09:55:14 | 1825 | Nicole Humphreys | nicole.humphreys@carrier.co.uk | Carrier | ok | 393 ms |
| 09:55:14 | 1777 | Jess | jess@quintessentiallytravel.com | Quintessentially Travel | ok | 226 ms |
| 09:55:14 | 2262 | Lauren Godfrey | lauren.godfrey@wingedboots.co.uk | Winged Boots | ok | 289 ms |
| 09:55:14 | 2263 | Abby | abby@360privatetravel.com | 360 Private Travel | ok | 174 ms |
| 09:55:15 | 78 | Mtroy | mtroy@abbeytravel.ie | Abbey Travel | ok | 129 ms |
| 09:55:15 | 2260 | Kian | kian@magicbreaks.co.uk | MagicBreaks | ok | 221 ms |
| 09:55:15 | 79 | Kelly | kelly@magicbreaks.co.uk | MagicBreaks | ok | 106 ms |
| 09:55:15 | 2261 | Hadassa | hadassa@magicbreaks.co.uk | MagicBreaks | ok | 216 ms |
| 09:55:15 | 63 | Claire Wadham | claire@frontpage.co.uk | Frontpage | ok | 198 ms |
| 09:55:15 | 16 | Paula Anderson | paula@frontpage.co.uk | Frontpage | ok | 128 ms |
| 09:55:16 | 21 | Rhiannon Walker | rhiannon@imaginary-friends.studio | Imaginary Friends | ok | 221 ms |
| 09:55:16 | 11 | Daniel McAteer | daniel@frontpage.co.uk | Frontpage | ok | 370 ms |
| 09:55:16 | 50 | Michelle Westwood | michelle.westwood@disney.com | Disney | ok | 110 ms |
| 09:55:16 | 25 | Lucie Preece | lucie.preece@disney.com | Disney | ok | 221 ms |
| 09:55:17 | 210 | Nicole Horlock | nicole.horlock@disney.com | Disney | ok | 134 ms |
| 09:55:17 | 389 | Lizi Bostock | lizi.bostock@disney.com | Disney | ok | 107 ms |
| 09:55:17 | 145 | Alice Murphy | alice.murphy@disney.com | Disney | ok | 283 ms |
| 09:55:17 | 43 | Paul Heustice | paul.heustice@disney.com | Disney | ok | 172 ms |
| 09:55:17 | 608 | Gaby Rogers | gabrielle.rogers@disney.com | Disney | ok | 121 ms |
| 09:55:17 | 30 | Max Mason | max.mason@disney.com | Disney | ok | 234 ms |
