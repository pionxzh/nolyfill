// @ts-check
'use strict';

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const ezspawn = require('@jsdevtools/ez-spawn');

const currentPackageJson = require('./package.json');

const autoGeneratedPackagesList = /** @type {const} */ ([
  ['array-includes', 'Array.prototype.includes', false],
  ['array.prototype.findlastindex', `Array.prototype.findLastIndex || function (callback, thisArg) {
  for (let i = this.length - 1; i >= 0; i--) {
    if (callback.call(thisArg, this[i], i, this)) return i;
  }
  return -1;
}`, false],
  ['array.prototype.flat', 'Array.prototype.flat', false],
  ['array.prototype.flatmap', 'Array.prototype.flatMap', false],
  ['arraybuffer.prototype.slice', 'ArrayBuffer.prototype.slice', false],
  ['function.prototype.name', 'Function.prototype.name', false],
  ['has', 'Object.prototype.hasOwnProperty', false],
  ['object-keys', 'Object.keys', true],
  ['object.assign', 'Object.assign', true],
  ['object.entries', 'Object.entries', true],
  ['object.fromentries', 'Object.fromEntries', true],
  ['object.hasown', 'Object.hasOwn || require(\'@nolyfill/shared\').uncurryThis(Object.prototype.hasOwnProperty)', true, true],
  ['object.values', 'Object.values', true],
  ['string.prototype.trim', 'String.prototype.trim', false],
  ['string.prototype.trimend', 'String.prototype.trimEnd', false],
  ['string.prototype.trimstart', 'String.prototype.trimStart', false],
  ['string.prototype.trimleft', 'String.prototype.trimLeft', false],
  ['string.prototype.trimright', 'String.prototype.trimRight', false],
  ['string.prototype.matchall', 'String.prototype.matchAll', false],
  ['regexp.prototype.flags', 'RegExp.prototype.flags', false],
  ['globalthis', 'globalThis', true],
  ['array.prototype.tosorted', `Array.prototype.toSorted || function (compareFn) {
  const o = Object(this);
  const l = Number(o.length);
  const a = new Array(l);
  for (let i = 0; i < l; i++) {
    a[i] = o[i];
  }
  Array.prototype.sort.call(a, compareFn);
  return a;
}`, false],
  ['object.groupby', `Object.groupBy || function (items, callbackfn) {
  const o = Object.create(null);
  let k = 0;
  for (const value of items) {
    const key = callbackfn(value, k++);
    if (key in o) {
      Array.prototype.push.call(o[key], value);
    } else {
      o[key] = [value];
    }
  }
  return o;
}`, true],
  ['array.prototype.find', 'Array.prototype.find', false],
  ['array.from', 'Array.from', true]
  // ['string.prototype.padend', 'String.prototype.padEnd', false],
  // ['string.prototype.padstart', 'String.prototype.padStart', false],
  // ['string.prototype.padend', 'String.prototype.padEnd', false],
  // ['object.getownpropertydescriptors', 'Object.getOwnPropertyDescriptors', true],
  // ['array.prototype.reduce', 'Array.prototype.reduce', false],
  // ['object-is', 'Object.is', true],
  // ['reflect.ownkeys', 'Reflect.ownKeys', true],
  // ['array.prototype.filter', 'Array.prototype.filter', false],
  // ['promise.any', 'Promise.any', true],
  // ['promise.allsettled', 'Promise.allSettled', true],
  // ['string.prototype.replaceall', 'String.prototype.replaceAll', false],
  // ['array.prototype.map', 'Array.prototype.map', false],
  // ['reflect.getprototypeof', 'Reflect.getPrototypeOf', true],
  // ['object.getprototypeof', 'Object.getPrototypeOf', true]
]);

