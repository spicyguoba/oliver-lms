"use client";
import { useEffect, useRef, useState } from "react";
import { api, ErrorBox } from "./ui";

export default function AccountsPanel({ busy, act, learners }) {
  const formHeading = useRef(null);
  const [accounts, setAccounts] = useState([]),
    [edit, setEdit] = useState(null),
    [query, setQuery] = useState(""),
    [roleFilter, setRoleFilter] = useState("all"),
    [statusFilter, setStatusFilter] = useState("all"),
    [error, setError] = useState("");
  useEffect(() => {
    if (edit) {
      formHeading.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
      formHeading.current?.focus({ preventScroll: true });
    }
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
  const visibleAccounts = accounts.filter((a) => {
    const learner =
      learners.find((l) => l.id === a.learnerId)?.name || "All learners";
    return (
      `${a.username} ${learner}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (roleFilter === "all" || a.role === roleFilter) &&
      (statusFilter === "all" ||
        (statusFilter === "enabled" ? a.enabled : !a.enabled))
    );
  });
  return (
    <section>
      <p className="eyebrow">ADMINISTRATOR ACCESS</p>
      <h1>User accounts</h1>
      <p>
        Students see only their own world. Parents manage only their linked
        student. Admin manages every account and learner.
      </p>
      <ErrorBox message={error} />
      <div className="white-card account-search">
        <label>
          Find an account
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Username or learner name"
          />
        </label>
        <label>
          Role
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="parent">Parent</option>
            <option value="student">Student</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => {
            setEdit(null);
            formHeading.current?.scrollIntoView({ block: "start" });
            formHeading.current?.focus({ preventScroll: true });
          }}
        >
          + Add account
        </button>
      </div>
      <p role="status">
        {visibleAccounts.length} of {accounts.length} accounts shown
      </p>
      <div className="white-card account-list">
        {!visibleAccounts.length && (
          <p>No accounts match. Try another name or clear the filters.</p>
        )}
        {visibleAccounts.map((a) => (
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
      <h2 className="section" ref={formHeading} tabIndex={-1}>
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
        <small>
          3–32 characters: start with a letter, then use letters, numbers, _ or
          -.
        </small>
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
        an existing learning profile. Changing a username or password signs that
        account out on its other devices. Leave the password blank to keep it.
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
