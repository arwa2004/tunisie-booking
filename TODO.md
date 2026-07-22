# TODO - Sentry/dev warnings cleanup

- [ ] Modify `client/src/app/sentry-example-page/page.tsx` to report to Sentry without throwing an error.
- [ ] Update `client/next.config.ts` to remove deprecated Sentry options (disableLogger/automaticVercelMonitors/reactComponentAnnotation) where possible.
- [ ] Silence Turbopack workspace-root warning by setting `turbopack.root` in `client/next.config.ts`.
- [ ] Run `npm run dev` in `client/` and verify:
  - /sentry-example-page no longer throws in browser console
  - deprecation warnings reduced/removed
  - workspace root warning silenced

