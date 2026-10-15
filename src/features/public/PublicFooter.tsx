import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-navy text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="text-xl font-bold">Romix Website</div>
          <div className="text-xs uppercase tracking-widest text-white/50 mt-1">Car Hire Solutions</div>
          <p className="text-sm text-white/70 mt-4">
            Reliable cars. Multiple branches. One platform.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="text-white/60 hover:text-white"><Facebook size={18} /></a>
            <a href="#" className="text-white/60 hover:text-white"><Twitter size={18} /></a>
            <a href="#" className="text-white/60 hover:text-white"><Instagram size={18} /></a>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Company</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="text-white/80 hover:text-white">About Us</Link></li>
            <li><Link to="/branches" className="text-white/80 hover:text-white">Our Branches</Link></li>
            <li><Link to="/partner" className="text-white/80 hover:text-white">Partner With Us</Link></li>
            <li><Link to="/contact" className="text-white/80 hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Fleet</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/fleet" className="text-white/80 hover:text-white">All Vehicles</Link></li>
            <li><Link to="/fleet?category=sedan" className="text-white/80 hover:text-white">Sedans</Link></li>
            <li><Link to="/fleet?category=suv" className="text-white/80 hover:text-white">SUVs</Link></li>
            <li><Link to="/fleet?category=van" className="text-white/80 hover:text-white">Vans</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-3">Contact</div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2 text-white/80">
              <Phone size={14} className="mt-0.5 shrink-0" /> +254 700 123 456
            </li>
            <li className="flex items-start gap-2 text-white/80">
              <Mail size={14} className="mt-0.5 shrink-0" /> hello@romixwebsite.co.ke
            </li>
            <li className="flex items-start gap-2 text-white/80">
              <MapPin size={14} className="mt-0.5 shrink-0" /> Nairobi · Mombasa · Kenya
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>© {new Date().getFullYear()} Romix Website. All rights reserved.</div>
          <div className="flex gap-5">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}