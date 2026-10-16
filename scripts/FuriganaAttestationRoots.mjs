// Reviewed post-hoc trust roots. Updating these is a separate audit decision, never an automatic record refresh.
// These code-review roots do not protect against replacement of the verifier itself.
export const reviewRoots=Object.freeze({
  "policy": "a9c23b32966b4b8d8f951e9ee18dc2ba98bfb8f05a9ee70612269cbbee342c5b",
  "attestation": "dac89676a8075a7247941d16eba4233fefbf3106c148f5501c3a43672a51f9b6",
  "standardComponent": {
    "url": "https://static.rust-lang.org/dist/2026-09-03/rust-std-1.98.1-wasm32-unknown-unknown.tar.xz",
    "sha256": "cf1fcf68880d8b2b90128cede7416cfb82ad3584357ce9fb668f2b6244c26e55"
  }
});
export const claims=Object.freeze([
  "fixed-artifact-identity",
  "fixed-source-and-lock",
  "recorded-106-compiled-packages",
  "recorded-features-host-target-kinds",
  "official-54-standard-inputs",
  "recorded-bindgen-input-output",
  "notices-for-declared-scope",
  "zero-known-missing-notices",
  "recorded-same-machine-isolated-repeat"
]);
export const exclusions=Object.freeze([
  "complete-final-linked-sbom",
  "post-lto-instruction-data-source-bijection",
  "complete-build-input-closure",
  "independent-third-party-reproduction",
  "uncompromised-compiler-or-build-host"
]);
