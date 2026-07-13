import random
from datetime import datetime, timedelta

output_file = r'd:\avo-maitrise\back\src\main\resources\db\mock_invoices.sql'

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('-- Script pour générer 100 factures aléatoires\n\n')
    f.write('DELETE FROM invoice_time_entry;\n')
    f.write('DELETE FROM invoice;\n\n')
    
    start_date = datetime(2025, 1, 1)
    
    invoice_id = 1001
    entry_id = 2001
    
    f.write('INSERT INTO invoice (id, numero_facture, status, issue_date, due_date, subtotal_amount, tax_rate, total_amount, dunning_level, is_disputed, dossier_id, note) VALUES \n')
    
    invoice_values = []
    time_entry_values = []
    
    for i in range(100):
        issue_date = start_date + timedelta(days=random.randint(0, 365))
        due_date = issue_date + timedelta(days=15)
        
        status = random.choice(['DRAFT', 'ISSUED'])
        
        num_entries = random.randint(5, 50)
        
        subtotal = 0.0
        
        for j in range(num_entries):
            mins = random.choice([5, 10, 15, 30, 45, 60, 120])
            price5min = random.choice([10.0, 15.0, 20.0, 25.0, 35.0])
            
            line_total = (mins / 5.0) * price5min
            subtotal += line_total
            
            time_entry_values.append(f"({entry_id}, {invoice_id}, null, {mins}, {price5min})")
            entry_id += 1
            
        tax_rate = 17.00
        tax = round(subtotal * (tax_rate / 100), 2)
        total = round(subtotal + tax, 2)
        
        id_str = str(i+1).zfill(3)
        issue_str = issue_date.strftime("%Y-%m-%d")
        due_str = due_date.strftime("%Y-%m-%d")
        
        invoice_values.append(f"({invoice_id}, 'FAC-{issue_date.year}-{id_str}', '{status}', '{issue_str}', '{due_str}', {subtotal}, {tax_rate}, {total}, 0, false, null, 'Facture générée automatiquement {i+1}')")
        
        invoice_id += 1
        
    f.write(',\n'.join(invoice_values) + ';\n\n')
    
    f.write('INSERT INTO invoice_time_entry (id, invoice_id, invoice_dossier_service_id, nbr_of_minutes, price5min) VALUES \n')
    
    chunk_size = 1000
    for i in range(0, len(time_entry_values), chunk_size):
        chunk = time_entry_values[i:i+chunk_size]
        f.write(',\n'.join(chunk) + ';\n\n')
        if i + chunk_size < len(time_entry_values):
            f.write('INSERT INTO invoice_time_entry (id, invoice_id, invoice_dossier_service_id, nbr_of_minutes, price5min) VALUES \n')