const singleFilePackagesList = /** @type {const} */ ([
  ['has-property-descriptors', `const hasPropertyDescriptors = () => true;
hasPropertyDescriptors.hasArrayLengthDefineBug = () => false;
module.exports = hasPropertyDescriptors;`],
  ['gopd', 'module.exports = Object.getOwnPropertyDescriptor;'],
  ['has-proto', 'module.exports = () => true'],
  ['get-symbol-description', `const { uncurryThis } = require('@nolyfill/shared');
module.exports = uncurryThis(Object.getOwnPropertyDescriptor(Symbol.prototype, 'description').get);`, true],
  ['is-array-buffer', `const { uncurryThis } = require('@nolyfill/shared');
const bL = uncurryThis(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
module.exports = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  try {
    bL(obj);
    return true;
  } catch (_) {
    return false;
  }
};`, true],
  ['is-shared-array-buffer', `const { uncurryThis } = require('@nolyfill/shared');
const bL = uncurryThis(Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'byteLength').get);
module.exports = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  try {
    bL(obj);
    return true;
  } catch (_) {
    return false;
  }
};
`, true],
  ['typed-array-buffer', `const { uncurryThis } = require('@nolyfill/shared');
module.exports = uncurryThis(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Int8Array.prototype), 'buffer').get);`, true],
  ['typed-array-byte-length', `const { TypedArrayPrototype, uncurryThis } = require('@nolyfill/shared');
const typedArrayByteLength = uncurryThis(Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'byteLength').get);
module.exports = (value) => {
  try {
    return typedArrayByteLength(value);
  } catch (e) {
    return false;
  }
};`, true],
  ['typed-array-byte-offset', `const { TypedArrayPrototype, uncurryThis } = require('@nolyfill/shared');
const typedArrayByteOffSet = uncurryThis(Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'byteOffset').get);
module.exports = (value) => {
  try {
    return typedArrayByteOffSet(value);
  } catch (e) {
    return false;
  }
};`, true],
  ['typed-array-length', `const { TypedArrayPrototype, uncurryThis } = require('@nolyfill/shared');
const typedArrayLength = uncurryThis(Object.getOwnPropertyDescriptor(TypedArrayPrototype, 'length').get);
module.exports = (value) => {
  try {
    return typedArrayLength(value);
  } catch (e) {
    return false;
  }
};`, true]
]);

const manualPackagesList = /** @type {const} */ ([
  'array-buffer-byte-length', // require multiple dependencies
  'function-bind' // function-bind's main entry poin is not uncurried, and doesn't follow es-shim API
]);

(async () => {
  await Promise.all([
    ...autoGeneratedPackagesList.map(pkg => createEsShimLikePackage(pkg[0], pkg[1], pkg[2], pkg[3])),
    ...singleFilePackagesList.map(pkg => createSingleFilePackage(pkg[0], pkg[1], pkg[2]))
  ]);

  const allPackages = [
    ...manualPackagesList,
    ...autoGeneratedPackagesList.map(pkg => pkg[0]),
    ...singleFilePackagesList.map(pkg => pkg[0])
  ].sort();

  const newPackageJson = {
    ...currentPackageJson,
    overrides: allPackages
      .reduce((acc, packageName) => {
        acc[/** @type {string} */(packageName)] = `npm:@nolyfill/${packageName}@latest`;
        return acc;
      }, /** @type {Record<string, string>} */({})),
    pnpm: {
      overrides: allPackages
        .reduce((acc, packageName) => {
          acc[/** @type {string} */(packageName)] = `workspace:@nolyfill/${packageName}@*`;
          return acc;
        }, /** @type {Record<string, string>} */({}))
    }
  };

  await compareAndWriteFile(
    path.join(__dirname, 'package.json'),
    `${JSON.stringify(newPackageJson, null, 2)}\n`
  );

  await ezspawn.async('pnpm', ['i']);
})();

/**
 * @param {string} path
 */
