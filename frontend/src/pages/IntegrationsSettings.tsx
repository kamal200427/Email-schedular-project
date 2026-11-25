
import { useEffect, useState } from "react";
import api from "../services/api";

interface SlackSettings {
  channelId: string;
  channelName: string | null;
  isEnabled: boolean;
  notifyEmailSent: boolean;
  notifyEmailFailed: boolean;
  notifyRateLimited: boolean;
  notifyBatchCompleted: boolean;
}

const defaultSettings: SlackSettings = {
  channelId: "",
  channelName: "",
  isEnabled: false,
  notifyEmailSent: true,
  notifyEmailFailed: true,
  notifyRateLimited: true,
  notifyBatchCompleted: true,
};

const IntegrationsSettings = () => {
  const [settings, setSettings] = useState<SlackSettings>(defaultSettings);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const [settingsResponse, statusResponse] = await Promise.all([
          api.get("/slack/settings"),
          api.get("/slack/status"),
        ]);

        setSettings({
          ...defaultSettings,
          ...settingsResponse.data.data,
        });

        setConnected(Boolean(statusResponse.data.data?.connected));
      } catch (err) {
        console.error("Unable to load Slack settings:", err);
        setError("Unable to load Slack settings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const updateField = <K extends keyof SlackSettings>(
    field: K,
    value: SlackSettings[K]
  ) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (!settings.channelId.trim()) {
        setError("Enter your Slack channel ID first.");
        return;
      }

      const response = await api.put("/slack/settings", {
        ...settings,
        channelId: settings.channelId.trim(),
      });

      setSettings({
        ...defaultSettings,
        ...response.data.data,
      });

      setMessage("Slack notification settings saved successfully.");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to save Slack notification settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setTesting(true);
      setMessage("");
      setError("");

      if (!settings.channelId.trim()) {
        setError("Enter and save your Slack channel ID first.");
        return;
      }

      await api.post("/slack/notify", {
        channelId: settings.channelId.trim(),
        message: "Test notification from Email Job Scheduler. Slack is connected successfully!",
      });

      setMessage("Test notification sent. Check your Slack channel.");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to send the test notification."
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading integration settings...
      </div>
    );
  }

  const notificationOptions: {
    field:
      | "notifyEmailSent"
      | "notifyEmailFailed"
      | "notifyRateLimited"
      | "notifyBatchCompleted";
    label: string;
    description: string;
  }[] = [
    {
      field: "notifyEmailSent",
      label: "Email sent",
      description: "Notify me when an email is successfully sent.",
    },
    {
      field: "notifyEmailFailed",
      label: "Email failed",
      description: "Notify me when an email permanently fails.",
    },
    {
      field: "notifyRateLimited",
      label: "Rate limited",
      description: "Notify me when an email is delayed by rate limiting.",
    },
    {
      field: "notifyBatchCompleted",
      label: "Batch completed",
      description: "Notify me when an email batch has finished.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Integration Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure Slack notifications for your email scheduler.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Slack Connection
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect your Slack workspace to receive notifications.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              connected
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {connected ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.delete("/slack/disconnect");
                  setConnected(false);
                  setSettings((previous) => ({
                    ...previous,
                    isEnabled: false,
                  }));
                  setMessage("Slack account disconnected.");
                } catch {
                  setError("Unable to disconnect Slack.");
                }
              }}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Disconnect Slack
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.href = `${
                  api.defaults.baseURL
                }/slack/connect`;
              }}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Connect Slack
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Notification Configuration
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="channelId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Slack Channel ID
            </label>

            <input
              id="channelId"
              type="text"
              value={settings.channelId}
              onChange={(event) =>
                updateField("channelId", event.target.value)
              }
              placeholder="Example: C0123456789"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />

            <p className="mt-1 text-xs text-gray-500">
              Open your Slack channel details to find its channel ID. Invite
              your Slack app/bot to the channel before testing.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 p-4">
            <input
              type="checkbox"
              checked={settings.isEnabled}
              onChange={(event) =>
                updateField("isEnabled", event.target.checked)
              }
              disabled={!connected}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-medium text-gray-800">
                Enable Slack notifications
              </span>
              <span className="text-sm text-gray-500">
                Turn automatic Slack notifications on or off.
              </span>
            </span>
          </label>

          <div>
            <h3 className="font-medium text-gray-800">
              Notification Events
            </h3>

            <div className="mt-3 divide-y divide-gray-100">
              {notificationOptions.map((option) => (
                <label
                  key={option.field}
                  className="flex cursor-pointer items-start gap-3 py-4"
                >
                  <input
                    type="checkbox"
                    checked={settings[option.field]}
                    onChange={(event) =>
                      updateField(option.field, event.target.checked)
                    }
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">
                      {option.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving || !connected}
              className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

            <button
              type="button"
              onClick={sendTestNotification}
              disabled={testing || !connected}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testing ? "Sending..." : "Send Test Notification"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsSettings;
