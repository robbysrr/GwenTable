import {htmlCopy, copy} from './locale.js';
import {inventoryPrices, savedInventoryView} from './lib/saved-inventory.js';
import {CURRENCY, SRD_ITEMS, SRD_CATALOG_PROVENANCE} from './lib/srd-encumbrance.mjs';

const text = value => String(value).replace(/[&<>"']/g, character => (
  {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]
));
const option = (value, label) => `<option value="${text(value)}">${text(label)}</option>`;
const select = (name, label, options) =>
  `<label>${htmlCopy(label)}<select name="${name}" required>${options}</select></label>`;
const number = (name,label,attributes) =>
  `<label>${htmlCopy(label)}<input name="${name}" type="number" ${attributes}></label>`;
const button = (type,label) => `<button type="button" data-inventory-action="${type}">${htmlCopy(label)}</button>`;
const form = (type,label,controls) => `<form class="enc-inline" data-inventory-form="${type}">
  ${controls}<button type="submit">${htmlCopy(label)}</button></form>`;
const quantity = number('quantity','Quantity','min="1" max="1000000" value="1" required');
const catalogue = Object.entries(SRD_ITEMS).sort(([,left],[,right]) => left.name.localeCompare(right.name,'en'));
const market = catalogue.filter(([id]) => Object.hasOwn(inventoryPrices,id));
const locations = {carried:'Carried', worn:'Worn', equipped:'Equipped', stored:'Stored', dropped:'Dropped'};

