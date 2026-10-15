import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PublicVehiclePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <Link to="/fleet" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={16} /> Back to fleet
      </Link>
      <h1 className="text-3xl font-bold text-navy mt-4">Vehicle {id?.slice(0, 8)}</h1>
      <p className="text-slate-500 mt-2">Full detail page coming next batch.</p>
    </div>
  );
}
