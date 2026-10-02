"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { setToken } from "@/utils/auth";
import { ToastContainer, toast } from "react-toastify";
import apiUrl from "../api/utils/apiUtils/apiUrl";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import "../globals.css";
import "../signup/signup.css";
import "react-toastify/dist/ReactToastify.css";

export default function SignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password");
  const [otpStep, setOtpStep] = useState("request");
  const [otp, setOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("passwordUpdateSuccess") === "true") {
      sessionStorage.removeItem("passwordUpdateSuccess");
      toast.success("Password updated. Please sign in again.");
    }
  }, []);

  useEffect(() => {
    if (otpStep !== "verify" || (resendSeconds <= 0 && expirySeconds <= 0)) return;

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
      setExpirySeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpStep, resendSeconds, expirySeconds]);

  const finishSignIn = (tokenResponse) => {
    if (!tokenResponse?.access_token) {
      throw new Error("The login response did not include an access token.");
    }

    setToken(tokenResponse.access_token);
    router.push("/user-orgs");
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await axios.post(apiUrl.SIGN_IN, { username, password });
      finishSignIn(res.data);
    } catch {
      toast.error("Unable to sign in. Please check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async (event) => {
    event?.preventDefault();
    if (isLoading || !username) return;

    setIsLoading(true);
    try {
      await axios.post(apiUrl.REQUEST_LOGIN_OTP, {
        subject_type: "email",
        subject: username,
      });
      setOtp("");
      setOtpStep("verify");
      setResendSeconds(60);
      setExpirySeconds(5 * 60);
      toast.success("We sent a 6-digit code to your email.");
    } catch {
      toast.error("Unable to send a code. Please check your email and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (isLoading || expirySeconds === 0) return;

    setIsLoading(true);
    try {
      const res = await axios.post(apiUrl.VERIFY_LOGIN_OTP, {
        subject_type: "email",
        subject: username,
        otp,
      });
      finishSignIn(res.data);
    } catch {
      toast.error("That code is invalid or has expired. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const showPasswordLogin = () => {
    setLoginMethod("password");
    setOtpStep("request");
    setOtp("");
    setResendSeconds(0);
    setExpirySeconds(0);
  };

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <>
      <ToastContainer />
      <main className="signup-page signin-page">
        <aside className="signup-story" aria-hidden="true">
          <div className="signup-story-photo" />
        </aside>
        <div className="signup-main">
          <header className="signup-topbar">
            <Image src="/images/peaklogo.png" alt="Peak Mobile" width={112} height={63} className="signup-mobile-logo" />
            <p>Don’t have an account? <Link href="/signup">Register <ArrowRight size={15} /></Link></p>
          </header>
          <div className="signup-content signin-content">
            <header className="signup-heading">
              <h1>Welcome back</h1>
              <p>{loginMethod === "password" ? "Sign in with your email and password." : "Sign in with a one-time code sent to your email."}</p>
            </header>
            {loginMethod === "password" ? (
              <>
                <form onSubmit={handleSignIn} className="signup-form" aria-busy={isLoading}>
                  <div className="signup-field">
                    <label htmlFor="signin-email">Email address</label>
                    <input id="signin-email" name="email" type="email" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
                  </div>
                  <div className="signup-field">
                    <label htmlFor="signin-password">Password</label>
                    <div className="signup-password">
                      <input id="signin-password" name="password" type={isPasswordVisible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                      <IconButton type="button" aria-label={isPasswordVisible ? "Hide password" : "Show password"} aria-pressed={isPasswordVisible} onClick={() => setIsPasswordVisible(!isPasswordVisible)} size="small">
                        {isPasswordVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    </div>
                  </div>
                  <div className="signin-recovery"><Link href="/reset" className="signup-text-button">Forgot password?</Link></div>
                  <button type="submit" className="signup-submit" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"} {!isLoading && <ArrowRight size={18} />}
                  </button>
                </form>
                <div className="signin-alternative"><span>Or use another way</span></div>
                <button type="button" className="signin-method" onClick={() => setLoginMethod("otp")}>
                  <Mail size={19} aria-hidden="true" />
                  <span><strong>Email me a code</strong><small>Use a one-time password that expires in 5 minutes</small></span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </>
            ) : otpStep === "request" ? (
              <form onSubmit={requestOtp} className="signup-form" aria-busy={isLoading}>
                <div className="signup-field">
                  <label htmlFor="otp-email">Email address</label>
                  <input id="otp-email" name="email" type="email" autoComplete="email" required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} />
                </div>
                <button type="submit" className="signup-submit" disabled={isLoading}>
                  {isLoading ? "Sending code..." : "Send code"} {!isLoading && <ArrowRight size={18} />}
                </button>
                <button type="button" className="signin-back signup-text-button" onClick={showPasswordLogin}><ArrowLeft size={16} /> Use password instead</button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="signup-form" aria-busy={isLoading}>
                <div className="signin-otp-summary">
                  <span>Code sent to</span>
                  <strong>{username}</strong>
                  <button type="button" className="signup-text-button" onClick={() => setOtpStep("request")}>Change</button>
                </div>
                <div className="signup-field">
                  <label htmlFor="signin-otp">6-digit code</label>
                  <input id="signin-otp" className="signin-otp-input" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} aria-describedby="otp-expiry" />
                  <p id="otp-expiry" className={expirySeconds === 0 ? "signup-error" : "signup-hint"} aria-live="polite">
                    {expirySeconds > 0 ? `Code expires in ${formatTime(expirySeconds)}` : "This code has expired. Request a new one."}
                  </p>
                </div>
                <button type="submit" className="signup-submit" disabled={isLoading || otp.length !== 6 || expirySeconds === 0}>
                  {isLoading ? "Verifying..." : "Verify and sign in"} {!isLoading && <ArrowRight size={18} />}
                </button>
                <div className="signin-otp-actions">
                  <button type="button" className="signup-text-button" onClick={requestOtp} disabled={isLoading || resendSeconds > 0}>
                    {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
                  </button>
                  <button type="button" className="signup-text-button" onClick={showPasswordLogin}>Use password instead</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
