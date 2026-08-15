import { Lead } from '../types';

export function downloadVcfContacts(leads: Lead[]): void {
  if (leads.length === 0) return;
  let vcf = '';
  for (const l of leads) {
    vcf += `BEGIN:VCARD\nVERSION:3.0\nN:${l.name || 'Lead Truck'}\nFN:${l.name || 'Lead Truck'}\nTEL;TYPE=CELL:${l.rawPhone}\nNOTE:${l.item || ''} - ${l.location || ''}\nEND:VCARD\n`;
  }
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contatos_trucks_${Date.now()}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadGoogleContactsCsv(leads: Lead[]): void {
  if (leads.length === 0) return;
  let csv = 'Name,Given Name,Family Name,Phone 1 - Value,Notes\n';
  for (const l of leads) {
    const name = (l.name || 'Lead Truck').replace(/"/g, '""');
    csv += `"${name}","${name}","","${l.rawPhone}","${(l.item || '').replace(/"/g, '""')}"\n`;
  }
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `google_contacts_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
