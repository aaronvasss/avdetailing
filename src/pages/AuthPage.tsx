import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { authFormSchema } from "@/lib/validations";
import { checkRateLimit, clearRateLimit } from "@/lib/security";
import { SEOHead } from "@/components/seo/SEOHead";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is a staff-only worker (not admin)
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const roleSet = new Set((roles || []).map((r) => r.role));
        if (roleSet.has("staff") && !roleSet.has("admin")) {
          navigate("/worker");
        } else {
          navigate("/account");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side rate limiting (5 attempts per 15 minutes, 30 min block)
    const rateCheck = checkRateLimit('auth-form', 5, 900000, 1800000);
    if (!rateCheck.allowed) {
      const waitTime = rateCheck.blockedUntil 
        ? Math.ceil((rateCheck.blockedUntil.getTime() - Date.now()) / 60000)
        : 15;
      toast.error(`Too many login attempts. Please wait ${waitTime} minute${waitTime !== 1 ? 's' : ''}.`);
      return;
    }
    
    // Validate with Zod
    const dataToValidate = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;
    
    const result = authFormSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });
        if (error) throw error;
        clearRateLimit('auth-form');
        toast.success("Welcome back!");
        
        // Route based on role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);
        const roleSet = new Set((roles || []).map((r) => r.role));
        if (roleSet.has("staff") && !roleSet.has("admin")) {
          navigate("/worker");
        } else {
          navigate("/account");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: formData.fullName.trim(),
              phone: formData.phone.trim(),
            },
          },
        });
        if (error) throw error;
        clearRateLimit('auth-form');
        toast.success("Account created! You can now log in.");
        navigate("/account");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEOHead title="Sign In" description="Private page." path="/auth" noIndex />
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Sign in to manage your bookings and memberships"
                : "Join AV Detailing for exclusive member benefits"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(225) 555-1234"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  maxLength={255}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Benefits */}
          {!isLogin && (
            <div className="mt-8 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">Member Benefits</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Save your vehicles and addresses</li>
                <li>• View booking history</li>
                <li>• Manage memberships</li>
                <li>• Priority scheduling</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
