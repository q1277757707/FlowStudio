import { ASSIGNEE, getAssigneeType, newRid } from './assignee';
import { NODE } from './constants';
import type { WorkflowAssignee, WorkflowNode } from './types';

function ensureAssignee(item?: WorkflowAssignee): WorkflowAssignee {
  if (!item) return { rid: newRid(), assigneeType: ASSIGNEE.SELF };
  if (!item.rid) item.rid = newRid();
  return item;
}

/** 对齐 ref ApproverDrawer：根据审批人数量与类型修正 multiInstanceApprovalType */
export function syncApprovalMultiInstanceType(node: WorkflowNode) {
  if (node.type !== NODE.APPROVE) return;
  const assignees = node.assignees ?? [];
  if (!assignees.length) return;

  const firstType = getAssigneeType(assignees[0], 'approve');
  const current = node.multiInstanceApprovalType ?? 0;

  if (assignees.length === 1) {
    if ([ASSIGNEE.MULTISTEP_LEADER, ASSIGNEE.MULTISTEP_DEPARTMENT_LEADER].includes(firstType as never)) {
      node.multiInstanceApprovalType = 3;
      return;
    }
    if ([ASSIGNEE.ROLE, ASSIGNEE.ASSIGNEE, ASSIGNEE.INITIATOR_CHOICE].includes(firstType as never) && [0, 3].includes(current)) {
      if (current === 0) node.multiInstanceApprovalType = 1;
    }
    return;
  }

  if (current === 0) node.multiInstanceApprovalType = 1;

  const sameType = assignees.every((item) => getAssigneeType(item, 'approve') === firstType);
  if (!sameType && node.multiInstanceApprovalType === 3) {
    node.multiInstanceApprovalType = 1;
  }
}

export function syncTransactMultiInstanceType(node: WorkflowNode) {
  if (node.type !== NODE.TRANSACT) return;
  const list = node.transactors ?? [];
  if (list.length > 1 && (node.multiInstanceApprovalType ?? 0) === 0) {
    node.multiInstanceApprovalType = 1;
  }
}

export function normalizeWorkflowNodeDraft(node: WorkflowNode): WorkflowNode {
  const draft = JSON.parse(JSON.stringify(node)) as WorkflowNode;

  if (draft.type === NODE.APPROVE) {
    draft.approvalType ??= 0;
    draft.multiInstanceApprovalType ??= 0;
    draft.flowNodeNoAuditorType ??= 0;
    draft.flowNodeSelfAuditorType ??= 0;
    draft.assignable ??= true;
    draft.signable ??= true;
    draft.backable ??= true;
    draft.assignees = (draft.assignees?.length ? draft.assignees : [{ rid: newRid(), assigneeType: ASSIGNEE.SELF }]).map(ensureAssignee);
    syncApprovalMultiInstanceType(draft);
  }

  if (draft.type === NODE.COPY) {
    draft.ccs = (draft.ccs?.length ? draft.ccs : [{ rid: newRid(), ccType: ASSIGNEE.SELF, assigneeType: ASSIGNEE.SELF }]).map((item) => {
      const row = ensureAssignee(item);
      row.ccType ??= row.assigneeType ?? ASSIGNEE.SELF;
      return row;
    });
  }

  if (draft.type === NODE.TRANSACT) {
    draft.approvalType ??= 0;
    draft.multiInstanceApprovalType ??= 0;
    draft.flowNodeNoAuditorType ??= 2;
    draft.assignable ??= true;
    draft.transactors = (draft.transactors?.length ? draft.transactors : [{ rid: newRid(), transactorType: ASSIGNEE.SELF, assigneeType: ASSIGNEE.SELF }]).map((item) => {
      const row = ensureAssignee(item);
      row.transactorType ??= row.assigneeType ?? ASSIGNEE.SELF;
      return row;
    });
    syncTransactMultiInstanceType(draft);
  }

  return draft;
}
