# TODO - Persistent AgriRelay App Shell

- [ ] Update `src/components/layout/Sidebar.jsx` to match spec (desktop fixed 240px sidebar, officer info, nav icons/routes, active styling, red dot logic, mobile bottom nav with 5 icons, bottom sign out UI).
- [ ] Update `src/components/layout/TopBar.jsx` to match spec (sticky 64px, accepts `pageTitle` prop, zone chip, last sync time, refresh spinner on click, notification bell with red dot).
- [ ] Update `src/App.jsx` to pass dynamic page title into `TopBar` based on current route.
- [ ] Ensure both Sidebar and TopBar share the same derived contamination alert boolean based on `contaminationFlags` (unflagged => severity === 'high').
- [ ] Verify by running `npm run lint`.
- [ ] Verify by running `npm run dev` and checking desktop + mobile behaviors.

