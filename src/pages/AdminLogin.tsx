import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, UserPlus } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Auto-assign admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Insert admin role via a separate call after signup
        setSuccess("রেজিস্ট্রেশন সফল! এখন লগইন করুন।");
        setIsRegister(false);
      }
      setLoading(false);
      return;
    }

    // Login flow
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("লগইন ব্যর্থ হয়েছে");
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      setError("আপনার অ্যাডমিন অ্যাক্সেস নেই। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।");
      setLoading(false);
      return;
    }

    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <motion.div
        className="bg-card rounded-2xl p-8 border border-border shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {isRegister ? <UserPlus className="w-6 h-6 text-primary" /> : <Lock className="w-6 h-6 text-primary" />}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          {isRegister ? "অ্যাডমিন রেজিস্ট্রেশন" : "অ্যাডমিন লগইন"}
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-6">
          {isRegister ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "অ্যাডমিন প্যানেলে প্রবেশ করতে লগইন করুন"}
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-primary/10 text-primary text-sm p-3 rounded-xl mb-4 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">ইমেইল</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? (isRegister ? "রেজিস্ট্রেশন হচ্ছে..." : "লগইন হচ্ছে...")
              : (isRegister ? "রেজিস্টার করুন" : "লগইন করুন")}
          </button>
        </form>

        <button
          onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
        >
          {isRegister ? "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন" : "নতুন অ্যাকাউন্ট তৈরি করুন"}
        </button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
