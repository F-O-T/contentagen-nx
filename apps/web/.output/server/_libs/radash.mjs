const isSymbol = (value) => {
  return !!value && value.constructor === Symbol;
};
const isFunction = (value) => {
  return !!(value && value.constructor && value.call && value.apply);
};
const isNumber = (value) => {
  try {
    return Number(value) === value;
  } catch {
    return false;
  }
};
const isDate = (value) => {
  return Object.prototype.toString.call(value) === "[object Date]";
};
const isEmpty = (value) => {
  if (value === true || value === false)
    return true;
  if (value === null || value === void 0)
    return true;
  if (isNumber(value))
    return value === 0;
  if (isDate(value))
    return isNaN(value.getTime());
  if (isFunction(value))
    return false;
  if (isSymbol(value))
    return false;
  const length = value.length;
  if (isNumber(length))
    return length === 0;
  const size = value.size;
  if (isNumber(size))
    return size === 0;
  const keys = Object.keys(value).length;
  return keys === 0;
};
const guard = (func, shouldGuard) => {
  const _guard = (err) => {
    return void 0;
  };
  const isPromise2 = (result) => result instanceof Promise;
  try {
    const result = func();
    return isPromise2(result) ? result.catch(_guard) : result;
  } catch (err) {
    return _guard();
  }
};
export {
  guard as g,
  isEmpty as i
};
