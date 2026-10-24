# Lee Cooper cargo collection

The storefront reproduces the supplied MHTML collection using its embedded logo, original photographs, sprite sheet, CSS, and five product records. The accompanying video informed the product detail views and owner product management flow.

Public files live in `public/`. Netlify serves that directory and deploys the TypeScript endpoints in `netlify/functions/`. Product routes use `#product/<id>` and the collection uses `#collection`. The bag saves selections in the visitor's browser, matching the reference. No payment or order processing was present in the reference.

The owner manager is at `/admin/`. Netlify checks the `admin` role before serving any files in that area; other visitors are redirected to `/owner-login/`. Sign-in, invitations, and password recovery use that separate public login page. Products are stored in Netlify Database; uploaded PNG, JPEG, and WebP files are stored in Netlify Blobs. All mutations require a verified Netlify Identity account with the `admin` role. Product edits affect the shared collection rather than browser-only demo data.

## Owner access

Identity is enabled. In the site's Netlify dashboard, open Identity, invite the owner, and assign that user the `admin` role. Accept the email invitation, set a password, and sign in at `/admin/`. Password reset links are supported. Public visitors cannot edit products or upload images.

## Development and verification

Install dependencies with `npm install`. Run `netlify dev --port 8889` for local development. Run `npm run check` for TypeScript and browser JavaScript checks. With the development server running, run `npm run test:access` to verify management redirects and rejection of anonymous catalog changes and uploads. Schema migrations and the original five-product seed are included under `netlify/database/migrations/`; Netlify applies them during deployment. Do not apply them manually.

The static reference collection is available immediately and remains a fallback if the catalog service cannot be reached. Database-backed editing requires the deployment migrations and owner account setup.
