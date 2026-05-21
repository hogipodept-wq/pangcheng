import { Badge } from './ui';
import {
  PROJECT_STATUS_LABELS,
  PROCUREMENT_STATUS_LABELS,
  QUOTATION_STATUS_LABELS,
  type ProjectStatus,
  type ProcurementStatus,
  type QuotationStatus,
} from '@pangcheng/shared';

type Tone = 'gray' | 'red' | 'green' | 'blue' | 'amber' | 'purple' | 'slate';

const projectTone: Record<ProjectStatus, Tone> = {
  planning: 'amber',
  in_progress: 'blue',
  completed: 'green',
  closed: 'slate',
};

const procurementTone: Record<ProcurementStatus, Tone> = {
  draft: 'gray',
  pending: 'amber',
  approved: 'blue',
  ordered: 'purple',
  received: 'green',
  completed: 'green',
  cancelled: 'red',
};

const quotationTone: Record<QuotationStatus, Tone> = {
  draft: 'gray',
  submitted: 'amber',
  approved: 'blue',
  signed: 'green',
  rejected: 'red',
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const s = status as ProjectStatus;
  return <Badge tone={projectTone[s] ?? 'gray'}>{PROJECT_STATUS_LABELS[s] ?? status}</Badge>;
}

export function ProcurementStatusBadge({ status }: { status: string }) {
  const s = status as ProcurementStatus;
  return (
    <Badge tone={procurementTone[s] ?? 'gray'}>{PROCUREMENT_STATUS_LABELS[s] ?? status}</Badge>
  );
}

export function QuotationStatusBadge({ status }: { status: string }) {
  const s = status as QuotationStatus;
  return <Badge tone={quotationTone[s] ?? 'gray'}>{QUOTATION_STATUS_LABELS[s] ?? status}</Badge>;
}
