import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const policies = {
  faq: {
    title: 'Frequently Asked Questions',
    body: [
      ['How long does delivery take?', 'Orders are typically delivered within 4-7 business days across India.'],
      ['Can I exchange a product?', 'Yes, most items can be exchanged within 7 days of delivery. Earrings are non-returnable for hygiene reasons.'],
      ['Do you offer Cash on Delivery?', 'Yes, COD is available alongside UPI, cards and net banking.'],
      ['How do I track my order?', 'Once shipped, you can track your order from the My Orders section of your account.'],
    ],
  },
  shipping: {
    title: 'Shipping & Delivery',
    body: [
      ['Delivery Timeline', 'Orders are processed within 1-2 business days and delivered within 4-7 business days depending on your location.'],
      ['Shipping Charges', 'We currently offer free shipping across India on all orders.'],
      ['Serviceability', 'We deliver to most pincodes across India. Serviceability is confirmed at checkout.'],
    ],
  },
  returns: {
    title: 'Refund and Returns Policy',
    body: [
      ['Exchange Window', 'Most products are eligible for exchange within 7 days of delivery, provided they are unused and in original packaging.'],
      ['Non-Returnable Items', 'Earrings are non-returnable for hygiene reasons unless defective on arrival.'],
      ['Refunds', 'Refunds for prepaid orders are processed to the original payment method within 5-7 business days of approval.'],
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    body: [
      ['Use of Site', 'By using this website you agree to use it only for lawful purposes and in a way that does not infringe the rights of others.'],
      ['Pricing', 'All prices are listed in Indian Rupees (INR) and are subject to change without prior notice.'],
      ['Orders', 'We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud or pricing errors.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['Information We Collect', 'We collect your name, contact details, shipping address and order history to process and deliver your orders.'],
      ['Marketing Communication', 'We only send marketing emails/SMS/WhatsApp messages if you have opted in during signup or checkout.'],
      ['Data Security', 'Your data is stored securely and is never sold to third parties.'],
    ],
  },
};

export default function PolicyPage() {
  const { slug } = useParams();
  const policy = policies[slug];

  if (!policy) return <div className="max-w-3xl mx-auto px-4 py-20">Page not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-14">
      <Helmet><title>{policy.title} | Arohi by Megha</title></Helmet>
      <h1 className="section-heading mb-8">{policy.title}</h1>
      <div className="space-y-6">
        {policy.body.map(([heading, text]) => (
          <div key={heading}>
            <h3 className="font-medium mb-1">{heading}</h3>
            <p className="text-charcoal/70 text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
