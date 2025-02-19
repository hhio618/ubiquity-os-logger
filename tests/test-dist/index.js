import './sourcemap-register.cjs';import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 506:
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
class ArraySet {
  constructor() {
    this._array = [];
    this._set = new Map();
  }

  /**
   * Static method for creating ArraySet instances from an existing array.
   */
  static fromArray(aArray, aAllowDuplicates) {
    const set = new ArraySet();
    for (let i = 0, len = aArray.length; i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  }

  /**
   * Return how many unique items are in this ArraySet. If duplicates have been
   * added, than those do not count towards the size.
   *
   * @returns Number
   */
  size() {
    return this._set.size;
  }

  /**
   * Add the given string to this set.
   *
   * @param String aStr
   */
  add(aStr, aAllowDuplicates) {
    const isDuplicate = this.has(aStr);
    const idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      this._set.set(aStr, idx);
    }
  }

  /**
   * Is the given string a member of this set?
   *
   * @param String aStr
   */
  has(aStr) {
      return this._set.has(aStr);
  }

  /**
   * What is the index of the given string in the array?
   *
   * @param String aStr
   */
  indexOf(aStr) {
    const idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
    throw new Error('"' + aStr + '" is not in the set.');
  }

  /**
   * What is the element at the given index?
   *
   * @param Number aIdx
   */
  at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error("No element indexed by " + aIdx);
  }

  /**
   * Returns the array representation of this set (which has the proper indices
   * indicated by indexOf). Note that this is a copy of the internal array used
   * for storing the members so that no one can mess with internal state.
   */
  toArray() {
    return this._array.slice();
  }
}
exports.C = ArraySet;


/***/ }),

/***/ 259:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const base64 = __nccwpck_require__(543);

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

const VLQ_BASE_SHIFT = 5;

// binary: 100000
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
const VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
const VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
// eslint-disable-next-line no-unused-vars
function fromVLQSigned(aValue) {
  const isNegative = (aValue & 1) === 1;
  const shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  let encoded = "";
  let digit;

  let vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};


/***/ }),

/***/ 543:
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function(number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};


/***/ }),

/***/ 277:
/***/ ((__unused_webpack_module, exports) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  const mid = Math.floor((aHigh - aLow) / 2) + aLow;
  const cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  } else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    }
    return mid;
  }

  // Our needle is less than aHaystack[mid].
  if (mid - aLow > 1) {
    // The element is in the lower half.
    return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
  }

  // we are in termination case (3) or (2) and return the appropriate thing.
  if (aBias == exports.LEAST_UPPER_BOUND) {
    return mid;
  }
  return aLow < 0 ? -1 : aLow;
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  let index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};


/***/ }),

/***/ 433:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const util = __nccwpck_require__(616);

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  const lineA = mappingA.generatedLine;
  const lineB = mappingB.generatedLine;
  const columnA = mappingA.generatedColumn;
  const columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a negligible overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
class MappingList {
  constructor() {
    this._array = [];
    this._sorted = true;
    // Serves as infimum
    this._last = {generatedLine: -1, generatedColumn: 0};
  }

  /**
   * Iterate through internal items. This method takes the same arguments that
   * `Array.prototype.forEach` takes.
   *
   * NOTE: The order of the mappings is NOT guaranteed.
   */
  unsortedForEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  }

  /**
   * Add the given source mapping.
   *
   * @param Object aMapping
   */
  add(aMapping) {
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  }

  /**
   * Returns the flat, sorted array of mappings. The mappings are sorted by
   * generated position.
   *
   * WARNING: This method returns internal data without copying, for
   * performance. The return value must NOT be mutated, and should be treated as
   * an immutable borrow. If you want to take ownership, you must make your own
   * copy.
   */
  toArray() {
    if (!this._sorted) {
      this._array.sort(util.compareByGeneratedPositionsInflated);
      this._sorted = true;
    }
    return this._array;
  }
}

exports.P = MappingList;


/***/ }),

/***/ 293:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {



// Note: This file is replaced with "read-wasm-browser.js" when this module is
// bundled with a packager that takes package.json#browser fields into account.

const fs = __nccwpck_require__(896);
const path = __nccwpck_require__(928);

module.exports = function readWasm() {
  return new Promise((resolve, reject) => {
    const wasmPath = __nccwpck_require__.ab + "mappings.wasm";
    fs.readFile(__nccwpck_require__.ab + "mappings.wasm", null, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(data.buffer);
    });
  });
};

module.exports.initialize = _ => {
  console.debug("SourceMapConsumer.initialize is a no-op when running in node.js");
};


/***/ }),

/***/ 383:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

var __webpack_unused_export__;
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const util = __nccwpck_require__(616);
const binarySearch = __nccwpck_require__(277);
const ArraySet = (__nccwpck_require__(506)/* .ArraySet */ .C);
const base64VLQ = __nccwpck_require__(259); // eslint-disable-line no-unused-vars
const readWasm = __nccwpck_require__(293);
const wasm = __nccwpck_require__(692);

const INTERNAL = Symbol("smcInternal");

class SourceMapConsumer {
  constructor(aSourceMap, aSourceMapURL) {
    // If the constructor was called by super(), just return Promise<this>.
    // Yes, this is a hack to retain the pre-existing API of the base-class
    // constructor also being an async factory function.
    if (aSourceMap == INTERNAL) {
      return Promise.resolve(this);
    }

    return _factory(aSourceMap, aSourceMapURL);
  }

  static initialize(opts) {
    readWasm.initialize(opts["lib/mappings.wasm"]);
  }

  static fromSourceMap(aSourceMap, aSourceMapURL) {
    return _factoryBSM(aSourceMap, aSourceMapURL);
  }

  /**
   * Construct a new `SourceMapConsumer` from `rawSourceMap` and `sourceMapUrl`
   * (see the `SourceMapConsumer` constructor for details. Then, invoke the `async
   * function f(SourceMapConsumer) -> T` with the newly constructed consumer, wait
   * for `f` to complete, call `destroy` on the consumer, and return `f`'s return
   * value.
   *
   * You must not use the consumer after `f` completes!
   *
   * By using `with`, you do not have to remember to manually call `destroy` on
   * the consumer, since it will be called automatically once `f` completes.
   *
   * ```js
   * const xSquared = await SourceMapConsumer.with(
   *   myRawSourceMap,
   *   null,
   *   async function (consumer) {
   *     // Use `consumer` inside here and don't worry about remembering
   *     // to call `destroy`.
   *
   *     const x = await whatever(consumer);
   *     return x * x;
   *   }
   * );
   *
   * // You may not use that `consumer` anymore out here; it has
   * // been destroyed. But you can use `xSquared`.
   * console.log(xSquared);
   * ```
   */
  static async with(rawSourceMap, sourceMapUrl, f) {
    const consumer = await new SourceMapConsumer(rawSourceMap, sourceMapUrl);
    try {
      return await f(consumer);
    } finally {
      consumer.destroy();
    }
  }

  /**
   * Iterate over each mapping between an original source/line/column and a
   * generated line/column in this source map.
   *
   * @param Function aCallback
   *        The function that is called with each mapping.
   * @param Object aContext
   *        Optional. If specified, this object will be the value of `this` every
   *        time that `aCallback` is called.
   * @param aOrder
   *        Either `SourceMapConsumer.GENERATED_ORDER` or
   *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
   *        iterate over the mappings sorted by the generated file's line/column
   *        order or the original's source/line/column order, respectively. Defaults to
   *        `SourceMapConsumer.GENERATED_ORDER`.
   */
  eachMapping(aCallback, aContext, aOrder) {
    throw new Error("Subclasses must implement eachMapping");
  }

  /**
   * Returns all generated line and column information for the original source,
   * line, and column provided. If no column is provided, returns all mappings
   * corresponding to a either the line we are searching for or the next
   * closest line that has any mappings. Otherwise, returns all mappings
   * corresponding to the given line and either the column we are searching for
   * or the next closest column that has any offsets.
   *
   * The only argument is an object with the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.  The line number is 1-based.
   *   - column: Optional. the column number in the original source.
   *    The column number is 0-based.
   *
   * and an array of objects is returned, each with the following properties:
   *
   *   - line: The line number in the generated source, or null.  The
   *    line number is 1-based.
   *   - column: The column number in the generated source, or null.
   *    The column number is 0-based.
   */
  allGeneratedPositionsFor(aArgs) {
    throw new Error("Subclasses must implement allGeneratedPositionsFor");
  }

