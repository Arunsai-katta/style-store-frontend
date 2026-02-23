'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-sm text-gray-400 mb-8">Last updated: February 2025</p>

                    <div className="prose prose-gray max-w-none space-y-8 text-gray-600">

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                            <p>By accessing or using StyleStore ("we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website or services.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Use of the Platform</h2>
                            <p>You agree to use StyleStore only for lawful purposes. You must not:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Use the platform in any way that violates applicable local or national laws.</li>
                                <li>Attempt to gain unauthorised access to any part of our systems.</li>
                                <li>Use automated tools to scrape, crawl, or bulk-download content.</li>
                                <li>Submit false or misleading information during registration or checkout.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Orders and Payments</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>All orders are subject to product availability.</li>
                                <li>Prices are listed in Indian Rupees (₹) and inclusive of applicable taxes.</li>
                                <li>We reserve the right to cancel any order and refund the amount if a product is out of stock or pricing errors occur.</li>
                                <li>Payments are processed securely through Razorpay. We do not store card details.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Shipping and Delivery</h2>
                            <p>We aim to dispatch orders within 2–3 business days. Delivery timelines depend on your location and the courier partner. StyleStore is not liable for delays caused by courier services or events outside our control.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Returns and Refunds</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Items may be returned within 7 days of delivery if they are unused, unwashed, and in original packaging.</li>
                                <li>Refunds are processed to the original payment method within 5–7 business days after we receive and inspect the returned item.</li>
                                <li>Sale items and customised products are non-refundable unless defective.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
                            <p>All content on StyleStore — including logos, product images, descriptions, and designs — is the intellectual property of StyleStore or its suppliers. You may not reproduce, distribute, or create derivative works without our explicit written permission.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
                            <p>To the fullest extent permitted by law, StyleStore shall not be liable for any indirect, incidental, or consequential damages arising from your use of our platform or products. Our total liability for any claim shall not exceed the amount you paid for the relevant order.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to These Terms</h2>
                            <p>We reserve the right to update these Terms at any time. Changes will be reflected on this page. Continued use of StyleStore after changes constitutes your acceptance of the revised Terms.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Governing Law</h2>
                            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
                            <p>For questions about these Terms, please contact:</p>
                            <p className="mt-2">
                                <strong>StyleStore</strong><br />
                                Hyderabad, Telangana, India<br />
                                <a href="mailto:stylestore@support.com" className="text-primary hover:underline">stylestore@support.com</a>
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-sm">
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        <Link href="/" className="text-gray-500 hover:text-gray-700">← Back to Home</Link>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
