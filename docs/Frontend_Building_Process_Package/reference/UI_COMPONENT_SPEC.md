# UI Component Spec

Use this as the shared component standard for Caroline's apps. The product can change, but buttons, cards, panels, badges, controls, spacing, and state treatment should feel like one product family.

## Design Tokens

Use these as the default app-family foundation:

```css
:root {
  --bg: #f3f3f1;
  --surface: #f8f8f6;
  --surface-soft: #f5f5f2;
  --surface-raised: #fbfbfa;
  --text: #24282c;
  --text-soft: #3f474f;
  --muted: #747c84;
  --muted-light: #9ba2a9;
  --line: rgba(30, 38, 46, 0.09);
  --accent: #ff6b00;
  --accent-2: #ff8a24;
  --accent-wash: rgba(255, 107, 0, 0.10);
  --success: #3f9462;
  --danger: #ff5a1f;
  --warning: #c99122;
  --radius-panel: 18px;
  --radius-card: 14px;
  --radius-control: 12px;
  --radius-pill: 999px;
}
```

For each app, change only:

```css
--accent;
--accent-2;
--accent-wash;
```

Do not recolor the whole product.

## Typography Roles

Logo/product mark:

```css
font-family: "Bebas Neue", "Anton", "League Gothic", sans-serif;
letter-spacing: 0.02em;
text-transform: uppercase;
```

Editorial headings:

```css
font-family: "Cormorant Garamond", "Playfair Display", "Bodoni 72", "Didot", serif;
font-weight: 500;
letter-spacing: 0.12em;
text-transform: uppercase;
```

UI/body text:

```css
font-family: "Inter", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
```

Operational labels:

```css
font-size: 11px;
font-weight: 700;
letter-spacing: 0.14em;
text-transform: uppercase;
color: var(--muted);
```

## Panel

Use panels for major page sections and large workflow areas.

```css
.ui-panel {
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: var(--radius-panel);
  box-shadow:
    12px 14px 30px rgba(45, 52, 60, 0.10),
    -8px -8px 22px rgba(255, 255, 255, 0.92),
    inset 1px 1px 0 rgba(255, 255, 255, 0.88);
}
```

Rules:

- panels are not nested inside other panels
- panels hold sections, workflows, or grouped data
- panel padding should usually be `20px` to `28px`
- panels should not become decorative containers for marketing copy

## Card

Use cards for repeated items, metrics, tasks, drills, assets, approvals, and compact decision objects.

```css
.ui-card {
  background: var(--surface-raised);
  border: 1px solid rgba(30, 38, 46, 0.08);
  border-radius: var(--radius-card);
  box-shadow:
    7px 8px 18px rgba(45, 52, 60, 0.08),
    -5px -5px 14px rgba(255, 255, 255, 0.86),
    inset 1px 1px 0 rgba(255, 255, 255, 0.72);
}
```

Rules:

- cards answer one job: what is happening, what changed, what needs action, or what to inspect
- cards should not contain other cards
- cards need a clear title, status, and action or reason to exist
- repeated cards should have stable dimensions across desktop and mobile

## Inset Surface

Use inset surfaces for progress tracks, input wells, inactive workflow paths, recessed chart areas, and neutral containers.

```css
.ui-inset {
  background: var(--surface-soft);
  border-radius: var(--radius-control);
  box-shadow:
    inset 5px 5px 10px rgba(45, 52, 60, 0.08),
    inset -5px -5px 10px rgba(255, 255, 255, 0.92);
}
```

## Button System

All buttons should share size, radius, typography, and tactile treatment.

Base:

```css
.ui-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-control);
  padding: 0 16px;
  font: 700 12px/1 var(--font-ui, "Inter", sans-serif);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
}

.ui-button:hover {
  transform: translateY(-1px);
}

.ui-button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent), white 20%);
  outline-offset: 3px;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}
```

Primary:

