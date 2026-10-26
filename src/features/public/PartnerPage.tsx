import { Link } from 'react-router-dom';
import { CheckCircle2, DollarSign, Shield, Car, FileText, Wallet } from 'lucide-react';

export function PartnerPage() {
  return (
    <div>
      <section className="relative bg-navy text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=2000&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/60" />
        <div className="relative max-w-5xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold">Partner With Us</div>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold">Turn Your Vehicle Into Income</h1>
          <p className="mt-5 text-white/80 text-lg max-w-2xl">
            We welcome vehicle owners and businesses to partner with us. Your car earns for you while we handle bookings, customers, and maintenance.
          </p>
          <div className="mt-8">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-6 py-3 font-medium"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card icon={FileText} title="What You Need">
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Valid ID / KRA PIN</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Vehicle logbook / ownership proof</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Insurance certificate (comprehensive)</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Vehicle in good condition</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Clear photos of the vehicle</li>
            </ul>
          </Card>

          <Card icon={DollarSign} title="Rates & Earning Potential">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex justify-between"><span>Sedan</span><span className="font-mono text-navy">$30–$60 / day</span></li>
              <li className="flex justify-between"><span>SUV</span><span className="font-mono text-navy">$50–$90 / day</span></li>
              <li className="flex justify-between"><span>Van</span><span className="font-mono text-navy">$60–$120 / day</span></li>
              <li className="flex justify-between"><span>Luxury</span><span className="font-mono text-navy">Custom</span></li>
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              Rates vary by market, vehicle age, condition, and demand. Final rates confirmed during onboarding.
            </p>
          </Card>

          <Card icon={Shield} title="Our Policies">
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Vehicle must be well maintained</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> No illegal use (e.g., drugs, racing)</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Insurance is mandatory</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Regular inspections required</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> Timely payouts (monthly)</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" /> We handle customer service</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold">Simple Process</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-navy">How to Partner</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Step n="1" icon={FileText} title="Apply Online" text="Fill out the partner form with your details." />
            <Step n="2" icon={Shield} title="Verification" text="We verify your documents and vehicle." />
            <Step n="3" icon={FileText} title="Agreement" text="Sign the partnership contract." />
            <Step n="4" icon={Wallet} title="Start Earning" text="Your vehicle goes live on our platform." />
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto">
              <Car size={32} className="text-primary mx-auto" />
              <h3 className="mt-3 text-xl font-bold text-navy">Ready to list your vehicle?</h3>
              <p className="text-slate-500 mt-2 text-sm">
                Create your partner account, upload documents, and we'll review within 3 business days.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-6 py-2.5 font-medium"
                >
                  Apply Now
                </Link>
                <a
                  href="mailto:partners@romixwebsite.co.ke"
                  className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-navy rounded-md px-6 py-2.5 font-medium"
                >
                  Contact Partner Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon size={20} className="text-primary" />
      </div>
      <h3 className="font-semibold text-navy text-lg mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Step({ n, icon: Icon, title, text }: { n: string; icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
        {n}
      </div>
      <Icon size={20} className="text-primary mt-4" />
      <h3 className="mt-2 font-semibold text-navy">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{text}</p>
    </div>
  );
}
