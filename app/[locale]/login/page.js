"use client";
import { forwardRef, useEffect, useState } from "react";
import { auth, db, googleProvider } from "@/firebase";
import { popupResolver, preparePopupSignIn } from "@/lib/firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
import { safeRedirectPath } from "@/utils/redirect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/ui/page";

const COPY = {
  tr: {
    intro: {
      login: {
        title: "Hesabına giriş yap",
        lede: "Etkinlik kayıtların, QR biletlerin ve canlı oyunlar bu hesapta."
      },
      signup: {
        title: "Topluluğa katıl",
        lede: "Hesabınla etkinliklere kayıt olur, canlı quizlere katılırsın. Google hesabınla tek adımda açabilirsin."
      },
      reset: {
        title: "Şifreni sıfırla",
        lede: "Hesabının e-posta adresini yaz, sıfırlama bağlantısını gönderelim."
      },
      verify: {
        title: "Son adım: e-postanı doğrula",
        lede: "Doğrulamadan sonra e-posta ve şifrenle giriş yapabilirsin."
      }
    },
    perksTitle: "Hesapla neler yapabilirsin",
    perks: [
      {
        title: "Etkinliklere kayıt ol",
        body: "Kayıt olduğun etkinliklerin QR biletleri profilinde durur."
      },
      {
        title: "Canlı quiz ve anketlere katıl",
        body: "Etkinlikte ekrana gelen 6 haneli kodla."
      },
      {
        title: "Etkinlik fotoğraflarını paylaş",
        body: "Sosyal akışta paylaş, çekilişlere katıl."
      },
      {
        title: "Destek talebi aç",
        body: "Bir sorun olduğunda ekibe doğrudan yaz."
      }
    ],
    modeLabel: "Giriş veya kayıt",
    loginTab: "Giriş yap",
    signupTab: "Kayıt ol",
    continueWithGoogle: "Google ile devam et",
    orEmail: "veya e-posta ile",
    fullName: "Ad soyad",
    email: "E-posta",
    emailPlaceholder: "ad@ornek.com",
    password: "Şifre",
    passwordHint: "8–24 karakter; en az bir küçük harf ve bir rakam.",
    forgotPassword: "Şifremi unuttum",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
    signIn: "Giriş yap",
    signUp: "Hesap oluştur",
    sendReset: "Sıfırlama bağlantısı gönder",
    backToLogin: "Girişe dön",
    termsPrefix: "Hesap oluşturduğunda ",
    terms: "Kullanım Şartları",
    termsJoiner: " ve ",
    privacy: "Gizlilik Politikası",
    termsSuffix: " geçerli olur.",
    resetSent: (email) =>
      `${email} adresine sıfırlama bağlantısı gönderdik. Gelen kutunu ve spam klasörünü kontrol et.`,
    verificationSent: (email) =>
      `${email} adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkla, sonra buradan giriş yap.`,
    checkSpam: "E-posta birkaç dakikada gelmezse spam klasörüne bak.",
    resendVerification: "Doğrulama e-postasını tekrar gönder",
    verificationResent: "Yeni bir doğrulama e-postası gönderdik.",
    errors: {
      verifyEmail: "E-posta adresin henüz doğrulanmadı. Gelen kutundaki bağlantıya tıkla.",
      enterName: "Adını ve soyadını yaz.",
      enterEmail: "Önce e-posta adresini yaz.",
      enterPassword: "Şifreni yaz.",
      alreadyInUse: "Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.",
      invalidEmail: "Bu e-posta adresi geçerli görünmüyor.",
      weakPassword: "Şifre 8–24 karakter olmalı; en az bir küçük harf ve bir rakam içermeli.",
      userNotFound: "Bu e-posta adresiyle kayıtlı bir hesap yok.",
      wrongPassword: "Şifre hatalı.",
      invalidCredential: "E-posta veya şifre hatalı.",
      tooManyRequests: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.",
      network: "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.",
      generic: "Bir şeyler ters gitti. Tekrar dene.",
      popupBlocked: "Tarayıcın Google penceresini engelledi. Bu site için açılır pencerelere izin ver.",
      googleFailed: "Google ile giriş yapılamadı. Tekrar dene.",
      resetUnknown: "Sıfırlama e-postası gönderilemedi. Tekrar dene."
    }
  },
  en: {
    intro: {
      login: {
        title: "Sign in to your account",
        lede: "Your event registrations, QR tickets and live games live here."
      },
      signup: {
        title: "Join the community",
        lede: "With an account you can register for events and play live quizzes. Your Google account sets it up in one step."
      },
      reset: {
        title: "Reset your password",
        lede: "Enter the email address of your account and we will send you a reset link."
      },
      verify: {
        title: "Last step: verify your email",
        lede: "Once verified, sign in with your email and password."
      }
    },
    perksTitle: "What an account is for",
    perks: [
      {
        title: "Register for events",
        body: "QR tickets for the events you join are kept on your profile."
      },
      {
        title: "Play live quizzes and polls",
        body: "With the 6-digit code shown at the event."
      },
      {
        title: "Share event photos",
        body: "Post to the social feed and enter raffles."
      },
      {
        title: "Open a support ticket",
        body: "Write to the team directly when something goes wrong."
      }
    ],
    modeLabel: "Sign in or sign up",
    loginTab: "Sign in",
    signupTab: "Sign up",
    continueWithGoogle: "Continue with Google",
    orEmail: "or with email",
    fullName: "Full name",
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Password",
    passwordHint: "8–24 characters, with at least one lowercase letter and one number.",
    forgotPassword: "Forgot password?",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signIn: "Sign in",
    signUp: "Create account",
    sendReset: "Send reset link",
    backToLogin: "Back to sign in",
    termsPrefix: "By creating an account you agree to the ",
    terms: "Terms of Use",
    termsJoiner: " and ",
    privacy: "Privacy Policy",
    termsSuffix: ".",
    resetSent: (email) =>
      `We sent a reset link to ${email}. Check your inbox and spam folder.`,
    verificationSent: (email) =>
      `We sent a verification link to ${email}. Click it, then sign in here.`,
    checkSpam: "If it does not arrive in a few minutes, check your spam folder.",
    resendVerification: "Resend verification email",
    verificationResent: "We sent a new verification email.",
    errors: {
      verifyEmail: "Your email address is not verified yet. Click the link in your inbox.",
      enterName: "Enter your full name.",
      enterEmail: "Enter your email address first.",
      enterPassword: "Enter your password.",
      alreadyInUse: "An account with this email already exists. Try signing in.",
      invalidEmail: "This email address does not look valid.",
      weakPassword: "Use 8–24 characters with at least one lowercase letter and one number.",
      userNotFound: "No account is registered with this email address.",
      wrongPassword: "Incorrect password.",
      invalidCredential: "Email or password is incorrect.",
      tooManyRequests: "Too many attempts. Try again in a few minutes.",
      network: "Could not connect. Check your internet connection and try again.",
      generic: "Something went wrong. Please try again.",
      popupBlocked: "Your browser blocked the Google window. Allow pop-ups for this site.",
      googleFailed: "Could not sign in with Google. Please try again.",
      resetUnknown: "The reset email could not be sent. Please try again."
    }
  }
};

