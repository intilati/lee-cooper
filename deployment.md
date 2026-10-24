# Deployment

Netlify publishes `public/` and deploys `netlify/functions/`. No frontend compilation is required. Dependencies are installed from the lockfile. Netlify applies the included database migrations before publishing, including the initial reference catalog.

Netlify Identity has been enabled. The site owner must invite their account through the Netlify dashboard's Identity page and assign the `admin` role before using `/admin/`. No admin password is stored in the repository.

The public site works without signing in. Management pages and scripts under `/admin/` require the `admin` role at the CDN; unauthenticated and non-admin visitors are redirected to `/owner-login/`. Management responses use private, no-store caching. The owner manager supports adding, editing, and deleting products and uploading product photographs. Its server endpoints reject anonymous and non-admin changes. Live database mutations must be verified after deployment with an authorized account; local checks do not substitute for that setup.
