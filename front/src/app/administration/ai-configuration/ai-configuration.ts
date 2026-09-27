import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AiConfigurationDTO } from '../../appTypes';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ai-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-configuration.html',
  styleUrl: './ai-configuration.css'
})
export class AiConfiguration implements OnInit {
  configurations: AiConfigurationDTO[] = [];
  selectedConfig: AiConfigurationDTO | null = null;
  isEditing = false;
  
  providers = ['OLLAMA', 'OPENAI', 'GEMINI'];
  
  private apiUrl = `${environment.apiUrl}/api/ai-configuration`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations() {
    this.http.get<AiConfigurationDTO[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.configurations = data;
      },
      error: (err) => console.error('Erreur chargement configs', err)
    });
  }

  createNew() {
    this.selectedConfig = {
      provider: 'OLLAMA',
      modelName: '',
      apiKey: '',
      baseUrl: '',
      temperature: 0.7,
      timeoutMinutes: 15,
      isActive: false
    };
    this.isEditing = true;
  }

  editConfig(config: AiConfigurationDTO) {
    this.selectedConfig = { ...config };
    this.isEditing = true;
  }

  saveConfig() {
    if (!this.selectedConfig) return;

    const req = this.selectedConfig.id 
      ? this.http.put<AiConfigurationDTO>(`${this.apiUrl}/${this.selectedConfig.id}`, this.selectedConfig)
      : this.http.post<AiConfigurationDTO>(this.apiUrl, this.selectedConfig);

    req.subscribe({
      next: () => {
        this.loadConfigurations();
        this.isEditing = false;
        this.selectedConfig = null;
      },
      error: (err) => console.error('Erreur sauvegarde config', err)
    });
  }

  deleteConfig(id: number | undefined) {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => this.loadConfigurations(),
        error: (err) => console.error('Erreur suppression config', err)
      });
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedConfig = null;
  }
}
