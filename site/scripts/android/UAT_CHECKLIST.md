# GwenTable Integration 14 — Android UAT checklist

Record for each: phone model, Android version, Chrome version, result (Pass/Fail/Blocked), notes or screenshot.

| ID | Steps | Expected |
|---|---|---|
| A-01 | Start server, open http://127.0.0.1:42639/ | Overview loads; no error banner |
| A-02 | Tap the gear (top right) → Theme Dark; reload | Dark theme stays after reload |
| A-03 | Builder → Random character → Fighter 5 → Generate; tap Next until Appearance; Finish; Save | Play sheet opens with Level 5 Fighter |
| A-04 | Health: enter 5, Damage; reload page | HP down by 5 after reload |
| A-05 | Undo | HP back to full |
| A-06 | Attacks & checks → Attack roller: choose a weapon, type 20 in First d20, Show attack result | "Critical Hit"; Critical box ticks |
| A-07 | Damage: Roll damage for me | Twice the usual dice; modifier added once |
| A-08 | Type 1 in First d20, Target AC 5, Show attack result | "Natural 1: the attack misses." |
| A-09 | Choose a Finesse weapon (e.g. Dagger), switch Finesse ability to Strength | Bonus and formula change to Strength |
| A-10 | Advantage, only one die, Show attack result | Asks for both d20s; Roll for me fills both |
| A-11 | After any attack/damage preview, reload | Nothing about the character changed |
| A-12 | Bless and Bane → record Bless; Attack roller | Bless d4 field appears; result shows "Bless +n" |
| A-13 | Print / PDF → GwenTable sheet Complete → Generate → Download; open in a PDF app, edit a field, save | Filled sheet; fields editable |
| A-14 | Compendium → search "Bag of Holding" → open | Shows its own text first; Show full SRD page works |
| A-15 | Switch to Bahasa Indonesia (flag) | Navigation and attack roller in Indonesian |
| A-16 | Turn on airplane mode after first load; reload | Site still opens with saved characters (keep Termux running) |
| A-17 | Open the same address in a second Chrome tab, edit HP in tab 1, then in tab 2 | Tab 2 refuses with "changed in another tab" |
| A-18 | Rotate to landscape; zoom text to 200% (Chrome settings) | No sideways scrolling; buttons reachable |
| A-19 | Spells & slots → Cast a spell: choose a levelled spell, read details, choose a slot, tick confirm, Record casting | Slot count drops by one; Concentration shown in the top strip if the spell needs it |
| A-20 | Tap Undo in the top strip | Slot and Concentration both restored |
| A-21 | Scroll down a long sheet | HP/AC strip stays at the top; shows "Saved" after each change |
