import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { validatePassword, validatePhoneNumber, countries } from "../../utils/validation";
import { authApi } from "../../lib/api/auth";
import {
    AlertCircle,
    Mail,
    User,
    Phone,
    Lock,
    Eye,
    EyeOff,
    Github,
    Twitter,
    Facebook,
    AtSign,
    ChevronDown,
} from "lucide-react";

interface PasswordStrength {
    score: number;
    feedback: string;
    color: string;
}

export const RegisterPage = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [selectedCountry, setSelectedCountry] = useState<typeof countries[0] | null>(null);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        feedback: "",
        color: "bg-gray-200",
    });

    useEffect(() => {
        if (formData.password) {
            let score = 0;
            let feedback = "";
            let color = "bg-gray-200";

            if (formData.password.length >= 8) score++;
            if (/[A-Z]/.test(formData.password)) score++;
            if (/[a-z]/.test(formData.password)) score++;
            if (/[0-9]/.test(formData.password)) score++;
            if (/[^A-Za-z0-9]/.test(formData.password)) score++;

            switch (score) {
                case 0:
                case 1:
                    feedback = t("passwordWeak");
                    color = "bg-red-500";
                    break;
                case 2:
                case 3:
                    feedback = t("passwordMedium");
                    color = "bg-yellow-500";
                    break;
                case 4:
                    feedback = t("passwordStrong");
                    color = "bg-green-500";
                    break;
                case 5:
                    feedback = t("passwordVeryStrong");
                    color = "bg-green-600";
                    break;
            }

            setPasswordStrength({ score, feedback, color });
        }
    }, [formData.password, t]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string[] } = {};

        // Required field validation
        Object.keys(formData).forEach((key) => {
            if (!formData[key as keyof typeof formData].trim()) {
                newErrors[key] = [t("requiredField")];
            }
        });

        // Password validation
        if (formData.password) {
            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                newErrors.password = passwordValidation.errors.map((error) => t(error));
            }
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = [t("passwordsDoNotMatch")];
        }

        // Country selection validation
        if (!selectedCountry) {
            newErrors.country = [t("countryRequired")];
        }

        // Phone number validation
        if (formData.phone && selectedCountry) {
            const phoneValidation = validatePhoneNumber(formData.phone, selectedCountry);
            if (!phoneValidation.isValid) {
                newErrors.phone = [phoneValidation.error || t("invalidPhoneNumber")];
            }
        }

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = [t("invalidEmail")];
        }

        // Username validation
        if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
            newErrors.username = [t("invalidUsername")];
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptTerms) {
            setErrors((prev) => ({ ...prev, terms: [t("acceptTermsRequired")] }));
            return;
        }

        if (validateForm()) {
            setIsLoading(true);
            try {
                // Format phone number before sending to backend
                let formattedPhone = formData.phone;
                if (selectedCountry) {
                    const phoneValidation = validatePhoneNumber(formData.phone, selectedCountry);
                    if (phoneValidation.isValid) {
                        formattedPhone = phoneValidation.formattedPhone;
                    }
                }

                const response = await authApi.register({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    username: formData.username,
                    phone: formattedPhone,
                });

                const { token } = response.data;

                localStorage.setItem("token", token);
                navigate("/dashboard");
            } catch (error) {
                setErrors({ submit: [t("registrationFailed")] });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleBlur = (field: keyof typeof formData) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        validateForm();
    };

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (touched[field]) {
            validateForm();
        }
    };

    const handleCountrySelect = (country: typeof countries[0]) => {
        setSelectedCountry(country);
        setShowCountryDropdown(false);
        // Clear any previous phone errors when country changes
        if (errors.phone) {
            const newErrors = { ...errors };
            delete newErrors.phone;
            setErrors(newErrors);
        }
        // Re-validate if phone field was already touched
        if (touched.phone) {
            validateForm();
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center p-4'>
            <div className='w-full max-w-2xl'>
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold text-white mb-2'>
                        {t("createYourAccount")}
                    </h1>
                    <p className='text-white/80'>{t("joinOurCommunity")}</p>
                </div>

                <Card className='bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl'>
                    {/* Social Registration Buttons */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6'>
                        {[
                            {
                                icon: Github,
                                name: "GitHub",
                                color: "bg-gray-900 hover:bg-gray-800",
                            },
                            {
                                icon: Twitter,
                                name: "Twitter",
                                color: "bg-blue-400 hover:bg-blue-500",
                            },
                            {
                                icon: Facebook,
                                name: "Facebook",
                                color: "bg-blue-600 hover:bg-blue-700",
                            },
                        ].map(({ icon: Icon, name, color }) => (
                            <button
                                key={name}
                                disabled
                                className={`relative px-4 py-3 ${color} text-white rounded-xl opacity-75 cursor-not-allowed flex items-center justify-center font-medium transition-all`}>
                                <Icon className='w-5 h-5 mr-2' />
                                {name}
                                <span className='absolute -top-2 -right-2 text-xs bg-white/20 px-2 py-1 rounded-full'>
                                    {t("comingSoon")}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className='relative my-6'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-gray-300'></div>
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='px-4 bg-white text-gray-500'>
                                {t("orRegisterWith")}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className='space-y-6'>
                        {errors.submit && (
                            <div className='bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2'>
                                <AlertCircle className='w-5 h-5 flex-shrink-0' />
                                <p className='text-sm'>{errors.submit[0]}</p>
                            </div>
                        )}

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div className='space-y-2'>
                                <label className='block text-sm font-medium text-gray-700'>
                                    {t("firstName")} *
                                </label>
                                <div className='relative'>
                                    <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                    <input
                                        type='text'
                                        value={formData.firstName}
                                        onChange={(e) => handleChange("firstName", e.target.value)}
                                        onBlur={() => handleBlur("firstName")}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.firstName ? "border-red-300" : "border-gray-200"
                                            } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                        placeholder={t("enterFirstName")}
                                        required
                                    />
                                </div>
                                {touched.firstName && errors.firstName && (
                                    <div className='text-red-500 text-sm flex items-center gap-1'>
                                        <AlertCircle className='w-4 h-4' />
                                        {errors.firstName[0]}
                                    </div>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <label className='block text-sm font-medium text-gray-700'>
                                    {t("lastName")} *
                                </label>
                                <div className='relative'>
                                    <User className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                    <input
                                        type='text'
                                        value={formData.lastName}
                                        onChange={(e) => handleChange("lastName", e.target.value)}
                                        onBlur={() => handleBlur("lastName")}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.lastName ? "border-red-300" : "border-gray-200"
                                            } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                        placeholder={t("enterLastName")}
                                        required
                                    />
                                </div>
                                {touched.lastName && errors.lastName && (
                                    <div className='text-red-500 text-sm flex items-center gap-1'>
                                        <AlertCircle className='w-4 h-4' />
                                        {errors.lastName[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                {t("username")} *
                            </label>
                            <div className='relative'>
                                <AtSign className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                <input
                                    type='text'
                                    value={formData.username}
                                    onChange={(e) => handleChange("username", e.target.value)}
                                    onBlur={() => handleBlur("username")}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.username ? "border-red-300" : "border-gray-200"
                                        } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                    placeholder={t("enterUsername")}
                                    required
                                />
                            </div>
                            {touched.username && errors.username && (
                                <div className='text-red-500 text-sm flex items-center gap-1'>
                                    <AlertCircle className='w-4 h-4' />
                                    {errors.username[0]}
                                </div>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                {t("email")} *
                            </label>
                            <div className='relative'>
                                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                <input
                                    type='email'
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    onBlur={() => handleBlur("email")}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.email ? "border-red-300" : "border-gray-200"
                                        } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                    placeholder={t("enterEmail")}
                                    required
                                />
                            </div>
                            {touched.email && errors.email && (
                                <div className='text-red-500 text-sm flex items-center gap-1'>
                                    <AlertCircle className='w-4 h-4' />
                                    {errors.email[0]}
                                </div>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                {t("country")} *
                            </label>
                            <div className='relative'>
                                <div
                                    className={`w-full py-3 rounded-xl border ${errors.country ? "border-red-300" : "border-gray-200"
                                        } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 cursor-pointer bg-white`}
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                >
                                    <div className='flex items-center justify-between px-4'>
                                        <div className='flex items-center'>
                                            {selectedCountry ? (
                                                <>
                                                    <span className='font-medium'>{selectedCountry.countryCode}</span>
                                                    <span className='ml-2 text-gray-600'>{selectedCountry.name}</span>
                                                </>
                                            ) : (
                                                <span className='text-gray-400'>{t("selectCountry")}</span>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {showCountryDropdown && (
                                    <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto'>
                                        {countries.map((country) => (
                                            <div
                                                key={country.code}
                                                className='px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center'
                                                onClick={() => handleCountrySelect(country)}
                                            >
                                                <span className='font-medium mr-2'>{country.countryCode}</span>
                                                <span className='text-gray-600'>{country.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.country && (
                                <div className='text-red-500 text-sm flex items-center gap-1'>
                                    <AlertCircle className='w-4 h-4' />
                                    {errors.country[0]}
                                </div>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                {t("phoneNumber")} *
                            </label>
                            <div className='relative'>
                                <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                <input
                                    type='tel'
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    onBlur={() => handleBlur("phone")}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.phone ? "border-red-300" : "border-gray-200"
                                        } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                    placeholder={selectedCountry ? `${selectedCountry.countryCode} XXX XXX XXXX` : t("enterPhoneNumber")}
                                    required
                                />
                            </div>
                            {touched.phone && errors.phone && (
                                <div className='text-red-500 text-sm flex items-center gap-1'>
                                    <AlertCircle className='w-4 h-4' />
                                    {errors.phone[0]}
                                </div>
                            )}
                            {selectedCountry && (
                                <p className='text-sm text-gray-500 mt-1'>
                                    {t("phoneNumberFormatInfo", {
                                        countryCode: selectedCountry.countryCode,
                                        length: selectedCountry.phoneLength
                                    })}
                                </p>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                {t("password")} *
                            </label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    onBlur={() => handleBlur("password")}
                                    className={`w-full pl-10 pr-12 py-3 rounded-xl border ${errors.password ? "border-red-300" : "border-gray-200"
                                        } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                    placeholder={t("enterPassword")}
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                                    {showPassword ? (
                                        <EyeOff className='w-5 h-5' />
                                    ) : (
                                        <Eye className='w-5 h-5' />
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <div className='mt-2'>
                                    <div className='flex items-center justify-between mb-1'>
                                        <span className='text-sm text-gray-600'>{t("passwordStrength")}</span>
                                        <span className='text-sm font-medium' style={{ color: passwordStrength.color.replace('bg-', '') }}>
                                            {passwordStrength.feedback}
                                        </span>
                                    </div>
                                    <div className='w-full bg-gray-200 rounded-full h-2'>
                                        <div
                                            className={`h-2 rounded-full ${passwordStrength.color}`}
                                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className='mt-1 text-xs text-gray-500'>
                                        {t("passwordRequirements")}
                                    </div>
                                </div>
                            )}
                            {touched.password && errors.password && (
                                <div className='text-red-500 text-sm flex items-center gap-1'>
                                    <AlertCircle className='w-4 h-4' />
                                    {errors.password[0]}
                                </div>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <label className='block text-sm font-medium text-gray-700'>
                                {t("confirmPassword")} *
                            </label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                    onBlur={() => handleBlur("confirmPassword")}
                                    className={`w-full pl-10 pr-12 py-3 rounded-xl border ${errors.confirmPassword ? "border-red-300" : "border-gray-200"
                                        } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200`}
                                    placeholder={t("confirmPassword")}
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                                    {showConfirmPassword ? (
                                        <EyeOff className='w-5 h-5' />
                                    ) : (
                                        <Eye className='w-5 h-5' />
                                    )}
                                </button>
                            </div>
                            {touched.confirmPassword && errors.confirmPassword && (
                                <div className='text-red-500 text-sm flex items-center gap-1'>
                                    <AlertCircle className='w-4 h-4' />
                                    {errors.confirmPassword[0]}
                                </div>
                            )}
                        </div>

                        <div className='flex items-center'>
                            <input
                                type='checkbox'
                                id='terms'
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className='w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500'
                            />
                            <label htmlFor='terms' className='ml-2 block text-sm text-gray-700'>
                                {t("acceptTerms")}
                                <a href='#' className='text-purple-600 hover:text-purple-800'>
                                    {" "}{t("termsOfService")}
                                </a>
                                {" "}{t("and")}
                                <a href='#' className='text-purple-600 hover:text-purple-800'>
                                    {" "}{t("privacyPolicy")}
                                </a>
                            </label>
                        </div>
                        {errors.terms && (
                            <div className='text-red-500 text-sm flex items-center gap-1'>
                                <AlertCircle className='w-4 h-4' />
                                {errors.terms[0]}
                            </div>
                        )}

                        <Button
                            type='submit'
                            disabled={isLoading}
                            className='w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200'>
                            {isLoading ? (
                                <div className='flex items-center justify-center'>
                                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                                    {t("creatingAccount")}
                                </div>
                            ) : (
                                t("createAccount")
                            )}
                        </Button>
                    </form>

                    <div className='mt-6 text-center'>
                        <p className='text-gray-600'>
                            {t("alreadyHaveAccount")}{" "}
                            <Link to='/login' className='text-purple-600 hover:text-purple-800 font-medium'>
                                {t("signIn")}
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};