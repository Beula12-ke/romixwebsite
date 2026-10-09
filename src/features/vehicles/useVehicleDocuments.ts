import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';

export type DocumentType =
  | 'insurance' | 'logbook' | 'inspection' | 'permit' | 'contract' | 'other';

export type VehicleDocument = {
  id: string;
  vehicle_id: string;
  branch_id: string;
  document_type: DocumentType;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

const BUCKET = 'vehicle-media';

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

export function documentUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export function useVehicleDocuments(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle_documents', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', vehicleId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VehicleDocument[];
    },
  });
}

export function useUploadVehicleDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      vehicleId: string;
      branchId: string;
      documentType: DocumentType;
      file: File;
      issueDate?: string | null;
      expiryDate?: string | null;
      notes?: string | null;
    }) => {
      const { vehicleId, branchId, documentType, file, issueDate, expiryDate, notes } = args;
      const safeName = sanitize(file.name);
      const rand = Math.random().toString(36).slice(2, 10);
      const path = `${branchId}/${vehicleId}/docs/${Date.now()}-${rand}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data, error: insErr } = await supabase
        .from('vehicle_documents')
        .insert({
          vehicle_id: vehicleId,
          branch_id: branchId,
          document_type: documentType,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          issue_date: issueDate || null,
          expiry_date: expiryDate || null,
          notes: notes || null,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      return data as VehicleDocument;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle_documents', vars.vehicleId] });
    },
  });
}

export function useDeleteVehicleDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { id: string; storage_path: string; vehicle_id: string }) => {
      const { error: sErr } = await supabase.storage.from(BUCKET).remove([d.storage_path]);
      if (sErr) throw sErr;
      const { error: dErr } = await supabase.from('vehicle_documents').delete().eq('id', d.id);
      if (dErr) throw dErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle_documents', vars.vehicle_id] });
    },
  });
}