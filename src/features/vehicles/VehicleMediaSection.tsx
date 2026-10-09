import { useRef, useState } from 'react';
import { Upload, Star, Trash2, Loader2 } from 'lucide-react';
import {
  useVehicleMedia,
  useUploadVehicleMedia,
  useDeleteVehicleMedia,
  useSetFeaturedMedia,
  mediaUrl,
} from './useVehicleMedia';
import { usePermissions } from '@/features/auth/usePermissions';

export function VehicleMediaSection({
  vehicleId,
  branchId,
}: {
  vehicleId: string;
  branchId: string;
}) {
  const { data: media = [], isLoading } = useVehicleMedia(vehicleId);
  const upload = useUploadVehicleMedia();
  const del = useDeleteVehicleMedia();
  const setFeatured = useSetFeaturedMedia();
  const { has } = usePermissions();

  const canManage = has('vehicles.manage');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setError(`Skipped ${file.name}: not an image`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`Skipped ${file.name}: larger than 10 MB`);
        continue;
      }
      try {
        await upload.mutateAsync({
          vehicleId,
          branchId,
          file,
          isFeatured: media.length === 0,
        });
      } catch (e: any) {
        setError(e?.message ?? 'Upload failed');
      }
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    await handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy">Photos</h2>
        {canManage && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark disabled:opacity-60"
          >
            {upload.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <div className="text-sm text-danger bg-danger/10 rounded-md p-2">{error}</div>}

      {canManage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center text-sm transition ${
            dragOver ? 'border-primary bg-primary/5 text-primary' : 'border-slate-300 text-slate-500'
          }`}
        >
          Drag and drop photos here, or click Upload above.
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-500 text-sm">Loading photos…</div>
      ) : media.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-6">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-fr">
          {media.map((m) => (
            <div
              key={m.id}
              className="group relative rounded-md overflow-hidden bg-slate-100"
              style={{ height: 180 }}
            >
              <a
                href={mediaUrl(m.storage_path)}
                target="_blank"
                rel="noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={mediaUrl(m.storage_path)}
                  alt={m.caption ?? m.file_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
              </a>
              {m.is_featured && (
                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded">
                  Featured
                </div>
              )}
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {!m.is_featured && (
                    <button
                      type="button"
                      title="Set as featured"
                      onClick={() =>
                        setFeatured.mutate({ id: m.id, vehicle_id: m.vehicle_id })
                      }
                      className="bg-white/90 hover:bg-white text-navy rounded p-1 shadow"
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => {
                      if (confirm('Delete this photo?')) {
                        del.mutate({
                          id: m.id,
                          storage_path: m.storage_path,
                          vehicle_id: m.vehicle_id,
                        });
                      }
                    }}
                    className="bg-white/90 hover:bg-white text-danger rounded p-1 shadow"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}