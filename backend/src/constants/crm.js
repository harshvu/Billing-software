const CRM_STATUSES = [
  { value: 'stage1', label: 'Stage 1 - Lead Submitted' },
  { value: 'stage2', label: 'Stage 2 - Assigned' },
  { value: 'stage3', label: 'Stage 3 - Contacted' },
  { value: 'stage4', label: 'Stage 4 - Payment & Billing Confirmed' },
  { value: 'stage5', label: 'Stage 5 - Service & Deal Finalized' },
  { value: 'stage6', label: 'Stage 6 - Documents Collected' },
  { value: 'stage7', label: 'Stage 7 - Payment Verification' },
  { value: 'stage8', label: 'Stage 8 - Approved / Rejection' },
];

const CRM_STEPS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_review', label: 'In Review' },
  { value: 'closed', label: 'Closed' },
];

const CRM_MODES = [
  { value: 'refundable', label: 'Refundable' },
  { value: 'non_refundable', label: 'Non-Refundable' },
];

const CRM_STATUS_VALUES = CRM_STATUSES.map((s) => s.value);
const CRM_STEP_VALUES = CRM_STEPS.map((s) => s.value);
const CRM_MODE_VALUES = CRM_MODES.map((s) => s.value);

module.exports = {
  CRM_STATUSES,
  CRM_STEPS,
  CRM_MODES,
  CRM_STATUS_VALUES,
  CRM_STEP_VALUES,
  CRM_MODE_VALUES,
};
