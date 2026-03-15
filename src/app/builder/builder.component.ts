import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';
import { FieldType, FormField } from '../core/models/form-builder.models';
import { FormStateService } from '../core/services/form-state.service';
import { FieldCard } from './field-card/field-card.component';

interface FieldTypeOption {
  type: FieldType;
  label: string;
  icon: string;
}

const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'integer', label: 'Integer', icon: '#' },
  { type: 'decimal', label: 'Decimal', icon: '.' },
  { type: 'textarea', label: 'Text Area', icon: 'T' },
  { type: 'datetime', label: 'Date & Time', icon: '//' },
  { type: 'email', label: 'Email', icon: '@' },
  { type: 'phone', label: 'Phone', icon: '+' },
  { type: 'url', label: 'URL', icon: '<>' },
];

const TYPE_ICONS: Record<FieldType, string> = {
  text: 'T',
  integer: '#',
  decimal: '.',
  textarea: '¶',
  datetime: '📅',
  email: '@',
  phone: '☎',
  url: '🔗',
};

@Component({
  selector: 'app-builder',
  imports: [AsyncPipe, FieldCard],
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeTypeMenu()',
  },
})
export class Builder {
  protected readonly formState = inject(FormStateService);

  readonly fieldTypeOptions = FIELD_TYPE_OPTIONS;

  private readonly selectedFieldIdSubject = new BehaviorSubject<string | null>(null);

  private readonly typeMenuSourceSubject = new BehaviorSubject<'header' | 'footer' | null>(null);

  private readonly fieldFilterSubject = new BehaviorSubject<string>('');

  private originalFieldSnapshot: FormField | null = null;

  readonly state$ = combineLatest({
    fields: this.formState.fields$,
    selectedFieldId: this.selectedFieldIdSubject.asObservable(),
    typeMenuSource: this.typeMenuSourceSubject.asObservable(),
    fieldFilter: this.fieldFilterSubject.asObservable(),
  }).pipe(
    map(({ fields, selectedFieldId, typeMenuSource, fieldFilter }) => {
      const term = fieldFilter.trim().toLowerCase();
      const filteredFields = term
        ? fields.filter((f) => f.label.toLowerCase().includes(term) || f.type.toLowerCase().includes(term))
        : fields;
      return {
        fields: filteredFields,
        totalFields: fields.length,
        selectedFieldId,
        typeMenuSource,
        fieldFilter,
        selectedField: fields.find((field) => field.id === selectedFieldId) ?? null,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getTypeIcon(type: FieldType): string {
    return TYPE_ICONS[type];
  }

  selectField(id: string): void {
    const found = this.formState.getFieldsSnapshot().find((f) => f.id === id) ?? null;
    this.originalFieldSnapshot = found ? { ...found } : null;
    this.selectedFieldIdSubject.next(id);
  }

  toggleTypeMenu(source: 'header' | 'footer', event: Event): void {
    event.stopPropagation();
    const current = this.typeMenuSourceSubject.getValue();
    this.typeMenuSourceSubject.next(current === source ? null : source);
  }

  closeTypeMenu(): void {
    if (this.typeMenuSourceSubject.getValue() !== null) {
      this.typeMenuSourceSubject.next(null);
    }
  }

  addField(type: FieldType, event: Event): void {
    event.stopPropagation();
    const newId = this.formState.addField(type);
    const found = this.formState.getFieldsSnapshot().find((f) => f.id === newId) ?? null;
    this.originalFieldSnapshot = found ? { ...found } : null;
    this.selectedFieldIdSubject.next(newId);
    this.typeMenuSourceSubject.next(null);
  }

  removeField(id: string, event: Event): void {
    event.stopPropagation();
    const selectedId = this.selectedFieldIdSubject.getValue();
    this.formState.removeField(id);
    if (selectedId === id) {
      this.selectedFieldIdSubject.next(null);
    }
  }

  revertField(): void {
    const snapshot = this.originalFieldSnapshot;
    if (snapshot) {
      this.formState.updateField(snapshot.id, snapshot);
    }
  }

  applyField(): void {
    this.originalFieldSnapshot = null;
    this.selectedFieldIdSubject.next(null);
  }

  setFieldFilter(value: string): void {
    this.fieldFilterSubject.next(value);
  }

  onFieldChange(id: string, patch: Partial<FormField>): void {
    this.formState.updateField(id, patch);
  }
}
