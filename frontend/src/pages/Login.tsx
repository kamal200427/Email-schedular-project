
import { useEffect } from "react";
import { Mail, ShieldCheck, Clock, Zap } from "lucide-react";

import useAuth from "../hooks/useAuth";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

const Login = () => {
  const {
    login,
    isAuthenticated,
    loading,
  } = useAuth();

  // If already authenticated, redirect to dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace("/dashboard");
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Loader
        fullScreen
        message="Checking your authentication..."
      />
    );
  }

  if (isAuthenticated) {
    return (
      <Loader
        fullScreen
        message="Redirecting to dashboard..."
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-white">

      {/* Left Section */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">

        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">

          <div className="rounded-xl bg-blue-600 p-3">
            <Mail size={25} />
          </div>

          <span className="text-2xl font-bold">
            MailScheduler
          </span>

        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg">

          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
            Smarter Email Automation
          </p>

          <h1 className="text-5xl font-bold leading-tight">
            Schedule emails.
            <span className="block text-blue-400">
              Save your time.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Manage multiple email senders, schedule campaigns,
            and monitor your email activity from one simple dashboard.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-6">

            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white/10 p-3">
                <Clock size={21} className="text-blue-400" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Smart Scheduling
                </h3>

                <p className="text-sm text-slate-400">
                  Schedule emails at your preferred time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white/10 p-3">
                <Zap size={21} className="text-blue-400" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Queue Management
                </h3>

                <p className="text-sm text-slate-400">
                  Manage background email processing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white/10 p-3">
                <ShieldCheck size={21} className="text-blue-400" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Reliable Processing
                </h3>

                <p className="text-sm text-slate-400">
                  Monitor scheduled, sent, and failed emails.
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © {new Date().getFullYear()} MailScheduler. All rights reserved.
        </div>

      </div>

      {/* Right Section */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-5 py-12 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* Mobile Brand */}
          <div className="mb-12 flex items-center justify-center gap-3 lg:hidden">

            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <Mail size={24} />
            </div>

            <span className="text-2xl font-bold text-slate-900">
              MailScheduler
            </span>

          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">

            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Mail size={30} />
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in with your Google account to access
                your email scheduling dashboard.
              </p>

            </div>

            {/* Google Login */}
            <Button
              fullWidth
              size="lg"
              onClick={login}
              className="flex items-center justify-center gap-3"
            >
              <svg
                viewBox="0 0 48 48"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.06 13.22l7.98 6.19C11.96 13.72 17.46 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.99 46.98 31.8 46.98 24.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.04 28.59A14.4 14.4 0 0 1 9.28 24c0-1.59.27-3.12.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.06 10.78l7.98-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.94-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.89 2.3-8.18 2.3-6.54 0-12.04-4.22-14.02-10.1l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>

              Continue with Google
            </Button>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                SECURE AUTHENTICATION
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="rounded-lg bg-slate-50 p-4">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-green-600"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Your account is protected
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Authentication is handled through Google OAuth.
                    Your Google password is never stored by this application.
                  </p>
                </div>

              </div>

            </div>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to use this service
              responsibly and comply with its applicable policies.
            </p>

          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need help? Contact your application administrator.
          </p>

        </div>
      </div>

    </div>
  );
};

export default Login;
