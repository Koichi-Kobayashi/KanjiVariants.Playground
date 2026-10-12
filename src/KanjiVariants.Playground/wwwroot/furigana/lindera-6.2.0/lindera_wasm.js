/* @ts-self-types="./lindera_wasm.d.ts" */

/**
 * A morphological analysis dictionary.
 */
export class Dictionary {
    static __wrap(ptr) {
        const obj = Object.create(Dictionary.prototype);
        obj.__wbg_ptr = ptr;
        DictionaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DictionaryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_dictionary_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get encoding() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.dictionary_encoding(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Metadata}
     */
    get metadata() {
        const ret = wasm.dictionary_metadata(this.__wbg_ptr);
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.dictionary_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) Dictionary.prototype[Symbol.dispose] = Dictionary.prototype.free;

/**
 * Field definition in dictionary schema.
 */
export class FieldDefinition {
    static __wrap(ptr) {
        const obj = Object.create(FieldDefinition.prototype);
        obj.__wbg_ptr = ptr;
        FieldDefinitionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FieldDefinitionFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fielddefinition_free(ptr, 0);
    }
    /**
     * @param {number} index
     * @param {string} name
     * @param {FieldType} field_type
     * @param {string | null} [description]
     */
    constructor(index, name, field_type, description) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(description) ? 0 : passStringToWasm0(description, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.fielddefinition_new(index, ptr0, len0, field_type, ptr1, len1);
        this.__wbg_ptr = ret;
        FieldDefinitionFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string | undefined}
     */
    get description() {
        const ret = wasm.__wbg_get_fielddefinition_description(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @returns {FieldType}
     */
    get field_type() {
        const ret = wasm.__wbg_get_fielddefinition_field_type(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get index() {
        const ret = wasm.__wbg_get_fielddefinition_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_fielddefinition_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string | null} [arg0]
     */
    set description(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_fielddefinition_description(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {FieldType} arg0
     */
    set field_type(arg0) {
        wasm.__wbg_set_fielddefinition_field_type(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set index(arg0) {
        wasm.__wbg_set_fielddefinition_index(this.__wbg_ptr, arg0);
    }
    /**
     * @param {string} arg0
     */
    set name(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_fielddefinition_name(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) FieldDefinition.prototype[Symbol.dispose] = FieldDefinition.prototype.free;

/**
 * Field type in dictionary schema.
 * @enum {0 | 1 | 2 | 3 | 4}
 */
export const FieldType = Object.freeze({
    /**
     * Surface form (word text)
     */
    Surface: 0, "0": "Surface",
    /**
     * Left context ID for morphological analysis
     */
    LeftContextId: 1, "1": "LeftContextId",
    /**
     * Right context ID for morphological analysis
     */
    RightContextId: 2, "2": "RightContextId",
    /**
     * Word cost (used in path selection)
     */
    Cost: 3, "3": "Cost",
    /**
     * Custom field (morphological features)
     */
    Custom: 4, "4": "Custom",
});

/**
 * Error type for Lindera operations.
 */
export class LinderaError {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LinderaErrorFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_linderaerror_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_linderaerror_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} message
     */
    constructor(message) {
        const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.linderaerror_new(ptr0, len0);
        this.__wbg_ptr = ret;
        LinderaErrorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.linderaerror_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set message(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_linderaerror_message(this.__wbg_ptr, ptr0, len0);
    }
}
if (Symbol.dispose) LinderaError.prototype[Symbol.dispose] = LinderaError.prototype.free;

/**
 * Dictionary metadata configuration.
 *
 * A thin wasm-bindgen wrapper over [`lindera_binding_core::CoreMetadata`], which
 * owns the default values and the schema wiring.
 */
export class Metadata {
    static __wrap(ptr) {
        const obj = Object.create(Metadata.prototype);
        obj.__wbg_ptr = ptr;
        MetadataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MetadataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_metadata_free(ptr, 0);
    }
    /**
     * @returns {Metadata}
     */
    static createDefault() {
        const ret = wasm.metadata_createDefault();
        return Metadata.__wrap(ret);
    }
    /**
     * @returns {Schema}
     */
    get dictionary_schema() {
        const ret = wasm.metadata_dictionary_schema(this.__wbg_ptr);
        return Schema.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    get encoding() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.metadata_encoding(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get name() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.metadata_name(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string | null} [name]
     * @param {string | null} [encoding]
     */
    constructor(name, encoding) {
        var ptr0 = isLikeNone(name) ? 0 : passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(encoding) ? 0 : passStringToWasm0(encoding, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.metadata_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret;
        MetadataFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Schema} schema
     */
    set dictionary_schema(schema) {
        _assertClass(schema, Schema);
        var ptr0 = schema.__destroy_into_raw();
        wasm.metadata_set_dictionary_schema(this.__wbg_ptr, ptr0);
    }
    /**
     * @param {string} encoding
     */
    set encoding(encoding) {
        const ptr0 = passStringToWasm0(encoding, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.metadata_set_encoding(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} name
     */
    set name(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.metadata_set_name(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {Schema} schema
     */
    set user_dictionary_schema(schema) {
        _assertClass(schema, Schema);
        var ptr0 = schema.__destroy_into_raw();
        wasm.metadata_set_user_dictionary_schema(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {Schema}
     */
    get user_dictionary_schema() {
        const ret = wasm.metadata_user_dictionary_schema(this.__wbg_ptr);
        return Schema.__wrap(ret);
    }
}
if (Symbol.dispose) Metadata.prototype[Symbol.dispose] = Metadata.prototype.free;

/**
 * Tokenization mode.
 *
 * Determines how text is segmented into tokens.
 * @enum {0 | 1}
 */
export const Mode = Object.freeze({
    /**
     * Standard tokenization based on dictionary cost
     */
    Normal: 0, "0": "Normal",
    /**
     * Decompose compound words using penalty-based segmentation
     */
    Decompose: 1, "1": "Decompose",
});

/**
 * Penalty configuration for decompose mode.
 *
 * Controls how aggressively compound words are decomposed based on
 * character type and length thresholds.
 */
export class Penalty {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PenaltyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_penalty_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get kanji_penalty_length_penalty() {
        const ret = wasm.__wbg_get_penalty_kanji_penalty_length_penalty(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get kanji_penalty_length_threshold() {
        const ret = wasm.__wbg_get_penalty_kanji_penalty_length_threshold(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get other_penalty_length_penalty() {
        const ret = wasm.__wbg_get_penalty_other_penalty_length_penalty(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get other_penalty_length_threshold() {
        const ret = wasm.__wbg_get_penalty_other_penalty_length_threshold(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number | null} [kanji_penalty_length_threshold]
     * @param {number | null} [kanji_penalty_length_penalty]
     * @param {number | null} [other_penalty_length_threshold]
     * @param {number | null} [other_penalty_length_penalty]
     */
    constructor(kanji_penalty_length_threshold, kanji_penalty_length_penalty, other_penalty_length_threshold, other_penalty_length_penalty) {
        const ret = wasm.penalty_new(isLikeNone(kanji_penalty_length_threshold) ? Number.MAX_SAFE_INTEGER : (kanji_penalty_length_threshold) >>> 0, isLikeNone(kanji_penalty_length_penalty) ? Number.MAX_SAFE_INTEGER : (kanji_penalty_length_penalty) >> 0, isLikeNone(other_penalty_length_threshold) ? Number.MAX_SAFE_INTEGER : (other_penalty_length_threshold) >>> 0, isLikeNone(other_penalty_length_penalty) ? Number.MAX_SAFE_INTEGER : (other_penalty_length_penalty) >> 0);
        this.__wbg_ptr = ret;
        PenaltyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} arg0
     */
    set kanji_penalty_length_penalty(arg0) {
        wasm.__wbg_set_penalty_kanji_penalty_length_penalty(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set kanji_penalty_length_threshold(arg0) {
        wasm.__wbg_set_penalty_kanji_penalty_length_threshold(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set other_penalty_length_penalty(arg0) {
        wasm.__wbg_set_penalty_other_penalty_length_penalty(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set other_penalty_length_threshold(arg0) {
        wasm.__wbg_set_penalty_other_penalty_length_threshold(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Penalty.prototype[Symbol.dispose] = Penalty.prototype.free;

/**
 * Dictionary schema definition.
 *
 * A thin wasm-bindgen wrapper over [`lindera_binding_core::CoreSchema`], which
 * owns the field storage, the name-to-index map, and the field lookups.
 */
export class Schema {
    static __wrap(ptr) {
        const obj = Object.create(Schema.prototype);
        obj.__wbg_ptr = ptr;
        SchemaFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SchemaFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_schema_free(ptr, 0);
    }
    /**
     * @returns {Schema}
     */
    static create_default() {
        const ret = wasm.schema_create_default();
        return Schema.__wrap(ret);
    }
    /**
     * @returns {number}
     */
    field_count() {
        const ret = wasm.schema_field_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string[]}
     */
    get_all_fields() {
        const ret = wasm.schema_get_all_fields(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {string[]}
     */
    get_custom_fields() {
        const ret = wasm.schema_get_custom_fields(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {string} name
     * @returns {FieldDefinition | undefined}
     */
    get_field_by_name(name) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.schema_get_field_by_name(this.__wbg_ptr, ptr0, len0);
        return ret === 0 ? undefined : FieldDefinition.__wrap(ret);
    }
    /**
     * @param {string} field_name
     * @returns {number | undefined}
     */
    get_field_index(field_name) {
        const ptr0 = passStringToWasm0(field_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.schema_get_field_index(this.__wbg_ptr, ptr0, len0);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * @param {number} index
     * @returns {string | undefined}
     */
    get_field_name(index) {
        const ret = wasm.schema_get_field_name(this.__wbg_ptr, index);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string[]} fields
     */
    constructor(fields) {
        const ptr0 = passArrayJsValueToWasm0(fields, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.schema_new(ptr0, len0);
        this.__wbg_ptr = ret;
        SchemaFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) Schema.prototype[Symbol.dispose] = Schema.prototype.free;

/**
 * A tokenizer for morphological analysis.
 */
export class Tokenizer {
    static __wrap(ptr) {
        const obj = Object.create(Tokenizer.prototype);
        obj.__wbg_ptr = ptr;
        TokenizerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TokenizerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tokenizer_free(ptr, 0);
    }
    /**
     * Creates a tokenizer directly from a loaded dictionary.
     *
     * # Arguments
     *
     * * `dictionary` - The system dictionary.
     * * `mode` - `"normal"` (the default) or `"decompose"`.
     * * `user_dictionary` - An optional user dictionary.
     * * `space_penalty` - The left-space penalty, in the forms
     *   `TokenizerBuilder.setSpacePenalty` accepts. `null` or `undefined`
     *   (the default) keeps the rules the dictionary ships.
     *
     * # Returns
     *
     * The tokenizer, or an error string for an invalid mode or space-penalty
     * setting, as `setSpacePenalty` and `build()` report them.
     * @param {Dictionary} dictionary
     * @param {string | null} [mode]
     * @param {UserDictionary | null} [user_dictionary]
     * @param {boolean | { rules: Array<{ pos: Array<string>; cost: number }> } | null} [space_penalty]
     */
    constructor(dictionary, mode, user_dictionary, space_penalty) {
        _assertClass(dictionary, Dictionary);
        var ptr0 = dictionary.__destroy_into_raw();
        var ptr1 = isLikeNone(mode) ? 0 : passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(user_dictionary)) {
            _assertClass(user_dictionary, UserDictionary);
            ptr2 = user_dictionary.__destroy_into_raw();
        }
        const ret = wasm.tokenizer_new(ptr0, ptr1, len1, ptr2, isLikeNone(space_penalty) ? 0 : addToExternrefTable0(space_penalty));
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        TokenizerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Tokenizes the input text.
     *
     * Tokens are returned as plain JS objects with camelCase fields, so
     * they carry no Rust-side allocation for the caller to release and
     * serialize without conversion.
     * @param {string} input_text
     * @returns {any[]}
     */
    tokenize(input_text) {
        const ptr0 = passStringToWasm0(input_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizer_tokenize(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Tokenizes the input text and returns N-best results.
     *
     * Returns an array of arrays, where each inner array contains Token JSON objects.
     * @param {string} input_text
     * @param {number} n
     * @param {boolean | null} [unique]
     * @param {bigint | null} [cost_threshold]
     * @returns {any}
     */
    tokenizeNbest(input_text, n, unique, cost_threshold) {
        const ptr0 = passStringToWasm0(input_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizer_tokenizeNbest(this.__wbg_ptr, ptr0, len0, n, isLikeNone(unique) ? 0xFFFFFF : unique ? 1 : 0, !isLikeNone(cost_threshold), isLikeNone(cost_threshold) ? BigInt(0) : cost_threshold);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Tokenizes the input text and returns only the token surfaces.
     *
     * This is the fast path for wakati-style use: no Token objects are
     * created and no morphological details are loaded, so it is
     * significantly faster than `tokenize` when only the surface strings
     * are needed. The surfaces equal `tokenize(text).map((t) => t.surface)`.
     * Unrelated to Web Workers.
     * @param {string} input_text
     * @returns {string[]}
     */
    tokenizeSurfaces(input_text) {
        const ptr0 = passStringToWasm0(input_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizer_tokenizeSurfaces(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
    /**
     * Tokenizes the input text and returns N-best results (snake_case alias).
     * @param {string} input_text
     * @param {number} n
     * @param {boolean | null} [unique]
     * @param {bigint | null} [cost_threshold]
     * @returns {any}
     */
    tokenize_nbest(input_text, n, unique, cost_threshold) {
        const ptr0 = passStringToWasm0(input_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizer_tokenize_nbest(this.__wbg_ptr, ptr0, len0, n, isLikeNone(unique) ? 0xFFFFFF : unique ? 1 : 0, !isLikeNone(cost_threshold), isLikeNone(cost_threshold) ? BigInt(0) : cost_threshold);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Tokenizes the input text and returns only the token surfaces (snake_case alias).
     * @param {string} input_text
     * @returns {string[]}
     */
    tokenize_surfaces(input_text) {
        const ptr0 = passStringToWasm0(input_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizer_tokenize_surfaces(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v2;
    }
}
if (Symbol.dispose) Tokenizer.prototype[Symbol.dispose] = Tokenizer.prototype.free;

/**
 * Builder for creating a [`Tokenizer`] instance.
 *
 * `TokenizerBuilder` provides a fluent API for configuring and building a tokenizer
 * with various options such as dictionary selection, tokenization mode, character filters,
 * and token filters. The build-flow orchestration is delegated to
 * [`lindera_binding_core::CoreTokenizerBuilder`].
 *
 * Setters return a builder handle sharing the same configuration, so both the
 * chained style (`builder.setMode(...).setDictionary(...).build()`) and the
 * sequential style (one call per statement) work. wasm-bindgen cannot return
 * the borrowed JS `this`, hence the shared-state handle instead.
 */
export class TokenizerBuilder {
    static __wrap(ptr) {
        const obj = Object.create(TokenizerBuilder.prototype);
        obj.__wbg_ptr = ptr;
        TokenizerBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TokenizerBuilderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tokenizerbuilder_free(ptr, 0);
    }
    /**
     * Appends a character filter to the tokenization pipeline.
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {string} name
     * @param {any} args
     * @returns {TokenizerBuilder}
     */
    appendCharacterFilter(name, args) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_appendCharacterFilter(this.__wbg_ptr, ptr0, len0, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Appends a token filter to the tokenization pipeline.
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {string} name
     * @param {any} args
     * @returns {TokenizerBuilder}
     */
    appendTokenFilter(name, args) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_appendTokenFilter(this.__wbg_ptr, ptr0, len0, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Appends a character filter (snake_case alias).
     * @param {string} name
     * @param {any} args
     * @returns {TokenizerBuilder}
     */
    append_character_filter(name, args) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_append_character_filter(this.__wbg_ptr, ptr0, len0, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Appends a token filter (snake_case alias).
     * @param {string} name
     * @param {any} args
     * @returns {TokenizerBuilder}
     */
    append_token_filter(name, args) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_append_token_filter(this.__wbg_ptr, ptr0, len0, args);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Builds and returns a configured [`Tokenizer`] instance.
     *
     * If a dictionary instance was set via `setDictionaryInstance()`,
     * it will be used directly instead of loading from a URI.
     *
     * The builder remains usable afterwards, so multiple tokenizers can be
     * built from the same configuration.
     *
     * The `setSpacePenalty()` setting applies to a dictionary instance as it
     * does to a dictionary set by URI.
     * @returns {Tokenizer}
     */
    build() {
        const ret = wasm.tokenizerbuilder_build(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Tokenizer.__wrap(ret[0]);
    }
    /**
     * Creates a new `TokenizerBuilder` instance.
     */
    constructor() {
        const ret = wasm.tokenizerbuilder_new();
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        TokenizerBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Sets the dictionary to use for tokenization by URI.
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {string} uri
     * @returns {TokenizerBuilder}
     */
    setDictionary(uri) {
        const ptr0 = passStringToWasm0(uri, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_setDictionary(this.__wbg_ptr, ptr0, len0);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets a pre-loaded dictionary instance for tokenization.
     *
     * Use this method when the dictionary has been loaded from bytes
     * (e.g., via `loadDictionaryFromBytes()`) instead of from a URI.
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {Dictionary} dictionary
     * @returns {TokenizerBuilder}
     */
    setDictionaryInstance(dictionary) {
        _assertClass(dictionary, Dictionary);
        var ptr0 = dictionary.__destroy_into_raw();
        const ret = wasm.tokenizerbuilder_setDictionaryInstance(this.__wbg_ptr, ptr0);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets whether to keep whitespace tokens in the output.
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {boolean} keep
     * @returns {TokenizerBuilder}
     */
    setKeepWhitespace(keep) {
        const ret = wasm.tokenizerbuilder_setKeepWhitespace(this.__wbg_ptr, keep);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets the tokenization mode.
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {string} mode
     * @returns {TokenizerBuilder}
     */
    setMode(mode) {
        const ptr0 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_setMode(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Sets the left-space penalty (Korean; mecab-ko's
     * `left-space-penalty-factor`), with the same meaning as
     * `segmenter.space_penalty` in a YAML config.
     *
     * Since v6.1.0 a dictionary that ships rules in its `metadata.json`
     * (ko-dic does) applies them by default; pass `false` to turn them off.
     *
     * Applies both to a dictionary set with `setDictionary()` and to one set
     * with `setDictionaryInstance()` (e.g. loaded with
     * `loadDictionaryFromBytes()`).
     *
     * # Arguments
     *
     * * `value` - One of:
     *   - `null` / `undefined`: the default, i.e. the rules the dictionary
     *     ships, if any;
     *   - `false`: turn the penalty off;
     *   - `true`: require the dictionary's rules (`build()` fails if it
     *     ships none);
     *   - an object such as `{ rules: [{ pos: ["JKS"], cost: 6000 }] }`:
     *     apply these rules instead.
     *
     * # Returns
     *
     * A builder handle sharing this configuration, enabling method chaining,
     * or an error string when `value` is not one of the forms above.
     * @param {any} value
     * @returns {TokenizerBuilder}
     */
    setSpacePenalty(value) {
        const ret = wasm.tokenizerbuilder_setSpacePenalty(this.__wbg_ptr, value);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Sets a pre-loaded user dictionary instance.
     *
     * Use this method with a user dictionary loaded from bytes via
     * `loadUserDictionaryFromBytes()` or `loadUserDictionaryBinFromBytes()`;
     * URI-based user dictionaries are not available on WebAssembly (#972).
     *
     * Returns a builder handle sharing this configuration, enabling method chaining.
     * @param {UserDictionary} user_dictionary
     * @returns {TokenizerBuilder}
     */
    setUserDictionaryInstance(user_dictionary) {
        _assertClass(user_dictionary, UserDictionary);
        var ptr0 = user_dictionary.__destroy_into_raw();
        const ret = wasm.tokenizerbuilder_setUserDictionaryInstance(this.__wbg_ptr, ptr0);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets the dictionary by URI (snake_case alias).
     * @param {string} uri
     * @returns {TokenizerBuilder}
     */
    set_dictionary(uri) {
        const ptr0 = passStringToWasm0(uri, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_set_dictionary(this.__wbg_ptr, ptr0, len0);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets a pre-loaded dictionary instance (snake_case alias).
     * @param {Dictionary} dictionary
     * @returns {TokenizerBuilder}
     */
    set_dictionary_instance(dictionary) {
        _assertClass(dictionary, Dictionary);
        var ptr0 = dictionary.__destroy_into_raw();
        const ret = wasm.tokenizerbuilder_set_dictionary_instance(this.__wbg_ptr, ptr0);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets whether to keep whitespace tokens (snake_case alias).
     * @param {boolean} keep
     * @returns {TokenizerBuilder}
     */
    set_keep_whitespace(keep) {
        const ret = wasm.tokenizerbuilder_set_keep_whitespace(this.__wbg_ptr, keep);
        return TokenizerBuilder.__wrap(ret);
    }
    /**
     * Sets the tokenization mode (snake_case alias).
     * @param {string} mode
     * @returns {TokenizerBuilder}
     */
    set_mode(mode) {
        const ptr0 = passStringToWasm0(mode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.tokenizerbuilder_set_mode(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Sets the left-space penalty (snake_case alias of `setSpacePenalty`).
     *
     * # Arguments
     *
     * * `value` - `null` / `undefined`, a boolean, or an object with `rules`.
     *
     * # Returns
     *
     * A builder handle sharing this configuration, or an error string when
     * `value` is invalid.
     * @param {any} value
     * @returns {TokenizerBuilder}
     */
    set_space_penalty(value) {
        const ret = wasm.tokenizerbuilder_set_space_penalty(this.__wbg_ptr, value);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return TokenizerBuilder.__wrap(ret[0]);
    }
    /**
     * Sets a pre-loaded user dictionary instance (snake_case alias).
     * @param {UserDictionary} user_dictionary
     * @returns {TokenizerBuilder}
     */
    set_user_dictionary_instance(user_dictionary) {
        _assertClass(user_dictionary, UserDictionary);
        var ptr0 = user_dictionary.__destroy_into_raw();
        const ret = wasm.tokenizerbuilder_set_user_dictionary_instance(this.__wbg_ptr, ptr0);
        return TokenizerBuilder.__wrap(ret);
    }
}
if (Symbol.dispose) TokenizerBuilder.prototype[Symbol.dispose] = TokenizerBuilder.prototype.free;

/**
 * A user-defined dictionary for custom words.
 */
export class UserDictionary {
    static __wrap(ptr) {
        const obj = Object.create(UserDictionary.prototype);
        obj.__wbg_ptr = ptr;
        UserDictionaryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        UserDictionaryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_userdictionary_free(ptr, 0);
    }
}
if (Symbol.dispose) UserDictionary.prototype[Symbol.dispose] = UserDictionary.prototype.free;

/**
 * Gets the version of the lindera-wasm library.
 * Backward compatibility alias for version().
 * @returns {string}
 */
export function getVersion() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.getVersion();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Loads a dictionary from the specified URI.
 *
 * On WebAssembly only `embedded://` dictionaries can be loaded by URI:
 * there is no filesystem on `wasm32-unknown-unknown`, so file URIs and
 * bare paths are rejected up front with a pointer at the bytes API (#971).
 * @param {string} uri
 * @returns {Dictionary}
 */
export function loadDictionary(uri) {
    const ptr0 = passStringToWasm0(uri, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.loadDictionary(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Dictionary.__wrap(ret[0]);
}

/**
 * Loads a dictionary from raw byte arrays.
 *
 * This function constructs a `Dictionary` directly from the binary data
 * of each dictionary component file, without requiring filesystem access.
 * This is useful for loading dictionaries from OPFS or other browser storage.
 *
 * # Arguments
 *
 * * `metadata` - The contents of `metadata.json`
 * * `dict_trie` - The contents of `dict.trie` (char-wise double-array trie)
 * * `dict_vals_idx` - The contents of `dict.valsidx` (values index)
 * * `dict_vals` - The contents of `dict.vals` (word value data)
 * * `dict_words_idx` - The contents of `dict.wordsidx` (word details index)
 * * `dict_words` - The contents of `dict.words` (word details)
 * * `matrix_mtx` - The contents of `matrix.mtx` (connection cost matrix)
 * * `char_def` - The contents of `char_def.bin` (character definitions)
 * * `unk` - The contents of `unk.bin` (unknown word dictionary)
 *
 * # Returns
 *
 * A `Dictionary` instance constructed from the provided byte data.
 *
 * # Breaking change (dictionary format version 2)
 *
 * Dictionaries built before Lindera v6 shipped a byte-wise automaton as
 * `dict.da`; that argument was replaced by `dict_trie` + `dict_vals_idx`.
 * Rebuild the dictionary or download a matching prebuilt one.
 * @param {Uint8Array} metadata
 * @param {Uint8Array} dict_trie
 * @param {Uint8Array} dict_vals_idx
 * @param {Uint8Array} dict_vals
 * @param {Uint8Array} dict_words_idx
 * @param {Uint8Array} dict_words
 * @param {Uint8Array} matrix_mtx
 * @param {Uint8Array} char_def
 * @param {Uint8Array} unk
 * @returns {Dictionary}
 */
export function loadDictionaryFromBytes(metadata, dict_trie, dict_vals_idx, dict_vals, dict_words_idx, dict_words, matrix_mtx, char_def, unk) {
    const ptr0 = passArray8ToWasm0(metadata, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(dict_trie, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(dict_vals_idx, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(dict_vals, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passArray8ToWasm0(dict_words_idx, wasm.__wbindgen_malloc);
    const len4 = WASM_VECTOR_LEN;
    const ptr5 = passArray8ToWasm0(dict_words, wasm.__wbindgen_malloc);
    const len5 = WASM_VECTOR_LEN;
    const ptr6 = passArray8ToWasm0(matrix_mtx, wasm.__wbindgen_malloc);
    const len6 = WASM_VECTOR_LEN;
    const ptr7 = passArray8ToWasm0(char_def, wasm.__wbindgen_malloc);
    const len7 = WASM_VECTOR_LEN;
    const ptr8 = passArray8ToWasm0(unk, wasm.__wbindgen_malloc);
    const len8 = WASM_VECTOR_LEN;
    const ret = wasm.loadDictionaryFromBytes(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Dictionary.__wrap(ret[0]);
}

/**
 * Loads a prebuilt user dictionary (`.bin`) from bytes.
 *
 * The bytes are the output of `lindera build --user` (a serialized user
 * dictionary), obtained in JavaScript via `fetch`, a file input, or OPFS.
 * @param {Uint8Array} bytes
 * @returns {UserDictionary}
 */
export function loadUserDictionaryBinFromBytes(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.loadUserDictionaryBinFromBytes(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return UserDictionary.__wrap(ret[0]);
}

/**
 * Builds a user dictionary from CSV bytes.
 *
 * The bytes typically come from `fetch`, an `<input type="file">` element,
 * or OPFS. The content must be UTF-8. Rows follow either the simple format
 * defined by the metadata's user dictionary schema (for IPADIC:
 * `surface,part_of_speech,reading`) or the full dictionary format; pass the
 * metadata of the system dictionary the user dictionary will be used with
 * (e.g. `dictionary.metadata`).
 *
 * The result feeds `Tokenizer`'s user-dictionary argument or
 * `TokenizerBuilder.setUserDictionaryInstance()`.
 * @param {Uint8Array} csv
 * @param {Metadata} metadata
 * @returns {UserDictionary}
 */
export function loadUserDictionaryFromBytes(csv, metadata) {
    const ptr0 = passArray8ToWasm0(csv, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(metadata, Metadata);
    var ptr1 = metadata.__destroy_into_raw();
    const ret = wasm.loadUserDictionaryFromBytes(ptr0, len0, ptr1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return UserDictionary.__wrap(ret[0]);
}

/**
 * @param {string} uri
 * @returns {Dictionary}
 */
export function load_dictionary(uri) {
    const ptr0 = passStringToWasm0(uri, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.load_dictionary(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Dictionary.__wrap(ret[0]);
}

/**
 * @param {Uint8Array} metadata
 * @param {Uint8Array} dict_trie
 * @param {Uint8Array} dict_vals_idx
 * @param {Uint8Array} dict_vals
 * @param {Uint8Array} dict_words_idx
 * @param {Uint8Array} dict_words
 * @param {Uint8Array} matrix_mtx
 * @param {Uint8Array} char_def
 * @param {Uint8Array} unk
 * @returns {Dictionary}
 */
export function load_dictionary_from_bytes(metadata, dict_trie, dict_vals_idx, dict_vals, dict_words_idx, dict_words, matrix_mtx, char_def, unk) {
    const ptr0 = passArray8ToWasm0(metadata, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(dict_trie, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(dict_vals_idx, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(dict_vals, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passArray8ToWasm0(dict_words_idx, wasm.__wbindgen_malloc);
    const len4 = WASM_VECTOR_LEN;
    const ptr5 = passArray8ToWasm0(dict_words, wasm.__wbindgen_malloc);
    const len5 = WASM_VECTOR_LEN;
    const ptr6 = passArray8ToWasm0(matrix_mtx, wasm.__wbindgen_malloc);
    const len6 = WASM_VECTOR_LEN;
    const ptr7 = passArray8ToWasm0(char_def, wasm.__wbindgen_malloc);
    const len7 = WASM_VECTOR_LEN;
    const ptr8 = passArray8ToWasm0(unk, wasm.__wbindgen_malloc);
    const len8 = WASM_VECTOR_LEN;
    const ret = wasm.load_dictionary_from_bytes(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return Dictionary.__wrap(ret[0]);
}

/**
 * @param {Uint8Array} bytes
 * @returns {UserDictionary}
 */
export function load_user_dictionary_bin_from_bytes(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.load_user_dictionary_bin_from_bytes(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return UserDictionary.__wrap(ret[0]);
}

/**
 * @param {Uint8Array} csv
 * @param {Metadata} metadata
 * @returns {UserDictionary}
 */
export function load_user_dictionary_from_bytes(csv, metadata) {
    const ptr0 = passArray8ToWasm0(csv, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    _assertClass(metadata, Metadata);
    var ptr1 = metadata.__destroy_into_raw();
    const ret = wasm.load_user_dictionary_from_bytes(ptr0, len0, ptr1);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return UserDictionary.__wrap(ret[0]);
}

/**
 * Returns the version of the lindera-wasm package.
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_92b29b0548f8b746: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_fa956cfa2d1bd751: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_c25d447a39f5578f: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_aca499c5de7ff5e5: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_2f76dc55065b4273: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_1ff95bcc5517c252: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_ea9085d691f535d3: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_a27215656b807791: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_undefined_c05833b95a3cf397: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_e659fcf7b0e32763: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_db4c3b15f63fc170: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_394265ed1e1b84ee: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_b0ca35b86a603356: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_344f42d3211c4765: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_8a2dd23819f8a60a: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_done_89b2b13e91a60321: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_015dc610cd81ede0: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_get_507a50627bffa49b: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_c7eb1f358a7654df: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_6e0ad6d2a41b06f6: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_4480b9e0068a8adb: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Map_e5b5e3db98422fcc: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Map;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_309b927aaf7a3fc7: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_0677c962b281d01a: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_04f36e4056f1b851: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_6f722e4a93058b71: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_1f0964f4a5e2c6d8: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_370319915dc99107: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_new_32b398fb48b6d94a: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_cd45aabdf6073e84: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_da52cf8fe3429cb2: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_next_6dbf2c0ac8cde20f: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_71f2aa1cb3d1e37e: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_prototypesetcall_4770620bbe4688a0: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_d2ae3af0c1217ae6: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_set_8535240470bf2500: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_value_a5d5488a9589444a: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./lindera_wasm_bg.js": import0,
    };
}

const DictionaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_dictionary_free(ptr, 1));
const FieldDefinitionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_fielddefinition_free(ptr, 1));
const LinderaErrorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_linderaerror_free(ptr, 1));
const MetadataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_metadata_free(ptr, 1));
const PenaltyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_penalty_free(ptr, 1));
const SchemaFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_schema_free(ptr, 1));
const TokenizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tokenizer_free(ptr, 1));
const TokenizerBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_tokenizerbuilder_free(ptr, 1));
const UserDictionaryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_userdictionary_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('lindera_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
