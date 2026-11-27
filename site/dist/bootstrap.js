import {initInterfaceLanguage} from './locale.js';
initInterfaceLanguage(document,()=>localStorage);

const fallback = document.getElementById('startup-error');
document.getElementById('reload-workspace').onclick = () => location.reload();
const showFailure = () => {fallback.hidden = false;};
const timeout = setTimeout(showFailure, 8000);
import('./app.js').then(() => {fallback.hidden = true;}, showFailure)
  .finally(() => clearTimeout(timeout));
