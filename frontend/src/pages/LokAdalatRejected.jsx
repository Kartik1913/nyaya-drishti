import LokAdalatDecisionList from "../components/LokAdalatDecisionList.jsx";

export default function LokAdalatRejected() {
  return (
    <LokAdalatDecisionList
      decisionType="rejected"
      title="Rejected Notices"
      emptyText="No notices rejected yet."
    />
  );
}
