
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, SearchX } from "lucide-react";

import Button from "../components/common/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

      <div className="w-full max-w-lg text-center">

        {/* Error Icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <SearchX size={45} />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-extrabold tracking-tight text-blue-600">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Page Not Found
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Sorry, the page you are looking for does not exist,
          may have been moved, or is temporarily unavailable.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <Button
            onClick={() => navigate("/dashboard")}
          >
            <Home size={17} className="mr-2" />
            Go to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={17} className="mr-2" />
            Go Back
          </Button>

        </div>

        <p className="mt-10 text-xs text-slate-400">
          MailScheduler · Page Error 404
        </p>

      </div>
    </div>
  );
};

export default NotFound;
