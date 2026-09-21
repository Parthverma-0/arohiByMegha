import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    // Newsletter provider (Mailchimp/Klaviyo/etc.) is not wired up yet — this is a
    // capture point ready to POST to that service once the user picks one.
    toast.success("Thanks for subscribing! We'll keep you posted.");
    setEmail('');
  }

  return (
    <section className="bg-charcoal text-ivory py-16 md:py-20">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="section-heading">Stay in the know</h2>
        <p className="mt-3 text-ivory/70">Be the first to hear about new collections, offers and stories.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 rounded-full px-5 py-3 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button type="submit" className="rounded-full bg-gold px-8 py-3 text-sm tracking-wide hover:bg-gold-light transition-colors">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
