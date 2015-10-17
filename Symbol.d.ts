/**
 * Needed beacuse we use symbols interally to track nodes uniquely in workflows.
 * We're targeting Node >= v4, so we know that Symbol will be implemented (but many other ES6 things will not).
 * Thus, .d.ts shims
 */

/* tslint:disable:interface-name no-use-before-declare */
interface Symbol {
    [Symbol.toStringTag]: string;

    /** Returns a string representation of an object. */
    toString(): string;

    /** Returns the primitive value of the specified object. */
    valueOf(): Object;
}

interface SymbolConstructor {
    /**
     * A reference to the prototype.
     */
    prototype: Symbol;

    // Well-known Symbols

    /**
     * A method that determines if a constructor object recognizes an object as one of the
     * constructor's instances. Called by the semantics of the instanceof operator.
     */
    hasInstance: symbol;

    /**
     * A Boolean value that if true indicates that an object should flatten to its array elements
     * by Array.prototype.concat.
     */
    isConcatSpreadable: symbol;

    /**
     * A method that returns the default iterator for an object. Called by the semantics of the
     * for-of statement.
     */
    iterator: symbol;

    /**
     * A regular expression method that matches the regular expression against a string. Called
     * by the String.prototype.match method.
     */
    match: symbol;

    /**
     * A regular expression method that replaces matched substrings of a string. Called by the
     * String.prototype.replace method.
     */
    replace: symbol;

    /**
     * A regular expression method that returns the index within a string that matches the
     * regular expression. Called by the String.prototype.search method.
     */
    search: symbol;

    /**
     * A function valued property that is the constructor function that is used to create
     * derived objects.
     */
    species: symbol;

    /**
     * A regular expression method that splits a string at the indices that match the regular
     * expression. Called by the String.prototype.split method.
     */
    split: symbol;

    /**
     * A method that converts an object to a corresponding primitive value.
     * Called by the ToPrimitive abstract operation.
     */
    toPrimitive: symbol;

    /**
     * A String value that is used in the creation of the default string description of an object.
     * Called by the built-in method Object.prototype.toString.
     */
    toStringTag: symbol;

    /**
     * An Object whose own property names are property names that are excluded from the 'with'
     * environment bindings of the associated objects.
     */
    unscopables: symbol;

    /**
     * Returns a new unique Symbol value.
     * @param  description Description of the new Symbol object.
     */
    (description?: string|number): symbol;

    /**
     * Returns a Symbol object from the global symbol registry matching the given key if found.
     * Otherwise, returns a new symbol with this key.
     * @param key key to search for.
     */
    for(key: string): symbol;

    /**
     * Returns a key from the global symbol registry matching the given Symbol if found.
     * Otherwise, returns a undefined.
     * @param sym Symbol to find the key for.
     */
    keyFor(sym: symbol): string;
}

interface ObjectConstructor {
  getOwnPropertySymbols(o: any): symbol[];
}
declare var Symbol: SymbolConstructor;