  destroy() {
    throw new Error("Subclasses must implement destroy");
  }
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;
SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
class BasicSourceMapConsumer extends SourceMapConsumer {
  constructor(aSourceMap, aSourceMapURL) {
    return super(INTERNAL).then(that => {
      let sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      const version = util.getArg(sourceMap, "version");
      const sources = util.getArg(sourceMap, "sources").map(String);
      // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
      // requires the array) to play nice here.
      const names = util.getArg(sourceMap, "names", []);
      const sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      const sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      const mappings = util.getArg(sourceMap, "mappings");
      const file = util.getArg(sourceMap, "file", null);

      // Once again, Sass deviates from the spec and supplies the version as a
      // string rather than a number, so we use loose equality checking here.
      if (version != that._version) {
        throw new Error("Unsupported version: " + version);
      }

      that._sourceLookupCache = new Map();

      // Pass `true` below to allow duplicate names and sources. While source maps
      // are intended to be compressed and deduplicated, the TypeScript compiler
      // sometimes generates source maps with duplicates in them. See Github issue
      // #72 and bugzil.la/889492.
      that._names = ArraySet.fromArray(names.map(String), true);
      that._sources = ArraySet.fromArray(sources, true);

      that._absoluteSources = ArraySet.fromArray(that._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      }), true);

      that.sourceRoot = sourceRoot;
      that.sourcesContent = sourcesContent;
      that._mappings = mappings;
      that._sourceMapURL = aSourceMapURL;
      that.file = file;

      that._computedColumnSpans = false;
      that._mappingsPtr = 0;
      that._wasm = null;

      return wasm().then(w => {
        that._wasm = w;
        return that;
      });
    });
  }

  /**
   * Utility function to find the index of a source.  Returns -1 if not
   * found.
   */
  _findSourceIndex(aSource) {
    // In the most common usecases, we'll be constantly looking up the index for the same source
    // files, so we cache the index lookup to avoid constantly recomputing the full URLs.
    const cachedIndex = this._sourceLookupCache.get(aSource);
    if (typeof cachedIndex === "number") {
      return cachedIndex;
    }

    // Treat the source as map-relative overall by default.
    const sourceAsMapRelative = util.computeSourceURL(null, aSource, this._sourceMapURL);
    if (this._absoluteSources.has(sourceAsMapRelative)) {
      const index = this._absoluteSources.indexOf(sourceAsMapRelative);
      this._sourceLookupCache.set(aSource, index);
      return index;
    }

    // Fall back to treating the source as sourceRoot-relative.
    const sourceAsSourceRootRelative = util.computeSourceURL(this.sourceRoot, aSource, this._sourceMapURL);
    if (this._absoluteSources.has(sourceAsSourceRootRelative)) {
      const index = this._absoluteSources.indexOf(sourceAsSourceRootRelative);
      this._sourceLookupCache.set(aSource, index);
      return index;
    }

    // To avoid this cache growing forever, we do not cache lookup misses.
    return -1;
  }

  /**
   * Create a BasicSourceMapConsumer from a SourceMapGenerator.
   *
   * @param SourceMapGenerator aSourceMap
   *        The source map that will be consumed.
   * @param String aSourceMapURL
   *        The URL at which the source map can be found (optional)
   * @returns BasicSourceMapConsumer
   */
  static fromSourceMap(aSourceMap, aSourceMapURL) {
    return new BasicSourceMapConsumer(aSourceMap.toString());
  }

  get sources() {
    return this._absoluteSources.toArray();
  }

  _getMappingsPtr() {
    if (this._mappingsPtr === 0) {
      this._parseMappings();
    }

    return this._mappingsPtr;
  }

  /**
   * Parse the mappings in a string in to a data structure which we can easily
   * query (the ordered arrays in the `this.__generatedMappings` and
   * `this.__originalMappings` properties).
   */
  _parseMappings() {
    const aStr = this._mappings;
    const size = aStr.length;

    const mappingsBufPtr = this._wasm.exports.allocate_mappings(size);
    const mappingsBuf = new Uint8Array(this._wasm.exports.memory.buffer, mappingsBufPtr, size);
    for (let i = 0; i < size; i++) {
      mappingsBuf[i] = aStr.charCodeAt(i);
    }

    const mappingsPtr = this._wasm.exports.parse_mappings(mappingsBufPtr);

    if (!mappingsPtr) {
      const error = this._wasm.exports.get_last_error();
      let msg = `Error parsing mappings (code ${error}): `;

      // XXX: keep these error codes in sync with `fitzgen/source-map-mappings`.
      switch (error) {
        case 1:
          msg += "the mappings contained a negative line, column, source index, or name index";
          break;
        case 2:
          msg += "the mappings contained a number larger than 2**32";
          break;
        case 3:
          msg += "reached EOF while in the middle of parsing a VLQ";
          break;
        case 4:
          msg += "invalid base 64 character while parsing a VLQ";
          break;
        default:
          msg += "unknown error code";
          break;
      }

      throw new Error(msg);
    }

    this._mappingsPtr = mappingsPtr;
  }

  eachMapping(aCallback, aContext, aOrder) {
    const context = aContext || null;
    const order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    this._wasm.withMappingCallback(
      mapping => {
        if (mapping.source !== null) {
          mapping.source = this._absoluteSources.at(mapping.source);

          if (mapping.name !== null) {
            mapping.name = this._names.at(mapping.name);
          }
        }
        if (this._computedColumnSpans && mapping.lastGeneratedColumn === null) {
          mapping.lastGeneratedColumn = Infinity;
        }

        aCallback.call(context, mapping);
      },
      () => {
        switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          this._wasm.exports.by_generated_location(this._getMappingsPtr());
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          this._wasm.exports.by_original_location(this._getMappingsPtr());
          break;
        default:
          throw new Error("Unknown order of iteration.");
        }
      }
    );
  }

  allGeneratedPositionsFor(aArgs) {
    let source = util.getArg(aArgs, "source");
    const originalLine = util.getArg(aArgs, "line");
    const originalColumn = aArgs.column || 0;

    source = this._findSourceIndex(source);
    if (source < 0) {
      return [];
    }

    if (originalLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (originalColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    const mappings = [];

    this._wasm.withMappingCallback(
      m => {
        let lastColumn = m.lastGeneratedColumn;
        if (this._computedColumnSpans && lastColumn === null) {
          lastColumn = Infinity;
        }
        mappings.push({
          line: m.generatedLine,
          column: m.generatedColumn,
          lastColumn,
        });
      }, () => {
        this._wasm.exports.all_generated_locations_for(
          this._getMappingsPtr(),
          source,
          originalLine - 1,
          "column" in aArgs,
          originalColumn
        );
      }
    );

    return mappings;
  }

  destroy() {
    if (this._mappingsPtr !== 0) {
      this._wasm.exports.free_mappings(this._mappingsPtr);
      this._mappingsPtr = 0;
    }
  }

  /**
   * Compute the last column for each generated mapping. The last column is
   * inclusive.
   */
  computeColumnSpans() {
    if (this._computedColumnSpans) {
      return;
    }

    this._wasm.exports.compute_column_spans(this._getMappingsPtr());
    this._computedColumnSpans = true;
  }

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.  The line number
   *     is 1-based.
   *   - column: The column number in the generated source.  The column
   *     number is 0-based.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the original source, or null.  The
   *     column number is 0-based.
   *   - name: The original identifier, or null.
   */
  originalPositionFor(aArgs) {
    const needle = {
      generatedLine: util.getArg(aArgs, "line"),
      generatedColumn: util.getArg(aArgs, "column")
    };

    if (needle.generatedLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (needle.generatedColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    let bias = util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND);
    if (bias == null) {
      bias = SourceMapConsumer.GREATEST_LOWER_BOUND;
    }

    let mapping;
    this._wasm.withMappingCallback(m => mapping = m, () => {
      this._wasm.exports.original_location_for(
        this._getMappingsPtr(),
        needle.generatedLine - 1,
        needle.generatedColumn,
        bias
      );
    });

    if (mapping) {
      if (mapping.generatedLine === needle.generatedLine) {
        let source = util.getArg(mapping, "source", null);
        if (source !== null) {
          source = this._absoluteSources.at(source);
        }

        let name = util.getArg(mapping, "name", null);
        if (name !== null) {
          name = this._names.at(name);
        }

        return {
          source,
          line: util.getArg(mapping, "originalLine", null),
          column: util.getArg(mapping, "originalColumn", null),
          name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  }

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function(sc) { return sc == null; });
  }

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    const index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }

    throw new Error('"' + aSource + '" is not in the SourceMap.');
  }

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.  The line number
   *     is 1-based.
   *   - column: The column number in the original source.  The column
   *     number is 0-based.
   *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
   *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
   *     closest element that is smaller than or greater than the one we are
   *     searching for, respectively, if the exact element cannot be found.
   *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the generated source, or null.
   *     The column number is 0-based.
   */
  generatedPositionFor(aArgs) {
    let source = util.getArg(aArgs, "source");
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    const needle = {
      source,
      originalLine: util.getArg(aArgs, "line"),
      originalColumn: util.getArg(aArgs, "column")
    };

    if (needle.originalLine < 1) {
      throw new Error("Line numbers must be >= 1");
    }

    if (needle.originalColumn < 0) {
      throw new Error("Column numbers must be >= 0");
    }

    let bias = util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND);
    if (bias == null) {
      bias = SourceMapConsumer.GREATEST_LOWER_BOUND;
    }

    let mapping;
    this._wasm.withMappingCallback(m => mapping = m, () => {
      this._wasm.exports.generated_location_for(
        this._getMappingsPtr(),
        needle.source,
        needle.originalLine - 1,
        needle.originalColumn,
        bias
      );
    });

    if (mapping) {
      if (mapping.source === needle.source) {
        let lastColumn = mapping.lastGeneratedColumn;
        if (this._computedColumnSpans && lastColumn === null) {
          lastColumn = Infinity;
        }
        return {
          line: util.getArg(mapping, "generatedLine", null),
          column: util.getArg(mapping, "generatedColumn", null),
          lastColumn,
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  }
}

BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
__webpack_unused_export__ = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
class IndexedSourceMapConsumer extends SourceMapConsumer {
  constructor(aSourceMap, aSourceMapURL) {
    return super(INTERNAL).then(that => {
      let sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      const version = util.getArg(sourceMap, "version");
      const sections = util.getArg(sourceMap, "sections");

      if (version != that._version) {
        throw new Error("Unsupported version: " + version);
      }

      let lastOffset = {
        line: -1,
        column: 0
      };
      return Promise.all(sections.map(s => {
        if (s.url) {
          // The url field will require support for asynchronicity.
          // See https://github.com/mozilla/source-map/issues/16
          throw new Error("Support for url field in sections not implemented.");
        }
        const offset = util.getArg(s, "offset");
        const offsetLine = util.getArg(offset, "line");
        const offsetColumn = util.getArg(offset, "column");

        if (offsetLine < lastOffset.line ||
            (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;

        const cons = new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL);
        return cons.then(consumer => {
          return {
            generatedOffset: {
              // The offset fields are 0-based, but we use 1-based indices when
              // encoding/decoding from VLQ.
              generatedLine: offsetLine + 1,
              generatedColumn: offsetColumn + 1
            },
            consumer
          };
        });
      })).then(s => {
        that._sections = s;
        return that;
      });
    });
  }

  /**
   * The list of original sources.
   */
  get sources() {
    const sources = [];
    for (let i = 0; i < this._sections.length; i++) {
      for (let j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }

  /**
   * Returns the original source, line, and column information for the generated
   * source's line and column positions provided. The only argument is an object
   * with the following properties:
   *
   *   - line: The line number in the generated source.  The line number
   *     is 1-based.
   *   - column: The column number in the generated source.  The column
   *     number is 0-based.
   *
   * and an object is returned with the following properties:
   *
   *   - source: The original source file, or null.
   *   - line: The line number in the original source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the original source, or null.  The
   *     column number is 0-based.
   *   - name: The original identifier, or null.
   */
  originalPositionFor(aArgs) {
    const needle = {
      generatedLine: util.getArg(aArgs, "line"),
      generatedColumn: util.getArg(aArgs, "column")
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    const sectionIndex = binarySearch.search(needle, this._sections,
      function(aNeedle, section) {
        const cmp = aNeedle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (aNeedle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    const section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  }

  /**
   * Return true if we have the source content for every source in the source
   * map, false otherwise.
   */
  hasContentsOfAllSources() {
    return this._sections.every(function(s) {
      return s.consumer.hasContentsOfAllSources();
    });
  }

  /**
   * Returns the original source content. The only argument is the url of the
   * original source file. Returns null if no original source content is
   * available.
   */
  sourceContentFor(aSource, nullOnMissing) {
    for (let i = 0; i < this._sections.length; i++) {
      const section = this._sections[i];

      const content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    throw new Error('"' + aSource + '" is not in the SourceMap.');
  }

  _findSectionIndex(source) {
    for (let i = 0; i < this._sections.length; i++) {
      const { consumer } = this._sections[i];
      if (consumer._findSourceIndex(source) !== -1) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Returns the generated line and column information for the original source,
   * line, and column positions provided. The only argument is an object with
   * the following properties:
   *
   *   - source: The filename of the original source.
   *   - line: The line number in the original source.  The line number
   *     is 1-based.
   *   - column: The column number in the original source.  The column
   *     number is 0-based.
   *
   * and an object is returned with the following properties:
   *
   *   - line: The line number in the generated source, or null.  The
   *     line number is 1-based.
   *   - column: The column number in the generated source, or null.
   *     The column number is 0-based.
   */
  generatedPositionFor(aArgs) {
    const index = this._findSectionIndex(util.getArg(aArgs, "source"));
    const section = index >= 0 ? this._sections[index] : null;
    const nextSection =
      index >= 0 && index + 1 < this._sections.length
        ? this._sections[index + 1]
        : null;

    const generatedPosition =
      section && section.consumer.generatedPositionFor(aArgs);
    if (generatedPosition && generatedPosition.line !== null) {
      const lineShift = section.generatedOffset.generatedLine - 1;
      const columnShift = section.generatedOffset.generatedColumn - 1;

      if (generatedPosition.line === 1) {
        generatedPosition.column += columnShift;
        if (typeof generatedPosition.lastColumn === "number") {
          generatedPosition.lastColumn += columnShift;
        }
      }

      if (
        generatedPosition.lastColumn === Infinity &&
        nextSection &&
        generatedPosition.line === nextSection.generatedOffset.generatedLine
      ) {
        generatedPosition.lastColumn =
          nextSection.generatedOffset.generatedColumn - 2;
      }
      generatedPosition.line += lineShift;

      return generatedPosition;
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  }

  allGeneratedPositionsFor(aArgs) {
    const index = this._findSectionIndex(util.getArg(aArgs, "source"));
    const section = index >= 0 ? this._sections[index] : null;
    const nextSection =
      index >= 0 && index + 1 < this._sections.length
        ? this._sections[index + 1]
        : null;

    if (!section) return [];

    return section.consumer.allGeneratedPositionsFor(aArgs).map(
      generatedPosition => {
        const lineShift = section.generatedOffset.generatedLine - 1;
        const columnShift = section.generatedOffset.generatedColumn - 1;

        if (generatedPosition.line === 1) {
          generatedPosition.column += columnShift;
          if (typeof generatedPosition.lastColumn === "number") {
            generatedPosition.lastColumn += columnShift;
          }
        }

        if (
          generatedPosition.lastColumn === Infinity &&
          nextSection &&
          generatedPosition.line === nextSection.generatedOffset.generatedLine
        ) {
          generatedPosition.lastColumn =
            nextSection.generatedOffset.generatedColumn - 2;
        }
        generatedPosition.line += lineShift;

        return generatedPosition;
      }
    );
  }

  eachMapping(aCallback, aContext, aOrder) {
    this._sections.forEach((section, index) => {
      const nextSection =
        index + 1 < this._sections.length
          ? this._sections[index + 1]
          : null;
      const { generatedOffset } = section;

      const lineShift = generatedOffset.generatedLine - 1;
      const columnShift = generatedOffset.generatedColumn - 1;

      section.consumer.eachMapping(function(mapping) {
        if (mapping.generatedLine === 1) {
          mapping.generatedColumn += columnShift;

          if (typeof mapping.lastGeneratedColumn === "number") {
            mapping.lastGeneratedColumn += columnShift;
          }
        }

        if (
          mapping.lastGeneratedColumn === Infinity &&
          nextSection &&
          mapping.generatedLine === nextSection.generatedOffset.generatedLine
        ) {
          mapping.lastGeneratedColumn =
            nextSection.generatedOffset.generatedColumn - 2;
        }
        mapping.generatedLine += lineShift;

        aCallback.call(this, mapping);
      }, aContext, aOrder);
    });
  }

  computeColumnSpans() {
    for (let i = 0; i < this._sections.length; i++) {
      this._sections[i].consumer.computeColumnSpans();
    }
  }

  destroy() {
    for (let i = 0; i < this._sections.length; i++) {
      this._sections[i].consumer.destroy();
    }
  }
}
__webpack_unused_export__ = IndexedSourceMapConsumer;

/*
 * Cheat to get around inter-twingled classes.  `factory()` can be at the end
 * where it has access to non-hoisted classes, but it gets hoisted itself.
 */
function _factory(aSourceMap, aSourceMapURL) {
  let sourceMap = aSourceMap;
  if (typeof aSourceMap === "string") {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  const consumer = sourceMap.sections != null
      ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
      : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
  return Promise.resolve(consumer);
}

function _factoryBSM(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
}


/***/ }),

/***/ 658:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const base64VLQ = __nccwpck_require__(259);
const util = __nccwpck_require__(616);
const ArraySet = (__nccwpck_require__(506)/* .ArraySet */ .C);
const MappingList = (__nccwpck_require__(433)/* .MappingList */ .P);

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
class SourceMapGenerator {
  constructor(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, "file", null);
    this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
    this._skipValidation = util.getArg(aArgs, "skipValidation", false);
    this._sources = new ArraySet();
    this._names = new ArraySet();
    this._mappings = new MappingList();
    this._sourcesContents = null;
  }

  /**
   * Creates a new SourceMapGenerator based on a SourceMapConsumer
   *
   * @param aSourceMapConsumer The SourceMap.
   */
  static fromSourceMap(aSourceMapConsumer) {
    const sourceRoot = aSourceMapConsumer.sourceRoot;
    const generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot
    });
    aSourceMapConsumer.eachMapping(function(mapping) {
      const newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      let sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      const content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  }

  /**
   * Add a single mapping from original source line and column to the generated
   * source's line and column for this source map being created. The mapping
   * object should have the following properties:
   *
   *   - generated: An object with the generated line and column positions.
   *   - original: An object with the original line and column positions.
   *   - source: The original source file (relative to the sourceRoot).
   *   - name: An optional original token name for this mapping.
   */
  addMapping(aArgs) {
    const generated = util.getArg(aArgs, "generated");
    const original = util.getArg(aArgs, "original", null);
    let source = util.getArg(aArgs, "source", null);
    let name = util.getArg(aArgs, "name", null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source,
      name
    });
  }

  /**
   * Set the source content for a source file.
   */
  setSourceContent(aSourceFile, aSourceContent) {
    let source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  }

  /**
   * Applies the mappings of a sub-source-map for a specific source file to the
   * source map being generated. Each mapping to the supplied source file is
   * rewritten using the supplied source map. Note: The resolution for the
   * resulting mappings is the minimium of this map and the supplied map.
   *
   * @param aSourceMapConsumer The source map to be applied.
   * @param aSourceFile Optional. The filename of the source file.
   *        If omitted, SourceMapConsumer's file property will be used.
   * @param aSourceMapPath Optional. The dirname of the path to the source map
   *        to be applied. If relative, it is relative to the SourceMapConsumer.
   *        This parameter is needed when the two source maps aren't in the same
   *        directory, and the source map to be applied contains relative source
   *        paths. If so, those relative source paths need to be rewritten
   *        relative to the SourceMapGenerator.
   */
  applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    let sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          "SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, " +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    const sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    const newSources = this._mappings.toArray().length > 0
      ? new ArraySet()
      : this._sources;
    const newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function(mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        const original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      const source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      const name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function(srcFile) {
      const content = aSourceMapConsumer.sourceContentFor(srcFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          srcFile = util.join(aSourceMapPath, srcFile);
        }
        if (sourceRoot != null) {
          srcFile = util.relative(sourceRoot, srcFile);
        }
        this.setSourceContent(srcFile, content);
      }
    }, this);
  }

  /**
   * A mapping can have one of the three levels of data:
   *
   *   1. Just the generated position.
   *   2. The Generated position, original position, and original source.
   *   3. Generated and original position, original source, as well as a name
   *      token.
   *
   * To maintain consistency, we validate that any new mapping being added falls
   * in to one of these categories.
   */
  _validateMapping(aGenerated, aOriginal, aSource, aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        throw new Error(
            "original.line and original.column are not numbers -- you probably meant to omit " +
            "the original mapping entirely and only map the generated position. If so, pass " +
            "null for the original mapping instead of an object with empty or null values."
        );
    }

    if (aGenerated && "line" in aGenerated && "column" in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.

    } else if (aGenerated && "line" in aGenerated && "column" in aGenerated
             && aOriginal && "line" in aOriginal && "column" in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.

    } else {
      throw new Error("Invalid mapping: " + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  }

  /**
   * Serialize the accumulated mappings in to the stream of base 64 VLQs
   * specified by the source map format.
   */
  _serializeMappings() {
    let previousGeneratedColumn = 0;
    let previousGeneratedLine = 1;
    let previousOriginalColumn = 0;
    let previousOriginalLine = 0;
    let previousName = 0;
    let previousSource = 0;
    let result = "";
    let next;
    let mapping;
    let nameIdx;
    let sourceIdx;

    const mappings = this._mappings.toArray();
    for (let i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = "";

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ";";
          previousGeneratedLine++;
        }
      } else if (i > 0) {
        if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
          continue;
        }
        next += ",";
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  }

  _generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function(source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      const key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  }

  /**
   * Externalize the source map.
   */
  toJSON() {
    const map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  }

  /**
   * Render the source map being generated to a string.
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

SourceMapGenerator.prototype._version = 3;
exports.SourceMapGenerator = SourceMapGenerator;


/***/ }),

/***/ 862:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const SourceMapGenerator = (__nccwpck_require__(658).SourceMapGenerator);
const util = __nccwpck_require__(616);

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
const REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
const NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
const isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
class SourceNode {
  constructor(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null) this.add(aChunks);
  }

  /**
   * Creates a SourceNode from generated code and a SourceMapConsumer.
   *
   * @param aGeneratedCode The generated code
   * @param aSourceMapConsumer The SourceMap for the generated code
   * @param aRelativePath Optional. The path that relative sources in the
   *        SourceMapConsumer should be relative to.
   */
  static fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    const node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    const remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    let remainingLinesIndex = 0;
    const shiftNextLine = function() {
      const lineContents = getNextLine();
      // The last line of a file might not have a newline.
      const newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    let lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    let lastMapping = null;
    let nextLine;

    aSourceMapConsumer.eachMapping(function(mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          nextLine = remainingLines[remainingLinesIndex] || "";
          const code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        nextLine = remainingLines[remainingLinesIndex] || "";
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      const content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        const source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  }

  /**
   * Add a chunk of generated JS to this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function(chunk) {
        this.add(chunk);
      }, this);
    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    } else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  }

  /**
   * Add a chunk of generated JS to the beginning of this source node.
   *
   * @param aChunk A string snippet of generated JS code, another instance of
   *        SourceNode, or an array where each member is one of those things.
   */
  prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (let i = aChunk.length - 1; i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    } else {
      throw new TypeError(
        "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
      );
    }
    return this;
  }

  /**
   * Walk over the tree of JS snippets in this node and its children. The
   * walking function is called once for each snippet of JS and is passed that
   * snippet and the its original associated source's line/column location.
   *
   * @param aFn The traversal function.
   */
  walk(aFn) {
    let chunk;
    for (let i = 0, len = this.children.length; i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      } else if (chunk !== "") {
        aFn(chunk, { source: this.source,
                      line: this.line,
                      column: this.column,
                      name: this.name });
      }
    }
  }

  /**
   * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
   * each of `this.children`.
   *
   * @param aSep The separator.
   */
  join(aSep) {
    let newChildren;
    let i;
    const len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0; i < len - 1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  }

  /**
   * Call String.prototype.replace on the very right-most source snippet. Useful
   * for trimming whitespace from the end of a source node, etc.
   *
   * @param aPattern The pattern to replace.
   * @param aReplacement The thing to replace the pattern with.
   */
  replaceRight(aPattern, aReplacement) {
    const lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    } else if (typeof lastChild === "string") {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    } else {
      this.children.push("".replace(aPattern, aReplacement));
    }
    return this;
  }

  /**
   * Set the source content for a source file. This will be added to the SourceMapGenerator
   * in the sourcesContent field.
   *
   * @param aSourceFile The filename of the source file
   * @param aSourceContent The content of the source file
   */
  setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  }

  /**
   * Walk over the tree of SourceNodes. The walking function is called for each
   * source file content and is passed the filename and source content.
   *
   * @param aFn The traversal function.
   */
  walkSourceContents(aFn) {
    for (let i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    const sources = Object.keys(this.sourceContents);
    for (let i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  }

  /**
   * Return the string representation of this source node. Walks over the tree
   * and concatenates all the various snippets together to one string.
   */
  toString() {
    let str = "";
    this.walk(function(chunk) {
      str += chunk;
    });
    return str;
  }

  /**
   * Returns the string representation of this source node along with a source
   * map.
   */
  toStringWithSourceMap(aArgs) {
    const generated = {
      code: "",
      line: 1,
      column: 0
    };
    const map = new SourceMapGenerator(aArgs);
    let sourceMappingActive = false;
    let lastOriginalSource = null;
    let lastOriginalLine = null;
    let lastOriginalColumn = null;
    let lastOriginalName = null;
    this.walk(function(chunk, original) {
      generated.code += chunk;
      if (original.source !== null
          && original.line !== null
          && original.column !== null) {
        if (lastOriginalSource !== original.source
          || lastOriginalLine !== original.line
          || lastOriginalColumn !== original.column
          || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (let idx = 0, length = chunk.length; idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          // Mappings end at eol
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function(sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });

    return { code: generated.code, map };
  }
}

exports.SourceNode = SourceNode;


/***/ }),

/***/ 927:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */


// Note: This file is overridden in the 'package.json#browser' field to
// substitute lib/url-browser.js instead.

// Use the URL global for Node 10, and the 'url' module for Node 8.
module.exports = typeof URL === "function" ? URL : (__nccwpck_require__(16).URL);


/***/ }),

/***/ 616:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

const URL = __nccwpck_require__(927);

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  }
    throw new Error('"' + aName + '" is a required argument.');

}
exports.getArg = getArg;

const supportsNullProto = (function() {
  const obj = Object.create(null);
  return !("__proto__" in obj);
}());

function identity(s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return "$" + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  const length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  /* eslint-disable no-multi-spaces */
  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }
  /* eslint-enable no-multi-spaces */

  for (let i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  let cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
}
exports.parseSourceMapInput = parseSourceMapInput;

// We use 'http' as the base here because we want URLs processed relative
// to the safe base to be treated as "special" URLs during parsing using
// the WHATWG URL parsing. This ensures that backslash normalization
// applies to the path and such.
const PROTOCOL = "http:";
const PROTOCOL_AND_HOST = `${PROTOCOL}//host`;

/**
 * Make it easy to create small utilities that tweak a URL's path.
 */
function createSafeHandler(cb) {
  return input => {
    const type = getURLType(input);
    const base = buildSafeBase(input);
    const url = new URL(input, base);

    cb(url);

    const result = url.toString();

    if (type === "absolute") {
      return result;
    } else if (type === "scheme-relative") {
      return result.slice(PROTOCOL.length);
    } else if (type === "path-absolute") {
      return result.slice(PROTOCOL_AND_HOST.length);
    }

    // This assumes that the callback will only change
    // the path, search and hash values.
    return computeRelativeURL(base, result);
  };
}

function withBase(url, base) {
  return new URL(url, base).toString();
}

function buildUniqueSegment(prefix, str) {
  let id = 0;
  do {
    const ident = prefix + (id++);
    if (str.indexOf(ident) === -1) return ident;
  } while (true);
}

function buildSafeBase(str) {
  const maxDotParts = str.split("..").length - 1;

  // If we used a segment that also existed in `str`, then we would be unable
  // to compute relative paths. For example, if `segment` were just "a":
  //
  //   const url = "../../a/"
  //   const base = buildSafeBase(url); // http://host/a/a/
  //   const joined = "http://host/a/";
  //   const result = relative(base, joined);
  //
  // Expected: "../../a/";
  // Actual: "a/"
  //
  const segment = buildUniqueSegment("p", str);

  let base = `${PROTOCOL_AND_HOST}/`;
  for (let i = 0; i < maxDotParts; i++) {
    base += `${segment}/`;
  }
  return base;
}

const ABSOLUTE_SCHEME = /^[A-Za-z0-9\+\-\.]+:/;
function getURLType(url) {
  if (url[0] === "/") {
    if (url[1] === "/") return "scheme-relative";
    return "path-absolute";
  }

  return ABSOLUTE_SCHEME.test(url) ? "absolute" : "path-relative";
}

/**
 * Given two URLs that are assumed to be on the same
 * protocol/host/user/password build a relative URL from the
 * path, params, and hash values.
 *
 * @param rootURL The root URL that the target will be relative to.
 * @param targetURL The target that the relative URL points to.
 * @return A rootURL-relative, normalized URL value.
 */
function computeRelativeURL(rootURL, targetURL) {
  if (typeof rootURL === "string") rootURL = new URL(rootURL);
  if (typeof targetURL === "string") targetURL = new URL(targetURL);

  const targetParts = targetURL.pathname.split("/");
  const rootParts = rootURL.pathname.split("/");

  // If we've got a URL path ending with a "/", we remove it since we'd
  // otherwise be relative to the wrong location.
  if (rootParts.length > 0 && !rootParts[rootParts.length - 1]) {
    rootParts.pop();
  }

  while (
    targetParts.length > 0 &&
    rootParts.length > 0 &&
    targetParts[0] === rootParts[0]
  ) {
    targetParts.shift();
    rootParts.shift();
  }

  const relativePath = rootParts
    .map(() => "..")
    .concat(targetParts)
    .join("/");

  return relativePath + targetURL.search + targetURL.hash;
}

/**
 * Given a URL, ensure that it is treated as a directory URL.
 *
 * @param url
 * @return A normalized URL value.
 */
const ensureDirectory = createSafeHandler(url => {
  url.pathname = url.pathname.replace(/\/?$/, "/");
});

/**
 * Given a URL, strip off any filename if one is present.
 *
 * @param url
 * @return A normalized URL value.
 */
const trimFilename = createSafeHandler(url => {
  url.href = new URL(".", url.toString()).toString();
});

/**
 * Normalize a given URL.
 * * Convert backslashes.
 * * Remove any ".." and "." segments.
 *
 * @param url
 * @return A normalized URL value.
 */
const normalize = createSafeHandler(url => {});
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * All returned URLs will be normalized.
 *
 * @param aRoot The root path or URL. Assumed to reference a directory.
 * @param aPath The path or URL to be joined with the root.
 * @return A joined and normalized URL value.
 */
function join(aRoot, aPath) {
  const pathType = getURLType(aPath);
  const rootType = getURLType(aRoot);

  aRoot = ensureDirectory(aRoot);

  if (pathType === "absolute") {
    return withBase(aPath, undefined);
  }
  if (rootType === "absolute") {
    return withBase(aPath, aRoot);
  }

  if (pathType === "scheme-relative") {
    return normalize(aPath);
  }
  if (rootType === "scheme-relative") {
    return withBase(aPath, withBase(aRoot, PROTOCOL_AND_HOST)).slice(PROTOCOL.length);
  }

  if (pathType === "path-absolute") {
    return normalize(aPath);
  }
  if (rootType === "path-absolute") {
    return withBase(aPath, withBase(aRoot, PROTOCOL_AND_HOST)).slice(PROTOCOL_AND_HOST.length);
  }

  const base = buildSafeBase(aPath + aRoot);
  const newPath = withBase(aPath, withBase(aRoot, base));
  return computeRelativeURL(base, newPath);
}
exports.join = join;

/**
 * Make a path relative to a URL or another path. If returning a
 * relative URL is not possible, the original target will be returned.
 * All returned URLs will be normalized.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 * @return A rootURL-relative (if possible), normalized URL value.
 */
function relative(rootURL, targetURL) {
  const result = relativeIfPossible(rootURL, targetURL);

  return typeof result === "string" ? result : normalize(targetURL);
}
exports.relative = relative;

function relativeIfPossible(rootURL, targetURL) {
  const urlType = getURLType(rootURL);
  if (urlType !== getURLType(targetURL)) {
    return null;
  }

  const base = buildSafeBase(rootURL + targetURL);
  const root = new URL(rootURL, base);
  const target = new URL(targetURL, base);

  try {
    new URL("", target.toString());
  } catch (err) {
    // Bail if the URL doesn't support things being relative to it,
    // For example, data: and blob: URLs.
    return null;
  }

  if (
    target.protocol !== root.protocol ||
    target.user !== root.user ||
    target.password !== root.password ||
    target.hostname !== root.hostname ||
    target.port !== root.port
  ) {
    return null;
  }

  return computeRelativeURL(root, target);
}

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  // The source map spec states that "sourceRoot" and "sources" entries are to be appended. While
  // that is a little vague, implementations have generally interpreted that as joining the
  // URLs with a `/` between then, assuming the "sourceRoot" doesn't already end with one.
  // For example,
  //
  //   sourceRoot: "some-dir",
  //   sources: ["/some-path.js"]
  //
  // and
  //
  //   sourceRoot: "some-dir/",
  //   sources: ["/some-path.js"]
  //
  // must behave as "some-dir/some-path.js".
  //
  // With this library's the transition to a more URL-focused implementation, that behavior is
  // preserved here. To acheive that, we trim the "/" from absolute-path when a sourceRoot value
  // is present in order to make the sources entries behave as if they are relative to the
  // "sourceRoot", as they would have if the two strings were simply concated.
  if (sourceRoot && getURLType(sourceURL) === "path-absolute") {
    sourceURL = sourceURL.replace(/^\//, "");
  }

  let url = normalize(sourceURL || "");

  // Parsing URLs can be expensive, so we only perform these joins when needed.
  if (sourceRoot) url = join(sourceRoot, url);
  if (sourceMapURL) url = join(trimFilename(sourceMapURL), url);
  return url;
}
exports.computeSourceURL = computeSourceURL;


/***/ }),

/***/ 692:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const readWasm = __nccwpck_require__(293);

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.lastGeneratedColumn = null;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

let cachedWasm = null;

module.exports = function wasm() {
  if (cachedWasm) {
    return cachedWasm;
  }

  const callbackStack = [];

  cachedWasm = readWasm().then(buffer => {
      return WebAssembly.instantiate(buffer, {
        env: {
          mapping_callback(
            generatedLine,
            generatedColumn,

            hasLastGeneratedColumn,
            lastGeneratedColumn,

            hasOriginal,
            source,
            originalLine,
            originalColumn,

            hasName,
            name
          ) {
            const mapping = new Mapping();
            // JS uses 1-based line numbers, wasm uses 0-based.
            mapping.generatedLine = generatedLine + 1;
            mapping.generatedColumn = generatedColumn;

            if (hasLastGeneratedColumn) {
              // JS uses inclusive last generated column, wasm uses exclusive.
              mapping.lastGeneratedColumn = lastGeneratedColumn - 1;
            }

            if (hasOriginal) {
              mapping.source = source;
              // JS uses 1-based line numbers, wasm uses 0-based.
              mapping.originalLine = originalLine + 1;
              mapping.originalColumn = originalColumn;

              if (hasName) {
                mapping.name = name;
              }
            }

            callbackStack[callbackStack.length - 1](mapping);
          },

          start_all_generated_locations_for() { console.time("all_generated_locations_for"); },
          end_all_generated_locations_for() { console.timeEnd("all_generated_locations_for"); },

          start_compute_column_spans() { console.time("compute_column_spans"); },
          end_compute_column_spans() { console.timeEnd("compute_column_spans"); },

          start_generated_location_for() { console.time("generated_location_for"); },
          end_generated_location_for() { console.timeEnd("generated_location_for"); },

          start_original_location_for() { console.time("original_location_for"); },
          end_original_location_for() { console.timeEnd("original_location_for"); },

          start_parse_mappings() { console.time("parse_mappings"); },
          end_parse_mappings() { console.timeEnd("parse_mappings"); },

          start_sort_by_generated_location() { console.time("sort_by_generated_location"); },
          end_sort_by_generated_location() { console.timeEnd("sort_by_generated_location"); },

          start_sort_by_original_location() { console.time("sort_by_original_location"); },
          end_sort_by_original_location() { console.timeEnd("sort_by_original_location"); },
        }
      });
  }).then(Wasm => {
    return {
      exports: Wasm.instance.exports,
      withMappingCallback: (mappingCallback, f) => {
        callbackStack.push(mappingCallback);
        try {
          f();
        } finally {
          callbackStack.pop();
        }
      }
    };
  }).then(null, e => {
    cachedWasm = null;
    throw e;
  });

  return cachedWasm;
};


/***/ }),

/***/ 782:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = __nccwpck_require__(658).SourceMapGenerator;
exports.SourceMapConsumer = __nccwpck_require__(383).SourceMapConsumer;
exports.SourceNode = __nccwpck_require__(862).SourceNode;


/***/ }),

