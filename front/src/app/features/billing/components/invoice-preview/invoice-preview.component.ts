import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { InvoiceEntity } from '../../../../appTypes';

@Component({
    selector: 'app-invoice-preview',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './invoice-preview.component.html'
})
export class InvoicePreviewComponent  {
    }
