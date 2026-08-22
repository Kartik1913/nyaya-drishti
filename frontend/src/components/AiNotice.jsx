import Icon from "./Icon.jsx";

export default function AiNotice({
  text = "Administrative Triage View Only",
  className = "",
}) {
  return (
    <div
      className={`bg-surface-container-high text-on-surface-variant px-4 py-1.5 rounded-full flex items-center gap-2 border border-outline-variant/50 text-label-md font-label-md ${className}`}
    >
      <Icon name="info" size="16px" />
      <span>{text}</span>
    </div>
  );
}