/***/ 78:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LOG_LEVEL = exports.COLORS = void 0;
exports.COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    fgBlack: "\x1b[30m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};
exports.LOG_LEVEL = {
    FATAL: "fatal",
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    VERBOSE: "verbose",
    DEBUG: "debug",
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9ob21lL294MjZhL1Byb2plY3RzL3ViaXF1aXR5LW9zLWxvZ2dlci9zcmMvY29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsTUFBTSxHQUFHO0lBQ3BCLEtBQUssRUFBRSxTQUFTO0lBQ2hCLE1BQU0sRUFBRSxTQUFTO0lBQ2pCLEdBQUcsRUFBRSxTQUFTO0lBQ2QsVUFBVSxFQUFFLFNBQVM7SUFDckIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsT0FBTyxFQUFFLFNBQVM7SUFDbEIsTUFBTSxFQUFFLFNBQVM7SUFFakIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsS0FBSyxFQUFFLFVBQVU7SUFDakIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsTUFBTSxFQUFFLFVBQVU7SUFDbEIsU0FBUyxFQUFFLFVBQVU7SUFDckIsTUFBTSxFQUFFLFVBQVU7SUFDbEIsT0FBTyxFQUFFLFVBQVU7SUFFbkIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsS0FBSyxFQUFFLFVBQVU7SUFDakIsT0FBTyxFQUFFLFVBQVU7SUFDbkIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsTUFBTSxFQUFFLFVBQVU7SUFDbEIsU0FBUyxFQUFFLFVBQVU7SUFDckIsTUFBTSxFQUFFLFVBQVU7SUFDbEIsT0FBTyxFQUFFLFVBQVU7Q0FDWCxDQUFDO0FBRUUsUUFBQSxTQUFTLEdBQUc7SUFDdkIsS0FBSyxFQUFFLE9BQU87SUFDZCxLQUFLLEVBQUUsT0FBTztJQUNkLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBSSxFQUFFLE1BQU07SUFDWixPQUFPLEVBQUUsU0FBUztJQUNsQixLQUFLLEVBQUUsT0FBTztDQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgQ09MT1JTID0ge1xuICByZXNldDogXCJcXHgxYlswbVwiLFxuICBicmlnaHQ6IFwiXFx4MWJbMW1cIixcbiAgZGltOiBcIlxceDFiWzJtXCIsXG4gIHVuZGVyc2NvcmU6IFwiXFx4MWJbNG1cIixcbiAgYmxpbms6IFwiXFx4MWJbNW1cIixcbiAgcmV2ZXJzZTogXCJcXHgxYls3bVwiLFxuICBoaWRkZW46IFwiXFx4MWJbOG1cIixcblxuICBmZ0JsYWNrOiBcIlxceDFiWzMwbVwiLFxuICBmZ1JlZDogXCJcXHgxYlszMW1cIixcbiAgZmdHcmVlbjogXCJcXHgxYlszMm1cIixcbiAgZmdZZWxsb3c6IFwiXFx4MWJbMzNtXCIsXG4gIGZnQmx1ZTogXCJcXHgxYlszNG1cIixcbiAgZmdNYWdlbnRhOiBcIlxceDFiWzM1bVwiLFxuICBmZ0N5YW46IFwiXFx4MWJbMzZtXCIsXG4gIGZnV2hpdGU6IFwiXFx4MWJbMzdtXCIsXG5cbiAgYmdCbGFjazogXCJcXHgxYls0MG1cIixcbiAgYmdSZWQ6IFwiXFx4MWJbNDFtXCIsXG4gIGJnR3JlZW46IFwiXFx4MWJbNDJtXCIsXG4gIGJnWWVsbG93OiBcIlxceDFiWzQzbVwiLFxuICBiZ0JsdWU6IFwiXFx4MWJbNDRtXCIsXG4gIGJnTWFnZW50YTogXCJcXHgxYls0NW1cIixcbiAgYmdDeWFuOiBcIlxceDFiWzQ2bVwiLFxuICBiZ1doaXRlOiBcIlxceDFiWzQ3bVwiLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IGNvbnN0IExPR19MRVZFTCA9IHtcbiAgRkFUQUw6IFwiZmF0YWxcIixcbiAgRVJST1I6IFwiZXJyb3JcIixcbiAgV0FSTjogXCJ3YXJuXCIsXG4gIElORk86IFwiaW5mb1wiLFxuICBWRVJCT1NFOiBcInZlcmJvc2VcIixcbiAgREVCVUc6IFwiZGVidWdcIixcbn0gYXMgY29uc3Q7XG4iXX0=

/***/ }),

