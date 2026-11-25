
import React, { useState } from "react";
import Papa from "papaparse";
import { Upload, FileText, X, Users, Clock } from "lucide-react";

import Button from "../common/Button";
import Input from "../common/Input";
import Modal from "../common/Modal";

export interface SenderOption {
  id: string;
  email: string;
}

export interface ScheduleEmailPayload {
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startAt: string;
  delaySeconds: number;
  hourlyLimit: number;
}

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (
    payload: ScheduleEmailPayload
  ) => void | Promise<void>;
  senders?: SenderOption[];
}

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ComposeEmail: React.FC<ComposeEmailProps> = ({
  isOpen,
  onClose,
  onSchedule,
  senders = [],
}) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [delaySeconds, setDelaySeconds] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("50");
  const [senderId, setSenderId] = useState(senders[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extract unique email addresses from CSV/TXT.
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["csv", "txt"].includes(extension || "")) {
      setError("Please upload a CSV or TXT file.");
      event.target.value = "";
      return;
    }

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results: { data: any[]; }) => {
        const detectedEmails = results.data.flatMap((row) => {
          const values = Array.isArray(row) ? row : [String(row)];

          return values.flatMap((value) => {
            return (
              String(value)
                .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
            );
          });
        });

        const uniqueEmails = [
          ...new Set(
            detectedEmails
              .map((email) => email.trim().toLowerCase())
              .filter((email) => EMAIL_REGEX.test(email))
          ),
        ];

        setRecipients(uniqueEmails);
        setFileName(file.name);

        if (uniqueEmails.length === 0) {
          setError("No valid email addresses found in this file.");
        }
      },
      error: () => {
        setError("Unable to read the uploaded file.");
      },
    });

    event.target.value = "";
  };

  const removeFile = () => {
    setFileName("");
    setRecipients([]);
    setError("");
  };

  const resetForm = () => {
    setSubject("");
    setBody("");
    setRecipients([]);
    setFileName("");
    setStartAt("");
    setDelaySeconds("2");
    setHourlyLimit("50");
    setSenderId(senders[0]?.id || "");
    setError("");
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    if (!subject.trim()) {
      setError("Please enter an email subject.");
      return;
    }

    if (!body.trim()) {
      setError("Please enter the email body.");
      return;
    }

    if (recipients.length === 0) {
      setError("Please upload a file containing email addresses.");
      return;
    }

    if (!senderId) {
      setError("Please select an email sender.");
      return;
    }

    if (!startAt || new Date(startAt).getTime() <= Date.now()) {
      setError("Please select a future scheduling time.");
      return;
    }

    const delay = Number(delaySeconds);
    const limit = Number(hourlyLimit);

    if (!Number.isInteger(delay) || delay < 2) {
      setError("Minimum delay must be at least 2 seconds.");
      return;
    }

    if (!Number.isInteger(limit) || limit < 1) {
      setError("Hourly limit must be at least 1.");
      return;
    }

    try {
      setLoading(true);

      await onSchedule({
        senderId,
        subject: subject.trim(),
        body: body.trim(),
        recipients,
        startAt: new Date(startAt).toISOString(),
        delaySeconds: delay,
        hourlyLimit: limit,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to schedule emails."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compose New Email"
      size="lg"
      closeOnOutsideClick={!loading}
      showCloseButton={!loading}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Schedule Emails
          </Button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* Sender Selection */}
        <div>
          <label
            htmlFor="sender"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email Sender <span className="text-red-500">*</span>
          </label>

          <select
            id="sender"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            disabled={loading || senders.length === 0}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          >
            <option value="">Select sender</option>

            {senders.map((sender) => (
              <option key={sender.id} value={sender.id}>
                {sender.email}
              </option>
            ))}
          </select>

          {senders.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              No sender accounts available. Connect a sender first.
            </p>
          )}
        </div>

        {/* Subject */}
        <Input
          label="Email Subject"
          name="subject"
          placeholder="Enter your email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        {/* Body */}
        <div>
          <label
            htmlFor="email-body"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email Body <span className="text-red-500">*</span>
          </label>

          <textarea
            id="email-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email message..."
            disabled={loading}
            className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          />
        </div>

        {/* CSV Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Upload Email Leads
          </label>

          {!fileName ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 transition hover:border-blue-400 hover:bg-blue-50">
              <Upload className="mb-3 text-blue-600" size={28} />

              <p className="text-sm font-medium text-gray-700">
                Click to upload CSV or TXT
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Upload a file containing email addresses
              </p>

              <input
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-blue-600" size={24} />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {fileName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {recipients.length} valid email addresses detected
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                disabled={loading}
                aria-label="Remove uploaded file"
                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {recipients.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <Users size={18} />
              <span>
                <strong>{recipients.length}</strong> recipients ready for scheduling
              </span>
            </div>
          )}
        </div>

        {/* Scheduling Configuration */}
        <div className="border-t border-gray-200 pt-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" />

            <h3 className="text-sm font-semibold text-gray-900">
              Scheduling Configuration
            </h3>
          </div>

          <div className="space-y-4">

            <Input
              label="Start Date and Time"
              name="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Delay Between Emails (seconds)"
                name="delaySeconds"
                type="number"
                min={2}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                helperText="Minimum 2 seconds"
                required
              />

              <Input
                label="Hourly Sending Limit"
                name="hourlyLimit"
                type="number"
                min={1}
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                helperText="Maximum emails per hour"
                required
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ComposeEmail;
