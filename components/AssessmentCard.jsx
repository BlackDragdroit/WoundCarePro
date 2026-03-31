import React, { useState } from 'react';
import { Calendar, FileText, Clipboard, Trash2, Download } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateHelpers';
import { generateWordReport } from '../utils/reportGenerator';
import { saveAs } from 'file-saver';

const AssessmentCard = ({ entry, onDelete, onEdit, patientName, woundLocation }) => {
  const [showReport, setShowReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateWordReport(entry, patientName, woundLocation);
      saveAs(blob, `Wundbericht_${patientName}_${formatDate(new Date())}.docx`);
    } catch (error) {
       console.error("Failed to generate report", error);
       alert("Fehler bei der Berichtserstellung: " + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateReport = () => {
    return `WUNDDOKUMENTATION / VERLAUFSBERICHT
Datum: ${formatDate(entry.createdAt)}
Patient: ${patientName || 'Unbekannt'}

SUBJEKTIV
Patienteninteraktion dokumentiert.
Akute Beschwerden über den Basisstatus hinaus geäußert:
${entry.subjectiveComplaints || 'Keine'}

OBJEKTIV
Lokalisation: ${woundLocation || entry.locationName || 'Unbekannt'}
Maße: L ${entry.length}cm x B ${entry.width}cm x T ${entry.depth}cm
Wundphase: ${entry.phase}
Exsudat: ${entry.exudateAmount} / ${entry.exudateType}
Wundränder: ${entry.edges}
Wundumgebung: ${entry.surroundings}

THERAPIEPLAN
Reinigung: ${entry.cleanser || '-'}
Wundfüller: ${entry.filler || '-'}
Verband: ${entry.dressing || '-'}
Kompression: ${entry.compression === 'Ja' ? entry.compressionType : 'Keine'}
Nächster Verbandswechsel: ${entry.frequency || '-'}

NOTIZEN
${entry.notes || 'Keine Einträge.'}`;
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden group">
      <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
        {/* ... (Left side content remains unchanged) */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
            <Calendar size={18} />
          </div>
          <div>
            <div className="font-bold text-slate-800">
              {formatDate(entry.createdAt)} 
              <span className="text-slate-400 font-normal text-sm ml-2">
                {formatDateTime(entry.createdAt).split(',')[1]?.trim() || ''}
              </span>
            </div>
            <div className="text-xs text-slate-500">Dr. Mustermann</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(entry)}
            className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
          >
            Bearbeiten
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button 
            onClick={() => setShowReport(!showReport)}
            className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2"
          >
            <FileText size={14} />
            {showReport ? 'Bericht verbergen' : 'Bericht'}
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button 
            onClick={() => onDelete(entry.id)}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
            title="Eintrag löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-2 gap-8">
        {/* Clinical Data */}
        <div className="space-y-4 text-sm">
          <div>
            <span className="text-slate-400 uppercase text-xs font-bold tracking-wider block mb-1">Maße (L x B x T)</span>
            <div className="font-mono text-lg text-slate-700">
              {entry.length} <span className="text-slate-300">x</span> {entry.width} <span className="text-slate-300">x</span> {entry.depth} cm
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 uppercase text-xs font-bold tracking-wider block mb-1">Wundphase</span>
              <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-medium">{entry.phase}</span>
            </div>
            <div>
               <span className="text-slate-400 uppercase text-xs font-bold tracking-wider block mb-1">Exsudat</span>
               <div className="text-slate-700">{entry.exudateAmount} / {entry.exudateType}</div>
            </div>
          </div>

          <div>
            <span className="text-slate-400 uppercase text-xs font-bold tracking-wider block mb-1">Therapieplan</span>
            <ul className="list-disc list-inside text-slate-600 space-y-1">
               <li><span className="font-medium">Verband:</span> {entry.dressing}</li>
               <li><span className="font-medium">Füller:</span> {entry.filler}</li>
               <li><span className="font-medium">Kompression:</span> {entry.compression === 'Ja' ? entry.compressionType : 'Keine'}</li>
            </ul>
          </div>
        </div>

        {/* Images or Notes */}
        <div className="space-y-4">
          <div>
            <span className="text-slate-400 uppercase text-xs font-bold tracking-wider block mb-1">Fotodokumentation</span>
            {entry.imageUrl ? (
               <img src={entry.imageUrl} alt="Wundfoto" className="w-full h-48 object-cover rounded-lg border" />
            ) : (
               <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300">
                 Kein Bild vorhanden
               </div>
            )}
          </div>
          {entry.notes && (
             <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-yellow-800 text-sm">
               <strong>Notiz:</strong> {entry.notes}
             </div>
          )}
        </div>
      </div>

      {/* Auto Generated Report Overlay */}
      {showReport && (
        <div className="bg-slate-800 text-slate-100 p-6 font-mono text-sm border-t border-slate-700 relative">
          <h4 className="text-slate-400 mb-2 text-xs uppercase tracking-widest">Generierter Arztbrief</h4>
          <pre className="whitespace-pre-wrap">{generateReport()}</pre>
          <div className="mt-4 flex gap-2">
             <button 
               className="bg-white text-slate-900 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200 flex items-center gap-2"
               onClick={() => document.execCommand('copy')} // Simplistic copy
             >
               <Clipboard size={12} /> In die Zwischenablage
             </button>
             <button 
               className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
               onClick={handleDownloadReport}
               disabled={isDownloading}
             >
               <Download size={12} /> {isDownloading ? 'Erstelle...' : 'Word-Export'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentCard;
