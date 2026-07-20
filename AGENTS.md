# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free static portfolio deployed from the repository root with GitHub Pages. `index.html` contains the page structure, metadata, and JSON-LD. Handwritten styles live in `css/styles.css`; interactive filtering, theming, navigation, and reveal behavior live in `js/site.js`. Keep factual career and card content in `data/portfolio.json`. Store photos and icons in `images/`. Search crawl files and the résumé remain at the repository root.

## Build, Test, and Development Commands

- `npm run dev` serves the site at `http://localhost:8000` using Python's static server.
- `npm run build` runs the static-site validator. No compilation or output directory is required.
- `npm test` runs the same validation before a commit or pull request.

The validator checks local assets, in-page anchors, external-link safety attributes, and the expected project and timeline record counts.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, JavaScript, and JSON. Prefer semantic HTML, accessible button and input labels, and reusable CSS classes over inline styles. Use `kebab-case` for classes and IDs, `camelCase` for JavaScript variables, and descriptive lowercase `snake_case` for image files. Keep colors, typography, and spacing in CSS custom properties. Add career facts, AI stages, and skills to `data/portfolio.json`; do not duplicate them in rendering logic. Each project or experience has a `tabs` array. Add multiple valid tab IDs to display one card in multiple filters. Associate work with timeline or community items through a project's `engagementIds` array; engagement IDs must remain unique. Community records support optional `startDate`, `endDate`, or a custom `periodLabel`.

## Testing Guidelines

Run `npm test` after changing content, links, or assets. Then review the site at mobile and desktop widths. Confirm the project search and discipline filters, timeline filters, theme persistence, mobile navigation, résumé download, LinkedIn links, and reduced-motion behavior. Check the browser console for errors. There is no coverage threshold; validation and focused manual review are required.

## Commit & Pull Request Guidelines

History favors concise, imperative, sentence-case subjects such as `Update role` and `Make copyright year dynamic`. Keep commits focused and include source data with its related UI change. Pull requests should explain the visible result, list validation performed, and link relevant issues. Include before/after screenshots for visual or responsive changes. Call out résumé replacements and any inferred or corrected career data explicitly so facts can be reviewed.
