import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { FieldType, FormField } from '../../../core/models/form-builder.models';

const INPUT_TYPE_MAP: Record<FieldType, string> = {
  text: 'text',
  integer: 'number',
  decimal: 'number',
  textarea: 'text',
  datetime: 'datetime-local',
  email: 'email',
  phone: 'tel',
  url: 'url',
};

const INPUT_STEP_MAP: Partial<Record<FieldType, string>> = {
  integer: '1',
  decimal: 'any',
};

@Component({
  selector: 'app-dynamic-field',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-field.component.html',
  styleUrl: './dynamic-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class DynamicField implements OnChanges {
  @Input({ required: true }) field!: FormField;
  @Input() submitted = false;

  inputType = 'text';
  inputStep: string | null = null;
  isTextarea = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.inputType = INPUT_TYPE_MAP[this.field.type] ?? 'text';
      this.inputStep = INPUT_STEP_MAP[this.field.type] ?? null;
      this.isTextarea = this.field.type === 'textarea';
    }
  }
}
