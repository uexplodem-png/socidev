import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Users,
  Globe,
  Play,
  Lock,
  Gauge,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  const stats = [
    { value: "50K+", label: "Active Users", trend: "↑ 45%" },
    { value: "2.3M", label: "Followers Managed", trend: "↑ 312%" },
    { value: "847M+", label: "Posts Analyzed", trend: "↑ 89%" },
    { value: "99.9%", label: "Uptime", trend: "Industry Leading" },
  ];

  const features = [
    {
      icon: <Zap className='w-7 h-7' />,
      title: "AI-Powered Automation",
      description: "Intelligent scheduling and auto-engagement powered by machine learning algorithms",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <BarChart3 className='w-7 h-7' />,
      title: "Real-Time Analytics",
      description: "Deep insights into performance metrics across all platforms in one dashboard",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Users className='w-7 h-7' />,
      title: "Audience Intelligence",
      description: "Understand your audience with demographic, behavioral, and sentiment analysis",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: <Globe className='w-7 h-7' />,
      title: "All Platforms",
      description: "Instagram, TikTok, Twitter/X, YouTube & more - all managed from one place",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <Lock className='w-7 h-7' />,
      title: "Enterprise Security",
      description: "Bank-level encryption, SOC 2 compliant, with full compliance support",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: <Gauge className='w-7 h-7' />,
      title: "Performance Optimization",
      description: "Automated content optimization for maximum reach and engagement",
      color: "from-rose-500 to-orange-500",
    },
  ];

  const testimonials = [
    {
      name: "Alex Rivera",
      title: "Content Creator",
      image: "A",
      quote: "SociDev saved me 20 hours a week. My engagement tripled in just 3 months.",
      rating: 5,
    },
    {
      name: "Jordan Chen",
      title: "Marketing Manager",
      image: "J",
      quote: "The analytics features alone are worth it. Finally understand what's working.",
      rating: 5,
    },
    {
      name: "Sam Patel",
      title: "Brand Owner",
      image: "S",
      quote: "Best investment for our social media strategy. ROI is incredible.",
      rating: 5,
    },
  ];

  const benefits = [
    "Grow followers authentically & organically",
    "Increase engagement rates by 300%+",
    "Save 15+ hours per week on social media",
    "Get data-driven content recommendations",
    "Scale across unlimited accounts",
    "24/7 monitoring & automation",
  ];

  return (
    <div className='min-h-screen bg-black text-white overflow-hidden'>
      {/* Animated background */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl'></div>
        <div className='absolute top-1/3 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl'></div>
      </div>

      {/* Navigation */}
      <nav className='fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg'>
              S
            </div>
            <span className='text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
              SociDev
            </span>
          </div>

          <div className='hidden md:flex items-center gap-8'>
            <a href='#features' className='text-gray-300 hover:text-white transition-colors'>
              Features
            </a>
            <a href='#stats' className='text-gray-300 hover:text-white transition-colors'>
              Results
            </a>
            <a href='#pricing' className='text-gray-300 hover:text-white transition-colors'>
              Pricing
            </a>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              onClick={() => navigate("/login")}
              className='hidden sm:inline-flex px-4 py-2 text-white border border-gray-600 rounded-lg hover:border-gray-400 transition-colors bg-transparent'>
              Sign in
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className='px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-medium'>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className='pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='max-w-5xl mx-auto text-center'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/30 backdrop-blur'>
            <Sparkles className='w-4 h-4 text-blue-400' />
            <span className='text-sm font-semibold text-blue-300'>
              Join 50,000+ creators dominating social media
            </span>
          </div>

          {/* Main Headline */}
          <h1 className='text-6xl sm:text-7xl font-bold mb-6 leading-tight'>
            Social Media{" "}
            <span className='bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent'>
              on Autopilot
            </span>
          </h1>

          {/* Subheading */}
          <p className='text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed'>
            AI-powered automation that grows your followers, boosts engagement, and saves you 15+ hours
            per week. Stop wasting time. Start scaling.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
            <Button
              onClick={() => navigate("/register")}
              className='px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 text-lg'>
              Start Free Trial
              <ArrowRight className='w-5 h-5' />
            </Button>
            <Button
              className='px-8 py-4 border border-gray-600 hover:border-gray-400 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-lg bg-transparent hover:bg-white/5'>
              <Play className='w-5 h-5' />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className='flex flex-wrap justify-center gap-6 text-sm text-gray-400'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-5 h-5 text-green-400' />
              No credit card required
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-5 h-5 text-green-400' />
              14-day free trial
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='w-5 h-5 text-green-400' />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Hero Image/Stats Card */}
        <div className='mt-16 max-w-4xl mx-auto'>
          <div className='bg-gradient-to-b from-white/10 to-transparent rounded-2xl border border-white/20 p-8 backdrop-blur-xl'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
              {stats.map((stat, idx) => (
                <div key={idx} className='text-center'>
                  <div className='text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1'>
                    {stat.value}
                  </div>
                  <div className='text-sm text-gray-400 mb-2'>{stat.label}</div>
                  <div className='text-xs text-green-400 font-semibold'>{stat.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id='stats' className='py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-black via-blue-950/10 to-black'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl sm:text-5xl font-bold mb-4'>
              Proven Results From <span className='text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text'>Real Users</span>
            </h2>
            <p className='text-lg text-gray-400 max-w-2xl mx-auto'>
              See what our users have achieved in their first 90 days
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {[
              {
                metric: "+312%",
                label: "Average Follower Growth",
                description: "Users see organic growth average of 312% in first 90 days",
              },
              {
                metric: "+847%",
                label: "Engagement Increase",
                description: "Engagement rates up by average of 847% with smart automation",
              },
              {
                metric: "15 hrs",
                label: "Weekly Time Saved",
                description: "Automated workflows free up 15+ hours every single week",
              },
              {
                metric: "98%",
                label: "Satisfaction Rate",
                description: "98% of users report being satisfied or very satisfied",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className='bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10'>
                <div className='text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2'>
                  {item.metric}
                </div>
                <div className='text-white font-semibold mb-2'>{item.label}</div>
                <div className='text-gray-400 text-sm'>{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='py-20 px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl sm:text-5xl font-bold mb-4'>
              Powerful Features For
              <span className='block text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text'>
                Maximum Growth
              </span>
            </h2>
            <p className='text-lg text-gray-400 max-w-2xl mx-auto'>
              Everything you need to dominate social media, built with cutting-edge AI technology
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, idx) => (
              <div
                key={idx}
                className='group bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-8 hover:border-white/30 transition-all hover:shadow-xl hover:shadow-white/5 hover:bg-gradient-to-br hover:from-white/10 hover:to-white/0'>
                <div
                  className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className='text-lg font-semibold text-white mb-2'>{feature.title}</h3>
                <p className='text-gray-400'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-gradient-to-b from-black via-purple-950/10 to-black'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-2 gap-12 items-center'>
            <div>
              <h2 className='text-4xl sm:text-5xl font-bold mb-8 leading-tight'>
                Why{" "}
                <span className='text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text'>
                  Choose SociDev?
                </span>
              </h2>
              <div className='space-y-4'>
                {benefits.map((benefit, idx) => (
                  <div key={idx} className='flex items-center gap-3'>
                    <CheckCircle2 className='w-6 h-6 text-emerald-400 flex-shrink-0' />
                    <span className='text-gray-300 font-medium'>{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate("/register")}
                className='mt-10 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2'>
                Start Growing Now
                <ArrowRight className='w-4 h-4' />
              </Button>
            </div>

            <div className='bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl border border-white/10 p-8 backdrop-blur-xl'>
              <div className='space-y-6'>
                <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-400'>Profile Reach</span>
                    <span className='text-blue-400 font-bold'>+2,847</span>
                  </div>
                  <div className='w-full bg-gray-800 rounded-full h-2'>
                    <div className='bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full' style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-400'>Engagement Rate</span>
                    <span className='text-emerald-400 font-bold'>+8.3%</span>
                  </div>
                  <div className='w-full bg-gray-800 rounded-full h-2'>
                    <div className='bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full' style={{ width: "72%" }}></div>
                  </div>
                </div>
                <div className='bg-white/5 rounded-lg p-4 border border-white/10'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-gray-400'>Follower Growth</span>
                    <span className='text-purple-400 font-bold'>+312%</span>
                  </div>
                  <div className='w-full bg-gray-800 rounded-full h-2'>
                    <div className='bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full' style={{ width: "95%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl sm:text-5xl font-bold mb-4'>
              Loved By
              <span className='block text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text'>
                Content Creators
              </span>
            </h2>
          </div>

          <div className='grid md:grid-cols-3 gap-6'>
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className='bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-8 hover:border-white/30 transition-all'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg'>
                    {testimonial.image}
                  </div>
                  <div>
                    <div className='font-semibold text-white'>{testimonial.name}</div>
                    <div className='text-sm text-gray-400'>{testimonial.title}</div>
                  </div>
                </div>
                <div className='flex gap-1 mb-3'>
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i} className='text-yellow-400'>
                        ★
                      </span>
                    ))}
                </div>
                <p className='text-gray-300 italic'>"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl'></div>

          <div className='text-center relative z-10'>
            <h2 className='text-4xl sm:text-5xl font-bold text-white mb-4'>
              Ready to Dominate Social Media?
            </h2>
            <p className='text-lg text-blue-100 mb-8 max-w-2xl mx-auto'>
              Join 50,000+ creators who are already using SociDev to automate their social media and
              grow faster than ever.
            </p>
            <Button
              onClick={() => navigate("/register")}
              className='px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-lg'>
              Get Started Free Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 relative z-10'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-4 gap-8 mb-8'>
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold'>
                  S
                </div>
                <span className='font-bold text-white'>SociDev</span>
              </div>
              <p className='text-sm text-gray-400'>
                AI-powered social media automation for creators and businesses
              </p>
            </div>

            {[
              { title: "Product", links: ["Features", "Pricing", "Security"] },
              { title: "Company", links: ["About", "Blog", "Contact"] },
              { title: "Legal", links: ["Terms", "Privacy", "Cookies"] },
            ].map((section, idx) => (
              <div key={idx}>
                <h4 className='font-semibold text-white mb-4'>{section.title}</h4>
                <ul className='space-y-2'>
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <a href='#' className='text-sm text-gray-400 hover:text-gray-200 transition-colors'>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className='border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400'>
            <p>© 2024 SociDev. All rights reserved.</p>
            <div className='flex gap-4 mt-4 sm:mt-0'>
              <a href='#' className='hover:text-gray-200 transition-colors'>
                Twitter
              </a>
              <a href='#' className='hover:text-gray-200 transition-colors'>
                LinkedIn
              </a>
              <a href='#' className='hover:text-gray-200 transition-colors'>
                Instagram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
