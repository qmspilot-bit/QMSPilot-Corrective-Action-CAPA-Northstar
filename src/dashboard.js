function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

export function calculateDashboardMetrics({ correctiveActions, preventiveActions, totalCost }) {
  const actions = [...correctiveActions, ...preventiveActions];
  const today = new Date().toISOString().slice(0, 10);

  return {
    openActions: actions.filter((action) => action.action && action.status !== "Complete").length,
    overdueActions: actions.filter(
      (action) => action.action && action.dueDate && action.dueDate < today && action.status !== "Complete"
    ).length,
    totalCost: Number(totalCost || 0)
  };
}

export function updateDashboard({ score, correctiveActions, preventiveActions, totalCost, form }) {
  const metrics = calculateDashboardMetrics({ correctiveActions, preventiveActions, totalCost });

  setText("dashboardReadiness", `${score}%`);
  setText("dashboardOpenActions", metrics.openActions);
  setText("dashboardOverdue", metrics.overdueActions);
  setText("dashboardCopq", `$${metrics.totalCost.toFixed(2)}`);

  setText(
    "pilotStatus",
    score >= 70 ? "Coordinating final review" : "Building CAPA record and workflow"
  );
  setText(
    "forgeStatus",
    form.elements.rootCause?.value.trim()
      ? "Root cause entered; validation review active"
      : "Problem and RCA review pending"
  );
  setText(
    "atlasStatus",
    metrics.openActions
      ? `${metrics.openActions} open action(s) under accountability`
      : "No open accountable actions"
  );
  setText(
    "sentinelStatus",
    form.elements.verificationResults?.value.trim()
      ? "Evidence available for closure review"
      : "Evidence and closure review pending"
  );
  setText(
    "vectorStatus",
    preventiveActions.some((action) => action.action)
      ? "Systemic actions identified"
      : "Systemic prevention review pending"
  );
}
