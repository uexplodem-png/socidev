import React from "react";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CheckCircle2,
    Zap,
    BarChart3,
    Users,
    Lock,
    Globe,
    Rocket,
    TrendingUp,
    MessageSquare,
    Clock,
    Shield,
    Heart,
} from "lucide-react";

export const HomePage = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const features = [
        {
            icon: <Zap className='w-6 h-6' />,
            title: "Lightning-Fast Automation",
            description: "Automate your social media growth with intelligent scheduling and targeting",
        },
        {
            icon: <BarChart3 className='w-6 h-6' />,
            title: "Advanced Analytics",
            description: "Track engagement, reach, and growth metrics in real-time dashboards",
        },
        {
            icon: <Users className='w-6 h-6' />,
            title: "Audience Management",
            description: "Build and nurture communities with smart follower interactions",
        },
        {
            icon: <Globe className='w-6 h-6' />,
            title: "Multi-Platform",
            description: "Manage Instagram, TikTok, Twitter, and YouTube from one dashboard",
        },
        {
            icon: <MessageSquare className='w-6 h-6' />,
            title: "Smart Engagement",
            description: "Automated responses and engagement that feels genuine and personal",
        },
        {
            icon: <TrendingUp className='w-6 h-6' />,
            title: "Trend Analytics",
            description: "Discover viral content trends and capitalize on them instantly",
        },
    ];

    const benefits = [
        "Grow your followers organically",
        "Increase engagement rates by 300%",
        "Save 10+ hours per week on social media",
        "Get data-driven insights",
        "Scale to multiple accounts",
        "24/7 automation",
    ];

    return (
        <div className='min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white'>
            {/* Navigation */}
            <nav className='fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16'>
                    <div className='inline-flex items-center gap-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold'>
                            ∞
                        </div>
                        <span className='text-xl font-bold text-gray-900'>Infini</span>
                    </div>

                    <div className='hidden md:flex items-center gap-8'>
                        <a href='#features' className='text-gray-600 hover:text-gray-900 transition-colors'>
                            Features
                        </a>
                        <a href='#pricing' className='text-gray-600 hover:text-gray-900 transition-colors'>
                            Pricing
                        </a>
                        <a href='#testimonials' className='text-gray-600 hover:text-gray-900 transition-colors'>
                            Testimonials
                        </a>
                    </div>

                    <div className='flex items-center gap-3'>
                        <Button
                            onClick={() => navigate("/login")}
                            className='hidden sm:inline-flex px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors'>
                            Sign in
                        </Button>
                        <Button
                            onClick={() => navigate("/register")}
                            className='px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl'>
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
                {/* Decorative elements */}
                <div className='absolute top-40 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -mr-32'></div>
                <div className='absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl -ml-32'></div>

                <div className='max-w-4xl mx-auto text-center relative z-10'>
                    <div className='inline-flex items-center gap-2 mb-6 px-4 py-2 bg-indigo-100/50 rounded-full border border-indigo-200/50'>
                        <Rocket className='w-4 h-4 text-indigo-600' />
                        <span className='text-sm font-semibold text-indigo-600'>
                            Now supporting 4 platforms
                        </span>
                    </div>

                    <h1 className='text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight'>
                        Grow Your Social Media{" "}
                        <span className='bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'>
                            Effortlessly
                        </span>
                    </h1>

                    <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed'>
                        Automate your social media growth with intelligent scheduling, analytics,
                        and engagement tools. Join thousands of creators scaling their presence.
                    </p>

                    <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
                        <Button
                            onClick={() => navigate("/register")}
                            className='px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2'>
                            Start Free Trial
                            <ArrowRight className='w-5 h-5' />
                        </Button>
                        <Button
                            className='px-8 py-3 border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition-colors'>
                            Watch Demo
                        </Button>
                    </div>

                    <div className='grid grid-cols-3 gap-6 max-w-xl mx-auto text-sm'>
                        <div>
                            <div className='text-2xl font-bold text-gray-900'>10k+</div>
                            <div className='text-gray-600'>Active Users</div>
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-gray-900'>4.9★</div>
                            <div className='text-gray-600'>User Rating</div>
                        </div>
                        <div>
                            <div className='text-2xl font-bold text-gray-900'>2M+</div>
                            <div className='text-gray-600'>Followers Grown</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id='features' className='py-20 px-4 sm:px-6 lg:px-8 relative z-10'>
                <div className='max-w-7xl mx-auto'>
                    <div className='text-center mb-16'>
                        <h2 className='text-4xl font-bold text-gray-900 mb-4'>
                            Powerful Features Built for Growth
                        </h2>
                        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
                            Everything you need to succeed on social media, all in one platform
                        </p>
                    </div>

                    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className='p-8 rounded-xl border border-gray-200 hover:border-indigo-300 bg-white hover:shadow-lg transition-all group'>
                                <div className='w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform'>
                                    {feature.icon}
                                </div>
                                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                                    {feature.title}
                                </h3>
                                <p className='text-gray-600'>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 relative z-10'>
                <div className='max-w-7xl mx-auto'>
                    <div className='grid md:grid-cols-2 gap-12 items-center'>
                        <div>
                            <h2 className='text-4xl font-bold text-gray-900 mb-8'>
                                Why Choose Infini?
                            </h2>
                            <div className='space-y-4'>
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className='flex items-center gap-3'>
                                        <CheckCircle2 className='w-5 h-5 text-green-500 flex-shrink-0' />
                                        <span className='text-gray-700'>{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl p-8 border border-indigo-200/50'>
                            <div className='bg-white rounded-lg shadow-lg p-6 space-y-4'>
                                <div className='flex justify-between items-center pb-4 border-b'>
                                    <span className='text-gray-600'>Profile Growth</span>
                                    <span className='text-2xl font-bold text-indigo-600'>+2,847</span>
                                </div>
                                <div className='flex justify-between items-center pb-4 border-b'>
                                    <span className='text-gray-600'>Engagement Rate</span>
                                    <span className='text-2xl font-bold text-indigo-600'>+8.3%</span>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className='text-gray-600'>Time Saved</span>
                                    <span className='text-2xl font-bold text-indigo-600'>45 hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className='py-20 px-4 sm:px-6 lg:px-8 relative z-10'>
                <div className='max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-12 relative overflow-hidden'>
                    {/* Decorative elements */}
                    <div className='absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl'></div>
                    <div className='absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl'></div>

                    <div className='text-center relative z-10'>
                        <h2 className='text-4xl font-bold text-white mb-4'>
                            Ready to Scale Your Presence?
                        </h2>
                        <p className='text-indigo-100 text-lg mb-8'>
                            Join thousands of creators and businesses growing on social media with Infini
                        </p>
                        <Button
                            onClick={() => navigate("/register")}
                            className='px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl'>
                            Get Started Free
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className='border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 relative z-10'>
                <div className='max-w-7xl mx-auto'>
                    <div className='grid md:grid-cols-4 gap-8 mb-8'>
                        <div>
                            <div className='inline-flex items-center gap-2 mb-4'>
                                <div className='w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm'>
                                    ∞
                                </div>
                                <span className='font-bold text-gray-900'>Infini</span>
                            </div>
                            <p className='text-sm text-gray-600'>
                                Grow your social media presence with intelligent automation
                            </p>
                        </div>

                        {[
                            { title: 'Product', links: ['Features', 'Pricing', 'Security'] },
                            { title: 'Company', links: ['About', 'Blog', 'Contact'] },
                            { title: 'Legal', links: ['Terms', 'Privacy', 'Cookies'] },
                        ].map((section, idx) => (
                            <div key={idx}>
                                <h4 className='font-semibold text-gray-900 mb-4'>{section.title}</h4>
                                <ul className='space-y-2'>
                                    {section.links.map((link, i) => (
                                        <li key={i}>
                                            <a href='#' className='text-sm text-gray-600 hover:text-gray-900 transition-colors'>
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className='border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600'>
                        <p>© 2024 Infini. All rights reserved.</p>
                        <div className='flex gap-4 mt-4 sm:mt-0'>
                            <a href='#' className='hover:text-gray-900 transition-colors'>Twitter</a>
                            <a href='#' className='hover:text-gray-900 transition-colors'>LinkedIn</a>
                            <a href='#' className='hover:text-gray-900 transition-colors'>Instagram</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
