const HttpError = require("./httpError");

function string(value, field, { required = false, max = 120 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `${field} is required.`);
    return undefined;
  }
  if (typeof value !== "string" || value.trim().length > max) {
    throw new HttpError(400, `${field} must be a string of at most ${max} characters.`);
  }
  return value.trim();
}

function positiveNumber(value, field, { required = false, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new HttpError(400, `${field} is required.`);
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new HttpError(400, `${field} must be a number between ${min} and ${max}.`);
  }
  return number;
}

function objectId(value, field) {
  const mongoose = require("mongoose");
  if (!mongoose.isObjectIdOrHexString(value)) throw new HttpError(400, `${field} is invalid.`);
  return value;
}

function enumValue(value, field, values, { required = false } = {}) {
  const result = string(value, field, { required });
  if (result !== undefined && !values.includes(result)) {
    throw new HttpError(400, `${field} must be one of: ${values.join(", ")}.`);
  }
  return result;
}

function boolean(value, field) {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  throw new HttpError(400, `${field} must be true or false.`);
}

function page(query) {
  return {
    page: Math.floor(positiveNumber(query.page || 1, "page", { min: 1, max: 100000 })),
    limit: Math.floor(positiveNumber(query.limit || 10, "limit", { min: 1, max: 50 })),
  };
}

function escapedRegex(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

module.exports = { boolean, enumValue, escapedRegex, objectId, page, positiveNumber, string };
