export function hasStageResponseAndEvidence(response?: string, evidence?: string) {
  return Boolean(response?.trim() && evidence?.trim());
}
