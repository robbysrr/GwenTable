// Pure browser-independent revision-token parser, shared by persistence and export gates.
export function characterStorageRevision(record) {
  return typeof record?._characterRevision==='string'&&/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(record._characterRevision)
    ?record._characterRevision:null;
}
