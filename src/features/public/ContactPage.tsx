import { useState } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div>
      <section className="bg-navy text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold">Get in Touch</h1>
          <p className="text-white/70 mt-3 text-lg">We'd love to hear from you</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Phone size={18} className="text-primary" />
            </div>
            <div className="font-semibold text-navy">Call Us</div>
            <a href="tel:+254700123456" className="text-sm text-slate-600 hover:text-primary mt-1 block">
              +254 700 123 456
            </a>
            <div className="text-xs text-slate-400 mt-2">Mon–Sun, 7:00 AM – 9:00 PM</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Mail size={18} className="text-primary" />
            </div>
            <div className="font-semibold text-navy">Email Us</div>
            <a href="mailto:hello@romixwebsite.co.ke" className="text-sm text-slate-600 hover:text-primary mt-1 block">
              hello@romixwebsite.co.ke
            </a>
            <div className="text-xs text-slate-400 mt-2">We reply within 24 hours</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <MapPin size={18} className="text-primary" />
            </div>
            <div className="font-semibold text-navy">Visit Us</div>
            <div className="text-sm text-slate-600 mt-1">Nairobi · Mombasa</div>
            <div className="text-xs text-slate-400 mt-2">See our branch list for details</div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          {sent ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <Send size={28} className="text-success" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-navy">Message sent</h2>
              <p className="text-slate-500 mt-2">We'll get back to you within 24 hours.</p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-primary hover:text-primary-dark font-medium text-sm"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-xl font-bold text-navy mb-2">Send us a message</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-md px-6 py-2.5 font-medium"
              >
                <Send size={16} /> Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
