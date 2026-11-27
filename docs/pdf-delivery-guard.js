// Read-only final-delivery gate for an already generated PDF.
// An earlier successful check must not authorize a link indefinitely.
// Call authorize() on the user's actual delivery action. No stored character
// or browser-owned revision token is changed by this module.
export function createPDFDeliveryGuard({authorize,onDenied}={}) {
  if(typeof authorize!=='function') throw new TypeError('PDF delivery needs an authorization check.');
  let cancelled=false;
  let pending=false;
  return {
    cancel(){cancelled=true;},
    async deliver(action){
      if(cancelled||pending) return false;
      if(typeof action!=='function') throw new TypeError('PDF delivery needs an action.');
      pending=true;
      try {
        let allowed=false;
        try {allowed=Boolean(await authorize());} catch {allowed=false;}
        if(cancelled) return false;
        if(!allowed){
          cancelled=true;
          onDenied?.();
          return false;
        }
        // No async boundary between the last authorization and delivery.
        action();
        return true;
      } finally {pending=false;}
    }
  };
}