/***/ 116:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Logs = void 0;
const constants_1 = __nccwpck_require__(78);
const pretty_logs_1 = __nccwpck_require__(623);
const log_types_1 = __nccwpck_require__(907);
class Logs {
    _maxLevel = -1;
    static console;
    _log({ level, consoleLog, logMessage, metadata, type }) {
        // filter out more verbose logs according to maxLevel set in config
        if (this._getNumericLevel(level) <= this._maxLevel) {
            consoleLog(logMessage, metadata);
        }
        return new log_types_1.LogReturn({
            raw: logMessage,
            diff: this._diffColorCommentMessage(type, logMessage),
            type,
            level,
        }, metadata);
    }
    _addDiagnosticInformation(metadata) {
        // this is a utility function to get the name of the function that called the log
        // I have mixed feelings on this because it manipulates metadata later possibly without the developer understanding why and where,
        // but seems useful for the metadata parser to understand where the comment originated from
        if (!metadata) {
            metadata = {};
        }
        else if (typeof metadata !== "object") {
            metadata = { message: metadata };
        }
        const stackLines = new Error().stack?.split("\n") || [];
        if (stackLines.length > 3) {
            const callerLine = stackLines[3];
            const match = callerLine.match(/at (\S+)/);
            if (match) {
                metadata.caller = match[1];
            }
        }
        return metadata;
    }
    async enableSourceMapDecoding(sourceMapFile) {
        await Logs.console.enableSourceMapDecoding(sourceMapFile);
    }
    ok(log, metadata) {
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.INFO,
            consoleLog: Logs.console.ok,
            logMessage: log,
            metadata,
            type: "ok",
        });
    }
    info(log, metadata) {
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.INFO,
            consoleLog: Logs.console.info,
            logMessage: log,
            metadata,
            type: "info",
        });
    }
    warn(log, metadata) {
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.WARN,
            consoleLog: Logs.console.warn,
            logMessage: log,
            metadata,
            type: "warn",
        });
    }
    error(log, metadata) {
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.ERROR,
            consoleLog: Logs.console.error,
            logMessage: log,
            metadata,
            type: "error",
        });
    }
    debug(log, metadata) {
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.DEBUG,
            consoleLog: Logs.console.debug,
            logMessage: log,
            metadata,
            type: "debug",
        });
    }
    fatal(log, metadata) {
        if (!metadata) {
            metadata = Logs.convertErrorsIntoObjects(new Error(log));
            const stack = metadata.stack;
            stack.splice(1, 1);
            metadata.stack = stack;
        }
        if (metadata instanceof Error) {
            metadata = Logs.convertErrorsIntoObjects(metadata);
            const stack = metadata.stack;
            stack.splice(1, 1);
            metadata.stack = stack;
        }
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.FATAL,
            consoleLog: Logs.console.fatal,
            logMessage: log,
            metadata,
            type: "fatal",
        });
    }
    verbose(log, metadata) {
        metadata = this._addDiagnosticInformation(metadata);
        return this._log({
            level: constants_1.LOG_LEVEL.VERBOSE,
            consoleLog: Logs.console.verbose,
            logMessage: log,
            metadata,
            type: "verbose",
        });
    }
    constructor(logLevel) {
        this._maxLevel = this._getNumericLevel(logLevel);
        Logs.console = new pretty_logs_1.PrettyLogs();
    }
    _diffColorCommentMessage(type, message) {
        const diffPrefix = {
            fatal: "> [!CAUTION]",
            error: "> [!CAUTION]",
            warn: "> [!WARNING]",
            ok: "> [!TIP]",
            info: "> [!NOTE]",
            debug: "> [!IMPORTANT]",
            verbose: "> [!NOTE]",
        };
        const selected = diffPrefix[type];
        if (selected) {
            message = message
                .trim()
                .split("\n")
                .map((line) => `> ${line}`)
                .join("\n");
        }
        return [selected, message].join("\n");
    }
    _getNumericLevel(level) {
        switch (level) {
            case constants_1.LOG_LEVEL.FATAL:
                return 0;
            case constants_1.LOG_LEVEL.ERROR:
                return 1;
            case constants_1.LOG_LEVEL.WARN:
                return 2;
            case constants_1.LOG_LEVEL.INFO:
                return 3;
            case constants_1.LOG_LEVEL.VERBOSE:
                return 4;
            case constants_1.LOG_LEVEL.DEBUG:
                return 5;
            default:
                return -1;
        }
    }
    static convertErrorsIntoObjects(obj) {
        // this is a utility function to render native errors in the console, the database, and on GitHub.
        if (obj instanceof Error) {
            return {
                message: obj.message,
                name: obj.name,
                stack: obj.stack ? obj.stack.split("\n") : null,
            };
        }
        else if (typeof obj === "object" && obj !== null) {
            const keys = Object.keys(obj);
            keys.forEach((key) => {
                obj[key] = this.convertErrorsIntoObjects(obj[key]);
            });
        }
        return obj;
    }
}
exports.Logs = Logs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9ob21lL294MjZhL1Byb2plY3RzL3ViaXF1aXR5LW9zLWxvZ2dlci9zcmMvbG9ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBd0M7QUFDeEMsK0NBQTJDO0FBQzNDLGlEQUE2RjtBQUU3RixNQUFhLElBQUk7SUFDUCxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkIsTUFBTSxDQUFDLE9BQU8sQ0FBYTtJQUVuQixJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFhO1FBQ3ZFLG1FQUFtRTtRQUNuRSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbkQsVUFBVSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsT0FBTyxJQUFJLHFCQUFTLENBQ2xCO1lBQ0UsR0FBRyxFQUFFLFVBQVU7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxVQUFVLENBQUM7WUFDckQsSUFBSTtZQUNKLEtBQUs7U0FDTixFQUNELFFBQVEsQ0FDVCxDQUFDO0lBQ0osQ0FBQztJQUVPLHlCQUF5QixDQUFDLFFBQW1CO1FBQ25ELGlGQUFpRjtRQUNqRixrSUFBa0k7UUFDbEksMkZBQTJGO1FBRTNGLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNkLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDaEIsQ0FBQzthQUFNLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDeEMsUUFBUSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENB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O2dCQUNqQixPQUFPLENBQUMsQ0FBQztZQUNYLEtBQUsscUJBQVMsQ0FBQyxPQUFPO2dCQUNwQixPQUFPLENBQUMsQ0FBQztZQUNYLEtBQUsscUJBQVMsQ0FBQyxLQUFLO2dCQUNsQixPQUFPLENBQUMsQ0FBQztZQUNYO2dCQUNFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDZCxDQUFDO0lBQ0gsQ0FBQztJQUNELE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFZO1FBQzFDLGtHQUFrRztRQUNsRyxJQUFJLEdBQUcsWUFBWSxLQUFLLEVBQUUsQ0FBQztZQUN6QixPQUFPO2dCQUNMLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztnQkFDcEIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO2dCQUNkLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTthQUNoRCxDQUFDO1FBQ0osQ0FBQzthQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuRCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDbkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQXpNRCxvQkF5TUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMT0dfTEVWRUwgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IFByZXR0eUxvZ3MgfSBmcm9tIFwiLi9wcmV0dHktbG9nc1wiO1xuaW1wb3J0IHsgTG9nUGFyYW1zLCBMb2dSZXR1cm4sIE1ldGFkYXRhLCBMb2dMZXZlbCwgTG9nTGV2ZWxXaXRoT2sgfSBmcm9tIFwiLi90eXBlcy9sb2ctdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIExvZ3Mge1xuICBwcml2YXRlIF9tYXhMZXZlbCA9IC0xO1xuICBzdGF0aWMgY29uc29sZTogUHJldHR5TG9ncztcblxuICBwcml2YXRlIF9sb2coeyBsZXZlbCwgY29uc29sZUxvZywgbG9nTWVzc2FnZSwgbWV0YWRhdGEsIHR5cGUgfTogTG9nUGFyYW1zKTogTG9nUmV0dXJuIHtcbiAgICAvLyBmaWx0ZXIgb3V0IG1vcmUgdmVyYm9zZSBsb2dzIGFjY29yZGluZyB0byBtYXhMZXZlbCBzZXQgaW4gY29uZmlnXG4gICAgaWYgKHRoaXMuX2dldE51bWVyaWNMZXZlbChsZXZlbCkgPD0gdGhpcy5fbWF4TGV2ZWwpIHtcbiAgICAgIGNvbnNvbGVMb2cobG9nTWVzc2FnZSwgbWV0YWRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTG9nUmV0dXJuKFxuICAgICAge1xuICAgICAgICByYXc6IGxvZ01lc3NhZ2UsXG4gICAgICAgIGRpZmY6IHRoaXMuX2RpZmZDb2xvckNvbW1lbnRNZXNzYWdlKHR5cGUsIGxvZ01lc3NhZ2UpLFxuICAgICAgICB0eXBlLFxuICAgICAgICBsZXZlbCxcbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIF9hZGREaWFnbm9zdGljSW5mb3JtYXRpb24obWV0YWRhdGE/OiBNZXRhZGF0YSkge1xuICAgIC8vIHRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRvIGdldCB0aGUgbmFtZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBjYWxsZWQgdGhlIGxvZ1xuICAgIC8vIEkgaGF2ZSBtaXhlZCBmZWVsaW5ncyBvbiB0aGlzIGJlY2F1c2UgaXQgbWFuaXB1bGF0ZXMgbWV0YWRhdGEgbGF0ZXIgcG9zc2libHkgd2l0aG91dCB0aGUgZGV2ZWxvcGVyIHVuZGVyc3RhbmRpbmcgd2h5IGFuZCB3aGVyZSxcbiAgICAvLyBidXQgc2VlbXMgdXNlZnVsIGZvciB0aGUgbWV0YWRhdGEgcGFyc2VyIHRvIHVuZGVyc3RhbmQgd2hlcmUgdGhlIGNvbW1lbnQgb3JpZ2luYXRlZCBmcm9tXG5cbiAgICBpZiAoIW1ldGFkYXRhKSB7XG4gICAgICBtZXRhZGF0YSA9IHt9O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1ldGFkYXRhICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICBtZXRhZGF0YSA9IHsgbWVzc2FnZTogbWV0YWRhdGEgfTtcbiAgICB9XG5cbiAgICBjb25zdCBzdGFja0xpbmVzID0gbmV3IEVycm9yKCkuc3RhY2s/LnNwbGl0KFwiXFxuXCIpIHx8IFtdO1xuICAgIGlmIChzdGFja0xpbmVzLmxlbmd0aCA+IDMpIHtcbiAgICAgIGNvbnN0IGNhbGxlckxpbmUgPSBzdGFja0xpbmVzWzNdO1xuICAgICAgY29uc3QgbWF0Y2ggPSBjYWxsZXJMaW5lLm1hdGNoKC9hdCAoXFxTKykvKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBtZXRhZGF0YS5jYWxsZXIgPSBtYXRjaFsxXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWV0YWRhdGE7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZW5hYmxlU291cmNlTWFwRGVjb2Rpbmcoc291cmNlTWFwRmlsZTogc3RyaW5nKSB7XG4gICAgYXdhaXQgTG9ncy5jb25zb2xlLmVuYWJsZVNvdXJjZU1hcERlY29kaW5nKHNvdXJjZU1hcEZpbGUpXG4gIH1cblxuICBwdWJsaWMgb2sobG9nOiBzdHJpbmcsIG1ldGFkYXRhPzogTWV0YWRhdGEpOiBMb2dSZXR1cm4ge1xuICAgIG1ldGFkYXRhID0gdGhpcy5fYWRkRGlhZ25vc3RpY0luZm9ybWF0aW9uKG1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5fbG9nKHtcbiAgICAgIGxldmVsOiBMT0dfTEVWRUwuSU5GTyxcbiAgICAgIGNvbnNvbGVMb2c6IExvZ3MuY29uc29sZS5vayxcbiAgICAgIGxvZ01lc3NhZ2U6IGxvZyxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgdHlwZTogXCJva1wiLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGluZm8obG9nOiBzdHJpbmcsIG1ldGFkYXRhPzogTWV0YWRhdGEpOiBMb2dSZXR1cm4ge1xuICAgIG1ldGFkYXRhID0gdGhpcy5fYWRkRGlhZ25vc3RpY0luZm9ybWF0aW9uKG1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5fbG9nKHtcbiAgICAgIGxldmVsOiBMT0dfTEVWRUwuSU5GTyxcbiAgICAgIGNvbnNvbGVMb2c6IExvZ3MuY29uc29sZS5pbmZvLFxuICAgICAgbG9nTWVzc2FnZTogbG9nLFxuICAgICAgbWV0YWRhdGEsXG4gICAgICB0eXBlOiBcImluZm9cIixcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyB3YXJuKGxvZzogc3RyaW5nLCBtZXRhZGF0YT86IE1ldGFkYXRhKTogTG9nUmV0dXJuIHtcbiAgICBtZXRhZGF0YSA9IHRoaXMuX2FkZERpYWdub3N0aWNJbmZvcm1hdGlvbihtZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMuX2xvZyh7XG4gICAgICBsZXZlbDogTE9HX0xFVkVMLldBUk4sXG4gICAgICBjb25zb2xlTG9nOiBMb2dzLmNvbnNvbGUud2FybixcbiAgICAgIGxvZ01lc3NhZ2U6IGxvZyxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgdHlwZTogXCJ3YXJuXCIsXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgZXJyb3IobG9nOiBzdHJpbmcsIG1ldGFkYXRhPzogTWV0YWRhdGEpOiBMb2dSZXR1cm4ge1xuICAgIG1ldGFkYXRhID0gdGhpcy5fYWRkRGlhZ25vc3RpY0luZm9ybWF0aW9uKG1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5fbG9nKHtcbiAgICAgIGxldmVsOiBMT0dfTEVWRUwuRVJST1IsXG4gICAgICBjb25zb2xlTG9nOiBMb2dzLmNvbnNvbGUuZXJyb3IsXG4gICAgICBsb2dNZXNzYWdlOiBsb2csXG4gICAgICBtZXRhZGF0YSxcbiAgICAgIHR5cGU6IFwiZXJyb3JcIixcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBkZWJ1Zyhsb2c6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSk6IExvZ1JldHVybiB7XG4gICAgbWV0YWRhdGEgPSB0aGlzLl9hZGREaWFnbm9zdGljSW5mb3JtYXRpb24obWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLl9sb2coe1xuICAgICAgbGV2ZWw6IExPR19MRVZFTC5ERUJVRyxcbiAgICAgIGNvbnNvbGVMb2c6IExvZ3MuY29uc29sZS5kZWJ1ZyxcbiAgICAgIGxvZ01lc3NhZ2U6IGxvZyxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgdHlwZTogXCJkZWJ1Z1wiLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGZhdGFsKGxvZzogc3RyaW5nLCBtZXRhZGF0YT86IE1ldGFkYXRhKTogTG9nUmV0dXJuIHtcbiAgICBpZiAoIW1ldGFkYXRhKSB7XG4gICAgICBtZXRhZGF0YSA9IExvZ3MuY29udmVydEVycm9yc0ludG9PYmplY3RzKG5ldyBFcnJvcihsb2cpKSBhcyBNZXRhZGF0YTtcbiAgICAgIGNvbnN0IHN0YWNrID0gbWV0YWRhdGEuc3RhY2sgYXMgc3RyaW5nW107XG4gICAgICBzdGFjay5zcGxpY2UoMSwgMSk7XG4gICAgICBtZXRhZGF0YS5zdGFjayA9IHN0YWNrO1xuICAgIH1cblxuICAgIGlmIChtZXRhZGF0YSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBtZXRhZGF0YSA9IExvZ3MuY29udmVydEVycm9yc0ludG9PYmplY3RzKG1ldGFkYXRhKSBhcyBNZXRhZGF0YTtcbiAgICAgIGNvbnN0IHN0YWNrID0gbWV0YWRhdGEuc3RhY2sgYXMgc3RyaW5nW107XG4gICAgICBzdGFjay5zcGxpY2UoMSwgMSk7XG4gICAgICBtZXRhZGF0YS5zdGFjayA9IHN0YWNrO1xuICAgIH1cblxuICAgIG1ldGFkYXRhID0gdGhpcy5fYWRkRGlhZ25vc3RpY0luZm9ybWF0aW9uKG1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5fbG9nKHtcbiAgICAgIGxldmVsOiBMT0dfTEVWRUwuRkFUQUwsXG4gICAgICBjb25zb2xlTG9nOiBMb2dzLmNvbnNvbGUuZmF0YWwsXG4gICAgICBsb2dNZXNzYWdlOiBsb2csXG4gICAgICBtZXRhZGF0YSxcbiAgICAgIHR5cGU6IFwiZmF0YWxcIixcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyB2ZXJib3NlKGxvZzogc3RyaW5nLCBtZXRhZGF0YT86IE1ldGFkYXRhKTogTG9nUmV0dXJuIHtcbiAgICBtZXRhZGF0YSA9IHRoaXMuX2FkZERpYWdub3N0aWNJbmZvcm1hdGlvbihtZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMuX2xvZyh7XG4gICAgICBsZXZlbDogTE9HX0xFVkVMLlZFUkJPU0UsXG4gICAgICBjb25zb2xlTG9nOiBMb2dzLmNvbnNvbGUudmVyYm9zZSxcbiAgICAgIGxvZ01lc3NhZ2U6IGxvZyxcbiAgICAgIG1ldGFkYXRhLFxuICAgICAgdHlwZTogXCJ2ZXJib3NlXCIsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihsb2dMZXZlbDogTG9nTGV2ZWwpIHtcbiAgICB0aGlzLl9tYXhMZXZlbCA9IHRoaXMuX2dldE51bWVyaWNMZXZlbChsb2dMZXZlbCk7XG4gICAgTG9ncy5jb25zb2xlID0gbmV3IFByZXR0eUxvZ3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2RpZmZDb2xvckNvbW1lbnRNZXNzYWdlKHR5cGU6IExvZ0xldmVsV2l0aE9rLCBtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBkaWZmUHJlZml4OiBSZWNvcmQ8TG9nTGV2ZWxXaXRoT2ssIHN0cmluZz4gPSB7XG4gICAgICBmYXRhbDogXCI+IFshQ0FVVElPTl1cIixcbiAgICAgIGVycm9yOiBcIj4gWyFDQVVUSU9OXVwiLFxuICAgICAgd2FybjogXCI+IFshV0FSTklOR11cIixcbiAgICAgIG9rOiBcIj4gWyFUSVBdXCIsXG4gICAgICBpbmZvOiBcIj4gWyFOT1RFXVwiLFxuICAgICAgZGVidWc6IFwiPiBbIUlNUE9SVEFOVF1cIixcbiAgICAgIHZlcmJvc2U6IFwiPiBbIU5PVEVdXCIsXG4gICAgfTtcbiAgICBjb25zdCBzZWxlY3RlZCA9IGRpZmZQcmVmaXhbdHlwZV07XG5cbiAgICBpZiAoc2VsZWN0ZWQpIHtcbiAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICAgIC50cmltKClcbiAgICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAgIC5tYXAoKGxpbmUpID0+IGA+ICR7bGluZX1gKVxuICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW3NlbGVjdGVkLCBtZXNzYWdlXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TnVtZXJpY0xldmVsKGxldmVsOiBMb2dMZXZlbCkge1xuICAgIHN3aXRjaCAobGV2ZWwpIHtcbiAgICAgIGNhc2UgTE9HX0xFVkVMLkZBVEFMOlxuICAgICAgICByZXR1cm4gMDtcbiAgICAgIGNhc2UgTE9HX0xFVkVMLkVSUk9SOlxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIGNhc2UgTE9HX0xFVkVMLldBUk46XG4gICAgICAgIHJldHVybiAyO1xuICAgICAgY2FzZSBMT0dfTEVWRUwuSU5GTzpcbiAgICAgICAgcmV0dXJuIDM7XG4gICAgICBjYXNlIExPR19MRVZFTC5WRVJCT1NFOlxuICAgICAgICByZXR1cm4gNDtcbiAgICAgIGNhc2UgTE9HX0xFVkVMLkRFQlVHOlxuICAgICAgICByZXR1cm4gNTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gIH1cbiAgc3RhdGljIGNvbnZlcnRFcnJvcnNJbnRvT2JqZWN0cyhvYmo6IHVua25vd24pOiBNZXRhZGF0YSB8IHVua25vd24ge1xuICAgIC8vIHRoaXMgaXMgYSB1dGlsaXR5IGZ1bmN0aW9uIHRvIHJlbmRlciBuYXRpdmUgZXJyb3JzIGluIHRoZSBjb25zb2xlLCB0aGUgZGF0YWJhc2UsIGFuZCBvbiBHaXRIdWIuXG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBvYmoubWVzc2FnZSxcbiAgICAgICAgbmFtZTogb2JqLm5hbWUsXG4gICAgICAgIHN0YWNrOiBvYmouc3RhY2sgPyBvYmouc3RhY2suc3BsaXQoXCJcXG5cIikgOiBudWxsLFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgJiYgb2JqICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIG9ialtrZXldID0gdGhpcy5jb252ZXJ0RXJyb3JzSW50b09iamVjdHMob2JqW2tleV0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH1cbn1cbiJdfQ==

