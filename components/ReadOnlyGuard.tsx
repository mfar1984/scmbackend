import { usePermissions } from '../lib/usePermissions';

/**
 * Wraps form content and disables every input/select/textarea/button inside it
 * when the current role lacks the given permission (default: Update) on the
 * module. Uses a native <fieldset disabled> so it covers all controls without
 * touching each field. Anchor links (e.g. "View Live") stay clickable.
 *
 * While permissions are still loading we keep the form enabled to avoid a
 * flash of disabled fields; Super Admin is always editable.
 */
export default function ReadOnlyGuard({
  moduleKey,
  perm = 'Update',
  children,
}: {
  moduleKey: string;
  perm?: string;
  children: React.ReactNode;
}) {
  const { can, loaded } = usePermissions();
  const editable = !loaded || can(moduleKey, perm);

  return (
    <fieldset
      disabled={!editable}
      className={editable ? undefined : 'rd-locked'}
      style={{ border: 0, margin: 0, padding: 0, minInlineSize: 'auto' }}
    >
      {!editable && (
        <div className="rd-readonly-note">
          <i className="bi bi-eye-fill"></i>
          You have read-only access to this page. Editing is disabled.
        </div>
      )}
      {children}
    </fieldset>
  );
}
