# Google Drive UI Overhaul + Bilingual (EN/VI) Support

## Background

The current project is a Django-based Google Drive clone with a functional backend (file/folder CRUD, sharing, trash, star, storage) and a single-page frontend using HTML templates + vanilla CSS/JS. The UI currently uses only Vietnamese text hardcoded throughout. The goal is to:

1. **Redesign the UI** to closely match the real Google Drive (https://drive.google.com) experience — its exact layout, colors, spacing, rounded corners, Material Design 3, sidebar pill navigation, search bar, workspace with tinted background, etc.
2. **Add bilingual language toggle** (English / Vietnamese) that persists in `localStorage` and can be switched from both the dashboard and auth pages.

---

## Current Codebase Summary

| File | Purpose | Size |
|------|---------|------|
| [models.py](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/models.py) | Folder & File Django models | 64 lines |
| [views.py](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/views.py) | Auth views + JSON API endpoints | 484 lines |
| [urls.py](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/urls.py) | URL routing | 30 lines |
| [base.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/base.html) | Base template (fonts, icons, CSS) | 32 lines |
| [dashboard.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/dashboard.html) | Main SPA dashboard | 337 lines |
| [login.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/login.html) | Login page | 47 lines |
| [signup.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/signup.html) | Signup page | 57 lines |
| [styles.css](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/static/drive/css/styles.css) | All CSS styles | 1271 lines |
| [app.js](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/static/drive/js/app.js) | SPA controller JS | 1235 lines |
| [tests.py](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/tests.py) | Unit tests | 167 lines |

---

## Proposed Changes

### 1. Internationalization (i18n) System

#### [NEW] [i18n.js](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/static/drive/js/i18n.js)

A standalone i18n module containing:
- Complete translation dictionaries for `en` and `vi`
- `getCurrentLang()` / `setLang(lang)` helpers using `localStorage`
- `t(key)` translation function for JS-side strings
- `applyTranslations()` to update all DOM elements with `data-i18n` attributes
- Covers all UI text: sidebar nav, breadcrumbs, modals, context menu, empty states, upload widget, auth pages, tooltips, etc.

### 2. Template Overhaul

#### [MODIFY] [base.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/base.html)

- Add `<html lang>` dynamic attribute
- Add Google Product Sans font (or use "Google Sans" fallback with Outfit)
- Include `i18n.js` before `app.js`
- Add `data-i18n` attributes to translatable elements

#### [MODIFY] [dashboard.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/dashboard.html)

Major redesign to match Google Drive's exact layout:
- **Header**: Hamburger menu icon (optional), Google Drive logo + "Drive" text, pill-shaped search bar with light gray (#f1f3f4) background, settings/help icons, language toggle dropdown, user avatar dropdown
- **Sidebar**: "New" button with `+` icon and raised shadow, navigation links with rounded-pill shapes and active blue tint (`#c2e7ff`), storage meter at bottom
- **Workspace**: Light tinted background (`#f8f9fa`) with rounded top-left corner, breadcrumb bar, grid/list toggle, "Suggested" and "Files" sections
- **Language toggle**: A dropdown/button in the header with 🌐 icon to switch EN/VI
- Add `data-i18n` and `data-i18n-placeholder` attributes on all text elements

#### [MODIFY] [login.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/login.html)

- Redesign to closely match Google's sign-in page style
- Centered card with Google/Drive logo, floating label inputs, step progression feel
- Add language toggle button in the bottom-left corner (like Google does)
- Add `data-i18n` attributes

#### [MODIFY] [signup.html](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/templates/drive/signup.html)

- Same design language as login page
- Add language toggle and `data-i18n` attributes

---

### 3. Complete CSS Redesign

#### [MODIFY] [styles.css](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/static/drive/css/styles.css)

Full rewrite to match Google Drive's Material Design 3 aesthetics:

**Color Palette** (exact Google Drive tokens):
- Primary: `#0b57d0` (Blue)
- Surface/Active: `#c2e7ff` (Light blue sidebar active)
- Background Main: `#f8f9fa` (Workspace tinted bg)
- Background White: `#ffffff` (Cards, sidebar)
- Border: `#e0e3e7`
- Text Primary: `#1f1f1f`
- Text Secondary: `#5f6368`
- Accent Success: `#0f9d58`
- Accent Warning: `#f29900`

**Layout refinements**:
- Header: 64px height, no bottom border (Google Drive uses shadow-less header)
- Search bar: pill-shaped `#edf2fc` bg, elevation on focus
- Sidebar: 256px width, pill-shaped nav items, proper spacing
- Workspace: `border-top-left-radius: 16px`, `background: #f8f9fa`, scrollable inner area
- File grid items: rounded cards with preview area + footer
- Folder items: rounded cards with folder icon, name truncation
- List view: clean table with Google Drive-style column headers (Name, Owner, Last modified, File size)
- Context menu: Material Design 3 popup with rounded corners and shadow
- Modals: Centered overlay with Material 3 card design
- Upload widget: Docked bottom-right panel with dark header

**New additions**:
- Language toggle button styles (globe icon dropdown)
- Smooth micro-animations for hover states, focus rings, modal enter/exit
- File type color coding for icons (PDF red, image green, zip purple, etc.)
- Image thumbnail preview in grid view
- Responsive sidebar collapse for smaller screens

---

### 4. JavaScript Overhaul

#### [MODIFY] [app.js](file:///Users/manhdx/Documents/04.AiCode/Learn01/drive/static/drive/js/app.js)

- Import and use `i18n.js` for all dynamic text rendering
- Replace all hardcoded Vietnamese strings with `t('key')` calls
- Add language toggle handler in header
- Ensure `applyTranslations()` is called on page load and after language switch
- Update `renderBreadcrumbs()`, `renderContents()`, empty state messages, upload widget, etc. to use `t()` function
- Add language toggle event binding

---

### 5. Backend — No Changes Required

The backend (views.py, models.py, urls.py, settings.py) requires **no changes**. All i18n is handled client-side. The Django error messages in views.py are only returned as JSON API responses and will be mapped client-side.

---

## Open Questions

> [!IMPORTANT]
> **File preview behavior**: Google Drive opens a file preview panel on single-click. Should I implement a detail/preview panel on the right side, or keep the current behavior (single-click selects, double-click downloads/opens)?

> [!NOTE]
> **Default language**: The current app uses Vietnamese. Should the default language for new users (no localStorage preference) be Vietnamese or English?

---

## Verification Plan

### Automated Tests
- Run existing Django tests: `python manage.py test drive` — must all pass (backend is unchanged)
- Manual browser testing of both languages

### Manual Verification
- Start dev server: `python manage.py runserver`
- Test login/signup pages in both EN and VI
- Test dashboard: navigate folders, upload files, right-click context menu, star/trash/rename/share
- Toggle language and verify all UI elements update instantly
- Test grid view and list view
- Test drag-and-drop upload
- Test responsive behavior
- Verify breadcrumbs, empty states, and modals display correctly in both languages
