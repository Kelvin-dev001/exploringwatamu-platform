'use strict';

const { ZodError } = require('zod');

// Request validation middleware. Parses and REPLACES req[source] with the
// validated/coerced value, so downstream handlers get clean, typed input.
// Usage: router.post('/x', validate(schema), handler)
module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Express 5 makes req.query a getter: plain assignment is silently
      // ignored, so the parsed value (coerced numbers, defaults) would be lost.
      if (source === 'query') Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true, enumerable: true });
      else req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err.issues || err.errors || []).map((e) => ({
          path: Array.isArray(e.path) ? e.path.join('.') : String(e.path ?? ''),
          message: e.message,
        }));
        return res.status(400).json({ error: 'Validation failed', issues });
      }
      next(err);
    }
  };
};