/***/ }),

/***/ 623:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrettyLogs = void 0;
const constants_1 = __nccwpck_require__(78);
const fs_1 = __importDefault(__nccwpck_require__(896));
const source_map_1 = __nccwpck_require__(782);
class PrettyLogs {
    _sourceMapConsumer;
    constructor() {
        this.ok = this.ok.bind(this);
        this.info = this.info.bind(this);
        this.error = this.error.bind(this);
        this.fatal = this.fatal.bind(this);
        this.warn = this.warn.bind(this);
        this.debug = this.debug.bind(this);
        this.verbose = this.verbose.bind(this);
    }
    fatal(message, metadata) {
        this._logWithStack(constants_1.LOG_LEVEL.FATAL, message, metadata);
    }
    error(message, metadata) {
        this._logWithStack(constants_1.LOG_LEVEL.ERROR, message, metadata);
    }
    warn(message, metadata) {
        this._logWithStack(constants_1.LOG_LEVEL.WARN, message, metadata);
    }
    ok(message, metadata) {
        this._logWithStack("ok", message, metadata);
    }
    info(message, metadata) {
        this._logWithStack(constants_1.LOG_LEVEL.INFO, message, metadata);
    }
    debug(message, metadata) {
        this._logWithStack(constants_1.LOG_LEVEL.DEBUG, message, metadata);
    }
    verbose(message, metadata) {
        this._logWithStack(constants_1.LOG_LEVEL.VERBOSE, message, metadata);
    }
    _logWithStack(type, message, metaData) {
        this._log(type, message);
        if (typeof metaData === "string") {
            this._log(type, metaData);
            return;
        }
        if (metaData) {
            const metadata = metaData;
            let stack = metadata?.error?.stack || metadata?.stack;
            if (!stack) {
                // generate and remove the top four lines of the stack trace
                const stackTrace = new Error().stack?.split("\n");
                if (stackTrace) {
                    stackTrace.splice(0, 4);
                    stack = stackTrace.filter((line) => line.includes(".ts:")).join("\n");
                }
            }
            const newMetadata = { ...metadata };
            delete newMetadata.message;
            delete newMetadata.name;
            delete newMetadata.stack;
            if (!this._isEmpty(newMetadata)) {
                this._log(type, newMetadata);
            }
            if (typeof stack == "string") {
                stack = this._decodeStack(stack);
                const prettyStack = this._formatStackTrace(stack, 1);
                const colorizedStack = this._colorizeText(prettyStack, constants_1.COLORS.dim);
                this._log(type, colorizedStack);
            }
            else if (stack) {
                stack = this._decodeStack(stack);
                const prettyStack = this._formatStackTrace(stack.join("\n"), 1);
                const colorizedStack = this._colorizeText(prettyStack, constants_1.COLORS.dim);
                this._log(type, colorizedStack);
            }
            else {
                throw new Error("Stack is null");
            }
        }
    }
    async enableSourceMapDecoding(sourceMapFile) {
        this._sourceMapConsumer = await new source_map_1.SourceMapConsumer(JSON.parse(fs_1.default.readFileSync(sourceMapFile, 'utf8')));
    }
    _decodeStack(stack) {
        if (!this._sourceMapConsumer)
            return stack;
        const _decodeStackLine = (consumer, stackLine) => {
            const match = stackLine.match(/\(?(.*):(\d+):(\d+)\)?/);
            if (!match)
                return stackLine;
            const [_, file, lineNumber, column] = match;
            const originalPosition = consumer.originalPositionFor({
                line: parseInt(lineNumber, 10),
                column: parseInt(column, 10),
            });
            if (!originalPosition.source)
                return stackLine;
            return `    at ${originalPosition.name} (${originalPosition.source}:${originalPosition.line}:${originalPosition.column})`;
        };
        if (typeof stack === "string") {
            // Handle string input
            return _decodeStackLine(this._sourceMapConsumer, stack);
        }
        else if (Array.isArray(stack)) {
            // Handle string[] input
            return stack.map(s => _decodeStackLine(this._sourceMapConsumer, s));
        }
        else {
            throw new Error("Invalid input type");
        }
    }
    _colorizeText(text, color) {
        if (!color) {
            throw new Error(`Invalid color: ${color}`);
        }
        return color.concat(text).concat(constants_1.COLORS.reset);
    }
    _formatStackTrace(stack, linesToRemove = 0, prefix = "") {
        const lines = stack.split("\n");
        for (let i = 0; i < linesToRemove; i++) {
            lines.shift(); // Remove the top line
        }
        return lines
            .map((line) => `${prefix}${line.replace(/\s*at\s*/, "  ↳  ")}`) // Replace 'at' and prefix every line
            .join("\n");
    }
    _isEmpty(obj) {
        return !Reflect.ownKeys(obj).some((key) => typeof obj[String(key)] !== "function");
    }
    _log(type, message) {
        const defaultSymbols = {
            fatal: "×",
            ok: "✓",
            warn: "⚠",
            error: "⚠",
            info: "›",
            debug: "››",
            verbose: "💬",
        };
        const symbol = defaultSymbols[type];
        const messageFormatted = typeof message === "string" ? message : JSON.stringify(message, null, 2);
        // Constructing the full log string with the prefix symbol
        const lines = messageFormatted.split("\n");
        const logString = lines
            .map((line, index) => {
            // Add the symbol only to the first line and keep the indentation for the rest
            const prefix = index === 0 ? `\t${symbol}` : `\t${" ".repeat(symbol.length)}`;
            return `${prefix} ${line}`;
        })
            .join("\n");
        const fullLogString = logString;
        const colorMap = {
            fatal: ["error", constants_1.COLORS.fgRed],
            ok: ["log", constants_1.COLORS.fgGreen],
            warn: ["warn", constants_1.COLORS.fgYellow],
            error: ["warn", constants_1.COLORS.fgYellow],
            info: ["info", constants_1.COLORS.dim],
            debug: ["debug", constants_1.COLORS.fgMagenta],
            verbose: ["debug", constants_1.COLORS.dim],
        };
        const _console = console[colorMap[type][0]];
        if (typeof _console === "function" && fullLogString.length > 12) {
            _console(this._colorizeText(fullLogString, colorMap[type][1]));
        }
        else if (fullLogString.length <= 12) {
            // removing empty logs which only contain the symbol
            return;
        }
        else {
            throw new Error(fullLogString);
        }
    }
}
exports.PrettyLogs = PrettyLogs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9ob21lL294MjZhL1Byb2plY3RzL3ViaXF1aXR5LW9zLWxvZ2dlci9zcmMvcHJldHR5LWxvZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkNBQWdEO0FBRWhELDRDQUFvQjtBQUNwQiwyQ0FBK0M7QUFFL0MsTUFBYSxVQUFVO0lBQ2Isa0JBQWtCLENBQXFCO0lBQy9DO1FBQ0UsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBQ00sS0FBSyxDQUFDLE9BQWUsRUFBRSxRQUFzQztRQUNsRSxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRU0sS0FBSyxDQUFDLE9BQWUsRUFBRSxRQUE0QjtRQUN4RCxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFTLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRU0sSUFBSSxDQUFDLE9BQWUsRUFBRSxRQUE0QjtRQUN2RCxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0sRUFBRSxDQUFDLE9BQWUsRUFBRSxRQUE0QjtRQUNyRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVNLElBQUksQ0FBQyxPQUFlLEVBQUUsUUFBNEI7UUFDdkQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBUyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVNLEtBQUssQ0FBQyxPQUFlLEVBQUUsUUFBNEI7UUFDeEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBUyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVNLE9BQU8sQ0FBQyxPQUFlLEVBQUUsUUFBNEI7UUFDMUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVPLGFBQWEsQ0FBQyxJQUFvQixFQUFFLE9BQWUsRUFBRSxRQUFzQztRQUNqRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN6QixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFCLE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLE1BQU0sUUFBUSxHQUFHLFFBQW9CLENBQUM7WUFDdEMsSUFBSSxLQUFLLEdBQUcsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLElBQUksUUFBUSxFQUFFLEtBQUssQ0FBQztZQUN0RCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1gsNERBQTREO2dCQUM1RCxNQUFNLFVBQVUsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xELElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2YsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3hCLEtBQUssR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4RSxDQUFDO1lBQ0gsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQztZQUNwQyxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUM7WUFDM0IsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDO1lBQ3hCLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQztZQUV6QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBRUQsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDN0IsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQ2hDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLGtCQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7aUJBQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBNEIsQ0FBQyxDQUFBO2dCQUN2RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUUsS0FBNkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pGLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLGtCQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ25DLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxhQUFxQjtRQUN4RCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxJQUFJLDhCQUFpQixDQUNuRCxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQ25ELENBQUM7SUFDSixDQUFDO0lBSU8sWUFBWSxDQUFDLEtBQXdCO1FBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCO1lBQzFCLE9BQU8sS0FBSyxDQUFDO1FBQ2YsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLFFBQTJCLEVBQUUsU0FBaUIsRUFBVSxFQUFFO1lBQ2xGLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsS0FBSztnQkFBRSxPQUFPLFNBQVMsQ0FBQztZQUU3QixNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQzVDLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLG1CQUFtQixDQUFDO2dCQUNwRCxJQUFJLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQzthQUM3QixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTTtnQkFBRSxPQUFPLFNBQVMsQ0FBQztZQUMvQyxPQUFPLFVBQVUsZ0JBQWdCLENBQUMsSUFBSSxLQUFLLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUM7UUFDNUgsQ0FBQyxDQUFBO1FBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM5QixzQkFBc0I7WUFDdEIsT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsa0JBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0QsQ0FBQzthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2hDLHdCQUF3QjtZQUN4QixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsa0JBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RSxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4QyxDQUFDO0lBQ0gsQ0FBQztJQUNPLGFBQWEsQ0FBQyxJQUFZLEVBQUUsS0FBYTtRQUMvQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLGtCQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVPLGlCQUFpQixDQUFDLEtBQWEsRUFBRSxhQUFhLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxFQUFFO1FBQ3JFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLHNCQUFzQjtRQUN2QyxDQUFDO1FBQ0QsT0FBTyxLQUFLO2FBQ1QsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMscUNBQXFDO2FBQ3BHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQixDQUFDO0lBRU8sUUFBUSxDQUFDLEdBQTRCO1FBQzNDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssVUFBVSxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUVPLElBQUksQ0FBQyxJQUFvQixFQUFFLE9BQXlDO1FBQzFFLE1BQU0sY0FBYyxHQUFtQztZQUNyRCxLQUFLLEVBQUUsR0FBRztZQUNWLEVBQUUsRUFBRSxHQUFHO1lBQ1AsSUFBSSxFQUFFLEdBQUc7WUFDVCxLQUFLLEVBQUUsR0FBRztZQUNWLElBQUksRUFBRSxHQUFHO1lBQ1QsS0FBSyxFQUFFLElBQUk7WUFDWCxPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUM7UUFFRixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFcEMsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWxHLDBEQUEwRDtRQUMxRCxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsTUFBTSxTQUFTLEdBQUcsS0FBSzthQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbkIsOEVBQThFO1lBQzlFLE1BQU0sTUFBTSxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUM5RSxPQUFPLEdBQUcsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzdCLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVkLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQztRQUVoQyxNQUFNLFFBQVEsR0FBMkQ7WUFDdkUsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLGtCQUFNLENBQUMsS0FBSyxDQUFDO1lBQzlCLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxrQkFBTSxDQUFDLE9BQU8sQ0FBQztZQUMzQixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsa0JBQU0sQ0FBQyxRQUFRLENBQUM7WUFDL0IsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLGtCQUFNLENBQUMsUUFBUSxDQUFDO1lBQ2hDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxrQkFBTSxDQUFDLEdBQUcsQ0FBQztZQUMxQixLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsa0JBQU0sQ0FBQyxTQUFTLENBQUM7WUFDbEMsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFFLGtCQUFNLENBQUMsR0FBRyxDQUFDO1NBQy9CLENBQUM7UUFFRixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBeUIsQ0FBZ0MsQ0FBQztRQUNuRyxJQUFJLE9BQU8sUUFBUSxLQUFLLFVBQVUsSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQ2hFLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7YUFBTSxJQUFJLGFBQWEsQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFFLENBQUM7WUFDdEMsb0RBQW9EO1lBQ3BELE9BQU87UUFDVCxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDakMsQ0FBQztJQUNILENBQUM7Q0FDRjtBQXZMRCxnQ0F1TEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMT0dfTEVWRUwsIENPTE9SUyB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgTWV0YWRhdGEsIExvZ0xldmVsV2l0aE9rLCBDb2xvcnMgfSBmcm9tIFwiLi90eXBlcy9sb2ctdHlwZXNcIjtcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IFNvdXJjZU1hcENvbnN1bWVyIH0gZnJvbSBcInNvdXJjZS1tYXBcIjtcblxuZXhwb3J0IGNsYXNzIFByZXR0eUxvZ3Mge1xuICBwcml2YXRlIF9zb3VyY2VNYXBDb25zdW1lcj86IFNvdXJjZU1hcENvbnN1bWVyO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLm9rID0gdGhpcy5vay5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaW5mbyA9IHRoaXMuaW5mby5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZXJyb3IgPSB0aGlzLmVycm9yLmJpbmQodGhpcyk7XG4gICAgdGhpcy5mYXRhbCA9IHRoaXMuZmF0YWwuYmluZCh0aGlzKTtcbiAgICB0aGlzLndhcm4gPSB0aGlzLndhcm4uYmluZCh0aGlzKTtcbiAgICB0aGlzLmRlYnVnID0gdGhpcy5kZWJ1Zy5iaW5kKHRoaXMpO1xuICAgIHRoaXMudmVyYm9zZSA9IHRoaXMudmVyYm9zZS5iaW5kKHRoaXMpO1xuICB9XG4gIHB1YmxpYyBmYXRhbChtZXNzYWdlOiBzdHJpbmcsIG1ldGFkYXRhPzogTWV0YWRhdGEgfCBzdHJpbmcgfCB1bmtub3duKSB7XG4gICAgdGhpcy5fbG9nV2l0aFN0YWNrKExPR19MRVZFTC5GQVRBTCwgbWVzc2FnZSwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHVibGljIGVycm9yKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSB8IHN0cmluZykge1xuICAgIHRoaXMuX2xvZ1dpdGhTdGFjayhMT0dfTEVWRUwuRVJST1IsIG1lc3NhZ2UsIG1ldGFkYXRhKTtcbiAgfVxuXG4gIHB1YmxpYyB3YXJuKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSB8IHN0cmluZykge1xuICAgIHRoaXMuX2xvZ1dpdGhTdGFjayhMT0dfTEVWRUwuV0FSTiwgbWVzc2FnZSwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHVibGljIG9rKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSB8IHN0cmluZykge1xuICAgIHRoaXMuX2xvZ1dpdGhTdGFjayhcIm9rXCIsIG1lc3NhZ2UsIG1ldGFkYXRhKTtcbiAgfVxuXG4gIHB1YmxpYyBpbmZvKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSB8IHN0cmluZykge1xuICAgIHRoaXMuX2xvZ1dpdGhTdGFjayhMT0dfTEVWRUwuSU5GTywgbWVzc2FnZSwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHVibGljIGRlYnVnKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSB8IHN0cmluZykge1xuICAgIHRoaXMuX2xvZ1dpdGhTdGFjayhMT0dfTEVWRUwuREVCVUcsIG1lc3NhZ2UsIG1ldGFkYXRhKTtcbiAgfVxuXG4gIHB1YmxpYyB2ZXJib3NlKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSB8IHN0cmluZykge1xuICAgIHRoaXMuX2xvZ1dpdGhTdGFjayhMT0dfTEVWRUwuVkVSQk9TRSwgbWVzc2FnZSwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9nV2l0aFN0YWNrKHR5cGU6IExvZ0xldmVsV2l0aE9rLCBtZXNzYWdlOiBzdHJpbmcsIG1ldGFEYXRhPzogTWV0YWRhdGEgfCBzdHJpbmcgfCB1bmtub3duKSB7XG4gICAgdGhpcy5fbG9nKHR5cGUsIG1lc3NhZ2UpO1xuICAgIGlmICh0eXBlb2YgbWV0YURhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuX2xvZyh0eXBlLCBtZXRhRGF0YSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtZXRhRGF0YSkge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSBtZXRhRGF0YSBhcyBNZXRhZGF0YTtcbiAgICAgIGxldCBzdGFjayA9IG1ldGFkYXRhPy5lcnJvcj8uc3RhY2sgfHwgbWV0YWRhdGE/LnN0YWNrO1xuICAgICAgaWYgKCFzdGFjaykge1xuICAgICAgICAvLyBnZW5lcmF0ZSBhbmQgcmVtb3ZlIHRoZSB0b3AgZm91ciBsaW5lcyBvZiB0aGUgc3RhY2sgdHJhY2VcbiAgICAgICAgY29uc3Qgc3RhY2tUcmFjZSA9IG5ldyBFcnJvcigpLnN0YWNrPy5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgaWYgKHN0YWNrVHJhY2UpIHtcbiAgICAgICAgICBzdGFja1RyYWNlLnNwbGljZSgwLCA0KTtcbiAgICAgICAgICBzdGFjayA9IHN0YWNrVHJhY2UuZmlsdGVyKChsaW5lKSA9PiBsaW5lLmluY2x1ZGVzKFwiLnRzOlwiKSkuam9pbihcIlxcblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgbmV3TWV0YWRhdGEgPSB7IC4uLm1ldGFkYXRhIH07XG4gICAgICBkZWxldGUgbmV3TWV0YWRhdGEubWVzc2FnZTtcbiAgICAgIGRlbGV0ZSBuZXdNZXRhZGF0YS5uYW1lO1xuICAgICAgZGVsZXRlIG5ld01ldGFkYXRhLnN0YWNrO1xuXG4gICAgICBpZiAoIXRoaXMuX2lzRW1wdHkobmV3TWV0YWRhdGEpKSB7XG4gICAgICAgIHRoaXMuX2xvZyh0eXBlLCBuZXdNZXRhZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygc3RhY2sgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBzdGFjayA9IHRoaXMuX2RlY29kZVN0YWNrKHN0YWNrKVxuICAgICAgICBjb25zdCBwcmV0dHlTdGFjayA9IHRoaXMuX2Zvcm1hdFN0YWNrVHJhY2Uoc3RhY2ssIDEpO1xuICAgICAgICBjb25zdCBjb2xvcml6ZWRTdGFjayA9IHRoaXMuX2NvbG9yaXplVGV4dChwcmV0dHlTdGFjaywgQ09MT1JTLmRpbSk7XG4gICAgICAgIHRoaXMuX2xvZyh0eXBlLCBjb2xvcml6ZWRTdGFjayk7XG4gICAgICB9IGVsc2UgaWYgKHN0YWNrKSB7XG4gICAgICAgIHN0YWNrID0gdGhpcy5fZGVjb2RlU3RhY2soc3RhY2sgYXMgdW5rbm93biBhcyBzdHJpbmdbXSlcbiAgICAgICAgY29uc3QgcHJldHR5U3RhY2sgPSB0aGlzLl9mb3JtYXRTdGFja1RyYWNlKChzdGFjayBhcyB1bmtub3duIGFzIHN0cmluZ1tdKS5qb2luKFwiXFxuXCIpLCAxKTtcbiAgICAgICAgY29uc3QgY29sb3JpemVkU3RhY2sgPSB0aGlzLl9jb2xvcml6ZVRleHQocHJldHR5U3RhY2ssIENPTE9SUy5kaW0pO1xuICAgICAgICB0aGlzLl9sb2codHlwZSwgY29sb3JpemVkU3RhY2spO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3RhY2sgaXMgbnVsbFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZW5hYmxlU291cmNlTWFwRGVjb2Rpbmcoc291cmNlTWFwRmlsZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fc291cmNlTWFwQ29uc3VtZXIgPSBhd2FpdCBuZXcgU291cmNlTWFwQ29uc3VtZXIoXG4gICAgICBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhzb3VyY2VNYXBGaWxlLCAndXRmOCcpKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIF9kZWNvZGVTdGFjayhzdGFjazogc3RyaW5nKTogc3RyaW5nO1xuICBwcml2YXRlIF9kZWNvZGVTdGFjayhzdGFjazogc3RyaW5nW10pOiBzdHJpbmdbXTtcbiAgcHJpdmF0ZSBfZGVjb2RlU3RhY2soc3RhY2s6IHN0cmluZyB8IHN0cmluZ1tdKTogc3RyaW5nIHwgc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5fc291cmNlTWFwQ29uc3VtZXIpXG4gICAgICByZXR1cm4gc3RhY2s7XG4gICAgY29uc3QgX2RlY29kZVN0YWNrTGluZSA9IChjb25zdW1lcjogU291cmNlTWFwQ29uc3VtZXIsIHN0YWNrTGluZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoID0gc3RhY2tMaW5lLm1hdGNoKC9cXCg/KC4qKTooXFxkKyk6KFxcZCspXFwpPy8pO1xuICAgICAgaWYgKCFtYXRjaCkgcmV0dXJuIHN0YWNrTGluZTtcblxuICAgICAgY29uc3QgW18sIGZpbGUsIGxpbmVOdW1iZXIsIGNvbHVtbl0gPSBtYXRjaDtcbiAgICAgIGNvbnN0IG9yaWdpbmFsUG9zaXRpb24gPSBjb25zdW1lci5vcmlnaW5hbFBvc2l0aW9uRm9yKHtcbiAgICAgICAgbGluZTogcGFyc2VJbnQobGluZU51bWJlciwgMTApLFxuICAgICAgICBjb2x1bW46IHBhcnNlSW50KGNvbHVtbiwgMTApLFxuICAgICAgfSk7XG5cbiAgICAgIGlmICghb3JpZ2luYWxQb3NpdGlvbi5zb3VyY2UpIHJldHVybiBzdGFja0xpbmU7XG4gICAgICByZXR1cm4gYCAgICBhdCAke29yaWdpbmFsUG9zaXRpb24ubmFtZX0gKCR7b3JpZ2luYWxQb3NpdGlvbi5zb3VyY2V9OiR7b3JpZ2luYWxQb3NpdGlvbi5saW5lfToke29yaWdpbmFsUG9zaXRpb24uY29sdW1ufSlgO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHN0YWNrID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAvLyBIYW5kbGUgc3RyaW5nIGlucHV0XG4gICAgICByZXR1cm4gX2RlY29kZVN0YWNrTGluZSh0aGlzLl9zb3VyY2VNYXBDb25zdW1lciEsIHN0YWNrKTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoc3RhY2spKSB7XG4gICAgICAvLyBIYW5kbGUgc3RyaW5nW10gaW5wdXRcbiAgICAgIHJldHVybiBzdGFjay5tYXAocyA9PiBfZGVjb2RlU3RhY2tMaW5lKHRoaXMuX3NvdXJjZU1hcENvbnN1bWVyISwgcykpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGlucHV0IHR5cGVcIik7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX2NvbG9yaXplVGV4dCh0ZXh0OiBzdHJpbmcsIGNvbG9yOiBDb2xvcnMpOiBzdHJpbmcge1xuICAgIGlmICghY29sb3IpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBjb2xvcjogJHtjb2xvcn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbG9yLmNvbmNhdCh0ZXh0KS5jb25jYXQoQ09MT1JTLnJlc2V0KTtcbiAgfVxuXG4gIHByaXZhdGUgX2Zvcm1hdFN0YWNrVHJhY2Uoc3RhY2s6IHN0cmluZywgbGluZXNUb1JlbW92ZSA9IDAsIHByZWZpeCA9IFwiXCIpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzID0gc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lc1RvUmVtb3ZlOyBpKyspIHtcbiAgICAgIGxpbmVzLnNoaWZ0KCk7IC8vIFJlbW92ZSB0aGUgdG9wIGxpbmVcbiAgICB9XG4gICAgcmV0dXJuIGxpbmVzXG4gICAgICAubWFwKChsaW5lKSA9PiBgJHtwcmVmaXh9JHtsaW5lLnJlcGxhY2UoL1xccyphdFxccyovLCBcIiAg4oazICBcIil9YCkgLy8gUmVwbGFjZSAnYXQnIGFuZCBwcmVmaXggZXZlcnkgbGluZVxuICAgICAgLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBwcml2YXRlIF9pc0VtcHR5KG9iajogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICByZXR1cm4gIVJlZmxlY3Qub3duS2V5cyhvYmopLnNvbWUoKGtleSkgPT4gdHlwZW9mIG9ialtTdHJpbmcoa2V5KV0gIT09IFwiZnVuY3Rpb25cIik7XG4gIH1cblxuICBwcml2YXRlIF9sb2codHlwZTogTG9nTGV2ZWxXaXRoT2ssIG1lc3NhZ2U6IHN0cmluZyB8IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgY29uc3QgZGVmYXVsdFN5bWJvbHM6IFJlY29yZDxMb2dMZXZlbFdpdGhPaywgc3RyaW5nPiA9IHtcbiAgICAgIGZhdGFsOiBcIsOXXCIsXG4gICAgICBvazogXCLinJNcIixcbiAgICAgIHdhcm46IFwi4pqgXCIsXG4gICAgICBlcnJvcjogXCLimqBcIixcbiAgICAgIGluZm86IFwi4oC6XCIsXG4gICAgICBkZWJ1ZzogXCLigLrigLpcIixcbiAgICAgIHZlcmJvc2U6IFwi8J+SrFwiLFxuICAgIH07XG5cbiAgICBjb25zdCBzeW1ib2wgPSBkZWZhdWx0U3ltYm9sc1t0eXBlXTtcblxuICAgIGNvbnN0IG1lc3NhZ2VGb3JtYXR0ZWQgPSB0eXBlb2YgbWVzc2FnZSA9PT0gXCJzdHJpbmdcIiA/IG1lc3NhZ2UgOiBKU09OLnN0cmluZ2lmeShtZXNzYWdlLCBudWxsLCAyKTtcblxuICAgIC8vIENvbnN0cnVjdGluZyB0aGUgZnVsbCBsb2cgc3RyaW5nIHdpdGggdGhlIHByZWZpeCBzeW1ib2xcbiAgICBjb25zdCBsaW5lcyA9IG1lc3NhZ2VGb3JtYXR0ZWQuc3BsaXQoXCJcXG5cIik7XG4gICAgY29uc3QgbG9nU3RyaW5nID0gbGluZXNcbiAgICAgIC5tYXAoKGxpbmUsIGluZGV4KSA9PiB7XG4gICAgICAgIC8vIEFkZCB0aGUgc3ltYm9sIG9ubHkgdG8gdGhlIGZpcnN0IGxpbmUgYW5kIGtlZXAgdGhlIGluZGVudGF0aW9uIGZvciB0aGUgcmVzdFxuICAgICAgICBjb25zdCBwcmVmaXggPSBpbmRleCA9PT0gMCA/IGBcXHQke3N5bWJvbH1gIDogYFxcdCR7XCIgXCIucmVwZWF0KHN5bWJvbC5sZW5ndGgpfWA7XG4gICAgICAgIHJldHVybiBgJHtwcmVmaXh9ICR7bGluZX1gO1xuICAgICAgfSlcbiAgICAgIC5qb2luKFwiXFxuXCIpO1xuXG4gICAgY29uc3QgZnVsbExvZ1N0cmluZyA9IGxvZ1N0cmluZztcblxuICAgIGNvbnN0IGNvbG9yTWFwOiBSZWNvcmQ8TG9nTGV2ZWxXaXRoT2ssIFtrZXlvZiB0eXBlb2YgY29uc29sZSwgQ29sb3JzXT4gPSB7XG4gICAgICBmYXRhbDogW1wiZXJyb3JcIiwgQ09MT1JTLmZnUmVkXSxcbiAgICAgIG9rOiBbXCJsb2dcIiwgQ09MT1JTLmZnR3JlZW5dLFxuICAgICAgd2FybjogW1wid2FyblwiLCBDT0xPUlMuZmdZZWxsb3ddLFxuICAgICAgZXJyb3I6IFtcIndhcm5cIiwgQ09MT1JTLmZnWWVsbG93XSxcbiAgICAgIGluZm86IFtcImluZm9cIiwgQ09MT1JTLmRpbV0sXG4gICAgICBkZWJ1ZzogW1wiZGVidWdcIiwgQ09MT1JTLmZnTWFnZW50YV0sXG4gICAgICB2ZXJib3NlOiBbXCJkZWJ1Z1wiLCBDT0xPUlMuZGltXSxcbiAgICB9O1xuXG4gICAgY29uc3QgX2NvbnNvbGUgPSBjb25zb2xlW2NvbG9yTWFwW3R5cGVdWzBdIGFzIGtleW9mIHR5cGVvZiBjb25zb2xlXSBhcyAoLi4uYXJnczogc3RyaW5nW10pID0+IHZvaWQ7XG4gICAgaWYgKHR5cGVvZiBfY29uc29sZSA9PT0gXCJmdW5jdGlvblwiICYmIGZ1bGxMb2dTdHJpbmcubGVuZ3RoID4gMTIpIHtcbiAgICAgIF9jb25zb2xlKHRoaXMuX2NvbG9yaXplVGV4dChmdWxsTG9nU3RyaW5nLCBjb2xvck1hcFt0eXBlXVsxXSkpO1xuICAgIH0gZWxzZSBpZiAoZnVsbExvZ1N0cmluZy5sZW5ndGggPD0gMTIpIHtcbiAgICAgIC8vIHJlbW92aW5nIGVtcHR5IGxvZ3Mgd2hpY2ggb25seSBjb250YWluIHRoZSBzeW1ib2xcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGZ1bGxMb2dTdHJpbmcpO1xuICAgIH1cbiAgfVxufVxuIl19