```css
.ui-button-primary {
  background: linear-gradient(145deg, var(--accent), var(--accent-2));
  color: #fff;
  box-shadow:
    7px 8px 16px rgba(255, 107, 0, 0.18),
    -5px -5px 12px rgba(255, 255, 255, 0.86),
    inset 1px 1px 0 rgba(255, 255, 255, 0.28);
}
```

Secondary:

```css
.ui-button-secondary {
  background: linear-gradient(145deg, #fbfbfa, #ececea);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    6px 7px 14px rgba(45, 52, 60, 0.10),
    -5px -5px 12px rgba(255, 255, 255, 0.96),
    inset 1px 1px 0 rgba(255, 255, 255, 0.90);
}
```

Ghost:

```css
.ui-button-ghost {
  background: transparent;
  color: var(--text-soft);
}

.ui-button-ghost:hover {
  background: var(--accent-wash);
  color: var(--text);
}
```

Icon button:

```css
.ui-icon-button {
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 50%;
}
```

Rules:

- primary buttons are for one main action per surface
- secondary buttons are for filters, settings, export, save, mode changes
- icon buttons use recognizable icons and accessible labels
- avoid long button text
- destructive buttons require clear wording and state

## Chips And Badges

```css
.ui-chip,
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  border-radius: var(--radius-pill);
  padding: 0 12px;
  font: 700 11px/1 var(--font-ui, "Inter", sans-serif);
  color: var(--text-soft);
  background: var(--surface-raised);
  border: 1px solid rgba(30, 38, 46, 0.08);
  box-shadow:
    4px 5px 10px rgba(45, 52, 60, 0.07),
    -4px -4px 10px rgba(255, 255, 255, 0.82);
}

.ui-badge-active {
  color: var(--accent);
  background: var(--accent-wash);
}
```

Rules:

- use chips for tags, claims, filters, levels, and short metadata
- use badges for status and compact counts
- accent only means active or important

## Navigation Item

```css
.ui-nav-item {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: var(--radius-control);
  padding: 0 14px;
  color: var(--muted);
  font: 800 12px/1.1 var(--font-ui, "Inter", sans-serif);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ui-nav-item-active {
  color: var(--accent);
  background: var(--surface-raised);
  box-shadow:
    6px 7px 14px rgba(45, 52, 60, 0.09),
    -5px -5px 12px rgba(255, 255, 255, 0.92);
}
```

Active nav must be obvious through surface, marker, or accent text.

## Progress Track

```css
.ui-progress {
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-soft);
  box-shadow:
    inset 4px 4px 8px rgba(45, 52, 60, 0.10),
    inset -4px -4px 8px rgba(255, 255, 255, 0.92);
  overflow: hidden;
}

.ui-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}
```

## Forms And Inputs

```css
.ui-input {
  min-height: 44px;
  width: 100%;
  border: 1px solid rgba(30, 38, 46, 0.08);
  border-radius: var(--radius-control);
  padding: 0 14px;
  background: var(--surface-soft);
  color: var(--text);
  box-shadow:
    inset 4px 4px 8px rgba(45, 52, 60, 0.07),
    inset -4px -4px 8px rgba(255, 255, 255, 0.90);
}
```

Rules:

- labels are always visible or programmatically associated
- errors are specific and close to the field
- disabled fields explain why when the reason matters

## Status Dot

```css
.ui-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--success), transparent 82%);
}
```

Use a dot plus a factual label. Do not rely on color alone.

## Layout Rhythm

Recommended spacing:

- shell/sidebar gap: `18px`
- panel gap: `18px`
- card gap: `14px` to `18px`
- panel padding: `20px` to `28px`
- card padding: `16px` to `20px`
- compact control height: `36px`
- normal control height: `40px` to `44px`

## App-Family Rule

Every Caroline app can have a different product personality, but the component grammar should stay consistent:

- same tactile button family
- same raised/inset surface logic
- same card rhythm
- same status badge style
- same navigation active state
- same loading/empty/error quality bar

This is the equivalent of an Apple-style UI spec for the app family.
