# Project Version Snapshots Log

| Timestamp | ID / Folder | Label / Description | Files Captured |
|---|---|---|---|
| 2026-08-09 11:03:13 | `20260809_110313_npv3-cad-viewer-reverted-working` | npv3-cad-viewer-reverted-working | `project-artifact.js, clippard.html` |
| 2026-08-09 17:00:01 | `20260809_170001_npv3-restored-original-working-state` | npv3-restored-original-working-state | `project-artifact.js, clippard.html` |
| 2026-08-09 17:03:02 | `20260809_170302_npv3-restored-confirmed-milestone` | npv3-restored-confirmed-milestone | `project-artifact.js, clippard.html` |
| 2026-08-09 17:16:24 | `20260809_171624_npv7-tuner-tuned-working-state` | npv7-tuner-tuned-working-state | `project-artifact.js, clippard.html` |
| 2026-08-09 17:21:07 | `20260809_172107_npv3-gasket-z-fighting-fixed-milestone` | npv3-gasket-z-fighting-fixed-milestone | `project-artifact.js, clippard.html` |
| 2026-08-18 21:11:46 | `20260818_211146_pg_case_study_complete_milestone` | pg_case_study_complete_milestone | `project-artifact.js, main.css, clippard.html, pg.html` |
| 2026-08-28 08:30:16 | `20260828_083016_needfinding_funnel_completed` | needfinding_funnel_completed | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-13 10:48:03 | `20260913_104803_fix_cad_viewer_esm_relative_imports` | fix_cad_viewer_esm_relative_imports | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-13 13:14:42 | `20260913_131442_github_pages_fully_working_milestone` | github_pages_fully_working_milestone | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

### Milestone Log Details:
- **`20260913_131442_github_pages_fully_working_milestone`**:
  - **CAD Viewer**: Replaced bare ES module specifiers with direct relative paths (`three.module.js`, `GLTFLoader.js`, `BufferGeometryUtils.js`) and added `.nojekyll`, enabling full 3D interactive viewer initialization on GitHub Pages / live web hosting.
  - **Asset Optimization**: Compressed heavy raw camera files (34MB `prototype blurred.jpg` & 32MB `prototype2 blurred.jpg` &rarr; ~400KB), resolving GitHub upload rejections and speeding up page load times.
  - **Hero Sticky Notes Image**: Fixed ampersand/URL-encoding collision by establishing clean `images/hero-sticky-notes.jpg`.
  - **Film Photography Gallery**: Corrected Linux/GitHub casing (`images/film photos/web/`) across `index.html`, `photography.html`, and `main.js`, verifying 50/50 live image loads (200 OK).
  - **Experience Timeline**: Converted Klein Tools node from an active link to an interactive `<div>` with persistent tooltip to keep unreleased project pages unlinked.
  - **Publish Synchronization**: Fully synchronized production-ready build to `Michel-Website-Publish`.
- **`20260913_104803_fix_cad_viewer_esm_relative_imports`**:
  - Replaced bare ES module specifiers (`"three"`, `"three/addons/..."`) with standard relative imports (`"./vendor/three/three.module.js"`, `"../../three.module.js"`).
  - Eliminated dependency on `<script type="importmap">`, ensuring universal compatibility across GitHub Pages, live hosting, Safari, and mobile webviews.
  - Added `.nojekyll` file to prevent GitHub Pages Jekyll processing from ignoring vendor directories or altering asset delivery.
  - Synchronized complete build to `Michel-Website-Publish`.
- **`20260809_170001_npv3-restored-original-working-state`**:
  - Restored 1,604-line working `assets/js/project-artifact.js` from earlier today's conversation (`95f862ff-3204-4f8a-ab0a-1cd08f85a115`).
  - Restored `npv3-panel` attributes in `projects/clippard.html` (`edge-threshold="14.70"`, `lower-edge-threshold="15.00"`, `display-scale="1.45"`).
  - Removed experimental NPV3 tuner overlay and vertical seam filters.
  - Script version updated to `?v=172`.
