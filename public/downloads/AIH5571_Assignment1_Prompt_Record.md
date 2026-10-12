# AIH5571 — Individual Assignment 1: Prompt Record

**Project:** Build Your Website — Introduce Yourself  
**Student:** LI YIXUAN (李怡璇)  
**AI tool:** Arena AI Agent Mode  
**Format:** Markdown  
**Date prepared:** 12 October 2026

## Record note

The portfolio site was developed through earlier conversations and already existed at the student’s GitHub Pages address. This is a concise reconstruction of the prompt/refinement process, not a verbatim transcript. Only text marked **Exact user wording** is quoted verbatim; earlier prompts whose full transcript is not available are explicitly marked as paraphrases. AI implementation plans are labelled separately from user prompts.

## Prompt and refinement log

| Stage and source | Prompt / instruction | Refinement and result |
|---|---|---|
| 1 — User’s original portfolio brief, paraphrased | Adapt the existing portfolio using the supplied personal materials. Retain its locker-based visual concept, Chinese–English mix and the original creator’s credit. | The existing portfolio and its real work samples became the content and visual source rather than a new generic self-introduction template. |
| 2 — User’s factual corrections, consolidated | Use the English name exactly as `LI YIXUAN`; retain the attribution to momo; do not invent gender or current city; keep personal claims grounded in the supplied materials. | The portfolio’s name, biography and credit were kept within those boundaries. Unsupported personal details were omitted. |
| 3 — Assignment brief from the user | **Exact user wording:** “按照这个准备文件”. The supplied specification requires (A) a one-page `index.html`, with CSS and JavaScript in that file, or a ZIP containing the HTML and its assets; and (B) a separate prompt record in Markdown, DOCX or PDF. | The assignment format was treated as a packaging requirement, not a request to replace the student’s current portfolio with unrelated content. |
| 4 — User’s correction after the first draft | **Exact user wording:** “但是这个index.html根本不能打开我现在的这个网页呀” (“But this index.html cannot open my current webpage at all.”), followed by the current GitHub Pages URL: `https://xuanleeeeeeee-lyx.github.io/locker-folio/`. | This clarified that the website deliverable must correspond to the student’s actual published portfolio. The earlier simplified page was not the right website for the submission and was replaced by a package built from the current portfolio source. |
| 5 — AI implementation plan, derived from the brief (not a direct user quote) | Bundle the existing portfolio into a self-contained assignment deliverable: keep the page’s content and interactions, put compiled CSS and JavaScript inside `index.html`, make image paths relative, and include the local assets. | The current site was built as a single HTML entry with inline CSS/JavaScript and a local `assets/` folder, so the extracted page no longer points at Vite source files or requires a build step. |
| 6 — Offline and attribution refinement | Avoid external CSS/JavaScript/font-CDN dependencies where practical; keep creator attribution and use the site’s existing images and information. | The Latin display/UI fonts used by the page were included locally with their font licences; Chinese text uses local system-font fallbacks. The original PDFs are not included. |

## Verification performed

- Built the page from the source corresponding to the current GitHub Pages portfolio, not from the unrelated one-page draft.
- Confirmed `index.html` contains the page CSS and JavaScript inline; it does not load an external stylesheet or script bundle.
- Rewrote public image references to relative paths and included the referenced site assets in the ZIP.
- Included locally used font files and their licences; removed the remote Google Fonts stylesheet dependency.
- Kept the published portfolio content, `LI YIXUAN` name, and momo attribution. No source CV or portfolio PDF is bundled.

## Reflection: responsible and effective use of generative AI

Generative AI helped inspect the assignment requirements, convert the existing multi-file portfolio build into a single-HTML deliverable, and check that the HTML, CSS, JavaScript and local asset paths were packaged together. The user’s correction was an important part of the iteration: the first standalone draft did not reproduce the website the student actually wanted to submit, so the source was corrected to the current published portfolio rather than treating the draft as finished.

AI was used as a coding and packaging assistant, not as a source of personal facts. The existing portfolio content and project images were retained, the requested name and factual limits were followed, and the original visual-concept credit to momo remains. The original CV and portfolio PDFs were excluded. Local fonts were included with licences, and Chinese typography falls back to fonts available on the reviewer’s device.

The student should still extract and test the ZIP in a browser, verify all personal details and external links, and confirm that included images are appropriate for submission. The student remains responsible for reviewing and submitting the final work; AI assistance does not replace that judgement.
