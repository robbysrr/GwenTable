# GwenTable SRD 5.2.1 hazard integration candidate v3

Private, standalone, dependency-free Node ES module. This ZIP is not a full website and not a patch against a known commit. Run `node --test test/*.test.mjs` from the extracted directory. See PROJECT_STATE.md and INTEGRATION.md.

Source: https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf (printed pp. 178, 181, 182, 185, 189). Rule calculations are adapted into original executable code and test fixtures.

This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

v2 includes the `src/survival.mjs` daily survival reducer, with source-specific Exhaustion and shared suffocation helper integration. The original `src/hazards.mjs` remains unchanged. See adapter contract for the exact limitations.

v3 extends v2 without changing either existing rule module. `src/survival-session.mjs` adds a synthetic integration seam and an in-memory fixture transaction store. See INTEGRATION.md for trusted-host boundaries, limitations, actual integration requirements and the proposed view model. Do not use as a production authorization or persistence implementation.
