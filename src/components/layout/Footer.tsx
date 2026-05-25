import Link from "next/link";
import { WePayLogo } from "./Navbar";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1a1f36] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <WePayLogo size="md" />
            <p className="text-gray-400 text-sm leading-relaxed">
              Drawing your needs closer to your salary. Zambia&apos;s trusted
              salary-backed lending platform.
            </p>
            <div className="flex space-x-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Social media"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", href: "/" },
                { label: "Features", href: "/#features" },
                { label: "How It Works", href: "/#how-it-works" },
                { label: "About Us", href: "/#about" },
                { label: "Apply for Loan", href: "/register" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {[
                "Privacy Policy",
                "Terms of Service",
                "Cookie Policy",
                "Loan Agreement",
                "Compliance",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  Cairo Road, Lusaka, Zambia
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-green-400 flex-shrink-0" />
                <a
                  href="tel:+260211000000"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  +260 211 000 000
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-blue-400 flex-shrink-0" />
                <a
                  href="mailto:hello@wepay.zm"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  hello@wepay.zm
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} WePay Financial Services Ltd. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Licensed by the Bank of Zambia · NAPSA Registered
          </p>
        </div>
      </div>
    </footer>
  );
}