// Firebase error code -> [field it belongs to (null = whole form), message key]
const AUTH_ERRORS = {
  "auth/invalid-email": ["email", "invalidEmail"],
  "auth/missing-email": ["email", "enterEmail"],
  "auth/email-already-in-use": ["email", "alreadyInUse"],
  "auth/user-not-found": ["email", "userNotFound"],
  "auth/missing-password": ["password", "enterPassword"],
  "auth/weak-password": ["password", "weakPassword"],
  "auth/password-does-not-meet-requirements": ["password", "weakPassword"],
  "auth/wrong-password": ["password", "wrongPassword"],
  "auth/invalid-credential": [null, "invalidCredential"],
  "auth/too-many-requests": [null, "tooManyRequests"],
  "auth/network-request-failed": [null, "network"]
};

const PERK_DOTS = ["bg-mark-blue", "bg-mark-red", "bg-mark-yellow", "bg-mark-green"];

function GoogleMark() {
  return (
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
  );
}

// Field passes id and aria props to its child; they land on the real <input>.
const PasswordInput = forwardRef(function PasswordInput(
  { visible, onToggle, showLabel, hideLabel, className, ...props },
  ref
) {
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute inset-y-px right-px flex w-11 items-center justify-center rounded-r text-muted-foreground transition-colors duration-micro ease-out hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});