/***/ }),

/***/ 907:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogReturn = void 0;
class LogReturn {
    logMessage;
    metadata;
    constructor(logMessage, metadata) {
        this.logMessage = logMessage;
        this.metadata = metadata;
    }
}
exports.LogReturn = LogReturn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLXR5cGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9ob21lL294MjZhL1Byb2plY3RzL3ViaXF1aXR5LW9zLWxvZ2dlci9zcmMvdHlwZXMvbG9nLXR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTJCQSxNQUFhLFNBQVM7SUFDcEIsVUFBVSxDQUFhO0lBQ3ZCLFFBQVEsQ0FBWTtJQUVwQixZQUFZLFVBQXNCLEVBQUUsUUFBbUI7UUFDckQsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDM0IsQ0FBQztDQUNGO0FBUkQsOEJBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDT0xPUlMsIExPR19MRVZFTCB9IGZyb20gXCIuLi9jb25zdGFudHNcIjtcblxudHlwZSBMb2dNZXNzYWdlID0geyByYXc6IHN0cmluZzsgZGlmZjogc3RyaW5nOyBsZXZlbDogTG9nTGV2ZWw7IHR5cGU6IExvZ0xldmVsV2l0aE9rIH07XG50eXBlIExvZ0Z1bmN0aW9uID0gKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBNZXRhZGF0YSkgPT4gdm9pZDtcblxuZXhwb3J0IHR5cGUgQ29sb3JzID0gKHR5cGVvZiBDT0xPUlMpW2tleW9mIHR5cGVvZiBDT0xPUlNdO1xuZXhwb3J0IHR5cGUgTG9nTGV2ZWwgPSAodHlwZW9mIExPR19MRVZFTClba2V5b2YgdHlwZW9mIExPR19MRVZFTF07XG5leHBvcnQgdHlwZSBMb2dMZXZlbFdpdGhPayA9IFwib2tcIiB8IExvZ0xldmVsO1xuXG5leHBvcnQgdHlwZSBMb2dQYXJhbXMgPSB7XG4gIGNvbnNvbGVMb2c6IExvZ0Z1bmN0aW9uO1xuICBsb2dNZXNzYWdlOiBzdHJpbmc7XG4gIGxldmVsOiBMb2dMZXZlbDtcbiAgdHlwZTogTG9nTGV2ZWxXaXRoT2s7XG4gIG1ldGFkYXRhPzogTWV0YWRhdGE7XG59O1xuXG5pbnRlcmZhY2UgTWV0YWRhdGFJbnRlcmZhY2Uge1xuICBlcnJvcjogRXJyb3IgfCB7IHN0YWNrOiBzdHJpbmcgfTtcbiAgc3RhY2s6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIFtrZXk6IHN0cmluZ106IHVua25vd247XG59XG5cbmV4cG9ydCB0eXBlIE1ldGFkYXRhID0gUGFydGlhbDxNZXRhZGF0YUludGVyZmFjZT47XG5cbmV4cG9ydCBjbGFzcyBMb2dSZXR1cm4ge1xuICBsb2dNZXNzYWdlOiBMb2dNZXNzYWdlO1xuICBtZXRhZGF0YT86IE1ldGFkYXRhO1xuXG4gIGNvbnN0cnVjdG9yKGxvZ01lc3NhZ2U6IExvZ01lc3NhZ2UsIG1ldGFkYXRhPzogTWV0YWRhdGEpIHtcbiAgICB0aGlzLmxvZ01lc3NhZ2UgPSBsb2dNZXNzYWdlO1xuICAgIHRoaXMubWV0YWRhdGEgPSBtZXRhZGF0YTtcbiAgfVxufVxuIl19

