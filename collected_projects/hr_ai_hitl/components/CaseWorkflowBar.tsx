const WORKFLOW_STEPS = [
  { id: "loaded", label: "Case loaded" },
  { id: "draft", label: "Draft generated" },
  { id: "review", label: "HRBP review" },
  { id: "written", label: "Written to record" },
] as const;

type CaseWorkflowBarProps = {
  hasDraft: boolean;
  drafting: boolean;
  written: boolean;
};

function stepState(
  index: number,
  { hasDraft, drafting, written }: CaseWorkflowBarProps,
): "done" | "current" | "pending" {
  if (written) return "done";

  if (index === 0) return "done";

  if (index === 1) {
    if (hasDraft) return "done";
    if (drafting) return "current";
    return "current";
  }

  if (index === 2) {
    if (hasDraft) return "current";
    return "pending";
  }

  return "pending";
}

export function CaseWorkflowBar(props: CaseWorkflowBarProps) {
  const { written } = props;

  return (
    <div className="case-workflow" aria-label="Demo workflow stages">
      <p className="case-workflow-label">Workflow (demo)</p>
      <ol className="case-workflow-steps">
        {WORKFLOW_STEPS.map((step, index) => {
          const state = stepState(index, props);
          return (
            <li
              key={step.id}
              className={`case-workflow-step ${state}${written && index === WORKFLOW_STEPS.length - 1 ? " complete-final" : ""}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="case-workflow-marker" aria-hidden>
                {state === "done" ? "✓" : index + 1}
              </span>
              <span className="case-workflow-text">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
