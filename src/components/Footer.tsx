'use client';

import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders over ₹5000' },
    { icon: Shield, title: 'Secure Payment', description: '100% secure checkout' },
    { icon: RotateCcw, title: 'Easy Returns', description: '7-day return policy' },
    { icon: Headphones, title: '24/7 Support', description: 'Always here to help' },
  ];

  const footerLinks = {
    shop: [
      { name: 'All Products', href: '/shop' },
      { name: 'T-Shirts', href: '/shop?category=t-shirts' },
      { name: 'Hoodies', href: '/shop?category=hoodies' },
      { name: 'Sweatshirts', href: '/shop?category=sweatshirts' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Youtube', icon: Youtube, href: '#' },
  ];

  return (
    <footer className="bg-white">
      {/* Features Section */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Brand Column - spans 2 cols */}
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <span className="text-2xl font-bold">
                  Style<span className="text-primary">Store</span>
                </span>
              </Link>
              <p className="text-gray-400 mb-4 text-sm">
                Your destination for premium t-shirts, hoodies, and sweatshirts.
                Quality, style, and comfort in every piece.
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2">
                {footerLinks.shop.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-primary mt-0.5" />
                  <span className="text-gray-400 text-sm">stylestore@support.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-primary mt-0.5" />
                  <span className="text-gray-400 text-sm">9390449090</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <span className="text-gray-400 text-sm">
                    Hyderabad, Telangana
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {currentYear} StyleStore. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-500 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
