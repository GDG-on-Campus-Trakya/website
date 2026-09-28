"use client";
import { useState } from "react";
import Image from "next/image";
import { auth, db, googleProvider } from "@/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer } from "@/components/ui/page";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const copy =
    locale === "en"
      ? {
          welcome: "Welcome Back!",
          createAccount: "Create Account",
          enterDetails: "Please enter your details",
          signUpPrompt: "Sign up to get started",
          fullName: "Full Name",
          fullNamePlaceholder: "Enter your full name",
          email: "Email Address",
          emailPlaceholder: "Enter your email address",
          password: "Password",
          passwordHint:
            "Must be 8-24 characters and include at least 1 lowercase letter and 1 number",
          rememberMe: "Remember me",
          forgotPassword: "Forgot password?",
          wait: "Please wait...",
          signIn: "Sign In",
          signUp: "Sign Up",
          or: "or",
          continueWithGoogle: "Continue with Google",
          noAccount: "Don't have an account? ",
          haveAccount: "Already have an account? ",
          termsPrefix: "By creating an account, you agree to the ",
          terms: "Terms of Use",
          privacy: "Privacy Policy",
          termsJoiner: " and ",
          showPassword: "Show password",
          hidePassword: "Hide password",
          errors: {
            verifyEmail:
              "Please verify your email address. Check your inbox first.",
            enterName: "Please enter your name",
            alreadyInUse: "This email address is already in use",
            invalidEmail: "Invalid email address",
            weakPassword:
              "Password must be at least 8 characters and include 1 lowercase letter and 1 number",
            userNotFound: "User not found",
            wrongPassword: "Incorrect password",
            invalidCredential: "Email or password is incorrect",
            tooManyRequests: "Too many attempts. Please try again later.",
            generic: "Something went wrong. Please try again.",
            popupBlocked:
              "Popup was blocked. Please allow popups in your browser.",
            googleFailed: "An error occurred while signing in with Google",
            enterEmail: "Please enter your email address",
            resetUnknown: "Password reset email could not be sent",
            emailNotRegistered: "This email address is not registered"
          },
          resetSent:
            "Password reset email sent. Please check your inbox.",
          verificationSent:
            "Registration successful. A verification email has been sent. Please verify your account before signing in."
        }
      : {
          welcome: "Hoş Geldiniz!",
          createAccount: "Hesap Oluştur",
          enterDetails: "Lütfen bilgilerinizi girin",
          signUpPrompt: "Başlamak için kayıt olun",
          fullName: "Ad Soyad",
          fullNamePlaceholder: "Adınızı ve soyadınızı girin",
          email: "Email Adresi",
          emailPlaceholder: "Email adresinizi girin",
          password: "Şifre",
          passwordHint:
            "8-24 karakter arası, en az 1 küçük harf ve 1 rakam içermelidir",
          rememberMe: "Beni hatırla",
          forgotPassword: "Şifremi Unuttum?",
          wait: "Lütfen bekleyin...",
          signIn: "Giriş Yap",
          signUp: "Kayıt Ol",
          or: "veya",
          continueWithGoogle: "Google ile Devam Et",
          noAccount: "Hesabınız yok mu? ",
          haveAccount: "Zaten hesabınız var mı? ",
          termsPrefix: "Hesap oluşturarak ",
          terms: "Kullanım Şartları",
          privacy: "Gizlilik Politikası",
          termsJoiner: " ve ",
          showPassword: "Şifreyi göster",
          hidePassword: "Şifreyi gizle",
          errors: {
            verifyEmail:
              "Lütfen email adresinizi doğrulayın. Email kutunuzu kontrol edin.",
            enterName: "Lütfen adınızı girin",
            alreadyInUse: "Bu email adresi zaten kullanımda",
            invalidEmail: "Geçersiz email adresi",
            weakPassword:
              "Şifre en az 8 karakter olmalı ve 1 küçük harf, 1 rakam içermelidir",
            userNotFound: "Kullanıcı bulunamadı",
            wrongPassword: "Hatalı şifre",
            invalidCredential: "Email veya şifre hatalı",
            tooManyRequests:
              "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin",
            generic: "Bir hata oluştu. Lütfen tekrar deneyin",
            popupBlocked:
              "Popup engellendi! Lütfen tarayıcınızda popup engellemesini kapatın.",
            googleFailed: "Google ile giriş yapılırken bir hata oluştu",
            enterEmail: "Lütfen email adresinizi girin",
            resetUnknown: "Şifre sıfırlama emaili gönderilemedi",
            emailNotRegistered: "Bu email adresi kayıtlı değil"
          },
          resetSent:
            "Şifre sıfırlama emaili gönderildi! Lütfen email kutunuzu kontrol edin.",
          verificationSent:
            "Kayıt başarılı! Email doğrulama linki gönderildi. Lütfen email kutunuzu kontrol edin ve ardından giriş yapın."
        };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;

      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);

        if (!result.user.emailVerified) {
          setError(copy.errors.verifyEmail);
          await auth.signOut();
          setLoading(false);
          return;
        }
      } else {
        if (!name.trim()) {
          setError(copy.errors.enterName);
          setLoading(false);
          return;
        }

        result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);

        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          name: name.trim(),
          email,
          createdAt: new Date().toISOString(),
          wantsToGetEmails: true,
          language: locale
        });

        await auth.signOut();
        setVerificationEmailSent(true);
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Authentication error:", error);
      }

      switch (error.code) {
        case "auth/email-already-in-use":
          setError(copy.errors.alreadyInUse);
          break;
        case "auth/invalid-email":
          setError(copy.errors.invalidEmail);
          break;
        case "auth/weak-password":
          setError(copy.errors.weakPassword);
          break;
        case "auth/user-not-found":
          setError(copy.errors.userNotFound);
          break;
        case "auth/wrong-password":
          setError(copy.errors.wrongPassword);
          break;
        case "auth/invalid-credential":
          setError(copy.errors.invalidCredential);
          break;
        case "auth/too-many-requests":
          setError(copy.errors.tooManyRequests);
          break;
        default:
          setError(copy.errors.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      googleProvider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, googleProvider);

      if (result?.user) {
        const { uid, email, displayName } = result.user;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email,
            createdAt: new Date().toISOString(),
            name: displayName || "New User",
            wantsToGetEmails: true,
            language: locale
          });
        }
      }

      router.push("/");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Google sign-in error:", error);
      }

      if (error.code === "auth/popup-blocked") {
        setError(copy.errors.popupBlocked);
      } else if (
        error.code !== "auth/popup-closed-by-user" &&
        error.code !== "auth/cancelled-popup-request"
      ) {
        setError(copy.errors.googleFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError(copy.errors.enterEmail);
      return;
    }

    try {
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Password reset error:", error);
      }

      switch (error.code) {
        case "auth/user-not-found":
          setError(copy.errors.emailNotRegistered);
          break;
        case "auth/invalid-email":
          setError(copy.errors.invalidEmail);
          break;
        default:
          setError(copy.errors.resetUnknown);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-md">
        <Link href="/" className="inline-block rounded-sm">
          <Image
            src="/logo.svg"
            alt="GDG Logo"
            width={56}
            height={56}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <h1 className="mt-8 font-display text-4xl font-extrabold md:text-5xl">
          {isLogin ? copy.welcome : copy.createAccount}
        </h1>
        <p className="mt-3 text-md text-ink-2">
          {isLogin ? copy.enterDetails : copy.signUpPrompt}
        </p>

        <form onSubmit={handleEmailAuth} className="mt-8 flex flex-col gap-2">
          {!isLogin && (
            <Field id="full-name" label={copy.fullName}>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={copy.fullNamePlaceholder}
                autoComplete="name"
                required={!isLogin}
              />
            </Field>
          )}

          <Field id="email" label={copy.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              autoComplete="email"
              required
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{copy.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12"
                placeholder="••••••••"
                aria-describedby="password-message"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={8}
                maxLength={24}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                aria-pressed={showPassword}
                className="absolute right-0 top-0"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <p id="password-message" className="min-h-[1lh] text-sm text-muted-foreground">
              {!isLogin && copy.passwordHint}
            </p>
          </div>

          {isLogin && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-h-11 items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember-me" className="cursor-pointer font-normal">
                  {copy.rememberMe}
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                onClick={handlePasswordReset}
                disabled={loading}
                className="min-h-11"
              >
                {copy.forgotPassword}
              </Button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded border border-error px-4 py-3 text-sm text-error"
            >
              {error}
            </div>
          )}

          {resetEmailSent && (
            <div
              role="status"
              className="rounded border border-success px-4 py-3 text-sm text-success"
            >
              {copy.resetSent}
            </div>
          )}

          {verificationEmailSent && (
            <div
              role="status"
              className="rounded border border-rule bg-paper-2 px-4 py-3 text-sm text-ink"
            >
              {copy.verificationSent}
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading ? (
              copy.wait
            ) : (
              <>
                {isLogin ? copy.signIn : copy.signUp}
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-rule" />
          {copy.or}
          <span className="h-px flex-1 bg-rule" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full"
        >
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {copy.continueWithGoogle}
        </Button>

        <p className="mt-6 flex flex-wrap items-baseline gap-x-1 text-sm text-ink-2">
          {isLogin ? copy.noAccount : copy.haveAccount}
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setResetEmailSent(false);
            }}
            className="min-h-11 font-semibold"
          >
            {isLogin ? copy.signUp : copy.signIn}
          </Button>
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          {copy.termsPrefix}
          <Link href="/terms" className="text-brand underline underline-offset-4">
            {copy.terms}
          </Link>
          {copy.termsJoiner}
          <Link href="/privacy" className="text-brand underline underline-offset-4">
            {copy.privacy}
          </Link>
          .
        </p>
      </div>
    </PageContainer>
  );
}
