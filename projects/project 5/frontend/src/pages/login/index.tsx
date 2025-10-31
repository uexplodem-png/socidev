import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/FormError";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { formatErrorMessage } from "../../utils/errorFormatter";
import { authApi } from "../../lib/api/auth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Github,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Send,
} from "lucide-react";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowResendButton(false);
    setResendSuccess(false);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const formattedError = formatErrorMessage(err);
      setError(formattedError);
      
      // Check if error is about email verification
      if (formattedError.toLowerCase().includes('verify') && 
          formattedError.toLowerCase().includes('email')) {
        setShowResendButton(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setResendLoading(true);
    setResendSuccess(false);

    try {
      await authApi.resendVerificationEmail(email);
      setResendSuccess(true);
      setError("");
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      const formattedError = formatErrorMessage(err);
      setError(formattedError);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-black text-white overflow-hidden flex'>
      {/* Animated background */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 right-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl'></div>
      </div>

      {/* Left Side - Brand & Features */}
      <div className='hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10'>
        {/* Logo */}
        <Link to='/' className='flex items-center gap-2 mb-16'>
          <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg'>
            S
          </div>
          <span className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
            SociDev
          </span>
        </Link>

        {/* Feature List */}
        <div className='space-y-8 flex-1'>
          <div>
            <h2 className='text-4xl font-bold mb-4'>
              <span className='bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
                Ready to scale?
              </span>
            </h2>
            <p className='text-gray-400 text-lg'>
              Access your SociDev dashboard to manage all your social media automation in one place
            </p>
          </div>

          <div className='space-y-4'>
            {[
              { icon: <Sparkles className='w-5 h-5' />, text: 'AI-powered automation' },
              { icon: <CheckCircle2 className='w-5 h-5' />, text: 'Real-time analytics' },
              { icon: <CheckCircle2 className='w-5 h-5' />, text: 'Multi-platform support' },
            ].map((feature, idx) => (
              <div key={idx} className='flex items-center gap-4'>
                <div className='text-blue-400'>{feature.icon}</div>
                <span className='text-gray-300'>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='text-gray-500 text-sm'>
          © 2024 SociDev. Automate. Scale. Dominate.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-8 relative z-10'>
        <div className='w-full max-w-sm'>
          {/* Mobile Logo */}
          <Link to='/' className='lg:hidden flex items-center gap-2 mb-8'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold'>
              S
            </div>
            <span className='text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
              SociDev
            </span>
          </Link>

          {/* Heading */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>Welcome back</h1>
            <p className='text-gray-400'>
              Don't have an account?{" "}
              <Link to='/register' className='text-blue-400 hover:text-blue-300 font-semibold transition-colors'>
                Sign up
              </Link>
            </p>
          </div>

          {/* Social Buttons */}
          <div className='grid grid-cols-2 gap-4 mb-6'>
            <button className='border border-gray-600 hover:border-gray-400 text-white rounded-lg py-3 transition-all flex items-center justify-center gap-2 hover:bg-white/5'>
              <Mail className='w-5 h-5' />
              <span className='hidden sm:inline'>Google</span>
            </button>
            <button className='border border-gray-600 hover:border-gray-400 text-white rounded-lg py-3 transition-all flex items-center justify-center gap-2 hover:bg-white/5'>
              <Github className='w-5 h-5' />
              <span className='hidden sm:inline'>GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-700'></div>
            </div>
            <div className='relative flex justify-center'>
              <span className='px-3 bg-black text-sm text-gray-400'>Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <FormError
                error={error}
                onDismiss={() => {
                  setError("");
                  setShowResendButton(false);
                }}
              />
            )}
            
            {showResendButton && (
              <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                <p className='text-sm text-blue-300 mb-3'>
                  Need a new verification link?
                </p>
                <button
                  type='button'
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className='w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2'>
                  {resendLoading ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className='w-4 h-4' />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {resendSuccess && (
              <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-green-400 flex-shrink-0 mt-0.5' />
                  <div>
                    <p className='text-sm text-green-300 font-medium mb-1'>
                      Verification email sent!
                    </p>
                    <p className='text-xs text-green-400/80'>
                      Please check your inbox and click the verification link.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Email
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none' />
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500'
                  placeholder='your@email.com'
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none' />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full pl-10 pr-12 py-3 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500'
                  placeholder='••••••••'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors'>
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className='flex items-center justify-between pt-2'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className='w-4 h-4 rounded bg-white/10 border-gray-600 text-blue-500 cursor-pointer'
                />
                <span className='text-sm text-gray-400'>Remember me</span>
              </label>
              <Link to='/forgot-password' className='text-sm text-blue-400 hover:text-blue-300 transition-colors'>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-blue-400 disabled:to-cyan-400 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl mt-6 flex items-center justify-center gap-2'>
              {isLoading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{t("signIn")}</span>
                  <ArrowRight className='w-4 h-4' />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className='text-center text-xs text-gray-500 mt-6 leading-relaxed'>
            By signing in, you agree to our{" "}
            <Link to='/terms' className='text-blue-400 hover:text-blue-300'>
              Terms
            </Link>
            {" "}and{" "}
            <Link to='/privacy' className='text-blue-400 hover:text-blue-300'>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
