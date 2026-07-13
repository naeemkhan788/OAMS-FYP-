import { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

const NavItem = ({ to, children, icon: Icon }) => (
  <NavLink to={to} end={to === '/'}>
    {({ isActive }) => (
      <div
        className={
          'group relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ' +
          (isActive
            ? 'text-emerald-600 bg-emerald-50/50'
            : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50/80')
        }
      >
        {Icon && (
          <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
        )}
        <span>{children}</span> 
        
        {/* Animated Underline */}
        <span
          className={
            'absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-emerald-500 transition-all duration-300 rounded-full ' +
            (isActive ? 'w-1/2 opacity-100' : 'w-0 opacity-0 group-hover:w-1/3 group-hover:opacity-50')
          }
        />
      </div>
    )}
  </NavLink>
);

const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const AboutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ContactIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SignInIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const SignUpIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'py-2 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-slate-100' 
        : 'py-4 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-outfit text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  OAMS
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 leading-none">
                  Online Attendance
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavItem to="/" icon={HomeIcon}>Home</NavItem>
            <NavItem to="/about" icon={AboutIcon}>About</NavItem>
            <NavItem to="/contact" icon={ContactIcon}>Contact</NavItem>
          </div>

          {/* User Account / Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  dropdownOpen 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-700 hover:bg-slate-100 bg-white/50 border border-slate-200'
                }`}
              >
                <div className={`p-1 rounded-full ${dropdownOpen ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                Account
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 origin-top-right bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-2 transform transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auth Actions</p>
                  </div>
                  <Link
                    to="/signin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2 bg-slate-50 group-hover:bg-emerald-100/50 rounded-lg transition-colors">
                      <SignInIcon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Sign In</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2 bg-slate-50 group-hover:bg-emerald-100/50 rounded-lg transition-colors">
                      <SignUpIcon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-600 transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-100 absolute top-full left-0 right-0 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 py-6 space-y-2">
            <NavItem to="/" icon={HomeIcon}>Home</NavItem>
            <NavItem to="/about" icon={AboutIcon}>About</NavItem>
            <NavItem to="/contact" icon={ContactIcon}>Contact</NavItem>
            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
              <Link
                to="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-all"
              >
                <SignInIcon className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
              >
                <SignUpIcon className="w-4 h-4" />
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
