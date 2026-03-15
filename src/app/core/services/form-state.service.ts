import { Injectable } from '@angular/core';
import { BehaviorSubject, map, shareReplay } from 'rxjs';
import { FieldType, FormField, FormRecord, FormSchema } from '../models/form-builder.models';

const SCHEMA_KEY = 'form_builder_schema';
const RECORDS_KEY = 'form_builder_records';

const FIELD_DEFAULTS: Record<FieldType, string> = {
  text: 'Text Field',
  integer: 'Integer Field',
  decimal: 'Decimal Field',
  textarea: 'Text Area',
  datetime: 'Date & Time',
  email: 'Email Field',
  phone: 'Phone Field',
  url: 'URL Field',
};

@Injectable({ providedIn: 'root' })
export class FormStateService {
  private readonly schemaSubject = new BehaviorSubject<FormSchema>(this.loadSchema());
  private readonly recordsSubject = new BehaviorSubject<FormRecord[]>(this.loadRecords());

  readonly fields$ = this.schemaSubject.pipe(
    map((schema) => schema.fields),
    shareReplay(1),
  );

  readonly records$ = this.recordsSubject.asObservable();

  readonly hasFields$ = this.fields$.pipe(map((fields) => fields.length > 0));

  readonly hasRecords$ = this.records$.pipe(map((records) => records.length > 0));

  getFieldsSnapshot(): FormField[] {
    return this.schemaSubject.getValue().fields;
  }

  addField(type: FieldType): string {
    const current = this.schemaSubject.getValue();
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: FIELD_DEFAULTS[type],
      required: false,
    };
    this.schemaSubject.next({ fields: [...current.fields, newField] });
    this.persistSchema();
    return newField.id;
  }

  updateField(id: string, patch: Partial<FormField>): void {
    const current = this.schemaSubject.getValue();
    this.schemaSubject.next({
      fields: current.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
    this.persistSchema();
  }

  removeField(id: string): void {
    const current = this.schemaSubject.getValue();
    this.schemaSubject.next({ fields: current.fields.filter((field) => field.id !== id) });
    this.persistSchema();
  }

  submitRecord(data: Record<string, unknown>): void {
    const record: FormRecord = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      data,
    };
    this.recordsSubject.next([...this.recordsSubject.getValue(), record]);
    this.persistRecords();
  }

  clearRecords(): void {
    this.recordsSubject.next([]);
    this.persistRecords();
  }

  resetSchema(): void {
    this.schemaSubject.next({ fields: [] });
    this.persistSchema();
  }

  private loadSchema(): FormSchema {
    try {
      const raw = localStorage.getItem(SCHEMA_KEY);
      if (raw) return JSON.parse(raw) as FormSchema;
    } catch {
    }
    return { fields: [] };
  }

  private loadRecords(): FormRecord[] {
    try {
      const raw = localStorage.getItem(RECORDS_KEY);
      if (raw) return JSON.parse(raw) as FormRecord[];
    } catch {
    }
    return [];
  }

  private persistSchema(): void {
    localStorage.setItem(SCHEMA_KEY, JSON.stringify(this.schemaSubject.getValue()));
  }

  private persistRecords(): void {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(this.recordsSubject.getValue()));
  }
}
