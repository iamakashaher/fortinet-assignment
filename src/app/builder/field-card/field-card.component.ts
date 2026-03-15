import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FieldType, FormField } from '../../core/models/form-builder.models';

interface FieldTypeOption {
  type: FieldType;
  label: string;
}

const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  { type: 'text', label: 'Text' },
  { type: 'integer', label: 'Integer' },
  { type: 'decimal', label: 'Decimal' },
  { type: 'textarea', label: 'Text Area' },
  { type: 'datetime', label: 'Date & Time' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'url', label: 'URL' },
];

@Component({
  selector: 'app-field-card',
  imports: [ReactiveFormsModule],
  templateUrl: './field-card.component.html',
  styleUrl: './field-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldCard implements OnInit, OnChanges {
  @Input({ required: true }) field!: FormField;

  @Output() fieldChange = new EventEmitter<Partial<FormField>>();

  readonly fieldTypeOptions = FIELD_TYPE_OPTIONS;

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    type: ['' as FieldType],
    label: [''],
    required: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.form.setValue(
        { type: this.field.type, label: this.field.label, required: this.field.required },
        { emitEvent: false },
      );
    }
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((formValue) => {
      this.fieldChange.emit({
        type: (formValue.type as FieldType) ?? this.field.type,
        label: formValue.label ?? '',
        required: formValue.required ?? false,
      });
    });
  }
}
