import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VoiceDossierSuggestion {
  dossierId: number;
  referenceInterne: string;
  titre: string;
  clientName?: string | null;
  reason: string;
}

export interface StructuredVoiceNoteResponse {
  title: string;
  structuredContent: string;
  aiEnhanced: boolean;
  suggestedTasks: string[];
  suggestedEventTitle?: string | null;
  suggestedEventDate?: string | null;
  suggestedDossier?: VoiceDossierSuggestion | null;
}

@Injectable({ providedIn: 'root' })
export class VoiceNoteService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private baseUrl = `${environment.apiUrl}voice-notes`;

  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];

  get isSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  get isAudioRecordingSupported(): boolean {
    return typeof window !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined';
  }

  async startAudioRecording(onAudioReady: (blob: Blob, mimeType: string) => void): Promise<boolean> {
    if (!this.isAudioRecordingSupported) return false;
    this.stopAudioRecording();
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const chosenMime = candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = chosenMime
        ? new MediaRecorder(this.mediaStream, { mimeType: chosenMime })
        : new MediaRecorder(this.mediaStream);

      this.audioChunks = [];
      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          this.audioChunks.push(ev.data);
        }
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || chosenMime || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mime });
        this.releaseStream();
        if (blob.size > 0) {
          this.zone.run(() => onAudioReady(blob, mime));
        }
      };
      this.mediaRecorder = recorder;
      recorder.start();
      return true;
    } catch {
      this.releaseStream();
      return false;
    }
  }

  stopAudioRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        this.releaseStream();
      }
    } else {
      this.releaseStream();
    }
    this.mediaRecorder = null;
  }

  private releaseStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || '');
        const idx = result.indexOf(',');
        resolve(idx >= 0 ? result.substring(idx + 1) : result);
      };
      reader.onerror = () => reject(new Error('Erreur lecture audio'));
      reader.readAsDataURL(blob);
    });
  }

  startRecognition(
    lang: string,
    callbacks: {
      onFinal: (chunk: string) => void;
      onInterim: (text: string) => void;
      onError: (message: string) => void;
      onEnd: () => void;
    }
  ): boolean {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      callbacks.onError('La reconnaissance vocale Web Speech n\'est pas supportée par ce navigateur (utilisez Chrome, Edge ou Safari).');
      return false;
    }

    this.stopRecognition();

    const rec = new SpeechRec();
    rec.lang = lang || 'fr-FR';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalChunk += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      this.zone.run(() => {
        if (finalChunk.trim()) callbacks.onFinal(finalChunk.trim());
        callbacks.onInterim(interim.trim());
      });
    };

    rec.onerror = (event: any) => {
      const code = event?.error || 'unknown';
      let msg = 'Erreur lors de la dictée vocale.';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        msg = 'Accès au microphone refusé. Autorisez le micro dans votre navigateur (HTTPS ou localhost requis).';
      } else if (code === 'no-speech') {
        msg = 'Aucune voix détectée. Parlez plus près du micro et réessayez.';
      } else if (code === 'network') {
        msg = 'Erreur réseau du service de reconnaissance vocale du navigateur.';
      }
      this.zone.run(() => callbacks.onError(msg));
    };

    rec.onend = () => {
      this.zone.run(() => callbacks.onEnd());
    };

    this.recognition = rec;
    try {
      rec.start();
      return true;
    } catch (e: any) {
      callbacks.onError(e?.message || 'Impossible de démarrer le microphone.');
      return false;
    }
  }

  stopRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  suggestDossier(transcript: string): Observable<{ found: boolean; suggestion?: VoiceDossierSuggestion }> {
    return this.http.post<{ found: boolean; suggestion?: VoiceDossierSuggestion }>(`${this.baseUrl}/suggest-dossier`, {
      transcript
    });
  }

  structureTranscript(transcript: string, dossierId?: number | null): Observable<StructuredVoiceNoteResponse> {
    return this.http.post<StructuredVoiceNoteResponse>(`${this.baseUrl}/structure`, {
      transcript,
      dossierId: dossierId ?? null
    });
  }
}
