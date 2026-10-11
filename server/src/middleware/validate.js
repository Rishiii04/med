import { ZodError } from 'zod';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };
      
      const validated = schema.parse(data);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
      });
    }
  };
};

export const validateBody = (schema) => validate(zod.object({ body: schema }));
export const validateQuery = (schema) => validate(zod.object({ query: schema }));
export const validateParams = (schema) => validate(zod.object({ params: schema }));

import { z } from 'zod';
export { z };