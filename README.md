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