/***/ }),

/***/ 450:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cleanLogString = cleanLogString;
exports.cleanSpyLogs = cleanSpyLogs;
exports.tryError = tryError;
// eslint-disable-next-line no-control-regex
const ansiEscapeCodes = /\x1b\[\d+m|\s/g;
function cleanLogs(spy) {
    const strs = spy.mock.calls.map((call) => call.map((str) => str?.toString()).join(" "));
    return strs.flat().map((str) => cleanLogString(str));
}
function cleanLogString(logString) {
    return logString.replaceAll(ansiEscapeCodes, "").replaceAll(/\n/g, "").replaceAll(/\r/g, "").replaceAll(/\t/g, "").trim();
}
function cleanSpyLogs(spy) {
    return cleanLogs(spy);
}
function tryError() {
    try {
        throw new Error("This is an error");
    }
    catch (e) {
        return e;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9ob21lL294MjZhL1Byb2plY3RzL3ViaXF1aXR5LW9zLWxvZ2dlci9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFhQSx3Q0FFQztBQUVELG9DQU9DO0FBRUQsNEJBTUM7QUFoQ0QsNENBQTRDO0FBQzVDLE1BQU0sZUFBZSxHQUFHLGdCQUFnQixDQUFDO0FBRXpDLFNBQVMsU0FBUyxDQUNoQixHQUdFO0lBRUYsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN4RixPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFFRCxTQUFnQixjQUFjLENBQUMsU0FBaUI7SUFDOUMsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM1SCxDQUFDO0FBRUQsU0FBZ0IsWUFBWSxDQUMxQixHQUdFO0lBRUYsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDeEIsQ0FBQztBQUVELFNBQWdCLFFBQVE7SUFDdEIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFVLENBQUM7SUFDcEIsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29udHJvbC1yZWdleFxuY29uc3QgYW5zaUVzY2FwZUNvZGVzID0gL1xceDFiXFxbXFxkK218XFxzL2c7XG5cbmZ1bmN0aW9uIGNsZWFuTG9ncyhcbiAgc3B5OiBqZXN0LlNwaWVkRnVuY3Rpb248e1xuICAgICguLi5kYXRhOiBzdHJpbmdbXSk6IHZvaWQ7XG4gICAgKG1lc3NhZ2U/OiBzdHJpbmcsIC4uLm9wdGlvbmFsUGFyYW1zOiBzdHJpbmdbXSk6IHZvaWQ7XG4gIH0+XG4pIHtcbiAgY29uc3Qgc3RycyA9IHNweS5tb2NrLmNhbGxzLm1hcCgoY2FsbCkgPT4gY2FsbC5tYXAoKHN0cikgPT4gc3RyPy50b1N0cmluZygpKS5qb2luKFwiIFwiKSk7XG4gIHJldHVybiBzdHJzLmZsYXQoKS5tYXAoKHN0cikgPT4gY2xlYW5Mb2dTdHJpbmcoc3RyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbkxvZ1N0cmluZyhsb2dTdHJpbmc6IHN0cmluZykge1xuICByZXR1cm4gbG9nU3RyaW5nLnJlcGxhY2VBbGwoYW5zaUVzY2FwZUNvZGVzLCBcIlwiKS5yZXBsYWNlQWxsKC9cXG4vZywgXCJcIikucmVwbGFjZUFsbCgvXFxyL2csIFwiXCIpLnJlcGxhY2VBbGwoL1xcdC9nLCBcIlwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhblNweUxvZ3MoXG4gIHNweTogamVzdC5TcGllZEZ1bmN0aW9uPHtcbiAgICAoLi4uZGF0YTogc3RyaW5nW10pOiB2b2lkO1xuICAgIChtZXNzYWdlPzogc3RyaW5nLCAuLi5vcHRpb25hbFBhcmFtczogc3RyaW5nW10pOiB2b2lkO1xuICB9PlxuKTogc3RyaW5nW10ge1xuICByZXR1cm4gY2xlYW5Mb2dzKHNweSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cnlFcnJvcigpIHtcbiAgdHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGlzIGFuIGVycm9yXCIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGUgYXMgRXJyb3I7XG4gIH1cbn1cbiJdfQ==

/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs");

/***/ }),

/***/ 928:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("path");

/***/ }),

