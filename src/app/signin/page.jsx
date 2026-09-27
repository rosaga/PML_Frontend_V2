"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ArrowRight } from "lucide-react";
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

  useEffect(() => {
    if (sessionStorage.getItem("passwordUpdateSuccess") === "true") {
      sessionStorage.removeItem("passwordUpdateSuccess");
      toast.success("Password updated. Please sign in again.");
    }
  }, []);

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await axios.post(apiUrl.SIGN_IN, { username, password });
      if (res.status === 200 && res.data.access_token) {
        setToken(res.data.access_token);
        router.push("/user-orgs");
      } else {
        toast.error("Unable to sign in. Please check your email and password.");
        setIsLoading(false);
      }
    } catch {
      toast.error("Unable to sign in. Please check your email and password.");
      setIsLoading(false);
    }
  };

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
            </header>
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
          </div>
        </div>
      </main>
    </>
  );
}
