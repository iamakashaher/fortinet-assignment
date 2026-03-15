export type FieldType =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'textarea'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
}

export interface FormSchema {
  fields: FormField[];
}

export interface FormRecord {
  id: string;
  submittedAt: string;
  data: Record<string, unknown>;
}
