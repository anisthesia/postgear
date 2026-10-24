# postgear design system

Dense, keyboard-first, dark-leaning. Dark is the default theme; light must still work.
Tokens live in `src/app/colors.scss` (values) and `tailwind.config.cjs` (class names).
Screens are restyled in later sprints; this document describes the token layer only.

## Principles

1. **Density over whitespace.** 13px base text, 4px spacing grid, compact rows.
2. **Keyboard first.** Every nav target reachable from a command palette, visible shortcut hints, a visible focus ring (`--new-focus`) on keyboard focus.
3. **Minimal chrome.** 1px low-alpha borders, one subtle shadow, no gradients, no promo banners.
4. **One accent.** Amber is used only for primary actions, focus and selected state. Everything else is neutral.
5. **Semantic tokens only.** Never use raw hex in components. The legacy `customColorN` / `--color-custom*` tokens are removed.

## Color tokens

Dark and light are defined under `.dark` / `.light` in `colors.scss`. Components always use the Tailwind class, never the CSS variable directly.

| Token (CSS var) | Tailwind class | Role | Dark | Light |
|---|---|---|---|---|
| `--new-bgColor` | `newBgColor` | Page background (surface 1) | `#0b0c0f` | `#f6f7f9` |
| `--new-bgColorInner` | `newBgColorInner` | Cards, panels (surface 2) | `#121317` | `#ffffff` |
| `--new-surface-2` | `newSurface2` | Raised elements, popovers (surface 3) | `#191b21` | `#f0f2f5` |
| `--new-border` | `newBorder` | Default 1px border | white 8% | ink 8% |
| `--new-sep` | `newSep` | Stronger divider, input border | white 10% | ink 12% |
| `--new-bgLineColor` | `newBgLineColor`, `fifth` | Subtle row lines | white 6% | ink 6% |
| `--new-blockSeparator` | `blockSeparator` | Separator between blocks | white 6% | ink 6% |
| `--new-btn-text` | `textColor`, `btnText` | Primary text | white 92% | ink 92% |
| `--new-textColor` | `newTextColor` | Primary text as RGB channels (supports `/ alpha`) | `255 255 255` | `14 14 14` |
| `--new-textItemBlur` | `textItemBlur` | Secondary text, 60% | white 60% | ink 60% |
| `--new-table-text` | `newTableText` | Table/secondary text | white 60% | ink 60% |
| `--new-menu-dots` | `menuDots` | Tertiary text, icons, 40% | white 40% | ink 40% |
| `--new-textItemFocused` | `textItemFocused` | Text of the focused menu item | white 92% | ink 92% |
| `--new-boxFocused` | `boxFocused` | Background of the focused/selected item | white 8% | ink 6% |
| `--new-box-hover` | `boxHover` | Hover background | white 4% | ink 4% |
| `--new-btn-simple` | `btnSimple` | Secondary button background | `#191b21` | `#f0f2f5` |
| `--new-accent` | `accent`, `btnPrimary` | Primary action, selected state | `#f5a524` | `#b45309` |
| `--new-accent-fg` | `accentFg` | Text/icon on top of accent | `#1a1203` | `#ffffff` |
| `--new-focus` | `focus` | Keyboard focus ring | `#f5a524` | `#b45309` |
| `--new-btn-primary` | `btnPrimary` | Alias of `--new-accent` (kept for existing usages) | accent | accent |
| `--new-table-text-focused` | `newTableTextFocused` | Active table header | accent | accent |
| `--new-table-border`, `--new-table-header` | `newTableBorder`, `newTableHeader` | Table lines, header background | white 6%, `#121317` | ink 6%, `#f0f2f5` |
| `--new-settings`, `--new-col-color`, `--new-small-strips`, `--new-big-strips` | `newSettings`, `newColColor`, `bigStrip` | Settings panel, columns, strips | surface 2/3 | surface 2/3 |
| `--new-back-drop`, `--popup-color` | `newBackdrop`, `popup` | Modal backdrop | black / 50% | near-black / 30% |
| `--new-ai-btn` | `ai` | AI action button | `#d82d7e` | `#d82d7e` |
| `--menu-shadow` | `shadow-menu`, `shadow-elevation` | The one elevation shadow | `0 4px 12px` black 40% | `0 4px 12px` ink 12% |

Legacy aliases still defined (`--color-primary`, `--color-secondary`, `--color-third`, `--color-forth`, `--color-seventh`, `--color-gray`, `--color-text`, `--color-input`, `--color-table-border`, `--color-modalCustom`) resolve to the surfaces/accent above. Prefer the `--new-*` names in new code.

Platform preview tokens (`--linkedin-*`, `--facebook-*`, `--instagram-*`, `--tiktok-*`, `--youtube-*`) intentionally mimic each network and are not part of this system.

### Known follow-up

`btnPrimary` is now amber, but many existing buttons pair it with `text-white`. Use `text-accentFg` on accent backgrounds when touching those screens.

## Typography

System UI stack (`font-sans`): `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. No web fonts. Body is 13px with 1.45 line-height.

| Class | Size | Use |
|---|---|---|
| `text-caption` | 11px | Hints, shortcut keys, badges |
| `text-body` | 13px | Default text, rows, inputs |
| `text-subtitle` | 15px | Section titles |
| `text-title` | 20px | Page titles |

## Spacing, radii, elevation

- Spacing follows the Tailwind 4px grid (`p-1` = 4px, `gap-2` = 8px). Prefer multiples of 4.
- Radii: `rounded-control` 4px (inputs, buttons), `rounded-card` 6px (cards, rows), `rounded-panel` 8px (modals, popovers).
- Elevation: a single `shadow-elevation` for floating layers. Everything else is flat and separated by borders.

## Do / don't

Do:
```tsx
<div className="bg-newBgColorInner border border-newBorder rounded-card p-3 text-body">
  <span className="text-textItemBlur text-caption">Scheduled</span>
  <button className="bg-accent text-accentFg rounded-control px-3 py-1">Post</button>
</div>
```

Don't:
```tsx
<div className="bg-[#121317] border-[#333] rounded-[12px] shadow-2xl p-[17px]">
  <span style={{ color: '#999', fontSize: 12 }}>Scheduled</span>
</div>
```

- Don't use raw hex, `customColorN`, gradients or stacked shadows.
- Don't use the accent for decoration; at most one accent element per region.
- Don't hide focus. Keep the `--new-focus` ring on keyboard focus.
- Don't touch the platform preview tokens or `polonto.css`.
