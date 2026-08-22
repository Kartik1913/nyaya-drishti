import Icon from "./Icon.jsx";

export default function UserActions({ hasUnread = true }) {
  return (
    <div className="flex items-center gap-1 text-on-surface-variant">
      <button
        type="button"
        aria-label="Notifications"
        className="w-10 h-10 flex items-center justify-center hover:text-primary hover:bg-surface-container-highest rounded-full transition-colors relative"
      >
        <Icon name="notifications" />
        {hasUnread && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        )}
      </button>
      <button
        type="button"
        aria-label="Account"
        className="w-10 h-10 flex items-center justify-center hover:text-primary hover:bg-surface-container-highest rounded-full transition-colors"
      >
        <Icon name="account_circle" />
      </button>
    </div>
  );
}