export function inventoryPanel(record, panels) {
  let view;
  try {
    view = savedInventoryView(record);
  } catch (error) {
    return `<p>${htmlCopy('Inventory is unavailable. Your saved data is preserved.')}</p><p>${htmlCopy(error.message)}</p>`;
  }
  const {inventory, load, starter} = view;
  const status = {'over-capacity':'Over carrying capacity','weight-incomplete':'Carried weight is incomplete',
    'within-capacity':'Within carrying capacity'}[load.status];
  const byId = new Map(load.details.map(row => [row.id,row]));
  const itemLabel = item => item.catalogId
    ? SRD_ITEMS[item.catalogId].name
    : item.customName;
  const walletLabel = (wallet, index = inventory.wallets.indexOf(wallet)) => copy('Wallet {number}',{number:index+1});
  const location = row => row.parentId
    ? copy('Inside {container}',{container:byId.get(row.parentId)?.name})
    : copy(locations[row.location]);
  const weight = row => row.itemWeightLb === null ? copy('Weight unknown') : row.itemWeightLb+' lb';
  const inventoryList = inventory.items.map(item => {
    const row=byId.get(item.id);
    const page=item.catalogId ? SRD_ITEMS[item.catalogId].sourcePage : null;
    return `<li>${row.quantity} × ${text(itemLabel(item))} · ${text(location(row))} · ${text(weight(row))}
      ${page ? `<a href="${SRD_CATALOG_PROVENANCE.url}#page=${page}" target="_blank" rel="noopener">SRD p. ${page}</a>` : ''}</li>`;
  }).join('');
  const balances = inventory.wallets.map((wallet,index) => `<li>${text(walletLabel(wallet,index))} ·
    ${CURRENCY.map(coin => wallet.coins[coin]+' '+coin).join(' · ')} · ${text(location(wallet))}</li>`).join('');
  const contentsWarnings = load.issues.map(issue => {
    const label = {'container-over-capacity':'{name} exceeds its weight limit.',
      'unknown-container-content-weight':'Some contents of {name} have unknown weight.',
      'volume-not-verified':'Check available space in {name} at the table.'}[issue.code];
    return `<li>${htmlCopy(label,{name:byId.get(issue.id)?.name})}</li>`;
  }).join('');
  const summary = `<div data-inventory-summary tabindex="-1">
    <p><strong>${htmlCopy(load.certainty === 'exact' ? 'Carried load {weight} / {capacity} lb' :
      'Known carried load ≥ {weight} / {capacity} lb',{weight:load.carriedKnownLb,capacity:load.capacity.carryLb})}</strong>
      · ${htmlCopy(status)}</p>
    ${load.unknownCarriedEntries ? '<p>'+htmlCopy('Unknown weights are excluded from the known total.')+'</p>' : ''}
    ${contentsWarnings ? '<ul>'+contentsWarnings+'</ul>' : ''}
    </div>
    <p>${htmlCopy('The build controls Armor Class and attack references.')}</p>
    <h3>${htmlCopy('Items')}</h3>
    ${inventoryList ? '<ul class="sheet-list">'+inventoryList+'</ul>' : '<p>'+htmlCopy('No items.')+'</p>'}
    <h3>${htmlCopy('Wallets')}</h3><ul class="sheet-list">${balances}</ul>`;
  if (starter) return `${summary}
    <p>${htmlCopy('Preview of starting inventory. Activating saves this list and balance. Download a private backup before activating.')}</p>
    <details><summary>${htmlCopy('Original gear and gold')}</summary><p>${starter.gp} gp</p>
      <ul>${starter.baseline.map(name => '<li>'+text(name)+'</li>').join('')}</ul></details>
    <div class="inventory-backup-step" data-inventory-backup-step>
      ${button('prepare-backup','Prepare private character backup')}
      <p class="play-note">${htmlCopy('The backup includes your character details. Save the JSON file privately and keep it for recovery.')}</p>
      <p role="status" data-inventory-backup-feedback></p>
      <div data-inventory-backup-confirmation hidden>
        <a data-inventory-backup-download download="gwentable-character-before-inventory.json" href="#">${htmlCopy('Download private backup JSON')}</a>
        <label class="enc-checkbox"><input type="checkbox" data-inventory-backup-ack disabled>
          ${htmlCopy('I downloaded and saved this private backup.')}</label>
      </div>
    </div>
    <button type="button" data-inventory-action="activate" disabled>${htmlCopy('Activate inventory tracking')}</button>`;

  const itemOptions = inventory.items.map(item => option(item.id,item.quantity+' × '+itemLabel(item))).join('');
  const walletOptions = inventory.wallets.map((wallet,index) => option(wallet.id,walletLabel(wallet,index))).join('');
  const coins = select('coin','Coin denomination',CURRENCY.map(coin => option(coin,coin)).join(''));
  const wallet = select('wallet','Wallet',walletOptions);
  const item = select('id','Owned item',itemOptions);
  const sellable = inventory.items.filter(item => Object.hasOwn(inventoryPrices,item.catalogId));
  const destinations = Object.entries(locations).map(([value,label]) => option(value,copy(label))).join('')+
    inventory.items.filter(item => item.customContainer || SRD_ITEMS[item.catalogId]?.type === 'container')
      .map(item => option('in:'+item.id,copy('Inside {container}',{container:itemLabel(item)}))).join('');
  const group = (title, content) => `<details data-panel="inventory-${title}" ${panels.has("inventory-"+title)?'open':''}>
    <summary>${htmlCopy(title)}</summary>${content}</details>`;
  const trade = form('buy','Buy',select('catalogId','Item',market.map(([id]) =>
    option(id,itemLabel({catalogId:id})+' · '+inventoryPrices[id]+' cp')).join(''))+quantity+wallet+coins)+
    (sellable.length ? form('sell','Sell',select('id','Owned item',sellable.map(item =>
      option(item.id,itemLabel(item)+' · '+inventoryPrices[item.catalogId]/2+' cp')).join(''))+quantity+wallet+coins) : '');
  return `${summary}
    ${group('Trade',`<p>${htmlCopy('Sales pay half the listed price. Select one denomination that gives the exact total. No change is made.')}</p>`+trade)}
    ${group('Manage items',
      form('add-item','Add SRD item',select('catalogId','Item',catalogue.map(([id]) => option(id,itemLabel({catalogId:id}))).join(''))+quantity)+
      form('add-custom','Add custom item',`<label>${htmlCopy('Item name')}<input name="name" maxlength="120" required></label>
        ${number('weight','Weight in pounds','min="0" max="1000000" step="0.001"')}
        <label class="enc-checkbox"><input name="container" type="checkbox"> ${htmlCopy('Container')}</label>`)+
      (itemOptions ? form('quantity','Set quantity',item+quantity)+form('remove','Remove item',item) : '')+
      form('move','Move',select('id','Item or wallet',itemOptions+walletOptions)+select('destination','Destination',destinations)))}
    ${group('Manage wallets',form('adjust','Adjust coins',wallet+coins+
      number('amount','Coin change (+/−)','min="-1000000000000" max="1000000000000" required'))+
      (inventory.wallets.length > 1 ? form('transfer','Transfer coins',wallet+select('target','Destination wallet',walletOptions)+coins+quantity) : '')+
      button('new-wallet','Add wallet'))}
    ${view.edited ? '' : button('deactivate','Undo inventory activation')}`;
}

export function inventoryFormCommand(formElement) {
  const numeric = new Set(['quantity','amount','weight']);
  const data = new FormData(formElement);
  const entries = Array.from(data,([key,value]) =>
    [key,numeric.has(key) ? (key === 'weight' && value === '' ? null : Number(value)) : value]);
  const type = formElement.dataset.inventoryForm;
  return {type,...Object.fromEntries(entries),...(type === 'add-custom' ? {container:data.has('container')} : {})};
}
