import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/FormError";
import { PasswordStrengthIndicator } from "../../components/PasswordStrengthIndicator";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../lib/api/auth";
import { formatErrorMessage } from "../../utils/errorFormatter";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Github,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        username: formData.email.split("@")[0], // Use email prefix as default username
      });

      // Store the token in localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      navigate("/dashboard");
    } catch (err) {
      const formattedError = formatErrorMessage(err);
      setError(formattedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-black text-white overflow-hidden'>
      {/* Animated background */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-0 right-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl'></div>
      </div>

      {/* Main Container */}
      <div className='relative z-10 flex min-h-screen'>
        {/* Left Side - Benefits (Desktop Only) */}
        <div className='hidden xl:flex xl:w-1/2 flex-col justify-between p-12'>
          {/* Logo */}
          <Link to='/' className='flex items-center gap-2 mb-16'>
            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg'>
              S
            </div>
            <span className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
              SociDev
            </span>
          </Link>

          {/* Benefits List */}
          <div className='space-y-8 flex-1'>
            <div>
              <h2 className='text-4xl font-bold mb-4'>
                <span className='bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent'>
                  Start growing today
                </span>
              </h2>
              <p className='text-gray-400 text-lg'>
                Join thousands of creators and brands already automating their social media success
              </p>
            </div>

            <div className='space-y-4'>
              {[
                { icon: <Zap className='w-5 h-5' />, text: 'Free for first 14 days' },
                { icon: <CheckCircle2 className='w-5 h-5' />, text: 'No credit card required' },
                { icon: <CheckCircle2 className='w-5 h-5' />, text: 'Full feature access' },
                { icon: <CheckCircle2 className='w-5 h-5' />, text: 'Premium support' },
              ].map((benefit, idx) => (
                <div key={idx} className='flex items-center gap-4'>
                  <div className='text-emerald-400'>{benefit.icon}</div>
                  <span className='text-gray-300'>{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className='grid grid-cols-2 gap-4 pt-4'>
              <div className='bg-white/5 backdrop-blur-md border border-gray-700/30 rounded-lg p-4'>
                <div className='text-2xl font-bold text-emerald-400'>50K+</div>
                <div className='text-xs text-gray-400 mt-1'>Active creators</div>
              </div>
              <div className='bg-white/5 backdrop-blur-md border border-gray-700/30 rounded-lg p-4'>
                <div className='text-2xl font-bold text-cyan-400'>2.3M</div>
                <div className='text-xs text-gray-400 mt-1'>Followers managed</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='text-gray-500 text-sm'>
            © 2024 SociDev. Automate. Scale. Dominate.
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className='w-full xl:w-1/2 flex flex-col justify-center p-6 sm:p-8 overflow-y-auto max-h-screen'>
          <div className='w-full max-w-md mx-auto'>
            {/* Mobile Logo */}
            <Link to='/' className='xl:hidden flex items-center gap-2 mb-6'>
              <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold'>
                S
              </div>
              <span className='text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent'>
                SociDev
              </span>
            </Link>

            {/* Heading */}
            <div className='mb-6'>
              <h1 className='text-3xl font-bold mb-2'>Create your account</h1>
              <p className='text-gray-400 text-sm'>
                Already a member?{" "}
                <Link to='/login' className='text-blue-400 hover:text-blue-300 font-semibold transition-colors'>
                  Sign in
                </Link>
              </p>
            </div>

            {/* Social Buttons */}
            <div className='grid grid-cols-2 gap-3 mb-4'>
              <button className='border border-gray-600 hover:border-gray-400 text-white rounded-lg py-2.5 transition-all flex items-center justify-center gap-2 hover:bg-white/5 text-sm'>
                <Mail className='w-4 h-4' />
                <span className='hidden sm:inline text-xs'>Google</span>
              </button>
              <button className='border border-gray-600 hover:border-gray-400 text-white rounded-lg py-2.5 transition-all flex items-center justify-center gap-2 hover:bg-white/5 text-sm'>
                <Github className='w-4 h-4' />
                <span className='hidden sm:inline text-xs'>GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className='relative my-4'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-700'></div>
              </div>
              <div className='relative flex justify-center'>
                <span className='px-2 bg-black text-xs text-gray-400'>Or register with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className='space-y-3'>
              {error && (
                <FormError
                  error={error}
                  onDismiss={() => setError("")}
                />
              )}

              {/* Name Fields */}
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block text-xs font-medium text-gray-300 mb-1.5'>
                    First name
                  </label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                    <input
                      type='text'
                      name='firstName'
                      value={formData.firstName}
                      onChange={handleChange}
                      className='w-full pl-9 pr-3 py-2 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500 text-sm'
                      placeholder='John'
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-300 mb-1.5'>
                    Last name
                  </label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                    <input
                      type='text'
                      name='lastName'
                      value={formData.lastName}
                      onChange={handleChange}
                      className='w-full pl-9 pr-3 py-2 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500 text-sm'
                      placeholder='Doe'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className='block text-xs font-medium text-gray-300 mb-1.5'>
                  Email
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                  <input
                    type='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    className='w-full pl-9 pr-3 py-2 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500 text-sm'
                    placeholder='your@email.com'
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className='block text-xs font-medium text-gray-300 mb-1.5'>
                  Password
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                  <input
                    type={showPassword ? "text" : "password"}
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    className='w-full pl-9 pr-10 py-2 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500 text-sm'
                    placeholder='••••••••'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors'>
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className='mt-2'>
                    <PasswordStrengthIndicator
                      password={formData.password}
                      showRequirements={true}
                    />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className='block text-xs font-medium text-gray-300 mb-1.5'>
                  Confirm password
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name='confirmPassword'
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className='w-full pl-9 pr-10 py-2 rounded-lg border border-gray-700 bg-white/5 hover:bg-white/10 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-500 text-sm'
                    placeholder='••••••••'
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors'>
                    {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className='flex items-start gap-2 pt-1'>
                <input
                  type='checkbox'
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className='w-4 h-4 rounded bg-white/10 border-gray-600 text-blue-500 cursor-pointer mt-0.5 flex-shrink-0'
                />
                <p className='text-xs text-gray-400 leading-relaxed'>
                  I agree to SociDev's{" "}
                  <Link to='/terms' className='text-blue-400 hover:text-blue-300'>
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link to='/privacy' className='text-blue-400 hover:text-blue-300'>
                    Privacy Policy
                  </Link>
                </p>
              </div>

              {/* Submit */}
              <Button
                type='submit'
                disabled={isLoading || !agreeTerms}
                className='w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:from-emerald-400 disabled:to-cyan-400 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl mt-4 flex items-center justify-center gap-2 text-sm'>
                {isLoading ? (
                  <>
                    <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>{t("signUp")}</span>
                    <ArrowRight className='w-3 h-3' />
                  </>
                )}
              </Button>
            </form>

            {/* Footer text */}
            <p className='text-center text-xs text-gray-500 mt-4 leading-relaxed'>
              We'll never share your email with anyone else.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
