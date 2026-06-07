import { useState } from 'react';

const ContactInfoItem = ({ icon: Icon, title, value }) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-emerald-50 transition-colors group">
    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
      <Icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
    </div>
    <div>
      <h4 className="font-outfit text-sm font-bold text-slate-900">{title}</h4>
      <p className="text-slate-600 text-sm leading-relaxed">{value}</p>
    </div>
  </div>
);

const EmailIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for contacting us! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
          Connect With Us
        </div>
        <h1 className="font-outfit text-4xl lg:text-5xl font-bold text-slate-900">Let's Start a <span className="text-emerald-600">Conversation</span></h1>
        <p className="text-slate-600 leading-relaxed">
          Whether you have a question about our features, pricing, or need a custom demo for your institution, our team is here to help.
        </p>
      </section>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Form Section */}
        <section className="lg:col-span-3 bg-white p-8 lg:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <h2 className="font-outfit text-2xl font-bold text-slate-900 mb-8">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-bold text-slate-700 ml-1">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                placeholder="How can we help you?"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-bold text-slate-700 ml-1">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium resize-none"
                placeholder="Tell us about your institutional needs..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 transform hover:-translate-y-1 active:scale-95"
            >
              Send Inquiry
            </button>
          </form>
        </section>

        {/* Sidebar Info */}
        <section className="lg:col-span-2 space-y-8">
          {/* Contact Details */}
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
            <h3 className="font-outfit text-xl font-bold text-slate-900 px-4">Contact Information</h3>
            <div className="space-y-2">
              <ContactInfoItem icon={EmailIcon} title="Email" value="support@oams.edu" />
              <ContactInfoItem icon={PhoneIcon} title="Phone" value="+1 (555) 123-4567" />
              <ContactInfoItem icon={LocationIcon} title="Main Campus" value="123 Education St, LC 12345" />
            </div>
          </div>

          {/* Office Hours */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-100/50 space-y-6">
            <h3 className="font-outfit text-xl font-bold text-slate-900">Institutional Hours</h3>
            <div className="space-y-3">
              {[
                { day: 'Mon - Fri', time: '9:00 AM - 6:00 PM' },
                { day: 'Saturday', time: '10:00 AM - 4:00 PM' },
                { day: 'Sunday', time: 'Closed' },
              ].map((h, i) => (
                <div key={i} className="flex justify-between items-center text-sm px-2">
                  <span className="text-slate-500 font-medium">{h.day}</span>
                  <span className="text-slate-900 font-bold">{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Help */}
          <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
            <h3 className="font-outfit text-xl font-bold relative z-10">Need Quick Support?</h3>
            <p className="text-emerald-50 text-sm leading-relaxed relative z-10">
              Our documentation and FAQ section have answers to common integration questions.
            </p>
            <button className="relative z-10 px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl text-xs hover:bg-emerald-50 transition-all">
              Visit Help Center
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
