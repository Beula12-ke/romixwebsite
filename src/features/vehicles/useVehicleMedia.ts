import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';

export type VehicleMedia = {
  id: string;
  vehicle_id: string;
  branch_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  caption: string | null;
  display_order: number;
  is_featured: boolean;
  uploaded_by: string | null;
  created_at: string;
};

const BUCKET = 'vehicle-media';

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

export function mediaUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function useVehicleMedia(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle_media', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_media')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as VehicleMedia[];
    },
  });
}

export function useUploadVehicleMedia() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      vehicleId: string;
      branchId: string;
      file: File;
      caption?: string;
      isFeatured?: boolean;
    }) => {
      const { vehicleId, branchId, file, caption, isFeatured } = args;
      const safeName = sanitize(file.name);
      const rand = Math.random().toString(36).slice(2, 10);
      const path = `${branchId}/${vehicleId}/${Date.now()}-${rand}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data, error: insErr } = await supabase
        .from('vehicle_media')
        .insert({
          vehicle_id: vehicleId,
          branch_id: branchId,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          caption: caption ?? null,
          is_featured: isFeatured ?? false,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      return data as VehicleMedia;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle_media', vars.vehicleId] });
    },
  });
}

export function useDeleteVehicleMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { id: string; storage_path: string; vehicle_id: string }) => {
      const { error: sErr } = await supabase.storage.from(BUCKET).remove([m.storage_path]);
      if (sErr) throw sErr;
      const { error: dErr } = await supabase.from('vehicle_media').delete().eq('id', m.id);
      if (dErr) throw dErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle_media', vars.vehicle_id] });
    },
  });
}

export function useSetFeaturedMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { id: string; vehicle_id: string }) => {
      await supabase
        .from('vehicle_media')
        .update({ is_featured: false })
        .eq('vehicle_id', m.vehicle_id);
      const { error } = await supabase
        .from('vehicle_media')
        .update({ is_featured: true })
        .eq('id', m.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle_media', vars.vehicle_id] });
    },
  });
}