- **`20260809_170302_npv3-restored-confirmed-milestone`**:
  - Restored 1,604-line working `assets/js/project-artifact.js` from earlier today's conversation (`95f862ff-3204-4f8a-ab0a-1cd08f85a115`).
  - Restored `npv3-panel` attributes in `projects/clippard.html` (`edge-threshold="14.70"`, `lower-edge-threshold="15.00"`, `display-scale="1.45"`).
  - Cleaned up experimental tuner overlay logic and vertical seam filters.
  - Script version updated to `?v=172`.
  - Confirmed working state checkpoint established.
- **`20260809_171624_npv7-tuner-tuned-working-state`**:
  - Saved user's tuned parameters for NPV7 (`edge-threshold="16.00"`, `lower-edge-threshold="12.00"`, `lower-edge-fraction="0.50"`).
  - WebGL depth bias adjusted to `0.009` and polygon offset factor to `3` to reveal lower mouth rim contour lines.
  - Verified syntax depth 0.
- **`20260809_172107_npv3-gasket-z-fighting-fixed-milestone`**:
  - Restored main body `polygonOffsetFactor: 8` and `polygonOffsetUnits: 8` on `fillMat` in `assets/js/project-artifact.js`.
  - Completely eliminated white z-fighting artifacts on NPV3 red gasket highlighted surface.
  - Script version updated to `?v=175`.
- **`20260818_211146_pg_case_study_complete_milestone`**:
  - Fully structured and polished Procter & Gamble case study in `projects/pg.html` following Brennan Chiu's portfolio layout aesthetic.
  - **Header & Title**: Re-aligned title `"Innovative Packaging Design"` and subtitle `"Designed for: Procter and Gamble"`.
  - **Staggered Showcase**: Added wide breakout `.project-img-stagger` featuring `csv1 blurred.jpg` and `csv5 blurred.jpg` (`min(94vw, 1540px)`).
  - **User Research**: Split narrative and `analysis2 blurred.jpg` image showcase with updated subconscious behavior copy.
  - **Ideation & Seamless Banner**: Left-aligned `.project-banner-intro` (`"Ideation."`) and full-bleed seamless sketch banner (`sketchbanner.jpg`) with multiply blend mode and expanded vertical whitespace.
  - **Rapid Prototyping**: 3-image mosaic (`prototype blurred.jpg`, `laser.jpg`, `prototype2 blurred.jpg`) with updated desirability/feasibility tension narrative.
  - **Delivery**: Asymmetric layout (`.project-section--delivery`) locking the left margin to the standard grid while expanding `Final_blurred.jpg` to the wide right margin; polished bulleted list with tight inter-item spacing and matched paragraph separation.
  - Updated `assets/css/main.css` and added version cache-busting `?v=3`.
- **`20260828_083016_needfinding_funnel_completed`**:
  - **Portfolio Intro & Copy**: Set up `projects/needfinding.html` with clinical environment branding, header banner, and approved copy for the Northwestern Medicine EAC needfinding project.
  - **Funnel Artwork & Geometry**: Built custom SVG vector funnel diagram (*"Where Patients are Lost"*) with 4 stages (Pink 100%, Purple 50%, Blue 17%, Green 7%), centered vertically stacked right compartments (crowd, doctor, link, calendar icons with clean text labels), and drop-off callout bubbles.
  - **Left Trajectory Flow**: Added 4 distinct curved arrow segments along the left slope with clean gaps between stages and sharp downward-pointing arrowheads.
  - **Scroll-Position Driven Reveal**: Configured per-tier vertical trigger lines in `assets/js/main.js` so each stage pops in piece-by-piece when the user scrolls it ~32% up from the bottom of the viewport, with speed tied to the user's scroll.
  - **Centering & Polish**: Positioned the central vertical axis of the funnel at the exact 50% midpoint of the page, removed all hover animations, and verified clean syntax across all files.
