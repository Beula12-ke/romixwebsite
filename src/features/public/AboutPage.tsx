import { Shield, Users, Target, Award, CheckCircle2 } from 'lucide-react';

export function AboutPage() {
  return (
    <div>
      <section className="bg-navy text-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold">About Us</div>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold">
            Reliable car hire, built for real journeys
          </h1>
          <p className="mt-5 text-white/70 text-lg max-w-3xl">
            Romix Website is a modern car hire platform connecting customers with a fleet of well-maintained vehicles across multiple Kenyan branches. We handle everything from bookings and payments to fleet tracking and partner settlements — all in one platform.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Stat value="500+" label="Happy customers" />
          <Stat value="2" label="Active branches" />
          <Stat value="24/7" label="Support" />
          <Stat value="100%" label="Insured" />
        </div>

        <div className="prose prose-slate max-w-none space-y-10">
          <Section
            icon={Target}
            title="Our Mission"
            text="To make car hire simple, transparent, and reliable across Kenya. No hidden fees, no paperwork drama, no surprise charges — just clean cars ready when you need them."
          />
          <Section
            icon={Users}
            title="Who We Serve"
            text="Business travellers who need reliability. Families planning road trips. Tourists exploring Kenya. And vehicle owners who want their idle cars earning through our partner program."
          />
          <Section
            icon={Shield}
            title="Our Commitment"
            text="Every vehicle is fully insured, regularly serviced, and inspected before every hire. Our support team is reachable 24/7 for emergencies, questions, or changes to your booking."
          />
          <Section
            icon={Award}
            title="Partner Programme"
            text="Vehicle owners across Kenya trust us to manage their fleet. We handle bookings, customers, insurance verification, and payouts — while you earn passive income from your vehicle."
          />
        </div>

        <div className="mt-16 bg-slate-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-navy mb-4">What sets us apart</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Real-time availability across all branches',
              'Transparent per-day pricing — no hidden extras',
              'Flexible pickup and return between branches',
              'Digital agreements and instant confirmation',
              'M-Pesa, card, and cash payments accepted',
              'Every vehicle fully insured and serviced',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-navy">{value}</div>
      <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function Section({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-navy">{title}</h2>
      </div>
      <p className="text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
