import { TransformFnParams } from 'class-transformer';

/** Coerce Gender Code */
export const genderCodeTransformer = (params: TransformFnParams) => {
  if (typeof params.value === 'string') {
    const trimmed = params.value.trim();
    return trimmed === '' ? undefined : Number(trimmed);
  }

  return params.value;
};