| 2026-08-29 12:27:59 | `20260829_122759_needfinding_3stage_matrix_complete` | needfinding_3stage_matrix_complete | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260829_122759_needfinding_3stage_matrix_complete`**:
  - **Clinical Responsibility Matrix Grid**: Built responsive full-width vector matrix with 8 clinic roles, 17 task columns across 3 clinical phases (7 Pre-Visit blue, 7 During Visit green, 3 Post-Visit tan), angled leaders, and rotated text headers.
  - **Sticky-Scroll Architecture & Viewport Balance**: Implemented `280vh` scroll runway with `100vh` flexbox viewport centering in `assets/css/main.css` and scroll-driven state manager in `assets/js/main.js`.
  - **Stage 0 (Full Matrix)**: Centered presentation of all roles, columns, and markers.
  - **Stage 1 (Context Switching)**: Isolates APP and Fellow rows, draws red gap connecting lines across fragmented tasks, and fades in the frosted glass "Context Switching" narrative card.
  - **Stage 2 (Lack of Ownership)**: Transitions active roles to APP and Attending Physician, highlights the `Perform Procedure` column with a yellow background overlay, and fades in the compact frosted "Lack of Ownership" card.
  - **Sticky Section Title**: Embedded `"Responsibilities Matrix – Who Owns What"` pinned above the chart with trimmed SVG viewport padding, keeping all text, matrix cells, and bottom phase labels completely visible on all screen sizes.
  - **Marker Alignment & Role Calibration**: Matched all dot types (solid dark purple, solid light purple, hollow dark ring, hollow light ring) to project slides across APP, Fellow, and Attending Physician.
| 2026-08-29 13:16:20 | `20260829_131620_needfinding_page_fully_completed` | needfinding_page_fully_completed | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260829_131620_needfinding_page_fully_completed`**:
  - **Interactive Opportunity Landscape Matrix**: Added dynamic hover and keyboard focus tooltips across all 11 numbered opportunity bubbles with smooth purple outline highlight, white card fill, dark gray text, and directional pointer arrow.
  - **Top-Layer Tooltips Stacking**: Positioned all tooltip cards in a top-level SVG layer (`<g class="matrix-tooltips-layer">`) preventing clipping or overlap under other bubbles.
  - **Concluding Two-Column Section ("Closing the Loop")**: Added responsive two-column grid below the responsibility matrix pairing narrative summary copy with an embedded presentation team photo (`needfinding-presentation.jpg`) tuned with 5:4 aspect ratio framing and vertical centering.