function Notice({ tone = "neutral", children, action }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded border px-4 py-3 text-sm",
        tone === "error" && "border-error text-error",
        tone === "success" && "border-success text-success",
        tone === "neutral" && "border-rule bg-paper-2 text-ink"
      )}
    >
      <p>{children}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default function LoginPage() {
  // login · signup · reset · verify (after sign-up, waiting for the email link)
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const copy = locale === "en" ? COPY.en : COPY.tr;
  const intro = copy.intro[mode];
  const isLogin = mode === "login";

  // Google's auth iframe is no longer loaded on every page; have it ready before the click.
  useEffect(() => {
    preparePopupSignIn();
  }, []);

  // Pages that need an account send people here with ?next=/path; go back there afterwards.
  const getRedirectPath = () =>
    safeRedirectPath(new URLSearchParams(window.location.search).get("next"));

  const clearMessages = () => {
    setError("");
    setFieldErrors({});
    setNotice("");
    setUnverified(false);
  };

  const switchMode = (next) => {
    clearMessages();
    setShowPassword(false);
    setMode(next);
  };

  const showAuthError = (code) => {
    const [field, key] = AUTH_ERRORS[code] || [null, "generic"];
    if (field) {
      setFieldErrors({ [field]: copy.errors[key] });
    } else {
      setError(copy.errors[key]);
    }
  };

  const updateField = (field, setter) => (e) => {
    setter(e.target.value);
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!isLogin && !name.trim()) {
      setFieldErrors({ name: copy.errors.enterName });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);

        if (!result.user.emailVerified) {
          setError(copy.errors.verifyEmail);
          setUnverified(true);
          await auth.signOut();
          return;
        }

        router.push(getRedirectPath());
        return;
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
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
      setPassword("");
      setMode("verify");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Authentication error:", error);
      }
      showAuthError(error.code);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    clearMessages();
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Verified in another tab in the meantime: just continue.
      if (result.user.emailVerified) {
        router.push(getRedirectPath());
        return;
      }

      await sendEmailVerification(result.user);
      await auth.signOut();
      setNotice(copy.verificationResent);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Resend verification error:", error);
      }
      showAuthError(error.code);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    let processingSignIn = false;

    try {
      setError("");

      googleProvider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, googleProvider, popupResolver());

      if (result?.user) {
        // Closing a popup can take time to reach Firebase. Keep the form usable
        // until sign-in succeeds and we actually start saving the user profile.
        processingSignIn = true;
        setLoading(true);
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

      router.push(getRedirectPath());
    } catch (error) {
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      if (process.env.NODE_ENV === "development") {
        logger.error("Google sign-in error:", error);
      }

      if (error.code === "auth/popup-blocked") {
        setError(copy.errors.popupBlocked);
      } else {
        setError(copy.errors.googleFailed);
      }
    } finally {
      if (processingSignIn) setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e?.preventDefault();
    clearMessages();

    if (!email) {
      setFieldErrors({ email: copy.errors.enterEmail });
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setNotice(copy.resetSent(email));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Password reset error:", error);
      }

      if (AUTH_ERRORS[error.code]) {
        showAuthError(error.code);
      } else {
        setError(copy.errors.resetUnknown);
      }
    } finally {
      setLoading(false);
    }
  };

  const emailField = (
    <Field id="email" label={copy.email} error={fieldErrors.email}>
      <Input
        type="email"
        value={email}
        onChange={updateField("email", setEmail)}
        placeholder={copy.emailPlaceholder}
        autoComplete="email"
        inputMode="email"
        spellCheck={false}
        required
      />
    </Field>
  );

  const modeTab = (target, label) => (
    <button
      type="button"
      aria-pressed={mode === target}
      disabled={loading}
      onClick={() => mode !== target && switchMode(target)}
      className={cn(
        "-mb-px min-h-12 border-b-2 text-base font-medium transition-colors duration-micro ease-out disabled:cursor-not-allowed",
        mode === target
          ? "border-ink text-ink"
          : "border-transparent text-muted-foreground hover:text-ink"
      )}
    >
      {label}
    </button>
  );

  let panel;

  if (mode === "verify") {
    panel = (
      <div role="status">
        <p className="text-md text-ink">{copy.verificationSent(email)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{copy.checkSpam}</p>
        <Button size="lg" className="mt-8 w-full" onClick={() => switchMode("login")}>
          {copy.backToLogin}
        </Button>
      </div>
    );
  } else if (mode === "reset") {
    panel = (
      <form onSubmit={handlePasswordReset} className="flex flex-col gap-2">
        {emailField}
        {error && <Notice tone="error">{error}</Notice>}
        {notice && <Notice tone="success">{notice}</Notice>}
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          {copy.sendReset}
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={() => switchMode("login")}
          className="mt-4 min-h-11 self-start"
        >
          <ArrowLeft aria-hidden="true" />
          {copy.backToLogin}
        </Button>
      </form>
    );
  } else {
    panel = (
      <>
        <div
          role="group"
          aria-label={copy.modeLabel}
          className="mb-6 grid grid-cols-2 border-b border-rule"
        >
          {modeTab("login", copy.loginTab)}
          {modeTab("signup", copy.signupTab)}
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full"
        >
          <GoogleMark />
          {copy.continueWithGoogle}
        </Button>

        <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          {copy.orEmail}
          <span className="h-px flex-1 bg-rule" aria-hidden="true" />
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-2">
          {!isLogin && (
            <Field id="full-name" label={copy.fullName} error={fieldErrors.name}>
              <Input
                type="text"
                value={name}
                onChange={updateField("name", setName)}
                autoComplete="name"
                required
              />
            </Field>
          )}

          {emailField}

          <Field
            id="password"
            label={copy.password}
            help={isLogin ? undefined : copy.passwordHint}
            error={fieldErrors.password}
            action={
              isLogin && (
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="rounded-sm text-sm font-medium text-brand underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {copy.forgotPassword}
                </button>
              )
            }
          >
            <PasswordInput
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              showLabel={copy.showPassword}
              hideLabel={copy.hidePassword}
              value={password}
              onChange={updateField("password", setPassword)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              // Length rules only apply to new passwords; older accounts may have shorter ones.
              minLength={isLogin ? undefined : 8}
              maxLength={isLogin ? undefined : 24}
            />
          </Field>

          {error && (
            <Notice
              tone="error"
              action={
                unverified && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="min-h-11 rounded-sm font-medium text-ink underline decoration-1 underline-offset-4 hover:decoration-2 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {copy.resendVerification}
                  </button>
                )
              }
            >
              {error}
            </Notice>
          )}
          {notice && <Notice tone="success">{notice}</Notice>}

          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            {isLogin ? copy.signIn : copy.signUp}
          </Button>
        </form>

        {!isLogin && (
          <p className="mt-4 text-sm text-muted-foreground">
            {copy.termsPrefix}
            <Link href="/terms" className="text-brand underline underline-offset-4">
              {copy.terms}
            </Link>
            {copy.termsJoiner}
            <Link href="/privacy" className="text-brand underline underline-offset-4">
              {copy.privacy}
            </Link>
            {copy.termsSuffix}
          </p>
        )}
      </>
    );
  }

  const showPerks = mode === "login" || mode === "signup";

  return (
    <PageContainer className="md:py-16">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:grid-rows-[auto_1fr]">
        <header className="lg:col-start-1 lg:row-start-1">
          <h1 className="font-display text-display-s font-extrabold">{intro.title}</h1>
          <p className="mt-4 max-w-[38ch] text-md text-ink-2">{intro.lede}</p>
        </header>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="sm:rounded-lg sm:border sm:border-rule sm:p-8">{panel}</div>
        </div>

        {showPerks && (
          <section
            aria-labelledby="perks-title"
            className="lg:col-start-1 lg:row-start-2 lg:self-start"
          >
            <h2
              id="perks-title"
              className="border-t-2 border-ink pt-3 font-display text-lg font-bold"
            >
              {copy.perksTitle}
            </h2>
            <ul className="mt-2">
              {copy.perks.map((perk, index) => (
                <li
                  key={perk.title}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-b border-rule py-4"
                >
                  <span
                    aria-hidden="true"
                    className={cn("mt-2 size-2 rounded-full", PERK_DOTS[index % PERK_DOTS.length])}
                  />
                  <span>
                    <span className="block font-medium text-ink">{perk.title}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{perk.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
