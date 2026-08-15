export const CRM_STATUSES = [
  { value: 'stage1', label: 'Stage 1 - Lead Submitted' },
  { value: 'stage2', label: 'Stage 2 - Assigned' },
  { value: 'stage3', label: 'Stage 3 - Contacted' },
  { value: 'stage4', label: 'Stage 4 - Payment & Billing Confirmed' },
  { value: 'stage5', label: 'Stage 5 - Service & Deal Finalized' },
  { value: 'stage6', label: 'Stage 6 - Documents Collected' },
  { value: 'stage7', label: 'Stage 7 - Payment Verification' },
  { value: 'stage8', label: 'Stage 8 - Approved / Rejection' },
];

export const CRM_STEPS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_review', label: 'In Review' },
  { value: 'closed', label: 'Closed' },
];

export const CRM_MODES = [
  { value: 'refundable', label: 'Refundable' },
  { value: 'non_refundable', label: 'Non-Refundable' },
];

export const CRM_DOC_TYPES = [
  'General', 'PAN Card', 'GST Certificate', 'Aadhaar', 'MOA/AOA', 'Bank Statement', 'Other',
];

export const CRM_STATUS_LABELS = Object.fromEntries(CRM_STATUSES.map((s) => [s.value, s.label]));
export const CRM_STEP_LABELS = Object.fromEntries(CRM_STEPS.map((s) => [s.value, s.label]));
export const CRM_MODE_LABELS = Object.fromEntries(CRM_MODES.map((s) => [s.value, s.label]));

export const statusBadgeClass = (status) => {
  if (status === 'stage8') return 'bg-green-100 text-green-700';
  if (['stage6', 'stage7'].includes(status)) return 'bg-blue-100 text-blue-700';
  if (['stage4', 'stage5'].includes(status)) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
};
