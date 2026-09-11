import { jsPDF } from 'jspdf';
import { formatDate } from './dateHelpers';

export const generatePDFReport = async (entry, patient, woundLocation) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const patientName = patient?.name || 'Unbekannt';
  const patientDob = patient?.dob || '-';
  const patientSvn = patient?.svn || '-';
  const patientKassa = patient?.kassa || '-';
  
  // Format dates
  const entryDate = formatDate(entry.createdAt);
  
  const formatTherapyString = (str, fallback = "-") => {
    if (!str || str === "Keine" || str === "Keiner") return fallback;
    if (!str.includes('|')) return String(str);
    return str.split(' | ').join(', ');
  };

  // 1. Branding Header bar in Deep slate-800 matching Web App
  doc.setFillColor(30, 41, 59); 
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('WundDoku Pro', 15, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Klinischer Verlaufsbericht / Wundbericht', 132, 20);

  // 2. Patient / Wound General Metadata Section
  let y = 45;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PATIENTEN-INFORMATIONEN', 15, y);
  
  y += 6;
  doc.setDrawColor(203, 213, 225); // border-slate-200
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Grid layout for patient details
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientName, 35, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Geburtsdatum:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientDob, 140, y);
  
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('SVN:', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientSvn, 35, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Krankenkasse:', 110, y);
  doc.setFont('helvetica', 'normal');
  doc.text(patientKassa, 140, y);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BEURTEILUNG', 15, y);
  
  y += 6;
  doc.line(15, y, 195, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Objective criteria list
  const docFields = [
    { label: 'Datum:', val: entryDate },
    { label: 'Lokalisation:', val: woundLocation || entry.locationName || 'Unbekannt' },
    { label: 'Maße (L x B x T):', val: `${entry.length} cm x ${entry.width} cm x ${entry.depth} cm` },
    { label: 'Wundphase:', val: entry.phase },
    { label: 'Exsudat:', val: `${entry.exudateAmount} / ${entry.exudateType}` },
    { label: 'Geruch:', val: entry.odor || 'Nein' },
    { label: 'Wundränder:', val: entry.edges },
    { label: 'Wundumgebung:', val: entry.surroundings }
  ];

  docFields.forEach(f => {
    doc.setFont('helvetica', 'bold');
    doc.text(f.label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(f.val), 60, y);
    y += 6;
  });

  // Photo integration
  if (entry.imageUrl) {
    try {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('Fotodokumentation:', 15, y);
      y += 6;
      doc.addImage(entry.imageUrl, 'JPEG', 15, y, 60, 45);
      y += 50; 
    } catch (err) {
      console.error("Could not add image to PDF:", err);
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'italic');
      doc.text('[Wundfoto konnte nicht im PDF geladen werden]', 15, y);
      doc.setTextColor(30, 41, 59);
      y += 10;
    }
  } else {
    y += 4;
  }

  // 3. Therapy Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('WUNDTHERAPIE', 15, y);
  
  y += 6;
  doc.line(15, y, 195, y);
  
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const therapyFields = [
    { label: 'Reinigung:', val: formatTherapyString(entry.cleanser, 'Standardprotokoll') },
    { label: 'Primärverband:', val: formatTherapyString(entry.filler, 'Keiner') },
    { label: 'Sekundärverband:', val: formatTherapyString(entry.dressing, 'Keiner') },
    { label: 'Kompression:', val: entry.compression === 'Ja' ? (entry.compressionType || 'Ja') : 'Keine' },
    { label: 'Verbandswechselintervall:', val: entry.frequency || 'Standard' }
  ];

  therapyFields.forEach(f => {
    doc.setFont('helvetica', 'bold');
    doc.text(f.label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(f.val), 65, y);
    y += 6;
  });

  // 4. Notes Section
  if (entry.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('NOTIZEN', 15, y);
    
    y += 6;
    doc.line(15, y, 195, y);
    
    y += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(entry.notes, 180);
    doc.text(splitNotes, 15, y);
    y += splitNotes.length * 5 + 6;
  }

  // 5. Interactive note field
  y += 4;
  if (y > 230) {
    doc.addPage();
    y = 25;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DIGITALE / HANDSCHRIFTLICHE ERGÄNZUNGEN (Ausfüllbar)', 15, y);
  
  y += 6;
  doc.line(15, y, 195, y);
  
  y += 8;
  
  // Create interactive text field
  const { TextField } = jsPDF.AcroForm;
  const noteField = new TextField();
  noteField.Rect = [15, y, 180, 36];
  noteField.fieldName = 'CustomClinicNotes';
  noteField.multiline = true;
  noteField.value = 'Klicken Sie hier, um weitere Notizen einzugeben...';
  doc.addField(noteField);

  return doc.output('blob');
};
