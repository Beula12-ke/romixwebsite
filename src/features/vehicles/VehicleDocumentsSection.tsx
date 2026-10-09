import { useRef, useState } from 'react';
import { Upload, Trash2, FileText, Loader2 } from 'lucide-react';
import {
  useVehicleDocuments,
  useUploadVehicleDocument,
  useDeleteVehicleDocument,
  documentUrl,
  type DocumentType,
} from './useVehicleDocuments';
import { usePermissions } from '@/features/auth/usePermissions';

const TYPES: DocumentType[] = ['insurance', 'logbook', 'inspection', 'permit', 'contract', 'other'];

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function VehicleDocumentsSection({
  vehicleId,
  branchId,
}: {
  vehicleId: string;
  branchId: string;
}) {
  const { data: docs = [], isLoading } = useVehicleDocuments(vehicleId);
  const upload = useUploadVehicleDocument();
  const del = useDeleteVehicleDocument();
  const { has } = usePermissions();

  const canManage = has('vehicles.manage');
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('insurance');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setDocType('insurance');
    setIssueDate('');
    setExpiryDate('');
    setNotes('');
    setFile(null);
    setError(null);
    setShowForm(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError('Choose a file');
    try {
      await upload.mutateAsync({
        vehicleId,
        branchId,
        documentType: docType,
        file,
        issueDate: issueDate || null,
        expiryDate: expiryDate || null,
        notes: notes || null,
      });
      reset();
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy">Documents</h2>
        {canManage && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark"
          >
            <Upload size={14} /> Upload document
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="border border-slate-200 rounded-lg p-4 space-y-3">
          {error && <div className="text-sm text-danger bg-danger/10 rounded-md p-2">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="input">
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">File</label>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Issue date</label>
              <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Expiry date</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={reset} className="text-sm text-slate-600 hover:text-navy px-3 py-2">
              Cancel
            </button>
            <button
              type="submit"
              disabled={upload.isPending}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {upload.isPending && <Loader2 size={14} className="animate-spin" />}
              {upload.isPending ? 'Uploading…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-slate-500 text-sm">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-6">No documents yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2">Type</th>
              <th>File</th>
              <th>Expiry</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const days = daysUntil(d.expiry_date);
              const expClass =
                days === null
                  ? 'text-slate-400'
                  : days < 0
                  ? 'text-danger'
                  : days <= 30
                  ? 'text-warning'
                  : 'text-success';
              return (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 capitalize">{d.document_type}</td>
                  <td>
                    <a
                      href={documentUrl(d.storage_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-dark"
                    >
                      <FileText size={14} /> {d.file_name}
                    </a>
                  </td>
                  <td className={expClass}>
                    {d.expiry_date ?? '—'}
                    {days !== null && days < 0 && ' (expired)'}
                    {days !== null && days >= 0 && days <= 30 && ` (${days}d)`}
                  </td>
                  <td className="text-slate-500">{d.notes ?? '—'}</td>
                  <td className="text-right">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this document?')) {
                            del.mutate({
                              id: d.id,
                              storage_path: d.storage_path,
                              vehicle_id: d.vehicle_id,
                            });
                          }
                        }}
                        className="text-danger hover:text-danger/80 p-1"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}