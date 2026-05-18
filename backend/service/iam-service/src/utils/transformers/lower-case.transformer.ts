import { TransformFnParams } from 'class-transformer';

export const lowerCaseTransformer = (params: TransformFnParams) => {
  if (params.value === null || params.value === undefined) {
    return params.value;
  }

  if (Array.isArray(params.value)) {
    return params.value.map((value) =>
      typeof value === 'string' ? value.toLowerCase() : value,
    );
  }

  return params.value.toLowerCase();
};
