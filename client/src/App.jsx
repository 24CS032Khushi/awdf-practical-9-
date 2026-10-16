/**
 * AFTER optimisation: route-based code splitting.
 * Each page is a separate chunk that downloads only when its route is visited.
 *
 * Rules followed (common mistakes avoided):
 *  - lazy() is declared at module top level, never inside a component
 *  - every lazy page uses `export default`
 *  - ONE <Suspense> wraps only the <Routes> block, so the Navbar/Footer never disappear
 */
import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazyWithDelay } from './utils/lazyWithDelay';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

const Home = lazyWithDelay(() => import('./pages/Home'));
const Projects = lazyWithDelay(() => import('./pages/Projects'));
const Contact = lazyWithDelay(() => import('./pages/Contact'));
const Tasks = lazyWithDelay(() => import('./pages/Tasks'));
const Login = lazyWithDelay(() => import('./pages/Login'));
const Register = lazyWithDelay(() => import('./pages/Register'));
const NotFound = lazyWithDelay(() => import('./pages/NotFound'));

export default function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <main className="container page">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
