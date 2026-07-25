import { TransformFnParams } from 'class-transformer';

/**
 * Coerces an ISO 5218 gender code arriving as a string into a number, so query
 * strings and form posts validate the same way as a JSON body does. Anything
 * that is not a non-empty string passes through untouched for @IsIn to reject.
 */
export const genderCodeTransformer = (params: TransformFnParams) => {
  if (typeof params.value === 'string') {
    const trimmed = params.value.trim();
    return trimmed === '' ? undefined : Number(trimmed);
  }

  return params.value;
};
