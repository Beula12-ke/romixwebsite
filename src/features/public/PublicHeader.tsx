import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Phone, User } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/branches', label: 'Branches' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/partner', label: 'Partner With Us' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-navy text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight">Romix Website</span>
            <span className="text-[10px] uppercase tracking-widest text-white/60">Car Hire Solutions</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm transition ${
                    isActive ? 'text-primary font-medium' : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a href="tel:+254700123456" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
              <Phone size={14} /> +254 700 123 456
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
            >
              <User size={14} /> Sign In
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden text-white p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-navy">
          <nav className="px-6 py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm ${
                    isActive ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 text-sm font-medium"
            >
              <User size={14} /> Sign In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}