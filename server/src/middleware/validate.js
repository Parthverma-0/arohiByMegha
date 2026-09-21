import { ApiError } from '../utils/ApiError.js';

// Wraps a zod schema; validates req.body (or a custom part) and replaces it
// with the parsed+coerced result so controllers can trust their input shape.
export function validate(schema, part = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(new ApiError(400, 'Invalid request', result.error.flatten()));
    }
    req[part] = result.data;
    next();
  };
}
