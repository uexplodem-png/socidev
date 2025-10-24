import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../lib/api/auth";
import {
    AlertCircle,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Github,
    Twitter,
    Facebook,
    ArrowRight,
    CheckCircle2,
    Zap,
    Shield,
    Globe,
} from "lucide-react";

export const LoginPage = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await authApi.login({ email, password });
            const { token } = response.data;
            localStorage.setItem("token", token);
            if (rememberMe) {
                localStorage.setItem("rememberEmail", email);
            }
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || t("loginFailed"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen bg-white flex'>
            {/* Left Side - Branding & Features */}
            <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex-col justify-between p-12 text-white relative overflow-hidden'>
                {/* Animated background elements */}
                <div className='absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl'></div>
                <div className='absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl'></div>

                <div className='relative z-10'>
                    <div className='inline-flex items-center gap-3 mb-16'>
                        <div className='w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                            <span className='font-bold text-2xl'>∞</span>
                        </div>
                        <span className='text-3xl font-bold'>Infini</span>
                    </div>
                </div>

                <div className='relative z-10 space-y-8'>
                    <div>
                        <h2 className='text-5xl font-bold mb-4 leading-tight'>
                            Grow Your Social Presence
                        </h2>
                        <p className='text-indigo-100 text-lg'>
                            Unlock powerful tools to boost your engagement across all social media platforms
                        </p>
                    </div>

                    <div className='space-y-4'>
                        {[
                            { icon: <Zap className='w-5 h-5' />, text: 'Lightning-fast automation' },
                            { icon: <Shield className='w-5 h-5' />, text: 'Enterprise-grade security' },
                            { icon: <Globe className='w-5 h-5' />, text: 'Multi-platform support' },
                        ].map((feature, idx) => (
                            <div key={idx} className='flex items-center gap-4'>
                                <div className='flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
                                    {feature.icon}
                                </div>
                                <span className='text-indigo-100 font-medium'>{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className='pt-8 border-t border-white/20'>
                        <div className='flex items-center gap-3 mb-3'>
                            <CheckCircle2 className='w-5 h-5 text-green-300' />
                            <span className='text-sm text-indigo-100'>Join 10,000+ creators</span>
                        </div>
                        <div className='flex items-center gap-3'>
                            <CheckCircle2 className='w-5 h-5 text-green-300' />
                            <span className='text-sm text-indigo-100'>4.9★ rating from users</span>
                        </div>
                    </div>
                </div>

                <div className='relative z-10 text-indigo-100 text-sm'>
                    © 2024 Infini. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-8'>
                <div className='w-full max-w-sm'>
                    {/* Mobile Logo */}
                    <div className='lg:hidden mb-8'>
                        <div className='inline-flex items-center gap-2'>
                            <div className='w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl'>
                                ∞
                            </div>
                            <span className='text-2xl font-bold text-gray-900'>Infini</span>
                        </div>
                    </div>

                    {/* Heading Section */}
                    <div className='mb-8'>
                        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                            Welcome back
                        </h1>
                        <p className='text-gray-600'>
                            Don't have an account?{" "}
                            <Link to='/register' className='text-indigo-600 hover:text-indigo-700 font-semibold transition-colors'>
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Social Login Options */}
                    <div className='grid grid-cols-3 gap-3 mb-6'>
                        {[
                            {
                                icon: Github,
                                label: "GitHub",
                                color: "hover:bg-gray-100",
                            },
                            {
                                icon: Twitter,
                                label: "Twitter",
                                color: "hover:bg-blue-50",
                            },
                            {
                                icon: Facebook,
                                label: "Facebook",
                                color: "hover:bg-blue-50",
                            },
                        ].map(({ icon: Icon, label, color }) => (
                            <button
                                key={label}
                                disabled
                                title={t("comingSoon")}
                                className={`px-3 py-3 border border-gray-300 text-gray-600 rounded-lg transition-all opacity-60 cursor-not-allowed relative group ${color}`}>
                                <Icon className='w-5 h-5 mx-auto' />
                                <span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
                                    Coming soon
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className='relative my-6'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-gray-200'></div>
                        </div>
                        <div className='relative flex justify-center'>
                            <span className='px-3 bg-white text-sm text-gray-500'>Or continue with email</span>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        {error && (
                            <div className='bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm'>
                                <AlertCircle className='w-5 h-5 flex-shrink-0' />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Email address
                            </label>
                            <div className='relative'>
                                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none' />
                                <input
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500'
                                    placeholder='your@email.com'
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Password
                            </label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none' />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className='w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500'
                                    placeholder='••••••••'
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'>
                                    {showPassword ? (
                                        <EyeOff className='w-5 h-5' />
                                    ) : (
                                        <Eye className='w-5 h-5' />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot Password */}
                        <div className='flex items-center justify-between pt-2'>
                            <label className='flex items-center gap-2 cursor-pointer group'>
                                <input
                                    type='checkbox'
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className='w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer'
                                />
                                <span className='text-sm text-gray-700 group-hover:text-gray-900 transition-colors'>Remember me</span>
                            </label>
                            <Link
                                to='/forgot-password'
                                className='text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors'>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Sign In Button */}
                        <Button
                            type='submit'
                            disabled={isLoading}
                            className='w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-400 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-xl mt-6 flex items-center justify-center gap-2'>
                            {isLoading ? (
                                <>
                                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight className='w-4 h-4' />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Footer Text */}
                    <p className='text-center text-xs text-gray-500 mt-6 leading-relaxed'>
                        By signing in, you agree to our{" "}
                        <Link to='/terms' className='text-indigo-600 hover:text-indigo-700'>
                            Terms of Service
                        </Link>
                        {" "}and{" "}
                        <Link to='/privacy' className='text-indigo-600 hover:text-indigo-700'>
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
