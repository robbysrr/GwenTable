"""Run saved-inventory QA on a fresh local origin and synthetic records."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import re
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
from threading import Thread

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--baseline", type=Path, required=True, help="Previous GwenTable source directory")
parser.add_argument("--site", type=Path, default=ROOT / "dist", help="Built site directory for the candidate")
parser.add_argument("--output", type=Path, required=True, help="Screenshot and log directory")
parser.add_argument("--engine", choices=["chromium", "firefox", "webkit"], default="chromium")
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)

def service_worker_revision(source):
    worker = (source / "sw.js").read_text()
    return re.search(r"const revision='([^']+)'", worker)[1]

from_cache = service_worker_revision(args.baseline / "dist")
to_cache = service_worker_revision(args.site)
if from_cache == to_cache:
    parser.error("Supply a baseline with an older service worker revision.")
fixture = json.loads(subprocess.check_output(
    ["node", "--input-type=module", "-e",
     "import {inventoryFixture} from './tests/fixtures/inventory-character.mjs'; "
     "console.log(JSON.stringify({...inventoryFixture(),inventory:['Backpack','2 Daggers','Unknown map'],gp:20}));"],
    cwd=ROOT, text=True
))
fixture_id = fixture["id"]
advanced = json.loads(subprocess.check_output(
    ["node", "--input-type=module", "-e",
     "import {inventoryFixture} from './tests/fixtures/inventory-character.mjs'; "
     "import {build, templateCharacter} from './dist/lib/character.js'; "
     "const draft=build({...templateCharacter('Fighter'),species:'Goliath',lineage:'Stone',level:4}).draft; "
     "console.log(JSON.stringify(inventoryFixture(draft)));"],
    cwd=ROOT, text=True
))


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def translate_path(self, path):
        self.directory = str(self.server.site)
        return super().translate_path(path)

    def do_GET(self):
        if getattr(self.server, "disconnected", False):
            self.connection.shutdown(socket.SHUT_RDWR)
            self.close_connection = True
            return
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            self.close_connection = True

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler))
server.site = args.baseline.resolve() / "dist"
Thread(target=server.serve_forever, daemon=True).start()
origin = f"http://127.0.0.1:{server.server_port}/"
route = origin + f"#play/{fixture_id}/inventory"
record_script = """async id => (await import('/lib/storage.js')).characters.get(id)"""
commit_script = """async ({id, command}) => {
  const {commitSavedInventory}=await import('/lib/inventory-storage.js');
  try {return {record:await commitSavedInventory(id, command)};}
  catch (error) {return {error:error.message,code:error.code};}
}"""


def say(message):
    print("PASS " + message, flush=True)


def row(page):
    return page.evaluate(record_script, fixture_id)


def operation(page, kind, **fields):
    return {"type":kind, "expectedRevision":row(page)["_characterRevision"],
            "operationId":page.evaluate("crypto.randomUUID()"), **fields}


def command(page, data):
    return page.evaluate(commit_script, {"id":fixture_id, "command":data})


def open_inventory_panel(page, name):
    panel = page.locator(f'[data-panel="inventory-{name}"]')
    if panel.get_attribute("open") is None:
        panel.locator("summary").click()


def cache(page, key):
    page.wait_for_function("async key => (await caches.keys()).includes(key)", arg=key)
    page.wait_for_function("async () => !!(await navigator.serviceWorker.getRegistration())?.active")


try:
    with tempfile.TemporaryDirectory(prefix="gwentable-browser-") as profile, sync_playwright() as playwright:
        engine = getattr(playwright, args.engine)
        executable = shutil.which("chromium") if args.engine == "chromium" else None
        launch = {"headless": True, **({"executable_path": executable} if executable else {})}
        context = engine.launch_persistent_context(profile, viewport={"width":1280,"height":960}, **launch)
        errors = []
        a = context.pages[0]
        a.on("pageerror", lambda error: errors.append(str(error)))
        a.goto(origin,wait_until="domcontentloaded")
        cache(a, from_cache)
        print("Baseline service worker active",flush=True)
        a.evaluate("""async record => (await import('/lib/storage.js')).characters.put(record)""", fixture)
        assert row(a)["gp"] == 20
        server.site = args.site.resolve()
        a.evaluate("""() => {
          navigator.serviceWorker.register('./sw.js')
            .then(registration => registration.update()).catch(() => {});
        }""")
        cache(a, to_cache)
        a.wait_for_function("async key => !(await caches.keys()).includes(key)", arg=from_cache)
        print("Candidate service worker active",flush=True)
        a.goto(route,wait_until="domcontentloaded")
        a.reload(wait_until="domcontentloaded")
        activate = a.locator('[data-inventory-action="activate"]')
        expect(activate).to_be_visible()
        expect(a.locator("[data-inventory-summary]")).to_contain_text("≥ 7.4")
        say("baseline service worker upgraded and existing native IndexedDB character reopened in migration preview")
        prepare = a.locator('[data-inventory-action="prepare-backup"]')
        backup_link = a.locator('[data-inventory-backup-download]')
        ack = a.locator('[data-inventory-backup-ack]')
        b = context.new_page()
        b.on("pageerror", lambda error: errors.append(str(error)))
        b.goto(route)
        expect(activate).to_be_disabled()
        before = row(a)
        rejected = command(a, operation(a,"activate"))
        assert "confirm a private backup" in rejected["error"]
        assert row(a) == before
        prepare.focus()
        prepare.press("Enter")
        expect(backup_link).to_be_focused()
        expect(ack).to_be_disabled()
        with a.expect_download() as downloaded:
            backup_link.press("Enter")
        backup_file = Path(downloaded.value.path()).read_bytes()
        assert json.loads(backup_file)["kind"] == "character-roster"
        expect(ack).to_be_enabled()
        expect(activate).to_be_disabled()
        ack.focus()
        ack.press("Space")
        expect(activate).to_be_enabled()
        a.locator('#language-toggle').click()
        expect(a.locator('html')).to_have_attribute('lang','id')
        expect(ack).to_be_checked()
        expect(activate).to_be_enabled()
        a.locator('#language-toggle').click()
        expect(ack).to_be_checked()
        assert row(a) == before
        say("keyboard backup preparation and download required acknowledgment, retained across EN/ID")
        b.locator('[data-play-form="hp"] input[name="value"]').fill("1")
        b.locator('[data-play-form="hp"] button[value="damage"]').click()
        b.wait_for_function("""async ({id,stamp}) => (await (await import('/lib/storage.js')).characters.get(id))._characterRevision!==stamp""",
                            arg={"id":fixture_id,"stamp":before["_characterRevision"]})
        updated = row(b)
        activate.click()
        expect(a.locator("#play-feedback")).to_contain_text("Inventory changed in another tab.")
        expect(backup_link).to_be_hidden()
        assert row(a) == updated and "gwentableInventory" not in updated
        reload_button = a.get_by_role("button",name="Reload saved character")
        expect(reload_button).to_be_focused()
        reload_button.press("Enter")
        expect(activate).to_be_disabled()
        expect(backup_link).to_be_hidden()
        say("stale acknowledged backup could not activate inventory and required a fresh backup")

        prepare.click()
        with a.expect_download() as downloaded:
            backup_link.click()
        backup_file = Path(downloaded.value.path()).read_bytes()
        ack.check()
        activate.press("Enter")
        expect(a.locator("#play-feedback")).to_contain_text("Inventory saved.")
        expect(a.locator("[data-inventory-summary]")).to_be_focused()
        assert row(a)["inventory"] == fixture["inventory"]
        current = row(a)
        a.goto(origin + "#characters")
        a.locator('#import').set_input_files({"name":"before-inventory.json","mimeType":"application/json","buffer":backup_file})
        expect(a.locator('#import-preview')).to_contain_text("Import creates new copies")
        a.locator('#accept-import').click()
        expect(a.locator('#library-status')).to_contain_text("as new copies")
        rolled_back = a.evaluate("""async id => (await (await import('/lib/storage.js')).characters.list()).find(row=>row.id!==id)""", fixture_id)
        assert "gwentableInventory" not in rolled_back
        for key in ("inventory","gp","customMetadata","play"):
            assert rolled_back[key] == updated[key], key
        assert row(a) == current
        a.goto(route)
        b.reload()
        say("browser backup restored a private copy of the pre-activation record and preserved the current record")
        for page in (a,b):
            open_inventory_panel(page,"Trade")
            page.locator('[data-inventory-form="buy"] select[name="catalogId"]').select_option("srd521:dagger")
            page.locator('[data-inventory-form="buy"] select[name="coin"]').select_option("gp")
        a.get_by_role("button", name="Buy", exact=True).click()
        expect(a.locator("#play-feedback")).to_contain_text("Inventory saved.")
        b.get_by_role("button", name="Buy", exact=True).click()
        expect(b.locator("#play-feedback")).to_contain_text("Inventory changed in another tab.")
        b.get_by_role("button", name="Reload saved character").click()
        expect(b.locator('[data-panel="inventory"]')).to_contain_text("18 gp")
        say("second tab displays a conflict and reloads the winning purchase")
        trade_before = row(b)["gwentableInventory"]["inventory"]
        dagger = next(item["id"] for item in trade_before["items"]
                      if item.get("catalogId") == "srd521:dagger" and not item["id"].startswith("starter-"))
        open_inventory_panel(b,"Trade")
        sell = b.locator('[data-inventory-form="sell"]')
        sell.locator('select[name="id"]').select_option(dagger)
        sell.locator('select[name="coin"]').select_option("gp")
        sell.get_by_role('button',name="Sell",exact=True).click()
        expect(b.locator('[data-panel="inventory"]')).to_contain_text("19 gp")
        open_inventory_panel(b,"Manage wallets")
        b.locator('[data-inventory-action="new-wallet"]').click()
        transfer = b.locator('[data-inventory-form="transfer"]')
        expect(transfer).to_be_visible()
        target = transfer.locator('select[name="target"] option').last.get_attribute('value')
        transfer.locator('select[name="target"]').select_option(target)
        transfer.locator('select[name="coin"]').select_option("gp")
        transfer.get_by_role('button',name="Transfer coins",exact=True).click()
        expect(b.locator('[data-panel="inventory"]')).to_contain_text("18 gp")
        open_inventory_panel(b,"Manage items")
        move = b.locator('[data-inventory-form="move"]')
        move.locator('select[name="id"]').select_option(target)
        move.locator('select[name="destination"]').select_option("stored")
        move.get_by_role('button',name="Move",exact=True).click()
        expect(b.locator('[data-panel="inventory"]')).to_contain_text("Stored")
        traded = row(b)["gwentableInventory"]["inventory"]
        assert all(item["id"] != dagger for item in traded["items"])
        assert [(w["coins"]["gp"],w["location"]) for w in traded["wallets"]] == [(18,"carried"),(1,"stored")]
        say("selling, wallet transfers and storage updated the same saved equipment and coin balances")

        first = operation(a,"buy",catalogId="srd521:dagger",wallet="purse",coin="gp",quantity=1)
        second = operation(b,"adjust",wallet="purse",coin="gp",amount=1)
        # Start both promises in separate tabs without waiting for either transaction.
        for page, data in ((a,first),(b,second)):
            page.evaluate("""({id,data}) => {
              window.inventoryRace=(async () => {
                const {commitSavedInventory}=await import('/lib/inventory-storage.js');
                try {return {record:await commitSavedInventory(id,data)};}
                catch(error) {return {code:error.code};}
              })();
            }""", {"id":fixture_id,"data":data})
        results = [page.evaluate("() => window.inventoryRace") for page in (a,b)]
        assert sum("record" in result for result in results) == 1
        assert sum(result.get("code") == "CHARACTER_REVISION_CONFLICT" for result in results) == 1
        winning = first if "record" in results[0] else second
        committed = row(a)
        assert command(b,winning)["record"] == committed
        say("two actual readwrite transactions serialized and duplicate retry preserved the opaque revision")

        bad = operation(a,"buy",catalogId="srd521:backpack",wallet="purse",coin="gp",quantity=2)
        assert "quantity 1" in command(a,bad)["error"]
        assert row(a) == committed
        pending = operation(a,"adjust",wallet="purse",coin="gp",amount=1)
        a.evaluate("""() => {
          const original=IDBObjectStore.prototype.put;
          IDBObjectStore.prototype.put=function(...args) {
            const request=original.apply(this,args);
            if(this.name==='characters') this.transaction.abort();
            return request;
          };
          window.restorePut=() => {IDBObjectStore.prototype.put=original;};
        }""")
        assert "abort" in command(a,pending)["error"].lower()
        a.evaluate("() => window.restorePut()")
        assert row(a) == committed
        a.evaluate("""() => {
          const original=IDBObjectStore.prototype.put;
          IDBObjectStore.prototype.put=function(...args) {
            if(this.name==='characters') throw new DOMException('Injected quota error','QuotaExceededError');
            return original.apply(this,args);
          };
          window.restorePut=() => {IDBObjectStore.prototype.put=original;};
        }""")
        assert "quota" in command(a,pending)["error"].lower()
        a.evaluate("() => window.restorePut()")
        assert row(a) == committed
        assert "record" in command(a,pending)
        say("failed purchase, native transaction abort and injected quota error left the previous record intact")

        stale = operation(b,"adjust",wallet="purse",coin="sp",amount=2)
        before_advance = row(a)
        capacity = a.evaluate("""async ({id, draft, completionApproval}) => {
          const {characters}=await import('/lib/storage.js');
          const {mergeSavedCharacterBuild}=await import('/saved-character-build.js');
          const {savedInventoryView}=await import('/lib/saved-inventory.js');
          const before=await characters.get(id);
          const after=await characters.update(id,current=>mergeSavedCharacterBuild(current,{draft,completionApproval}),
            {expectedRevision:before._characterRevision,requireExisting:true});
          return [savedInventoryView(before).load.capacity.carryLb,savedInventoryView(after).load.capacity.carryLb];
        }""", advanced)
        assert capacity[1] > capacity[0]
        assert command(b,stale)["code"] == "CHARACTER_REVISION_CONFLICT"
        assert row(a)["gwentableInventory"] == before_advance["gwentableInventory"]
        a.reload(wait_until="domcontentloaded")
        expect(a.locator("[data-inventory-summary]")).to_contain_text(f"/ {capacity[1]} lb")
        say("a reviewed advancement preserved inventory, updated carrying capacity and invalidated a second tab")
        assert row(a)["customMetadata"] == fixture["customMetadata"]
        checked = a.evaluate("""async id => {
          const {characters}=await import('/lib/storage.js');
          const p=await import('/lib/portable.js');
          const gcx=await import('/lib/gwentable-gcx.js');
          const codec=await import('/lib/gcx.mjs');
          const record=await characters.get(id);
          const old=await p.makeRosterExport([{draft:record.draft, inventory:record.inventory, gp:record.gp}]);
          const [legacy]=await p.readRosterExport(JSON.stringify(old));
          const [restored]=await p.readRosterExport(JSON.stringify(await p.makeRosterExport([record])));
          const individual=await p.readSavedCharacterExport(JSON.stringify(await p.makeSavedCharacterExport(record)));
          const exchange=await gcx.exportGwenGCX(record,'live-snapshot');
          const foreign=gcx.gcxToGwen(await codec.readGCX(JSON.parse(JSON.stringify(exchange))), true);
          // A backup import creates another record, leaving the original intact.
          await characters.addBatch([{...restored,id:'restored-fixture'}]);
          return {
            legacy:legacy.inventory, legacyGold:legacy.gp, metadata:restored.customMetadata,
            matches:[restored,individual,foreign].every(item=>JSON.stringify(item.gwentableInventory)===JSON.stringify(record.gwentableInventory)),
            fresh:(await characters.get('restored-fixture'))._characterRevision!==record._characterRevision
          };
        }""", fixture_id)
        assert checked == {"legacy":fixture["inventory"],"legacyGold":20,"metadata":fixture["customMetadata"],
                           "matches":True,"fresh":True}
        say("legacy and current JSON and GCX roundtripped in-browser, with a fresh ID for the restored record")

        before_play = row(a)
        a.locator('[data-play-form="hp"] input[name="value"]').fill("1")
        a.locator('[data-play-form="hp"] button[value="damage"]').click()
        a.wait_for_function("""async revision => (await (await import('/lib/storage.js')).characters.get(
          'inventory-fixture'))._characterRevision!==revision""", arg=before_play["_characterRevision"])
        expect(a.locator('[data-play-action="undo"]')).to_be_enabled()
        assert row(a)["gwentableInventory"] == before_play["gwentableInventory"]
        a.locator('[data-play-action="undo"]').click()
        expect(a.locator("#play-feedback")).to_contain_text("Undid the last play change.")
        assert row(a)["play"] == before_play["play"]
        assert row(a)["gwentableInventory"] == before_play["gwentableInventory"]
        say("Play damage and Undo preserved tracked equipment and wallet balances")

        a.locator('[data-play-action="print"]').click()
        a.locator('#sheet-export button[name="generate"]').click()
        pdf = a.get_by_role("button",name="Download character PDF")
        expect(pdf).to_be_visible(timeout=15000)
        with a.expect_download() as downloaded:
            pdf.click()
        pdf_path = Path(downloaded.value.path())
        assert pdf_path.read_bytes().startswith(b"%PDF")
        a.locator('[data-sheet-close]').click()
        say("Play generated and downloaded a real PDF")

        bag = operation(a,"add-item",catalogId="srd521:bag-of-holding",quantity=1)
        assert "record" in command(a,bag)
        a.reload(wait_until="domcontentloaded")
        snapshot_script = """async id => {
          const {characters}=await import('/lib/storage.js');
          const {makeRosterExport}=await import('/lib/portable.js');
          const {exportGwenGCX}=await import('/lib/gwentable-gcx.js');
          const record=await characters.get(id);
          return {record, roster:(await makeRosterExport([record])).payload,
                  gcx:(await exportGwenGCX(record,'live-snapshot')).preservedExtensions};
        }"""
        before_language = a.evaluate(snapshot_script, fixture_id)
        open_inventory_panel(a,"Trade")
        buy = a.locator('[data-inventory-form="buy"]')
        buy.locator('select[name="catalogId"]').select_option('srd521:dagger')
        buy.locator('input[name="quantity"]').fill("7")
        for width in (320,375,768):
            a.set_viewport_size({"width":width,"height":820})
            assert a.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), width
        a.locator('#language-toggle').click()
        expect(a.locator('html')).to_have_attribute('lang','id')
        expect(a.locator('[data-panel="inventory"] > summary')).to_have_text("Inventaris")
        expect(a.locator('[data-inventory-summary]')).to_contain_text("Beban bawaan")
        inventory = a.locator('[data-panel="inventory"]')
        expect(inventory.get_by_text("Bag of Holding", exact=False).first).to_be_visible()
        expect(inventory.get_by_text("Dagger", exact=False).first).to_be_visible()
        expect(buy.locator('select[name="catalogId"]')).to_have_value("srd521:dagger")
        expect(buy.locator('input[name="quantity"]')).to_have_value("7")
        assert a.evaluate(snapshot_script, fixture_id) == before_language
        a.set_viewport_size({"width":375,"height":820})
        a.locator('[data-panel="inventory"] > summary').scroll_into_view_if_needed()
        a.screenshot(path=args.output / f"{args.engine}-inventory-id-375.png")
        a.set_viewport_size({"width":1280,"height":960})
        a.goto(origin + "#compendium")
        for term in ("Light","Lock","Paper"):
            a.locator('[data-catalogue-search]').fill(term)
            expect(a.locator('[data-catalogue-results]').get_by_text(term,exact=True).first).to_be_visible()
        expect(a.locator('#theme-mode option[value="light"]')).to_have_text("Terang")
        say("Indonesian Compendium retained official names, theme Light localized, and saves and exports stayed identical")

        a.goto(origin + "#characters")
        a.locator(f'button[data-id="{fixture_id}"]').click()
        name = a.locator('[data-text="name"]')
        a.locator('[data-action="random-identity"][data-field="name"]').click()
        suggested = name.input_value()
        assert suggested.strip() and suggested != fixture["draft"]["name"]
        a.locator('#language-toggle').click()
        expect(name).to_have_value(suggested)
        name.fill("Lock")
        a.locator('#language-toggle').click()
        expect(name).to_have_value("Lock")
        equipment_index = a.evaluate("async () => (await import('/builder-stages.js')).stageIndex('equipment')")
        a.locator(f'[data-step="{equipment_index}"]').click()
        a.locator('[data-build-picker][data-choice="kit"]').click()
        picker = a.locator('#spell-picker')
        expect(picker.get_by_role('button',name=re.compile('Paket Chain Mail'))).to_be_visible()
        expect(picker.get_by_role('button',name=re.compile('Paket Studded Leather Armor'))).to_be_visible()
        a.keyboard.press('Escape')
        custom_index = a.evaluate("async () => (await import('/builder-stages.js')).stageIndex('custom')")
        a.locator(f'[data-step="{custom_index}"]').click()
        a.locator('[data-action="custom-new"]').click()
        a.locator('#new-custom-type + .picker-trigger').click()
        a.locator('#spell-picker').get_by_role('button',name='Armor',exact=True).click()
        a.locator('[data-custom="name"]').fill('Paper')
        category = a.locator('[data-custom="category"]')
        expect(category.locator('option[value="Light"]')).to_have_text("Light")
        expect(category.locator('..')).to_contain_text("Kategori zirah")
        a.locator('#language-toggle').click()
        expect(category).to_have_value('Light')
        expect(a.locator('[data-custom="name"]')).to_have_value("Paper")
        say("Builder kept generated and typed names, custom option values and localized field labels")
        assert a.evaluate(snapshot_script, fixture_id) == before_language
        a.goto(route)
        a.locator('[data-panel="inventory"] > summary').scroll_into_view_if_needed()
        a.screenshot(path=args.output / f"{args.engine}-inventory-en.png")
        say("English and Indonesian inventory rendered at 320, 375 and 768 pixels with focus and accessible controls")

        persisted = row(a)
        a.wait_for_function("() => !!navigator.serviceWorker.controller")
        assert a.evaluate("""async key => {
          const cache=await caches.open(key);
          return Boolean(await cache.match(location.origin+'/'));
        }""", to_cache)
        # Drop requests at the local transport so the worker gets real fetch
        # rejections. CDP offline emulation can bypass worker navigation.
        server.disconnected = True
        try:
            a.reload(wait_until="domcontentloaded", timeout=15000)
            expect(a.locator("[data-inventory-summary]")).to_be_visible()
            assert row(a) == persisted
            say("offline refresh preserved the whole record")
        finally:
            server.disconnected = False
        a.goto(origin + "#templates",wait_until="domcontentloaded")
        a.locator('#template-form button[type="submit"]').click()
        expect(a.locator('[data-text="name"]')).to_be_visible()
        a.locator('[data-text="name"]').fill("MVP QA Fighter")
        for _ in range(12):
            panel = a.locator('#step-content')
            if panel.locator('[data-skip-appearance]').count():
                panel.locator('[data-skip-appearance]').click()
                break
            suggested = panel.locator('[data-action="use-suggested-array"]')
            if suggested.count():
                suggested.click()
            while panel.locator('[data-confirm-choice]').count():
                confirmation = panel.locator('[data-confirm-choice]').first
                field = confirmation.get_attribute('data-confirm-choice')
                if field == "className":
                    expect(panel).to_contain_text("Builder progression available through level 20.")
                confirmation.click()
                expect(panel.locator(f'[data-confirm-choice="{field}"]')).to_have_count(0)
            a.locator('#next').click()
        expect(a.locator('#save')).to_be_enabled()
        a.locator('#save').click()
        expect(a.locator('#play-body h1')).to_have_text("MVP QA Fighter")
        new_route = a.url
        a.reload(wait_until="domcontentloaded")
        expect(a.locator('#play-body h1')).to_have_text("MVP QA Fighter")
        a.goto(origin + "#characters")
        saved = a.locator('#roster article').filter(has_text="MVP QA Fighter")
        saved.get_by_role('link',name="Play",exact=True).click()
        assert a.url == new_route
        expect(a.locator('#play-body h1')).to_have_text("MVP QA Fighter")
        say("new Fighter reviewed in Builder, saved, reloaded, and reopened from Saved Characters")
        context.close()
        context = engine.launch_persistent_context(profile, viewport={"width":1280,"height":960}, **launch)
        reopened = context.pages[0]
        reopened.on("pageerror", lambda error: errors.append(str(error)))
        reopened.goto(route,wait_until="domcontentloaded")
        expect(reopened.locator("[data-inventory-summary]")).to_be_visible()
        assert row(reopened) == persisted
        reopened.goto(new_route,wait_until="domcontentloaded")
        expect(reopened.locator('#play-body h1')).to_have_text("MVP QA Fighter")
        assert not errors, errors
        context.close()
        say("persistent browser restart preserved both the migrated fixture and the new Fighter")
finally:
    server.shutdown()
    server.server_close()
