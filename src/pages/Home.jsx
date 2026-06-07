import { Link, useNavigate } from 'react-router-dom';

const PortalCard = ({ title, description, icon, stats, onClick, gradient }) => (
  <div 
    onClick={onClick}
    className="group relative bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden z-10"
  >
    <div className={`absolute -inset-1 opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 bg-gradient-to-r ${gradient}`}></div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
    
    <div className="relative z-10">
      <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br ${gradient} text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
        {icon}
      </div>
      <h3 className="font-outfit text-2xl font-bold text-slate-800 mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-8">{description}</p>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {stats.map((stat, i) => (
          <span key={i} className="px-3 py-1 bg-slate-100/50 backdrop-blur-sm text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-200/50 group-hover:bg-white group-hover:border-white transition-colors">
            {stat}
          </span>
        ))}
      </div>
      
      <div className="flex items-center text-slate-800 font-bold text-sm gap-2 group-hover:gap-4 transition-all">
        Access Portal 
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </div>
  </div>
);

const FeatureItem = ({ icon, title, description }) => (
  <div className="group flex gap-6 p-6 rounded-[2rem] hover:bg-white/80 hover:backdrop-blur-md hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border border-transparent hover:border-white">
    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] group-hover:shadow-emerald-500/20 group-hover:-translate-y-1 transition-all duration-300">
      {icon}
    </div>
    <div>
      <h3 className="font-outfit text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Home() {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Student Portal',
      description: 'Your personalized academic hub. Track attendance, view grades, and monitor your progress.',
      icon: '🎓',
      link: '/student',
      role: 'student',
      gradient: 'from-blue-500 to-indigo-500',
      mockData: { name: 'John Student', email: 'john.student@oams.com', role: 'student', id: '2024001' },
      stats: ['Attendance Check', 'Marks Sheet', 'Fee Status']
    },
    {
      title: 'Faculty Dashboard',
      description: 'Streamline your teaching workflow. Manage classes, mark attendance, and grade students.',
      icon: '👨‍🏫',
      link: '/teacher',
      role: 'teacher',
      gradient: 'from-emerald-500 to-teal-500',
      mockData: { name: 'Dr. John Doe', email: 'john.doe@oams.com', role: 'teacher', id: 'faculty001' },
      stats: ['Class Logs', 'Grade Entry', 'Reports']
    },
    {
      title: 'Admin Console',
      description: 'Institutional management at your fingertips. Oversee users, classes, and system analytics.',
      icon: '🛡️',
      link: '/admin',
      role: 'admin',
      gradient: 'from-purple-500 to-pink-500',
      mockData: { name: 'Admin User', email: 'admin@oams.com', role: 'admin', id: 'admin001' },
      stats: ['User Management', 'Departments', 'System Logs']
    },
  ];

  const handlePortalAccess = (portal) => {
    const hasVisited = localStorage.getItem('oams_has_visited');
    if (!hasVisited) {
      navigate('/signin', { state: { intendedRole: portal.role, intendedPath: portal.link, showMessage: true } });
    } else {
      localStorage.setItem('oams_user', JSON.stringify(portal.mockData));
      navigate(portal.link);
    }
  };

  return (
    <div className="relative pb-24 overflow-hidden selection:bg-emerald-500/30">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-300/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-blue-300/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-10 text-center lg:text-left animate-slide-up mb-20">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm text-slate-600 text-[11px] font-bold uppercase tracking-widest">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Next-Gen Academic Ecosystem
            </div>
            
            <h1 className="font-outfit text-6xl lg:text-7xl xl:text-8xl font-black text-slate-900 leading-[1.05] tracking-tight">
              Elevate Your <br />
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-400 blur-2xl opacity-20 rounded-full"></span>
                <span className="relative bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Institution.
                </span>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
              Experience the pinnacle of educational management. Automate attendance, analyze performance, and empower your faculty with our intelligent platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
              <Link to="/signup" className="group relative px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto text-center">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
              <Link to="/about" className="group px-8 py-4 bg-white/50 backdrop-blur-md text-slate-700 border border-slate-200/50 font-bold rounded-2xl hover:bg-white hover:shadow-lg transition-all w-full sm:w-auto text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </Link>
            </div>
          </div>
          
          <div className="flex-1 relative animate-fade-in w-full max-w-2xl">
             <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 rounded-[3rem] blur-3xl transform rotate-3"></div>
             <div className="relative bg-white/40 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
               <img 
                 src="/lms_dashboard_hero.png" 
                 alt="OAMS Platform" 
                 className="w-full rounded-[2rem] shadow-sm animate-float object-cover aspect-[4/3] bg-slate-100/50"
               />
             </div>
          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="mt-8 mb-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 px-8 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {[
              { label: 'Active Students', value: '15K+' },
              { label: 'Faculty Members', value: '800+' },
              { label: 'Courses Managed', value: '2.4K+' },
              { label: 'System Uptime', value: '99.9%' },
            ].map((stat, i) => (
              <div key={i} className="text-center relative">
                {i !== 0 && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-slate-200"></div>}
                <div className="font-outfit text-4xl lg:text-5xl font-black text-slate-800 mb-1">{stat.value}</div>
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-slate-50/50 -skew-y-2 transform origin-top-left -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="font-outfit text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">Unified Access, <span className="text-emerald-600">Tailored Experience</span></h2>
            <p className="text-slate-500 text-lg leading-relaxed">Seamlessly transition between roles with our context-aware portals, designed to provide exactly what you need, when you need it.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {portals.map((portal, i) => (
              <PortalCard key={i} {...portal} onClick={() => handlePortalAccess(portal)} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-2">Why Choose OAMS</div>
              <h2 className="font-outfit text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">An Institutional <br/>Powerhouse.</h2>
            </div>
            <Link to="/about" className="group flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors">
              Explore Platform Capabilities 
              <span className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </span>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            <FeatureItem icon="📊" title="Deep Analytics" description="Go beyond simple attendance. Monitor long-term trends and identify students who need support proactively." />
            <FeatureItem icon="🔐" title="Bank-Grade Security" description="Enterprise-grade encryption ensures all student and faculty data remains strictly confidential and compliant." />
            <FeatureItem icon="📱" title="Universal Design" description="Access OAMS seamlessly from your desktop, tablet, or smartphone without losing any functionality." />
            <FeatureItem icon="🎯" title="Smart Reports" description="Generate comprehensive, beautiful PDF reports for departments or individuals in just a few clicks." />
            <FeatureItem icon="⚡" title="Real-time Sync" description="Instant data updates across all portals ensures everyone is always on the same page, with zero lag." />
            <FeatureItem icon="🌍" title="Global Scale" description="Built on modern cloud architecture to scale across multiple campuses and departments effortlessly." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="bg-slate-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl">
          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="font-outfit text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Ready to Modernize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Academic Workflow?</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Join leading institutions that are already redefining educational management with OAMS's intelligent platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
              <Link to="/signup" className="px-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] hover:-translate-y-1 active:scale-95">
                Register Institution
              </Link>
              <Link to="/contact" className="px-10 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-2xl hover:bg-white/20 transition-all hover:-translate-y-1 active:scale-95">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
