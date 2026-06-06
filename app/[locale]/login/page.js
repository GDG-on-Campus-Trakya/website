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
import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";

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
          illustrationTitle: "Welcome to GDG On Campus Trakya",
          illustrationDescription:
            "The meeting point of technology and innovation. Join now for events, projects and much more!",
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
          illustrationTitle: "GDG On Campus Trakya'ya Hoş Geldiniz",
          illustrationDescription:
            "Teknoloji ve inovasyonun buluşma noktası. Etkinlikler, projeler ve daha fazlası için hemen üye olun!",
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
    <div className="min-h-screen flex bg-gradient-to-b from-[#1a1a2e] to-[#000000]">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-32">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <Link href="/">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/logo.svg"
                  alt="GDG Logo"
                  width={56}
                  height={56}
                  className="h-14 w-auto cursor-pointer"
                  priority
                />
              </motion.div>
            </Link>
          </div>

          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl lg:text-4xl font-bold text-white mb-2"
            >
              {isLogin ? copy.welcome : copy.createAccount}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400"
            >
              {isLogin ? copy.enterDetails : copy.signUpPrompt}
            </motion.p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {copy.fullName}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder={copy.fullNamePlaceholder}
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {copy.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
                placeholder={copy.emailPlaceholder}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {copy.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  maxLength={24}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-2">{copy.passwordHint}</p>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">{copy.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  disabled={loading}
                >
                  {copy.forgotPassword}
                </button>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {resetEmailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
              >
                {copy.resetSent}
              </motion.div>
            )}

            {verificationEmailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm"
              >
                {copy.verificationSent}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                copy.wait
              ) : (
                <>
                  {isLogin ? copy.signIn : copy.signUp}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-gray-400">
                {copy.or}
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-gray-800/50 border border-gray-700/50 text-white py-3 rounded-lg font-medium hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 backdrop-blur-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? copy.noAccount : copy.haveAccount}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setResetEmailSent(false);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                {isLogin ? copy.signUp : copy.signIn}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            {copy.termsPrefix}
            <Link href="/terms" className="text-blue-400 hover:underline">
              {copy.terms}
            </Link>
            {copy.termsJoiner}
            <Link href="/privacy" className="text-blue-400 hover:underline">
              {copy.privacy}
            </Link>
            .
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl"
          >
            <div className="mb-8 flex justify-center">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/logo.svg"
                  alt="GDG Illustration"
                  width={192}
                  height={192}
                  className="w-48 h-48 object-contain drop-shadow-2xl"
                  priority
                />
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-4xl font-bold text-white mb-4 text-center"
            >
              {copy.illustrationTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white/90 text-lg text-center leading-relaxed"
            >
              {copy.illustrationDescription}
            </motion.p>

            <div className="flex justify-center gap-2 mt-8">
              <div className="w-8 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm"
          />
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 right-10 w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm"
          />
        </div>
      </div>
    </div>
  );
}