const fileExists = (path) => fsPromises.access(path, fs.constants.F_OK).then(() => true, () => false);
/**
 * If filePath doesn't exist, create new file with content.
 * If filePath already exists, compare content with existing file, only update the file when content changes.
 *
 * @param {string} filePath
 * @param {string} fileContent
 */
async function compareAndWriteFile(filePath, fileContent) {
  if (await fileExists(filePath)) {
    const existingContent = await fsPromises.readFile(filePath, { encoding: 'utf8' });
    if (existingContent !== fileContent) {
      return fsPromises.writeFile(filePath, fileContent, { encoding: 'utf-8' });
    }
  } else {
    return fsPromises.writeFile(filePath, fileContent, { encoding: 'utf-8' });
  }
}

/**
 * @param {string} packageName
 * @param {string} packageImplementation
 * @param {boolean} isStatic
 * @param {boolean} [forceUncurryThis]
 * @param {string} [minimumNodeVersion]
 */
async function createEsShimLikePackage(packageName, packageImplementation, isStatic, forceUncurryThis = false, minimumNodeVersion = '>=12.4.0') {
  const packagePath = path.join(__dirname, 'packages', packageName);

  await fsPromises.mkdir(
    packagePath,
    { recursive: true }
  );

  await Promise.all([
    compareAndWriteFile(
      path.join(packagePath, 'implementation.js'),
      `'use strict';\nmodule.exports = ${packageImplementation};\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'polyfill.js'),
      `'use strict';\nmodule.exports = () => ${packageImplementation};\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'shim.js'),
      `'use strict';\nmodule.exports = () => ${packageImplementation};\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'auto.js'),
      '\'use strict\';\n/* noop */\n'
    ),
    compareAndWriteFile(
      path.join(packagePath, 'index.js'),
      (isStatic
        ? `'use strict';\nconst impl = ${packageImplementation};\nmodule.exports = impl;\n`
        : `'use strict';\nconst { uncurryThis } = require('@nolyfill/shared');\nconst impl = ${packageImplementation};\nmodule.exports = uncurryThis(impl);\n`)
        .concat('module.exports.implementation = impl;\nmodule.exports.getPolyfill = () => impl;\nmodule.exports.shim = () => impl;\n')
    ),
    compareAndWriteFile(
      path.join(packagePath, 'package.json'),
      `${JSON.stringify({
        name: `@nolyfill/${packageName}`,
        version: currentPackageJson.version,
        main: './index.js',
        license: 'MIT',
        files: ['*.js'],
        scripts: {},
        dependencies: isStatic && !forceUncurryThis
          ? {}
          : {
            '@nolyfill/shared': 'workspace:*'
          },
        engines: {
          node: minimumNodeVersion
        }
      }, null, 2)}\n`
    )
  ]);

  console.log(`[${packageName}] created`);
}

/**
 * @param {string} packageName
 * @param {string} implementation
 * @param {boolean} [uncurryThis]
 * @param {string} [minimumNodeVersion]
 */
async function createSingleFilePackage(packageName, implementation, uncurryThis = false, minimumNodeVersion = '>=12.4.0') {
  const packagePath = path.join(__dirname, 'packages', packageName);

  await fsPromises.mkdir(
    packagePath,
    { recursive: true }
  );

  await Promise.all([
    compareAndWriteFile(
      path.join(packagePath, 'index.js'),
      `'use strict';\n${implementation}\n`
    ),
    compareAndWriteFile(
      path.join(packagePath, 'package.json'),
      `${JSON.stringify({
        name: `@nolyfill/${packageName}`,
        version: currentPackageJson.version,
        main: './index.js',
        license: 'MIT',
        files: ['*.js'],
        scripts: {},
        dependencies: !uncurryThis
          ? {}
          : {
            '@nolyfill/shared': 'workspace:*'
          },
        engines: {
          node: minimumNodeVersion
        }
      }, null, 2)}\n`
    )
  ]);

  console.log(`[${packageName}] created`);
}
