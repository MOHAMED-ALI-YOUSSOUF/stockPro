import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Loader2, Eye, EyeOff } from 'lucide-react';

interface FormMessage {
  type: 'success' | 'error' | 'warning';
  text: string;
}

const Auth = () => {
  const { signIn, signUp, inactiveMessage, clearInactiveMessage } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);

  // Afficher le message de compte inactif après la redirection
  useEffect(() => {
    if (inactiveMessage) {
      setFormMessage({ type: 'error', text: inactiveMessage });
      clearInactiveMessage();
    }
  }, [inactiveMessage, clearInactiveMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage(null);

    if (isSignUp) {
      if (!form.fullName.trim()) {
        setFormMessage({ type: 'error', text: 'Veuillez entrer votre nom' });
        setLoading(false);
        return;
      }

      const { error } = await signUp(form.email, form.password, form.fullName);

      if (error) {
        setFormMessage({ type: 'error', text: error.text });
      } else {
        setFormMessage({
          type: 'warning',
          text: 'Votre compte n\'est pas encore activé. Attendez la confirmation.',
        });
      }
    } else {
      const { error } = await signIn(form.email, form.password);

      if (error) {
        setFormMessage({ type: 'error', text: error.text });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">StockPro</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Créer un nouveau compte' : 'Connectez-vous à votre compte'}
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          {/* Message précis */}
          {formMessage && (
            <div
              className={`mb-4 text-center font-semibold ${formMessage.type === 'error'
                ? 'text-red-600'
                : formMessage.type === 'warning'
                  ? 'text-yellow-600'
                  : 'text-green-600'
                }`}
            >
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="input-modern"
                  placeholder="Votre nom"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-modern"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-modern pr-12"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-primary-gradient text-lg"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? 'Créer le compte' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormMessage(null);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp ? 'Vous avez déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
