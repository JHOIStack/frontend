import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgIf } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { HabitService, Habit } from '../../core/services/habit.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-habit-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterModule, 
    MatSnackBarModule, 
    NgIf
  ],
  templateUrl: './habit-form.component.html',
  styleUrl: './habit-form.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(.35,0,.25,1)', style({ opacity: 1, transform: 'none' }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class HabitFormComponent implements OnInit {
  habitForm: FormGroup;
  loading = false;
  error: string | null = null;
  isEdit = false;
  habitId: string | null = null;

  // Categorías disponibles
  categories = [
    { value: 'ENERGIA', label: 'Energía', icon: 'lightbulb', description: 'Hábitos para ahorrar energía' },
    { value: 'CONSUMO', label: 'Consumo', icon: 'shopping_cart', description: 'Consumo responsable' },
    { value: 'AGUA', label: 'Agua', icon: 'water_drop', description: 'Ahorro de agua' },
    { value: 'MOVILIDAD', label: 'Movilidad', icon: 'directions_car', description: 'Transporte sostenible' },
    { value: 'RESIDUOS', label: 'Residuos', icon: 'delete', description: 'Gestión de residuos' }
  ];

  constructor(
    private fb: FormBuilder,
    private habitService: HabitService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private loader: LoaderService
  ) {
    this.habitForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      category: ['', Validators.required]
    });
  }

  ngOnInit() {
    console.log('HabitFormComponent ngOnInit - Categories:', this.categories);
    console.log('HabitFormComponent ngOnInit - Categories length:', this.categories.length);
    
    this.habitId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.habitId;
    
    if (this.isEdit && this.habitId) {
      this.loading = true;
      this.loader.show();
      this.habitService.getHabit(this.habitId).subscribe({
        next: (habit: Habit) => {
          this.habitForm.patchValue({
            name: habit.name,
            description: habit.description,
            category: habit.category
          });
          this.loading = false;
          this.loader.hide();
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Error al cargar hábito';
          this.loading = false;
          this.loader.hide();
        }
      });
    }
  }

  onSubmit() {
    if (this.habitForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.loader.show();

    const habitData = {
      name: this.habitForm.get('name')?.value,
      description: this.habitForm.get('description')?.value,
      category: this.habitForm.get('category')?.value
    };

    if (this.isEdit && this.habitId) {
      this.habitService.updateHabit(this.habitId, habitData).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Hábito actualizado correctamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/habits']);
          this.loader.hide();
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al actualizar hábito';
          this.snackBar.open(this.error || 'Error al actualizar hábito', 'Cerrar', { 
            duration: 4000,
            panelClass: ['error-snackbar']
          });
          this.loader.hide();
        }
      });
    } else {
      this.habitService.createHabit(habitData).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Hábito creado correctamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/habits']);
          this.loader.hide();
        },
        error: (err: any) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al crear hábito';
          this.snackBar.open(this.error || 'Error al crear hábito', 'Cerrar', { 
            duration: 4000,
            panelClass: ['error-snackbar']
          });
          this.loader.hide();
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/habits']);
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'ENERGIA': 'lightbulb',
      'CONSUMO': 'shopping_cart',
      'AGUA': 'water_drop',
      'MOVILIDAD': 'directions_car',
      'RESIDUOS': 'delete'
    };
    return iconMap[category] || 'category';
  }

  getCategoryLabel(category: string): string {
    const labelMap: { [key: string]: string } = {
      'ENERGIA': 'Energía',
      'CONSUMO': 'Consumo',
      'AGUA': 'Agua',
      'MOVILIDAD': 'Movilidad',
      'RESIDUOS': 'Residuos'
    };
    return labelMap[category] || category;
  }

  getCategoryDescription(category: string): string {
    const descMap: { [key: string]: string } = {
      'ENERGIA': 'Hábitos para ahorrar energía',
      'CONSUMO': 'Consumo responsable',
      'AGUA': 'Ahorro de agua',
      'MOVILIDAD': 'Transporte sostenible',
      'RESIDUOS': 'Gestión de residuos'
    };
    return descMap[category] || '';
  }

  private markFormGroupTouched() {
    Object.keys(this.habitForm.controls).forEach(key => {
      const control = this.habitForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.habitForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      return `Mínimo ${field.errors?.['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}
