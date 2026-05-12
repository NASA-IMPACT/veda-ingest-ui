# COG Viewer

This document explains the COG Viewer page and the COG drawer workflow used by the dataset renders widget.

## Purpose

The COG Viewer helps users:

- load Cloud Optimized GeoTIFF (COG) metadata,
- preview raster tiles on a map,
- tune rendering options (bands, rescale, colormap, color formula, resampling, nodata),
- copy a valid `renders.dashboard` object for ingest forms.

## Entry Points

- Standalone page: `/cog-viewer`
  - Route component: `app/(pages)/cog-viewer/page.tsx`
  - Client container: `app/(pages)/cog-viewer/_components/CogViewerClient.tsx`
- Drawer integration in dataset forms:
  - Widget: `components/rjsf-components/RendersDashboardWidget.tsx`
  - Drawer: `components/COGViewer/COGDrawerViewer.tsx`

## Backend Dependencies

The viewer uses `VEDA_BACKEND_URL` and calls these raster endpoints:

1. Metadata endpoint
   - `GET /raster/cog/info?url=<encoded-cog-url>`
2. TileJSON endpoint
   - `GET /raster/cog/WebMercatorQuad/tilejson.json?url=<encoded-cog-url>&...rendering-params`
3. Colormap list endpoint
   - `GET /raster/colorMaps`

Related code:

- `hooks/useCOGViewer.ts`
- `components/COGViewer/COGControlsForm.tsx`

## Viewer Flow

1. User enters a COG URL and clicks **Load**.
2. The app fetches metadata from `/raster/cog/info`.
3. Initial rendering state is derived:
   - default bands from `band_descriptions` (up to first 3),
   - optional overrides from existing `renders` input.
4. The app fetches TileJSON from `/raster/cog/WebMercatorQuad/tilejson.json`.
5. The map overlays returned tile URL on top of OSM basemap.
6. If bounds are returned, map auto-fits to COG extent.
7. User modifies controls and clicks **Update Tile Layer** to request a refreshed tile URL.

## Rendering Controls

The controls panel supports:

- Band selectors (RGB for multiband, fixed label for single-band COGs)
- Rescale ranges per band
- Colormap (`Internal` + backend-provided maps)
- Color formula
- Resampling (`nearest`, `bilinear`, `cubic`, `cubic_spline`, `lanczos`, `average`, `mode`, `gauss`, `rms`)
- Nodata value

The **Update Tile Layer** button is enabled only when changes are pending and the viewer is not loading.

## Rendering Options Modal

The **View Rendering Options** modal shows the JSON payload used for dashboard renders and supports copy-to-clipboard.

Modal output conventions:

- Always includes `bidx`
- Includes `rescale` only when complete min/max pairs are present
- Excludes `colormap_name` when value is `Internal`
- Includes `color_formula`, `resampling`, `nodata` when set
- Always appends `assets: ["cog_default"]`

Implementation: `components/COGViewer/RenderingOptionsModal.tsx`

## Renders Widget Integration

`RendersDashboardWidget` integrates the COG drawer into dataset forms:

- Requires `sample_files[0]` in form data to open the drawer
- If missing, shows an inline validation alert
- Accepting options writes generated JSON into `renders.dashboard`

This is the primary authoring path for many dataset `renders.dashboard` values.

## COG Validation in Submit Flows

In create/edit dataset flows, sample COG URL validation runs before submit:

- Endpoint: `GET /raster/cog/validate?strict=false&url=<encoded-url>`
- If validation fails, user sees warning modal and can continue or cancel.

Implementation:

- `hooks/useCogValidation.ts`
- `components/ingestion/CreationFormManager.tsx`
- `components/ingestion/EditFormManager.tsx`

## Error and Loading Behavior

- Empty URL is rejected client-side.
- Metadata and tile fetch failures surface as Ant Design messages.
- A loading overlay is shown while map updates are in progress.
- Map size is invalidated on container resize to prevent display glitches.

## Notes for Contributors

- The page and map components are dynamically imported to avoid SSR issues with Leaflet.
