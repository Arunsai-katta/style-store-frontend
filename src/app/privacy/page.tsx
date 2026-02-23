'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                    <p className="text-sm text-gray-400 mb-8">Last updated: February 2025</p>

                    <div className="prose prose-gray max-w-none space-y-8 text-gray-600">

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                            <p>When you use StyleStore, we collect the following types of information:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Account information</strong> — name, email address, and password when you register.</li>
                                <li><strong>Order & payment information</strong> — shipping address, order history, and payment method details (processed securely via Razorpay; we do not store card details).</li>
                                <li><strong>Usage data</strong> — pages visited, device type, and browser information to improve our service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>To process and fulfil your orders.</li>
                                <li>To send order confirmations and shipping updates via email.</li>
                                <li>To respond to your customer support inquiries.</li>
                                <li>To improve our website and personalise your experience.</li>
                                <li>To comply with legal obligations.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Sharing Your Information</h2>
                            <p>We do not sell your personal information. We share data only with:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Payment processors</strong> (Razorpay) to handle secure payments.</li>
                                <li><strong>Shipping partners</strong> (Shiprocket / courier services) to deliver your orders.</li>
                                <li><strong>Legal authorities</strong> when required by applicable law.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
                            <p>We implement industry-standard security measures including HTTPS encryption, hashed passwords, and secure token storage. However, no method of transmission over the internet is 100% secure.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies</h2>
                            <p>We use essential cookies to maintain your session and cart. We do not use third-party advertising cookies. You can disable cookies in your browser settings, but this may affect site functionality.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
                            <p>You have the right to:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Access the personal data we hold about you.</li>
                                <li>Request correction or deletion of your data.</li>
                                <li>Withdraw consent at any time.</li>
                            </ul>
                            <p className="mt-2">To exercise these rights, email us at <a href="mailto:stylestore@support.com" className="text-primary hover:underline">stylestore@support.com</a>.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to This Policy</h2>
                            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of our service after changes constitutes acceptance.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Us</h2>
                            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
                            <p className="mt-2">
                                <strong>StyleStore</strong><br />
                                Hyderabad, Telangana, India<br />
                                <a href="mailto:stylestore@support.com" className="text-primary hover:underline">stylestore@support.com</a>
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-sm">
                        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                        <Link href="/" className="text-gray-500 hover:text-gray-700">← Back to Home</Link>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
