/**
 * Deep Merge Utility
 * 
 * Merges translation overrides with defaults.
 * Only the overridden keys are replaced, keeping all other defaults.
 */

export type DeepObject = Record<string, unknown>;

/**
 * Check if value is a plain object (not array, null, etc.)
 */
function isObject(item: unknown): item is DeepObject {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects
 * 
 * @param target - Base object (defaults)
 * @param source - Override object (custom values)
 * @returns Merged object with source values overriding target
 * 
 * @example
 * const defaults = { a: 1, b: { c: 2, d: 3 } };
 * const overrides = { b: { c: 10 } };
 * deepMerge(defaults, overrides);
 * // Result: { a: 1, b: { c: 10, d: 3 } }
 */
export function deepMerge<T extends DeepObject>(
  target: T,
  source: Partial<T> | undefined | null
): T {
  // If no source, return target as-is
  if (!source) {
    return target;
  }

  // Create a shallow copy of target
  const output = { ...target } as T;

  // Iterate over source keys
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      // If both values are objects, recursively merge
      if (isObject(sourceValue) && isObject(targetValue)) {
        (output as DeepObject)[key] = deepMerge(
          targetValue as DeepObject,
          sourceValue as DeepObject
        );
      } else if (sourceValue !== undefined) {
        // Otherwise, use source value (if defined)
        (output as DeepObject)[key] = sourceValue;
      }
    }
  }

  return output;
}

/**
 * Get a nested value from an object using dot notation
 * 
 * @example
 * getNestedValue({ a: { b: { c: 'hello' } } }, 'a.b.c');
 * // Result: 'hello'
 */
export function getNestedValue(obj: DeepObject, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as DeepObject)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Set a nested value in an object using dot notation
 * Creates intermediate objects if they don't exist
 * 
 * @example
 * const obj = {};
 * setNestedValue(obj, 'a.b.c', 'hello');
 * // Result: { a: { b: { c: 'hello' } } }
 */
export function setNestedValue(obj: DeepObject, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as DeepObject;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Flatten a nested object into dot-notation keys
 * Useful for displaying all translation keys in admin
 * 
 * @example
 * flattenObject({ a: { b: 1, c: 2 }, d: 3 });
 * // Result: { 'a.b': 1, 'a.c': 2, 'd': 3 }
 */
export function flattenObject(
  obj: DeepObject,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (isObject(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else if (typeof value === 'string') {
        result[newKey] = value;
      }
    }
  }

  return result;
}

/**
 * Unflatten a dot-notation object back to nested
 * 
 * @example
 * unflattenObject({ 'a.b': 1, 'a.c': 2, 'd': 3 });
 * // Result: { a: { b: 1, c: 2 }, d: 3 }
 */
export function unflattenObject(
  obj: Record<string, string>
): DeepObject {
  const result: DeepObject = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      setNestedValue(result, key, obj[key]);
    }
  }

  return result;
}

