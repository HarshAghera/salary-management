/** `class-transformer` helpers that normalise text input before validation runs. */
type TransformArgs = { value: unknown };

export const trim = ({ value }: TransformArgs) => (typeof value === 'string' ? value.trim() : value);

export const trimLower = ({ value }: TransformArgs) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const trimUpper = ({ value }: TransformArgs) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;
