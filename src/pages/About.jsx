const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300">
      <Icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
    </div>
    <h3 className="font-outfit text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
  </div>
);

const RoleCard = ({ initials, name, role, description }) => (
  <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all">
    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg shadow-emerald-100">
      {initials}
    </div>
    <h3 className="font-outfit text-lg font-bold text-slate-900">{name}</h3>
    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-3">{role}</p>
    <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
  </div>
);

const AnalyticsIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SecurityIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ResponsiveIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const PerformanceIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default function About() {
  const roles = [
    { name: 'Administrator', initials: 'AD', role: 'Global Control', description: 'Complete system oversight, user lifecycle management, and institutional settings.' },
    { name: 'Faculty', initials: 'FC', role: 'Academic Lead', description: 'Streamlined attendance marking, grading workflows, and student performance tracking.' },
    { name: 'Head of Dept', initials: 'HD', role: 'Strategic Review', description: 'Department-wide reporting, curriculum monitoring, and faculty coordination.' },
    { name: 'Student', initials: 'ST', role: 'Active Learner', description: 'Transparent access to personal records, attendance streaks, and progress analytics.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center gap-12 pt-8">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            About OAMS
          </div>
          <h1 className="font-outfit text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
            Elevating Educational <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Excellence.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            OAMS (Online Attendance Management System) is a state-of-the-art platform designed to bridge the gap between complex institutional data and actionable academic insights.
          </p>
          <div className="flex flex-wrap justify-center lg:justify-start gap-4">
            <button className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              Our Vision
            </button>
            <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition-all">
              Learn More
            </button>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full"></div>
          <img 
            src="/src/about_page_illustration_1777837962053.png" 
            alt="OAMS Innovation" 
            className="relative w-full max-w-lg mx-auto rounded-3xl shadow-2xl animate-float"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden absolute inset-0 flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <span className="text-slate-400 font-medium">Professional Illustration</span>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-12 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-8">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="font-outfit text-3xl font-bold">Our Mission</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            To empower educational institutions with an automated, transparent, and high-performance attendance ecosystem that eliminates administrative friction and fosters student accountability.
          </p>
        </div>
        <div className="bg-emerald-500 p-12 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 blur-[100px] -ml-32 -mb-32"></div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-8">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="font-outfit text-3xl font-bold">Our Vision</h2>
          <p className="text-emerald-50 text-lg leading-relaxed">
            We envision a world where academic progress is driven by data-backed decisions, ensuring that no student is left behind due to a lack of visibility or engagement.
          </p>
        </div>
      </section>

      {/* Key Features */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-outfit text-4xl font-bold text-slate-900">System Capabilities</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Built with modern architecture to provide the most reliable experience.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            icon={AnalyticsIcon} 
            title="Real-time Analytics" 
            description="Leverage deep data insights to monitor attendance patterns and academic milestones instantly."
          />
          <FeatureCard 
            icon={SecurityIcon} 
            title="Enterprise Security" 
            description="Role-based access control ensuring data integrity and privacy across all user tiers."
          />
          <FeatureCard 
            icon={ResponsiveIcon} 
            title="Cloud Responsive" 
            description="Seamlessly optimized for any device, from high-res monitors to mobile smartphones."
          />
          <FeatureCard 
            icon={PerformanceIcon} 
            title="Growth Tracking" 
            description="Visualized progress reports that highlight strengths and identify areas for intervention."
          />
        </div>
      </section>

      {/* User Roles */}
      <section className="bg-slate-50/50 rounded-[3rem] p-12 border border-slate-100">
        <div className="flex flex-col lg:flex-row items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="font-outfit text-4xl font-bold text-slate-900">The User Ecosystem</h2>
            <p className="text-slate-600 max-w-xl">A unified platform tailored for every member of the academic community.</p>
          </div>
          <div className="hidden lg:block h-1 w-24 bg-emerald-500 rounded-full mb-4"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, i) => (
            <RoleCard key={i} {...role} />
          ))}
        </div>
      </section>

    </div>
  );
}
