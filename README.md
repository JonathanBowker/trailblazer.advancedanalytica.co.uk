# Trailblazer

Standalone intake app for the Disney Trailblazer / MagiKit submission flow.

Local repository path: `/Users/jbb/Projects/disney-trailblazer-form-page`

## Purpose

This app isolates the protected upload experience from the main
`advancedanalytica.co.uk` site while continuing to use the same Supabase Auth
project and the same downstream Disney compliance pipeline.

## Domain

- Production: `https://trailblazer.advancedanalytica.co.uk`
- Local: `http://localhost:4321`

## Shared auth model

This app is designed to use the same Supabase project as the main
`advancedanalytica.co.uk` website, so user provisioning and role management can
stay on the existing admin surface.

`page_viewer` users can request security codes and access the protected Trailblazer
form without gaining access to the main portal.

## Required Supabase redirect URLs

Add these to the Supabase Auth redirect allow list before go-live:

- `https://trailblazer.advancedanalytica.co.uk/**`
- `http://localhost:4321/**`
- `http://127.0.0.1:4321/**`

## DigitalOcean

The sample app spec lives in [.do/app.yaml](./.do/app.yaml). Update the
repository URL after creating the GitHub repository for this standalone app.
