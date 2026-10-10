import { useRef, useState } from 'react';
import { Upload, Star, Loader2, ImagePlus, X } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-navy">Photos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {media.length} {media.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        {canManage && media.length > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark disabled:opacity-60"
          >
            {upload.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {upload.isPending ? 'Uploading…' : 'Add more'}
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

      <div className="p-6">
        {error && (
          <div className="text-sm text-danger bg-danger/10 rounded-md p-3 mb-4 flex items-start gap-2">
            <X size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-slate-500 text-sm">Loading photos…</div>
        ) : (
          <div
            onDragOver={(e) => {
              if (!canManage) return;
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={canManage ? onDrop : (e) => e.preventDefault()}
            onClick={() => canManage && inputRef.current?.click()}
            style={{
              border: dragOver ? '2px dashed rgb(225 29 46)' : '2px dashed rgb(203 213 225)',
              background: dragOver ? 'rgba(225, 29, 46, 0.04)' : 'transparent',
              borderRadius: 12,
              padding: media.length === 0 ? 48 : 16,
              cursor: canManage ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
          >
            {media.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <ImagePlus size={48} color="#cbd5e1" style={{ margin: '0 auto' }} />
                <p className="mt-3 font-medium text-slate-700">
                  {canManage ? 'Click to upload or drag and drop' : 'No photos yet'}
                </p>
                {canManage && (
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP · up to 10 MB each</p>
                )}
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 12,
                  }}
                >
                  {media.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1 / 1',
                        overflow: 'hidden',
                        borderRadius: 8,
                        background: '#f1f5f9',
                        cursor: 'default',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={mediaUrl(m.storage_path)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'block', width: '100%', height: '100%' }}
                      >
                        <img
                          src={mediaUrl(m.storage_path)}
                          alt={m.caption ?? m.file_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          loading="lazy"
                        />
                      </a>

                      {m.is_featured && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            background: 'rgb(225 29 46)',
                            color: 'white',
                            fontSize: 10,
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontWeight: 600,
                            letterSpacing: '0.02em',
                          }}
                        >
                          FEATURED
                        </div>
                      )}

                      {canManage && (
                        <>
                          <button
                            type="button"
                            title="Delete photo"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm('Delete this photo?')) {
                                del.mutate({
                                  id: m.id,
                                  storage_path: m.storage_path,
                                  vehicle_id: m.vehicle_id,
                                });
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 28,
                              height: 28,
                              background: 'white',
                              border: 'none',
                              borderRadius: 999,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                              color: '#dc2626',
                            }}
                          >
                            <X size={16} />
                          </button>
                          {!m.is_featured && (
                            <button
                              type="button"
                              title="Set as featured"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setFeatured.mutate({ id: m.id, vehicle_id: m.vehicle_id });
                              }}
                              style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                width: 28,
                                height: 28,
                                background: 'white',
                                border: 'none',
                                borderRadius: 999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                color: '#0b1f3a',
                              }}
                            >
                              <Star size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {canManage && (
                  <p className="text-xs text-slate-400 text-center mt-4">
                    Drag more photos here or click anywhere in this area
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}