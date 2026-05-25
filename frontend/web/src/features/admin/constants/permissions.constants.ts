export const STANDARD_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export const ACTION_LABELS: Record<string, string> = {
  read: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  cancel: 'Cancel',
  manage: 'Manage',
  statistics: 'Stats',
  write: 'Write',
};
