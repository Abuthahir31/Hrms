// src/App.jsx
import { useState } from 'react';
import { Menu, X, ChevronDown, Phone, Mail, MapPin } from 'lucide-react';

function Homepage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo + Company Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-md flex items-center justify-center text-white font-bold text-xl">
                HCM
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  Hitachi Construction Machinery
                </h1>
                <p className="text-xs text-gray-600">Zambia Co. Ltd</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#home" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                Home
              </a>
              <a href="#about" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                About
              </a>
              <a href="#products" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                Equipment
              </a>
              <a href="#services" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                Services
              </a>
              <a href="#contact" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                Contact
              </a>

              {/* Careers Button */}
              <a
                href={process.env.REACT_APP_API_CAREERS_URL} // ← replace with real link when available
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                Careers Portal
                <span className="text-xs bg-orange-700 px-1.5 py-0.5 rounded">Join us</span>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-6 space-y-5">
              <a href="#home" className="block text-gray-800 hover:text-orange-600 font-medium">Home</a>
              <a href="#about" className="block text-gray-800 hover:text-orange-600 font-medium">About</a>
              <a href="#products" className="block text-gray-800 hover:text-orange-600 font-medium">Equipment</a>
              <a href="#services" className="block text-gray-800 hover:text-orange-600 font-medium">Services</a>
              <a href="#contact" className="block text-gray-800 hover:text-orange-600 font-medium">Contact</a>
              
              <a
                href="http://hrms-w78g.vercel.app/user/home"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-lg font-medium mt-4"
              >
                Careers Portal
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58caa5?w=1600')] bg-cover bg-center opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36 lg:py-44">
          <div className="max-w-3xl">
            <h2 className="text-orange-500 font-semibold tracking-wide uppercase mb-4">
              Powering Zambia's Development
            </h2>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Hitachi Construction Machinery Zambia
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Premium excavators, dump trucks, wheel loaders and full after-sales support across Zambia.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <a
                href="#contact"
                className="bg-orange-600 hover:bg-orange-700 px-8 py-4 rounded-lg font-semibold text-lg transition shadow-lg text-center"
              >
                Contact Us
              </a>
              <a
                href="#products"
                className="border-2 border-white/40 hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition backdrop-blur-sm text-center"
              >
                View Equipment
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats / Value Props */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
          <div>
            <div className="text-5xl font-bold text-orange-600 mb-3">50+</div>
            <p className="text-gray-600 text-lg">Years of Global Experience</p>
          </div>
          <div>
            <div className="text-5xl font-bold text-orange-600 mb-3">200+</div>
            <p className="text-gray-600 text-lg">Machines Operating in Zambia</p>
          </div>
          <div>
            <div className="text-5xl font-bold text-orange-600 mb-3">24/7</div>
            <p className="text-gray-600 text-lg">Parts & Service Support</p>
          </div>
        </div>
      </section>

      {/* CTA Bar */}
      <section className="bg-orange-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to power your next project?
          </h3>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            Talk to our team about the right Hitachi machine for your operation.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-3 bg-white text-orange-700 hover:bg-gray-100 px-10 py-5 rounded-xl font-bold text-lg shadow-lg transition"
          >
            <Phone size={24} />
            Get in Touch Today
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-600 rounded-md flex items-center justify-center text-white font-bold">
                  HCM
                </div>
                <div>
                  <h4 className="font-bold text-white">Hitachi Construction Machinery</h4>
                  <p className="text-sm text-gray-400">Zambia Co. Ltd</p>
                </div>
              </div>
              <p className="text-sm">
                Authorised distributor of Hitachi construction equipment in Zambia.
              </p>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-5">Quick Links</h5>
              <ul className="space-y-3 text-sm">
                <li><a href="#home" className="hover:text-orange-400 transition">Home</a></li>
                <li><a href="#about" className="hover:text-orange-400 transition">About Us</a></li>
                <li><a href="#products" className="hover:text-orange-400 transition">Equipment</a></li>
                <li><a href="#services" className="hover:text-orange-400 transition">After Sales</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-5">Contact</h5>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="mt-1" />
                  <span>Plot 5286, Great North Road, Heavy Industrial Area, Lusaka, Zambia</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} />
                  <span>+260 211 845 000</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} />
                  <span>info@hcmzambia.com</span>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-5">Careers</h5>
              <p className="text-sm mb-4">
                Join a team that's building Zambia's future.
              </p>
                <a
                href={process.env.REACT_APP_API_CAREERS_URL} // ← replace with real link when available
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                View Open Positions
              </a>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} Hitachi Construction Machinery Zambia Co. Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;