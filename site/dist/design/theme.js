/** GwenTable personal appearance. Existing theme key is preserved.
 * Preferences affect presentation only; never write character data. */
(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const spec = {
    'gwentable-theme': {dataset:'theme', control:'theme-mode', values:['system','light','dark'], fallback:'system'},
    'gwentable-palette': {dataset:'palette', control:'palette-mode', values:['scholar-plum','moonlit-sapphire'], fallback:'scholar-plum'},
    'gwentable-density': {dataset:'density', control:'density-mode', values:['comfortable','compact'], fallback:'comfortable'}
  };
  const settings={};
  const get=(key)=>{try{return localStorage.getItem(key);}catch{return null;}};
  const set=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
  function read(){for(const [key,entry] of Object.entries(spec)){
    const stored=get(key);settings[key]=entry.values.includes(stored)?stored:entry.fallback;
  }}
  function apply(){
    root.dataset.theme=settings['gwentable-theme']==='system'?(system.matches?'dark':'light'):settings['gwentable-theme'];
    root.dataset.palette=settings['gwentable-palette'];
    root.dataset.density=settings['gwentable-density'];
    for(const [key,entry] of Object.entries(spec)){
      const control=document.getElementById(entry.control);
      if(control&&control.value!==settings[key])control.value=settings[key];
    }
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta&&typeof getComputedStyle==='function'){
      const color=getComputedStyle(root).getPropertyValue('--gwen-canvas').trim();
      if(color)meta.content=color;
    }
  }
  read();apply();
  system.addEventListener('change',()=>{if(settings['gwentable-theme']==='system')apply();});
  window.addEventListener('storage',event=>{
    if(event.key===null||Object.hasOwn(spec,event.key)){read();apply();}
  });
  document.addEventListener('DOMContentLoaded',()=>{
    apply();
    for(const [key,entry] of Object.entries(spec)){
      document.getElementById(entry.control)?.addEventListener('change',event=>{
        const next=event.target.value;
        if(!entry.values.includes(next)){event.target.value=settings[key];return;}
        settings[key]=next;set(key,next);apply();
      });
    }
  });
})();
