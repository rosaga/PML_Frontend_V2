"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import apiUrl from "../api/utils/apiUtils/apiUrl";
import PolicyReview, { POLICIES } from "./policies";
import "react-toastify/dist/ReactToastify.css";
import "../../app/globals.css";

const SignUp = () => {
  const router = useRouter();
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [orgAvailable, setOrgAvailable] = useState(null);
  const [checkingOrg, setCheckingOrg] = useState(false);
  const [organizationCheckError, setOrganizationCheckError] = useState("");
  const [organizationCheckAttempt, setOrganizationCheckAttempt] = useState(0);
  const [step, setStep] = useState("details");
  const [acknowledged, setAcknowledged] = useState({});
  const headingRef = useRef(null);
  const submittingRef = useRef(false);
  const allAcknowledged = POLICIES.every((policy) => acknowledged[policy.id]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    setOrgAvailable(null);
    setOrganizationCheckError("");
    if (organization.trim().length < 3) {
      setCheckingOrg(false);
      return;
    }

    const controller = new AbortController();
    setCheckingOrg(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://peakdata-jja4kcvvdq-ez.a.run.app/api/v1/organization/exists?name=${encodeURIComponent(organization)}`,
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) setOrgAvailable(!res.data.exists);
      } catch (error) {
        if (!controller.signal.aborted) {
          setOrganizationCheckError("We couldn’t check the organization name.");
        }
      } finally {
        if (!controller.signal.aborted) setCheckingOrg(false);
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [organization, organizationCheckAttempt]);

  const validateDetails = () => {
    const newErrors = {};
    if (!firstname.trim()) newErrors.firstname = "First name is required";
    if (!lastname.trim()) newErrors.lastname = "Last name is required";
    if (!organization.trim()) {
      newErrors.organization = "Organization name is required";
    } else if (organization.trim().length < 3) {
      newErrors.organization = "Use at least 3 characters for your organization name";
    } else if (orgAvailable === false) {
      newErrors.organization = "Organization name already exists";
    } else if (checkingOrg || orgAvailable === null) {
      newErrors.organization = "Please verify your organization name before continuing";
    }
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    const firstError = Object.keys(newErrors)[0];
    if (firstError) {
      setStep("details");
      requestAnimationFrame(() => {
        document.getElementById(firstError === "confirmPassword" ? "confirm-password" : firstError)?.focus();
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || !validateDetails()) return;
    if (step === "details") {
      setStep("policies");
      return;
    }
    if (!allAcknowledged) {
      setErrors({ policies: "Please read and acknowledge all three documents to continue." });
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    const signupPayload = {
      firstname,
      lastName: lastname,
      email,
      credentials: [{ type: "password", value: password, temporary: false }],
      attributes: { ACCOUNT: [organization] },
    };
    try {
      const res = await axios.post(apiUrl.SIGN_UP, signupPayload);
      if (res.status === 200) {
        toast.success("Account created. Please verify your email.");
        localStorage.setItem("signupEmail", email);
        router.push("/otp");
      } else {
        toast.error("We couldn’t create your account. Please try again.");
      }
    } catch (error) {
      const message = error.response?.data?.error;
      toast.error(
        message === "409 Conflict: User exists with same email"
          ? "An account with this email already exists. Please log in or use a different email."
          : message || "We couldn’t create your account. Please try again."
      );
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <main className="signup-page">
        <aside className="signup-story" aria-label="Welcome to Peak Mobile">
          <div className="signup-story-photo" />
          <div className="signup-story-copy">
            <span className="signup-story-accent" aria-hidden="true" />
            <h2>Bring your<br />customers closer.</h2>
            <p>Messages, data, and airtime rewards.<br />One place to keep your business connected.</p>
          </div>
        </aside>

        <div className="signup-main">
          <header className="signup-topbar">
            <Image src="/images/peaklogo.png" alt="Peak Mobile" width={112} height={63} className="signup-mobile-logo" />
            <p>Already have an account? <Link href="/signin">Log in <ArrowRight size={15} /></Link></p>
          </header>

          <div className="signup-content">
            <ol className="signup-steps" aria-label="Registration progress">
              <li className={step === "details" ? "is-current" : "is-finished"} aria-current={step === "details" ? "step" : undefined}>
                <span className="signup-step-number">{step === "details" ? "1" : <Check size={15} />}</span>
                Your details
              </li>
              <li className={step === "policies" ? "is-current" : ""} aria-current={step === "policies" ? "step" : undefined}>
                <span className="signup-step-number">2</span>
                Review policies
              </li>
            </ol>

            <header className="signup-heading">
              <h1 ref={headingRef} tabIndex={-1}>{step === "details" ? "Let’s get you started" : "Before you join"}</h1>
              <p>{step === "details" ? "Create your Peak Mobile account in two simple steps." : "Please review and acknowledge each document."}</p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="signup-form">
              {step === "details" ? (
                <>
                <div className="signup-field-pair">
                  <div className="signup-field">
                    <label htmlFor="firstname">First name</label>
                    <input
                      id="firstname"
                      name="given-name"
                      autoComplete="given-name"
                      required
                      value={firstname}
                      onChange={(e) => setFirstName(e.target.value)}
                      aria-invalid={!!errors.firstname}
                      aria-describedby={errors.firstname ? "firstname-error" : undefined}
                    />
                    {errors.firstname && <p id="firstname-error" className="signup-error">{errors.firstname}</p>}
                  </div>
                  <div className="signup-field">
                    <label htmlFor="lastname">Last name</label>
                    <input
                      id="lastname"
                      name="family-name"
                      autoComplete="family-name"
                      required
                      value={lastname}
                      onChange={(e) => setLastName(e.target.value)}
                      aria-invalid={!!errors.lastname}
                      aria-describedby={errors.lastname ? "lastname-error" : undefined}
                    />
                    {errors.lastname && <p id="lastname-error" className="signup-error">{errors.lastname}</p>}
                  </div>
                </div>

                <div className="signup-field">
                  <label htmlFor="organization">Organization name</label>
                  <input
                    id="organization"
                    name="organization"
                    autoComplete="organization"
                    required
                    value={organization}
                    onChange={(e) => {
                      setOrganization(e.target.value);
                      setOrgAvailable(null);
                      setOrganizationCheckError("");
                      setErrors({ ...errors, organization: "" });
                    }}
                    aria-invalid={!!errors.organization || orgAvailable === false}
                    aria-describedby="organization-status"
                  />
                  <div id="organization-status" aria-live="polite">
                    {errors.organization && !organizationCheckError ? (
                      <p className="signup-error">{errors.organization}</p>
                    ) : checkingOrg ? (
                      <p className="signup-hint">Checking name...</p>
                    ) : organizationCheckError ? (
                      <p className="signup-error">
                        {organizationCheckError}{" "}
                        <button type="button" className="signup-text-button" onClick={() => setOrganizationCheckAttempt((attempt) => attempt + 1)}>Try again</button>
                      </p>
                    ) : orgAvailable === false ? (
                      <p className="signup-error">Organization name already exists</p>
                    ) : orgAvailable === true ? (
                      <p className="signup-success">Organization name available</p>
                    ) : null}
                  </div>
                </div>

                <div className="signup-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && <p id="email-error" className="signup-error">{errors.email}</p>}
                </div>

                <div className="signup-field-pair">
                  <div className="signup-field">
                    <label htmlFor="password">Password</label>
                    <div className="signup-password">
                      <input
                        id="password"
                        name="password"
                        type={isPasswordVisible ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                      />
                      <IconButton
                        type="button"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                        aria-pressed={isPasswordVisible}
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        size="small"
                      >
                        {isPasswordVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    </div>
                    {errors.password && <p id="password-error" className="signup-error">{errors.password}</p>}
                  </div>
                  <div className="signup-field">
                    <label htmlFor="confirm-password">Confirm password</label>
                    <div className="signup-password">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={isPasswordVisible ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      />
                      <IconButton
                        type="button"
                        aria-label={isPasswordVisible ? "Hide confirm password" : "Show confirm password"}
                        aria-pressed={isPasswordVisible}
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        size="small"
                      >
                        {isPasswordVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    </div>
                    {errors.confirmPassword && <p id="confirm-password-error" className="signup-error">{errors.confirmPassword}</p>}
                  </div>
                </div>

                  <button type="submit" className="signup-submit" disabled={checkingOrg || orgAvailable === false}>
                    {checkingOrg ? "Checking organization..." : "Continue"} <ArrowRight size={18} />
                  </button>
                  <p className="signup-footnote">Next, take a look at our terms and how we handle your data.</p>
                </>
              ) : (
                <>
                  <div className="signup-account-summary">
                    <span className="signup-account-avatar" aria-hidden="true">{firstname.trim().charAt(0)}{lastname.trim().charAt(0)}</span>
                    <div><strong>{firstname} {lastname}</strong><span>{email}</span></div>
                    <button type="button" className="signup-text-button" disabled={isLoading} onClick={() => setStep("details")}>Edit details</button>
                  </div>
                  <PolicyReview
                    acknowledged={acknowledged}
                    onAcknowledge={(id, value) => {
                      setAcknowledged((previous) => ({ ...previous, [id]: value }));
                      setErrors((previous) => ({ ...previous, policies: "" }));
                    }}
                  />
                  {errors.policies && <p className="signup-error" role="alert">{errors.policies}</p>}
                  <div className="signup-review-footer">
                    <button type="button" className="signup-back" disabled={isLoading} onClick={() => setStep("details")}><ArrowLeft size={17} /> Back</button>
                    <button type="submit" className="signup-submit" disabled={isLoading || !allAcknowledged || checkingOrg} aria-describedby="signup-review-help">
                      {isLoading ? "Creating your account..." : "Create account"} {!isLoading && <ArrowRight size={18} />}
                    </button>
                  </div>
                  <p id="signup-review-help" className="signup-footnote" aria-live="polite">
                    {allAcknowledged ? "You’ll verify your email next." : "Acknowledge all three documents to create your account."}
                  </p>
                </>
              )}
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignUp;
