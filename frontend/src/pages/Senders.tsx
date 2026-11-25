
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  MailPlus,
  RefreshCw,
  Pencil,
  Trash2,
  Power,
  Server,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  Lock,
  Clock,
  Plus,
} from "lucide-react";

import api from "../services/api";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";

interface Sender {
  id: number;
  name: string;
  email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  hourly_limit: number;
  is_active: boolean;
  created_at?: string;
}

interface SenderForm {
  name: string;
  email: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  hourlyLimit: string;
}

const initialForm: SenderForm = {
  name: "",
  email: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: "587",
  smtpSecure: false,
  smtpUsername: "",
  smtpPassword: "",
  hourlyLimit: "100",
};

const Senders = () => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [form, setForm] = useState<SenderForm>(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch senders from backend.
  const fetchSenders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/senders");

      setSenders(response.data.senders || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to load email senders."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSenders();
  }, [fetchSenders]);

  // Update form fields.
  const updateField = <K extends keyof SenderForm>(
    field: K,
    value: SenderForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Reset form.
  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  // Open add sender form.
  const handleAdd = () => {
    setError("");
    setSuccess("");
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  // Open edit sender form.
  const handleEdit = (sender: Sender) => {
    setError("");
    setSuccess("");

    setEditingId(sender.id);
    setForm({
      name: sender.name,
      email: sender.email,
      smtpHost: sender.smtp_host,
      smtpPort: String(sender.smtp_port),
      smtpSecure: sender.smtp_secure,
      smtpUsername: "",
      smtpPassword: "",
      hourlyLimit: String(sender.hourly_limit),
    });

    setShowForm(true);
  };

  // Validate sender details.
  const validateForm = (): string | null => {
    if (!form.name.trim()) {
      return "Sender name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }

    if (!form.smtpHost.trim()) {
      return "SMTP host is required.";
    }

    const port = Number(form.smtpPort);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return "Enter a valid SMTP port.";
    }

    const hourlyLimit = Number(form.hourlyLimit);

    if (
      !Number.isInteger(hourlyLimit) ||
      hourlyLimit < 1 ||
      hourlyLimit > 10000
    ) {
      return "Hourly limit must be between 1 and 10000.";
    }

    if (!editingId && !form.smtpUsername.trim()) {
      return "SMTP username is required.";
    }

    if (!editingId && !form.smtpPassword.trim()) {
      return "SMTP password is required.";
    }

    return null;
  };

  // Create or update sender.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      smtpHost: form.smtpHost.trim(),
      smtpPort: Number(form.smtpPort),
      smtpSecure: form.smtpSecure,
      hourlyLimit: Number(form.hourlyLimit),
    };

    // Send credentials only when supplied.
    if (!editingId || form.smtpUsername.trim()) {
      payload.smtpUsername = form.smtpUsername.trim();
    }

    if (!editingId || form.smtpPassword) {
      payload.smtpPassword = form.smtpPassword;
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.patch(`/senders/${editingId}`, payload);
        setSuccess("Sender updated successfully.");
      } else {
        await api.post("/senders", payload);
        setSuccess("Sender created successfully.");
      }

      resetForm();
      await fetchSenders();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to save sender. Please check the details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate sender.
  const handleToggle = async (sender: Sender) => {
    setError("");
    setSuccess("");
    setUpdatingId(sender.id);

    try {
      await api.patch(`/senders/${sender.id}`, {
        isActive: !sender.is_active,
      });

      setSuccess(
        sender.is_active
          ? "Sender deactivated successfully."
          : "Sender activated successfully."
      );

      await fetchSenders();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to update sender status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTestSMTP = async (sender: Sender) => {
  setError("");
  setSuccess("");
  setTestingId(sender.id);

  try {
    const response = await api.post(
      `/senders/${sender.id}/test`
    );

    setSuccess(
      response.data.message || "SMTP connection verified successfully."
    );
  } catch (err: any) {
    setError(
      err.response?.data?.message ||
        "SMTP connection verification failed."
    );
  } finally {
    setTestingId(null);
  }
};
  // Delete sender.
  const handleDelete = async (sender: Sender) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${sender.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(sender.id);

    try {
      await api.delete(`/senders/${sender.id}`);

      setSuccess("Sender deleted successfully.");
      await fetchSenders();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to delete sender."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = senders.filter(
    (sender) => sender.is_active
  ).length;

  const inactiveCount = senders.length - activeCount;

  // Loading state.
  if (loading && senders.length === 0) {
    return (
      <Loader
        fullScreen
        message="Loading email senders..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Server size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Email Senders
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your SMTP accounts and sending configurations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => void fetchSenders()}
            disabled={loading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>

          <Button onClick={handleAdd}>
            <Plus size={17} className="mr-2" />
            Add Sender
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Senders
            </p>
            <Mail className="text-blue-500" size={22} />
          </div>

          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            {senders.length}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Active Senders
            </p>
            <CheckCircle2 className="text-green-500" size={22} />
          </div>

          <h2 className="mt-3 text-3xl font-bold text-green-600">
            {activeCount}
          </h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Inactive Senders
            </p>
            <Power className="text-slate-400" size={22} />
          </div>

          <h2 className="mt-3 text-3xl font-bold text-slate-500">
            {inactiveCount}
          </h2>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Sender" : "Add New Sender"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure your SMTP account details.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Basic information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <Mail size={18} className="text-blue-600" />
                Sender Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Sender Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="My Gmail Account"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <Server size={18} className="text-blue-600" />
                SMTP Configuration
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SMTP Host
                  </label>

                  <input
                    value={form.smtpHost}
                    onChange={(e) => updateField("smtpHost", e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SMTP Port
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={form.smtpPort}
                    onChange={(e) => updateField("smtpPort", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SMTP Username
                  </label>

                  <input
                    value={form.smtpUsername}
                    onChange={(e) =>
                      updateField("smtpUsername", e.target.value)
                    }
                    autoComplete="off"
                    placeholder={
                      editingId
                        ? "Leave blank to keep existing username"
                        : "Your SMTP username"
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required={!editingId}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    SMTP Password / App Password
                  </label>

                  <input
                    type="password"
                    value={form.smtpPassword}
                    onChange={(e) =>
                      updateField("smtpPassword", e.target.value)
                    }
                    autoComplete="new-password"
                    placeholder={
                      editingId
                        ? "Leave blank to keep existing password"
                        : "Enter SMTP password"
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required={!editingId}
                  />
                </div>
              </div>

              <label className="mt-5 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.smtpSecure}
                  onChange={(e) =>
                    updateField("smtpSecure", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-sm text-slate-700">
                  Use secure SMTP connection (SSL/TLS)
                </span>
              </label>

              <p className="mt-2 text-xs text-slate-500">
                Gmail normally uses port 587 with STARTTLS. In that
                configuration, leave this option unchecked.
              </p>
            </div>

            {/* Sending configuration */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
                <Clock size={18} className="text-blue-600" />
                Sending Configuration
              </h3>

              <div className="max-w-md">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hourly Email Limit
                </label>

                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={form.hourlyLimit}
                  onChange={(e) =>
                    updateField("hourlyLimit", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />

                <p className="mt-1 text-xs text-slate-500">
                  Maximum number of emails this sender can send per hour,
                  subject to the effective application rate limit.
                </p>
              </div>
            </div>

            {/* Security information */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={20} />

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Credential security
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-800">
                  SMTP credentials should be encrypted on the backend before
                  they are stored. The password is never displayed again
                  after saving.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Sender"
                    : "Save Sender"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sender List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Configured Senders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your connected SMTP accounts.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void fetchSenders()}
            disabled={loading}
          >
            <RefreshCw size={15} className="mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading senders...
          </div>
        ) : senders.length === 0 ? (
          <div className="px-5 py-16 text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MailPlus size={30} />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">
              No email senders found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add your first SMTP account to start scheduling emails.
            </p>

            <Button className="mt-5" onClick={handleAdd}>
              <Plus size={16} className="mr-2" />
              Add Your First Sender
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Sender</th>
                  <th className="px-5 py-4 font-semibold">SMTP Host</th>
                  <th className="px-5 py-4 font-semibold">Port</th>
                  <th className="px-5 py-4 font-semibold">Hourly Limit</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {senders.map((sender) => (
                  <tr
                    key={sender.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {sender.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {sender.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {sender.smtp_host}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {sender.smtp_port}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {sender.hourly_limit} / hour
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          sender.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            sender.is_active
                              ? "bg-green-500"
                              : "bg-slate-400"
                          }`}
                        />

                        {sender.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                          <button
                    type="button"
              onClick={() => void handleTestSMTP(sender)}
             disabled={
             testingId === sender.id ||
             updatingId === sender.id ||
           deletingId === sender.id
               }
            title="Test SMTP connection"
            className="rounded-lg border border-green-200 p-2 text-green-600 transition hover:bg-green-50 disabled:opacity-50"
>
         {testingId === sender.id ? (
             <Loader size="sm" />
             ) : (
    <ShieldCheck size={16} />
  )}
</button>
                        <button
                          type="button"
                          onClick={() => handleEdit(sender)}
                          title="Edit sender"
                          className="rounded-lg border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleToggle(sender)}
                          disabled={updatingId === sender.id}
                          title={sender.is_active ? "Deactivate sender" : "Activate sender"}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Power size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(sender)}
                          disabled={deletingId === sender.id}
                          title="Delete sender"
                          className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer information */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <Lock size={18} className="mt-0.5 shrink-0" />

        <p>
          Your SMTP credentials should be encrypted and stored securely by
          the backend. Use a provider-specific app password where required.
          Never expose SMTP credentials in frontend logs or API responses.
        </p>
      </div>

    </div>
  );
};

export default Senders;

