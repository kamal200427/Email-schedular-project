
import React, { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  X,
  Users,
  AlertCircle,
  CheckCircle,
  Mail,
} from "lucide-react";

import Button from "../common/Button";
import Loader from "../common/Loader";

interface EmailUploadProps {
  onEmailsChange: (emails: string[]) => void;
  maxFileSizeMB?: number;
  disabled?: boolean;
}

interface UploadResult {
  emails: string[];
  invalidCount: number;
}

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailUpload: React.FC<EmailUploadProps> = ({
  onEmailsChange,
  maxFileSizeMB = 5,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  // Extract email addresses from uploaded file.
  const extractEmails = (
    rows: unknown[][]
  ): UploadResult => {
    const detectedEmails: string[] = [];

    let invalid = 0;

    rows.forEach((row) => {
      row.forEach((value) => {
        if (value === null || value === undefined) return;

        const text = String(value).trim();

        if (!text) return;

        // Extract email-like strings from cells.
        const matches =
          text.match(
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
          ) || [];

        detectedEmails.push(...matches);

        // Count non-empty values that are not email addresses
        // when they contain an @ character.
        if (
          text.includes("@") &&
          matches.length === 0
        ) {
          invalid++;
        }
      });
    });

    const validEmails = detectedEmails
      .map((email) => email.toLowerCase().trim())
      .filter((email) => EMAIL_REGEX.test(email));

    const uniqueEmails = [...new Set(validEmails)];

    return {
      emails: uniqueEmails,
      invalidCount:
        invalid + detectedEmails.length - validEmails.length,
    };
  };

  // Process uploaded file.
  const processFile = useCallback(
    (file: File) => {
      if (disabled) return;

      setError("");

      const extension = file.name
        .split(".")
        .pop()
        ?.toLowerCase();

      if (!["csv", "txt"].includes(extension || "")) {
        setError("Only CSV and TXT files are supported.");
        return;
      }

      const maxSize = maxFileSizeMB * 1024 * 1024;

      if (file.size > maxSize) {
        setError(
          `File size must not exceed ${maxFileSizeMB} MB.`
        );
        return;
      }

      if (file.size === 0) {
        setError("The uploaded file is empty.");
        return;
      }

      setLoading(true);
      setFileName(file.name);
      setEmails([]);
      setInvalidCount(0);
      onEmailsChange([]);

      Papa.parse(file, {
        skipEmptyLines: true,

        complete: (results) => {
          try {
            const rows = results.data as unknown[][];

            const result = extractEmails(rows);

            setEmails(result.emails);
            setInvalidCount(result.invalidCount);

            if (result.emails.length === 0) {
              setError(
                "No valid email addresses were found."
              );
            }
          } catch {
            setError("Unable to process the uploaded file.");
            setFileName("");
          } finally {
            setLoading(false);
          }
        },

        error: () => {
          setError("Failed to read the uploaded file.");
          setFileName("");
          setLoading(false);
        },
      });
    },
    [disabled, maxFileSizeMB, onEmailsChange]
  );

  // File input handler.
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      processFile(file);
    }

    // Allow selecting the same file again.
    event.target.value = "";
  };

  // Drag and drop handlers.
  const handleDragOver = (
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();

    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLLabelElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      processFile(file);
    }
  };

  // Remove uploaded file.
  const handleRemoveFile = () => {
    setFileName("");
    setEmails([]);
    setInvalidCount(0);
    setError("");
    setShowPreview(false);

    onEmailsChange([]);
  };

  return (
    <div className="w-full space-y-4">

      {/* Upload Heading */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          Upload Email Leads
        </h3>

        <p className="mt-1 text-xs text-gray-500">
          Upload a CSV or TXT file containing recipient email
          addresses.
        </p>
      </div>

      {/* Upload Area */}
      {!fileName && (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            flex cursor-pointer flex-col items-center
            justify-center rounded-xl border-2 border-dashed
            px-5 py-10 text-center transition
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
            }
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
          `}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Upload size={26} className="text-blue-600" />
          </div>

          <p className="text-sm font-semibold text-gray-800">
            Drag and drop your file here
          </p>

          <p className="mt-1 text-sm text-gray-500">
            or click to browse
          </p>

          <span className="mt-3 rounded-md bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
            CSV / TXT · Maximum {maxFileSizeMB} MB
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
        </label>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <Loader
            size="md"
            message="Processing email addresses..."
          />
        </div>
      )}

      {/* Uploaded File Information */}
      {fileName && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">

          <div className="flex items-center justify-between gap-3">

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <FileText
                  size={22}
                  className="text-blue-600"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {fileName}
                </p>

                <p className="text-xs text-gray-500">
                  File processed
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={disabled}
              aria-label="Remove uploaded file"
              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
            >
              <X size={19} />
            </button>
          </div>

          {/* Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-lg bg-green-50 p-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={17} />

                <span className="text-xs font-medium">
                  Valid Emails
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-green-700">
                {emails.length}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={17} />

                <span className="text-xs font-medium">
                  Invalid Entries
                </span>
              </div>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {invalidCount}
              </p>
            </div>

          </div>

          {/* Recipient Preview */}
          {emails.length > 0 && (
            <div className="mt-4">

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Users size={16} />

                {showPreview
                  ? "Hide recipients"
                  : "Preview recipients"}
              </button>

              {showPreview && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                  {emails.map((email, index) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 border-b border-gray-100 py-2 last:border-0"
                    >
                      <Mail
                        size={14}
                        className="shrink-0 text-gray-400"
                      />

                      <span className="text-xs text-gray-700">
                        {email}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};

export default EmailUpload;

