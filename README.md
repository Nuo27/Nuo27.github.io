# Nuo27.github.io

Personal portfolio and blog. Jekyll + Notion CMS.

## Branch model

- **`deploy`** — full site source (Jekyll, articles, layouts, Notion sync). [Browse a'](../../tree/deploy)
- **`main`** — this README + the CI workflow only. Exists so GitHub Actions `schedule` triggers can find the workflow file (GitHub runs schedules from the default branch).
- **`dev`** — development branch.

## How the site works

The workflow on this branch checks out `deploy`, syncs articles from Notion, builds with Jekyll, and deploys to GitHub Pages. To edit the site, work on `dev`, merge to `deploy`.