/***/ 16:
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("url");

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "BJ", ({ value: true }));
exports.lm = exports.E$ = exports.p9 = exports.nR = exports.Fd = exports.eH = exports.uf = void 0;
const logs_1 = __nccwpck_require__(116);
Object.defineProperty(exports, "uf", ({ enumerable: true, get: function () { return logs_1.Logs; } }));
const pretty_logs_1 = __nccwpck_require__(623);
Object.defineProperty(exports, "eH", ({ enumerable: true, get: function () { return pretty_logs_1.PrettyLogs; } }));
const log_types_1 = __nccwpck_require__(907);
Object.defineProperty(exports, "Fd", ({ enumerable: true, get: function () { return log_types_1.LogReturn; } }));
const utils_1 = __nccwpck_require__(450);
Object.defineProperty(exports, "nR", ({ enumerable: true, get: function () { return utils_1.cleanLogString; } }));
Object.defineProperty(exports, "p9", ({ enumerable: true, get: function () { return utils_1.cleanSpyLogs; } }));
const constants_1 = __nccwpck_require__(78);
Object.defineProperty(exports, "E$", ({ enumerable: true, get: function () { return constants_1.LOG_LEVEL; } }));
Object.defineProperty(exports, "lm", ({ enumerable: true, get: function () { return constants_1.COLORS; } }));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZmlsZTovLy9ob21lL294MjZhL1Byb2plY3RzL3ViaXF1aXR5LW9zLWxvZ2dlci9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUNBQThCO0FBT3JCLHFGQVBBLFdBQUksT0FPQTtBQU5iLCtDQUEyQztBQU01QiwyRkFOTix3QkFBVSxPQU1NO0FBTHpCLGlEQUEwRjtBQUsvRCwwRkFMbEIscUJBQVMsT0FLa0I7QUFKcEMsbUNBQXVEO0FBSWpCLCtGQUo3QixzQkFBYyxPQUk2QjtBQUFFLDZGQUo3QixvQkFBWSxPQUk2QjtBQUhsRSwyQ0FBZ0Q7QUFHb0IsMEZBSDNELHFCQUFTLE9BRzJEO0FBQUUsdUZBSDNELGtCQUFNLE9BRzJEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTG9ncyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB7IFByZXR0eUxvZ3MgfSBmcm9tIFwiLi9wcmV0dHktbG9nc1wiO1xuaW1wb3J0IHsgTG9nUmV0dXJuLCBNZXRhZGF0YSwgTG9nTGV2ZWwsIExvZ0xldmVsV2l0aE9rLCBDb2xvcnMgfSBmcm9tIFwiLi90eXBlcy9sb2ctdHlwZXNcIjtcbmltcG9ydCB7IGNsZWFuTG9nU3RyaW5nLCBjbGVhblNweUxvZ3MgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgTE9HX0xFVkVMLCBDT0xPUlMgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcblxuZXhwb3J0IHR5cGUgeyBNZXRhZGF0YSwgTG9nTGV2ZWwsIExvZ0xldmVsV2l0aE9rLCBDb2xvcnMgfTtcbmV4cG9ydCB7IExvZ3MsIFByZXR0eUxvZ3MsIExvZ1JldHVybiwgY2xlYW5Mb2dTdHJpbmcsIGNsZWFuU3B5TG9ncywgTE9HX0xFVkVMLCBDT0xPUlMgfTtcbiJdfQ==
})();

var __webpack_exports__COLORS = __webpack_exports__.lm;
var __webpack_exports__LOG_LEVEL = __webpack_exports__.E$;
var __webpack_exports__LogReturn = __webpack_exports__.Fd;
var __webpack_exports__Logs = __webpack_exports__.uf;
var __webpack_exports__PrettyLogs = __webpack_exports__.eH;
var __webpack_exports___esModule = __webpack_exports__.BJ;
var __webpack_exports__cleanLogString = __webpack_exports__.nR;
var __webpack_exports__cleanSpyLogs = __webpack_exports__.p9;
export { __webpack_exports__COLORS as COLORS, __webpack_exports__LOG_LEVEL as LOG_LEVEL, __webpack_exports__LogReturn as LogReturn, __webpack_exports__Logs as Logs, __webpack_exports__PrettyLogs as PrettyLogs, __webpack_exports___esModule as __esModule, __webpack_exports__cleanLogString as cleanLogString, __webpack_exports__cleanSpyLogs as cleanSpyLogs };

//# sourceMappingURL=index.js.map