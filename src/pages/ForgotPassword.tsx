import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import authService from "@/services/authService";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; otp?: string; newPassword?: string; confirmPassword?: string }>({});

  const { toast } = useToast();
  const navigate = useNavigate();

  const validateStep1 = () => {
    const newErrors: { email?: string } = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Invalid email format";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { otp?: string; newPassword?: string; confirmPassword?: string } = {};
    if (!otp) {
      newErrors.otp = "Verification code is required";
    } else if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      newErrors.otp = "Verification code must be exactly 6 digits";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsLoading(true);
    setErrors({});
    try {
      await authService.forgotPassword(email);
      toast({
        title: "OTP Sent",
        description: "A password reset code has been sent to your email.",
      });
      setErrors({});
      setStep(2);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to send OTP. Please check your email.";
      setErrors(prev => ({ ...prev, form: message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    setErrors({});
    try {
      await authService.resetPassword({
        email,
        otp,
        newPassword,
      });
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
      navigate("/");
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to reset password. Please check your OTP.";
      setErrors(prev => ({ ...prev, form: message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-40 h-30 mb-4">
            <img src={logo} alt="SecurePro Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">RAM Investigative Group Inc.</h1>
          <p className="text-muted-foreground mt-1">Professional Investigation Services</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-semibold text-foreground">
              {step === 1 ? "Forgot Password" : "Reset Password"}
            </h2>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
              {errors.form && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  {errors.form}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a 6-digit verification code to reset your password.
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors(prev => ({ ...prev, email: undefined, form: undefined }));
                    }}
                    className={`w-full pl-12 pr-4 py-3.5 bg-secondary rounded-xl border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.email ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-[11px] font-semibold mt-1.5 ml-1 animate-fade-in">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12"
              >
                {isLoading ? "Sending Code..." : "Send Reset Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              {errors.form && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  {errors.form}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>.
              </p>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Verification Code (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setErrors(prev => ({ ...prev, otp: undefined, form: undefined }));
                    }}
                    className={`w-full pl-12 pr-4 py-3.5 bg-secondary rounded-xl border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all text-center tracking-widest font-mono text-lg ${
                      errors.otp ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                    }`}
                    placeholder="123456"
                  />
                </div>
                {errors.otp && (
                  <p className="text-destructive text-[11px] font-semibold mt-1.5 ml-1 animate-fade-in">{errors.otp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors(prev => ({ ...prev, newPassword: undefined, form: undefined }));
                    }}
                    className={`w-full pl-12 pr-12 py-3.5 bg-secondary rounded-xl border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.newPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-destructive text-[11px] font-semibold mt-1.5 ml-1 animate-fade-in">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`w-full pl-12 pr-12 py-3.5 bg-secondary rounded-xl border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      errors.confirmPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                    }`}
                    placeholder="Confirm new password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-[11px] font-semibold mt-1.5 ml-1 animate-fade-in">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12"
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
