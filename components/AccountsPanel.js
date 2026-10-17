"use client";
import { useEffect, useRef, useState } from "react";
import { api, ErrorBox } from "./ui";

export default function AccountsPanel({ busy, act, learners }) {
  const formHeading = useRef(null);
  const [accounts, setAccounts] = useState([]),
    [edit, setEdit] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (edit) formHeading.current?.scrollIntoView({ block: "start" });
  }, [edit?.id]);
  async function load() {
    const d = await api("admin/accounts");
    setAccounts(d.accounts);
  }
  useEffect(() => {
    let active = true;
    api("admin/accounts")
      .then((d) => {
        if (active) setAccounts(d.accounts);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section>
      <p className="eyebrow">ADMINISTRATOR ACCESS</p>
      <h1>User accounts</h1>
      <p>
        Students see only their own world. Parents manage only their linked
        student. Admin manages every account and learner.
      </p>
      <ErrorBox message={error} />
      <div className="white-card account-list">
        {accounts.map((a) => (
          <div className="list-row" key={a.id}>
            <div className="grow">
              <strong>{a.username}</strong>
              <p>
                {a.role} ·{" "}
                {a.role === "admin"
                  ? "All learners"
                  : learners.find((l) => l.id === a.learnerId)?.name}{" "}
                ·{" "}
                {a.enabled
                  ? a.needsPassword
                    ? "Password needed"
                    : "Enabled"
                  : "Disabled"}
              </p>
            </div>
            <button
              className="button secondary small"
              onClick={() => setEdit(a)}
              disabled={busy}
            >
              Manage {a.username}
            </button>
          </div>
        ))}
      </div>
      <h2 className="section" ref={formHeading}>
        {edit ? `Manage ${edit.username}` : "Add an account"}
      </h2>
      <AccountForm
        key={`${edit?.id || "new"}-${edit?.username || ""}`}
        account={edit}
        learners={learners}
        busy={busy}
        onCancel={() => setEdit(null)}
        onSave={async (body) => {
          const result = await act(
            "admin/account",
            body,
            "Account saved. Changed credentials and access revoke older sessions.",
          );
          if (result) {
            setEdit(null);
            try {
              await load();
            } catch (e) {
              setError(e.message);
            }
          }
          window.scrollTo({ top: 0 });
        }}
      />
    </section>
  );
}
function AccountForm({ account: a, learners, busy, onSave, onCancel }) {
  const [role, setRole] = useState(a?.role || "student");
  const admin = a?.role === "admin";
  return (
    <form
      className="white-card form-stack account-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        onSave({
          id: a?.id,
          username: form.get("username"),
          role,
          learnerId: admin ? null : form.get("learnerId"),
          enabled: admin || form.get("enabled") === "on",
          password: form.get("password"),
        });
      }}
    >
      <label>
        Username
        <input
          name="username"
          defaultValue={a?.username || ""}
          readOnly={admin}
          autoCapitalize="none"
          autoComplete="off"
          pattern="[a-z][a-z0-9_-]{2,31}"
          minLength={3}
          maxLength={32}
          required
        />
      </label>
      <label>
        Account role
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={admin}
        >
          {admin ? (
            <option value="admin">Admin</option>
          ) : (
            <>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </>
          )}
        </select>
      </label>
      {!admin && (
        <label>
          Linked learner
          <select
            name="learnerId"
            defaultValue={a?.learnerId || learners[0]?.id}
          >
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        {a ? "New password (leave blank to keep current)" : "Password"}
        <input
          name="password"
          type="password"
          minLength={8}
          maxLength={200}
          autoComplete="new-password"
          required={!a}
        />
      </label>
      <label className="check-label">
        <input
          name="enabled"
          type="checkbox"
          defaultChecked={a?.enabled ?? true}
          disabled={admin}
        />{" "}
        Account enabled
      </label>
      <p>
        Disabling an account keeps all learning history. Each login is linked to
        an existing learning profile.
      </p>
      <div className="row">
        <button className="button" disabled={busy}>
          {a ? "Save account" : "Create account"}
        </button>
        {a && (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel editing
          </button>
        )}
      </div>
    </form>
  );
}
