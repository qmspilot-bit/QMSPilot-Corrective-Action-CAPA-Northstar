export const REQUIRED_NAMES = [
  "capaNumber",
  "site",
  "source",
  "owner",
  "problemStatement",
  "containment",
  "rootCause",
  "verificationMethod"
];

export function calculateReadiness(form, correctiveActions, preventiveActions) {
  let total = REQUIRED_NAMES.length + 7;
  let complete = 0;

  REQUIRED_NAMES.forEach((name) => {
    if (String(form.elements[name]?.value || "").trim()) complete += 1;
  });

  if (correctiveActions.some((item) => item.action && item.owner && item.dueDate)) complete += 1;
  if (preventiveActions.some((item) => item.action)) complete += 1;

  [
    "rootCauseValidation",
    "extentReview",
    "successCriteria",
    "verificationResults",
    "qualityApproval"
  ].forEach((name) => {
    if (form.elements[name]?.value.trim()) complete += 1;
  });

  return Math.round((complete / total) * 100);
}

export function validateCapa(form, correctiveActions) {
  const errors = [];

  REQUIRED_NAMES.forEach((name) => {
    if (!String(form.elements[name]?.value || "").trim()) errors.push(name);
  });

  if (!correctiveActions.some((item) => item.action && item.owner && item.dueDate)) {
    errors.push("at least one corrective action with owner and due date");
  }

  if (form.elements.finalStatus.value === "Closed" && form.elements.effective.value !== "Yes") {
    errors.push("effectiveness must be Yes before closure");
  }

  return errors;
}
