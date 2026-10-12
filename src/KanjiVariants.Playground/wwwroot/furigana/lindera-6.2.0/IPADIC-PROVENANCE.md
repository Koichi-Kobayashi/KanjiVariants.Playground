# IPADIC redistribution provenance (audited 2026-10-12)

The binary dictionary is the unmodified content of the official Lindera v6.2.0 `lindera-ipadic-6.2.0.zip` release asset. Only transport gzip compression was applied to its nine data files. Their decompressed SHA-256 values are recorded in `manifest.json`.

- Release: https://github.com/lindera/lindera/releases/tag/v6.2.0
- ZIP: https://github.com/lindera/lindera/releases/download/v6.2.0/lindera-ipadic-6.2.0.zip
- ZIP SHA-256: `5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72`
- Build source: https://github.com/lindera/lindera/blob/0482efcc46b5ec518b7238efae55e9fed9bba0c0/lindera-ipadic/build.rs
- Source input: https://Lindera.dev/mecab-ipadic-2.7.0-20250920.tar.gz
- Source SHA-256: `a7ba9f645ffe7094e56ae1c4a81d100df8fbb1e28bbe1792622e9728e162db3d`
- Source MD5: `a95c409f12f1023fce8ef91f991ef042` (matches the pinned build.rs)
- Source repository: https://github.com/lindera/mecab-ipadic/tree/79f5146f8615277ca2c1817f04af9b932c9c6423
- Upstream change: https://github.com/lindera/mecab-ipadic/commit/79f5146f8615277ca2c1817f04af9b932c9c6423 (`Convert to UTF-8 (#1)`)

The original `IPADIC-NOTICE.txt` supplied in the ZIP refers to the antecedent `mecab-ipadic-2.7.0-20070801`. This upstream notice has been preserved verbatim; it is not a claim that the current build input archive is the 2007 archive. The 20250920 source is the Lindera UTF-8 fork. Comparing the two source archives found 19 byte-identical files, 24 files identical after WHATWG EUC-JP decoding, nine files differing only at four Unicode mapping pairs, one added conversion script, and no removed files. This does not assert byte-identical dictionary entries between all character conversion implementations.

The `COPYING` file in the 20250920 input is byte-identical to that in the 20070801 input and the original MeCab repository. SHA-256: `fca02d9adb601d101eccdf3131119abfff2d9c825ef5c759d7a89ebbaa972099`. The full original COPYING is now included as `IPADIC-COPYING`, including the NAIST copyright, permission/retention requirement and ICOT distribution/no-warranty paragraphs that were not all present in the Lindera NOTICE.

The source dictionary retains the NAIST/ICOT terms. It is not relicensed as the Playground's or Lindera engine's MIT license. These provenance findings resolve the date-label question, but do not approve publication of the WASM bundle: unresolved engine dependency notices and binary build provenance are listed in `manifest.json`.
