import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <Outlet />
      </main>
      <footer className="bg-primary-600 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm">
              © 2026 Online Attendance Management System (OAMS). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
