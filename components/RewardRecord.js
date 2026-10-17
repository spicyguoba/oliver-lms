"use client";

const statusLabels = {
  pending: "Awaiting approval",
  approved: "Approved · not yet completed",
  completed: "Completed",
  refunded: "Stars refunded",
};
export default function RewardRecord({
  request: r,
  today,
  timezone,
  busy,
  onAction,
}) {
  const requestedDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(r.at));
  const completed = r.status === "completed";
  return (
    <form
      className="reward-record"
      onSubmit={(e) => {
        e.preventDefault();
        const input = Object.fromEntries(new FormData(e.currentTarget));
        const action = e.nativeEvent.submitter?.value || "note";
        onAction(
          "admin/redemption",
          { ...input, id: r.id, action },
          action === "complete"
            ? "Reward marked completed. No extra stars charged."
            : action === "refund"
              ? "Stars refunded."
              : action === "approve"
                ? "Reward approved. Mark completed after you enjoy it."
                : "Parent note saved.",
        );
      }}
    >
      <div className="section-heading">
        <h3>{r.title}</h3>
        <span className="tag">{statusLabels[r.status] || r.status}</span>
      </div>
      <p>
        {r.cost} stars{" "}
        {r.status === "refunded" ? "returned" : "set aside when requested"} ·
        Requested{" "}
        {new Date(r.at).toLocaleDateString("en-US", { timeZone: timezone })}
      </p>
      {completed ? (
        <p>
          <strong>
            Enjoyed on{" "}
            {new Date(r.completedDay + "T12:00:00Z").toLocaleDateString(
              "en-US",
              {
                timeZone: "UTC",
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            )}
          </strong>
        </p>
      ) : (
        r.status !== "refunded" && (
          <label>
            Completion date
            <input
              name="completedDay"
              type="date"
              defaultValue={today}
              min={requestedDay}
              max={today}
            />
          </label>
        )
      )}
      <label>
        Parent note (private)
        <textarea
          name="parentNote"
          defaultValue={r.parentNote || ""}
          maxLength={1000}
          rows={3}
          placeholder="For example: Finished our bedtime story together. Oliver chose the book."
        />
      </label>
      <small>
        Only the parent dashboard and export show this note. Oliver sees the
        completion and date.
      </small>
      <div className="row reward-record-actions">
        {!completed && r.status !== "refunded" && (
          <button
            className="button"
            name="action"
            value="complete"
            disabled={busy}
          >
            ✓ Mark completed
          </button>
        )}
        <button
          className="button secondary"
          name="action"
          value="note"
          disabled={busy}
        >
          Save parent note
        </button>
        {r.status === "pending" && (
          <>
            <button
              className="button secondary"
              name="action"
              value="approve"
              disabled={busy}
            >
              Approve for later
            </button>
            <button
              className="text-button"
              name="action"
              value="refund"
              disabled={busy}
            >
              Refund stars
            </button>
          </>
        )}
      </div>
    </form>
  );
}