| 2026-08-31 20:15:26 | `20260831_201526_clippard_wikipedia_sidebar_and_card_perf_milestone` | clippard_wikipedia_sidebar_and_card_perf_milestone | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260831_201526_clippard_wikipedia_sidebar_and_card_perf_milestone`**:
  - **Wikipedia-Style Left-Rail Navigation (`clippard.html`)**: Transformed the floating box TOC into a clean, permanent 2-column document layout with a vertical dividing border and responsive mobile fallback.
  - **Scrollspy Precision Tuning**: Replaced `offsetTop` with real-time `getBoundingClientRect` viewport measurements, triggering section transitions only when headings scroll ~25% from the top of the viewport.
  - **Clippard Case Study Restructuring & Copy Polishing**:
    - Updated intro paragraph, Section 01 body copy, and placed the machinist narrative takeaway directly inside the left-justified KEY FEATURES header.
    - Replaced the NPV7 3D viewer and tuner with a clean two-column failure reproduction resolution block.
    - Updated Section 03 ("Oxygen Mixing Blender for Neonatal Ventilator") copy and added the benchmarking two-column follow-up section.
  - **3D CAD Scroll Progress & Card Trigger Calibration**: Added dynamic header-height offset in `assets/js/project-artifact.js` so CAD yaw rotation and callout card triggers activate with precision; shifted Cards 02 and 03 triggers earlier by 0.05.
  - **Homepage Performance & Hover Optimization (`index.html`)**:
    - Diagnosed and resolved browser freezing on project card hover caused by 48MB (98.6 MP) uncompressed image textures.
    - Resized and optimized title cards (P&G and Shellphone) down to Retina 1600px, reducing file sizes and GPU VRAM footprint by 99% (from 600+ MB to <5 MB).
    - Added hardware acceleration (`will-change: transform; transform: translateZ(0);`) to eliminate hover lag completely.

| 2026-08-31 21:05:05 | `20260831_210505_experience_timeline_milestone` | experience_timeline_milestone | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260831_210505_experience_timeline_milestone`**:
  - **Homepage Introduction Card Copy Update (`index.html`)**:
    - Updated copy to: *"I'm a Mechanical Engineer who combines **rigorous hands-on product development** with a **human-centered approach** to create meaningful products that solve real pain points. I've contributed to the release of products for the biomedical industry to professional tools and am look for opportunities that put at the front end of innovation."*
  - **Interactive Chronological Experience Timeline Architecture**:
    - Designed and implemented a single continuous horizontal timeline axis with alternating staggered milestone nodes (Top / Bottom) replacing the previous experience cards.
    - Added 7 milestone entries: **Notre Dame BS Mech Eng**, **Yaskawa Motoman Intern**, **Clippard NPD Engineer**, **Northwestern MS EDI**, **P&G Sponsored Design Project**, **Needfinding in Medical Environments**, and **Klein Tools Product Design Intern**.
  - **Focus + Context Non-Linear Spatial Scale**:
    - Scaled earlier years (`2019 — 2023`) to occupy `35%` of the timeline width.
    - Compressed the middle Clippard section (`2023 — 2025`) by 50% (`17%` width from `35%` to `52%`).
    - Allocated `48%` of the total timeline width to `2025 — Present` for generous breathing room across recent graduate, clinical, and corporate milestones.
  - **Dynamic Axis Duration Highlight**:
    - Hovering each milestone illuminates its exact duration span on the axis line with a glowing emerald bar (`#10b981`).
    - Removed floating black date pills to prevent any overlap with leader stems, ticks, or text.
  - **Centering, Alignment, and Clearance Calibration**:
    - **Notre Dame**: Centered directly over `2021` at `17%` (highlight `0%` to `35%`).
    - **Yaskawa**: Centered at `30%` (highlight `27%` to `33%`).
    - **Clippard**: Centered over `2024` at `43.5%` (highlight `35%` to `52%`).
    - **Northwestern MS EDI**: Positioned at `66%` (highlight `66%` to `100%`).
    - **P&G Sponsored Project**: Positioned at `71.5%` (highlight `67%` to `76%`).
    - **Needfinding**: Positioned at `81%` (highlight `77%` to `85%`).
    - **Klein Tools**: Positioned at `94%` (highlight `88%` to `100%`).
    - Added `120px` right-hand container buffer so the centered popover card for Klein Tools floats cleanly with zero edge clipping.
  - **Choreographed Scroll-Triggered Intro Animation**:
    - Integrated `IntersectionObserver` on `.timeline-section` that triggers an entrance sequence:
      1. Central axis line expands left-to-right (`0ms` to `650ms`).
      2. 9 year tick marks pop up in a wave (`200ms` to `520ms`).
      3. 7 experience nodes pop into place sequentially from left to right (`480ms` to `1200ms`).
      4. Fully compliant with `prefers-reduced-motion: reduce`.

