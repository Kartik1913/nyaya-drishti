import LokAdalatDecisionList from "../components/LokAdalatDecisionList.jsx";

export default function LokAdalatApproved() {
  return (
    <LokAdalatDecisionList
      decisionType="approved"
      title="Approved Notices"
      emptyText="No notices approved yet."
    />
  );
}
