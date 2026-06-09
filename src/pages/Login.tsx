import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import authService from "@/services/authService";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await authService.login(email, password);

      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("securepro_auth", "true");

      toast({
        title: "Login successful",
        description: response.message || `Welcome back, ${response.data.name}.`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Invalid email or password.";
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
          <div className="w-40 h-30  mb-4 ">
            <img src={logo} alt="SecurePro Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">RAM Investigative Group Inc.</h1>
          <p className="text-muted-foreground mt-1">Professional Investigation Services</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-6">Sign in to continue</h2>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {errors.form && (
              <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                {errors.form}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined, form: undefined }));
                  }}
                  className={`w-full pl-12 pr-12 py-3.5 bg-secondary rounded-xl border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    errors.password ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-[11px] font-semibold mt-1.5 ml-1 animate-fade-in">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* <div className="mt-6 py-3 bg-secondary rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Admin credentials are pre-filled. Click Sign In to continue.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