| 2026-09-07 18:47:29 | `20260907_184729_experience_timeline_milestone_boundaries_and_animation` | experience_timeline_milestone_boundaries_and_animation | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260907_184729_experience_timeline_milestone_boundaries_and_animation`**:
  - **Timeline Structural Reorganization**:
    - Reorganized timeline layout into Bottom Foundation Eras (Notre Dame BS, Clippard NPD, MS EDI) and Top Milestone Projects (Yaskawa, P&G Project, Clinical Needfinding, Klein Tools).
    - Added duration span brackets below the year axis for bottom eras with hover-only emerald green glow.
    - Updated MS EDI title to display cleanly on a single line.
  - **Boundary Calibration & Centering**:
    - Clippard: Span `31%` to `58%` (width `27%`), centered at `44.5%`.
    - MS EDI: Span `58%` to `100%` (width `42%`), centered at `79%`.
    - P&G Sponsored Project: Span `58%` to `67%` (width `9%`), centered at `62.5%`.
    - Clinical Needfinding: Span `71%` to `85%` (width `14%`), centered at `78%`.
    - Klein Tools: Span `85%` to `100%` (width `15%`), centered at `92.5%`.
    - Notre Dame: Span `0%` to `31%` (width `31%`), centered at `15.5%`.
    - Yaskawa: Hidden for now (`display: none; hidden`) while preserving complete code structure.
  - **Copy & Label Polish**:
    - Changed organization for Yaskawa to `Yaskawa` and removed `(Semistar Gekko)` from tooltip text.
    - Updated Notre Dame subtitle tag to `Bachelors Degree`.
    - Updated P&G and Clinical Needfinding subtitle tags to `Academic Project`.
    - Updated Clinical Needfinding organization to `Northwestern University`.
    - Updated Klein Tools subtitle tag to `Internship`.
    - Standardized tooltip tag colors to clean slate gray (`#64748b`).
  - **Cinematic Pacing & Animation Sequencing**:
    - Extended axis line draw duration to `1400ms` with smooth cubic-bezier easing.
    - Staggered year ticks from `200ms` to `1350ms` following the line draw.
    - Choreographed 2-phase node entrance: bottom 3 foundation eras (`800ms`, `1200ms`, `1600ms`), followed by top milestones left-to-right (`2050ms`, `2450ms`, `2850ms`, `3250ms`).
    - Tuned individual node pop-in duration to a crisp `450ms opacity / 480ms transform`.
  - **Layout & Clearance Fixes**:
    - Expanded `.timeline-container` bottom padding to `12rem` and stage height to `320px`, completely eliminating tooltip clipping on bottom cards.
    - Added explicit node classes `.timeline-node--1` through `.timeline-node--7` to eliminate `:nth-of-type` selector interference.


| 2026-09-07 18:49:25 | `20260907_184925_yaskawa_restored_accordion_hidden` | yaskawa_restored_accordion_hidden | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260907_184925_yaskawa_restored_accordion_hidden`**:
  - Restored Yaskawa experience node (`.timeline-node--4`) to full visibility on the interactive timeline.
  - Hidden the redundant lower accordion `<section class="experience" id="experience">` using `display: none;` and `hidden` attributes, preserving all markup and content in `index.html`.

| 2026-09-13 09:55:44 | `20260913_095544_github_publish_ready` | github_publish_ready | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260913_095544_github_publish_ready`**:
  - **NPV7 Beta Unit Mind Map Animation**:
    - Converted the failure reproduction Mind Map visual into a responsive vector diagram with blank-to-reveal scroll animation (Center &rarr; Primary Arrows &rarr; Categories &rarr; Secondary Arrows &rarr; Leaf nodes).
    - Updated narrative copy to describe reproducing the client's failure through exact test fixtures, circuit matching, and final material resolution.
  - **Oxygen Mixing Blender Pneumatic Circuit Diagram**:
    - Created a 3-phase automated looping pneumatic circuit diagram with compact dimensions (~44% height reduction, `viewBox="-90 140 2300 1790"`) that fits comfortably within a single screen alongside the text.
    - Animated fluid flow paths: Phase 1 (Air only &rarr; alarm bypass active), Phase 2 (Both Air + O₂ normal mixing), Phase 3 (Oxygen only &rarr; alarm bypass active).
    - Centered and scaled all component titles, funnel labels, and alarm indicator with high contrast.
  - **Dräger Medical Unit Image Polish**:
    - Replaced the image with a clean alpha-transparent cutout (`images/drager.png`), eliminating all faint rectangular borders and background discoloration.
    - Added `.project-section__img--drager` styling to constrain height (`clamp(260px, 35vh, 350px)`) and blend gracefully.
  - **Work Grid Coming Soon Cards**:
    - Changed Klein Tools, Cairn, and Shellphone project cards in `index.html` from links to non-clickable cards with `COMING SOON` displayed on hover.
  - **Project Pager Clean Loop**:
    - Linked the three published case studies (Clippard &harr; Needfinding &harr; Procter & Gamble) in a circular navigation pager.
  - **GitHub Publishing Package Export**:
    - Created a standalone publishing package in `Michel-Website-Publish` containing production assets, `.nojekyll`, and a deployment README.
| 2026-09-13 10:01:17 | `20260913_100117_coming_soon_centered_bw_hover` | coming_soon_centered_bw_hover | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260913_100117_coming_soon_centered_bw_hover`**:
  - **Restored Project Metadata**: Restored full titles, subtitles, company names, and tags for Klein Tools, Cairn, and Shellphone in `index.html`.
  - **Centered Coming Soon Badge**: Added `.project-card__badge-center` positioned at the exact vertical and horizontal center (`top: 50%; left: 50%; transform: translate(-50%, -50%)`) of the card that fades and scales smoothly into view on hover/focus.
  - **Black & White Image Transition on Hover**: Configured `.project-card--coming-soon:hover > img` with smooth `filter: grayscale(100%) contrast(1.05)` and subtle scale transition.
  - **Production Export Synced**: Updated the standalone deployment package in `Michel-Website-Publish`.
| 2026-09-13 10:48:03 | `20260913_104803_fix_cad_viewer_esm_relative_imports` | fix_cad_viewer_esm_relative_imports | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-13 11:02:24 | `20260913_110224_fix_hero_sticky_notes_image_path` | fix_hero_sticky_notes_image_path | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-13 13:00:59 | `20260913_130059_fix_film_photos_lowercase_casing` | fix_film_photos_lowercase_casing | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-13 13:03:54 | `20260913_130354_klein_timeline_node_non_clickable` | klein_timeline_node_non_clickable | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-13 13:14:42 | `20260913_131442_github_pages_fully_working_milestone` | github_pages_fully_working_milestone | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |
| 2026-09-21 20:27:39 | `20260921_202739_mobile_polish_timeline_cad_matrix_and_photo_fixes_milestone` | mobile_polish_timeline_cad_matrix_and_photo_fixes_milestone | `project-artifact.js, main.js, main.css, clippard.html, pg.html, needfinding.html, index.html` |

- **`20260921_202739_mobile_polish_timeline_cad_matrix_and_photo_fixes_milestone`**:
  - **Experience Timeline Mobile Overhaul**:
    - Converted timeline to a vertical mobile layout (`@media (max-width: 768px)`) with central axis, left-side foundation eras, and right-side project milestones.
    - Removed idle green highlights running down the timeline by enforcing `opacity: 0` at rest on `.timeline-bracket` and `.timeline-axis__highlight`, illuminating only on active selection.
    - Split long titles across two lines (`New Product Development<br />Engineer` and `MS, Engineering Design<br />Innovation`).
    - Implemented strictly mobile-only double-tap navigation (single tap activates card & reveals tooltip; double-tap navigates to project page) while maintaining immediate single-click navigation on desktop.
    - Sized tooltip bubbles to fit within left/right column margins without overflowing screen edges or covering the central axis.
    - Positioned P&G tooltip above the title on mobile and added tap-anywhere-outside dismissal.
  - **Clippard CAD Viewer & Project Hero**:
    - Adjusted mobile CAD viewer container height to stretch and match Key Feature card height.
    - Configured uncropped `.project-hero__img--contain` banner aspect ratio for full-width presentation.
  - **Needfinding Responsibilities Matrix & Funnel**:
    - Fixed Safari sticky scroll behavior on the responsibilities matrix and positioned narrative cards underneath the matrix chart on mobile.
    - Added responsive dynamic viewBox switching for the leaky funnel SVG (cropped `240 40 1220 650` on mobile, original `0 0 1500 730` on desktop).
  - **Film Photography Gallery Safari Fix**:
    - Rebuilt gallery item structure to eliminate flexbox height calculation ambiguity in WebKit grid tiles (`aspect-ratio: 1 / 1` on figure, 100% width/height on img, `decoding="async"`).
    - Isolated 3D push physics to desktop hover devices only.
  - **Asset Cache Busting**:
    - Bumped all production asset links to `?v=253`.
