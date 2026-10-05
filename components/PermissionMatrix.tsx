import { MODULES, PERMISSIONS, PermMatrix } from '../lib/rolesData';

type Props = {
  matrix: PermMatrix;
  readOnly?: boolean;
  onToggle?: (modKey: string, perm: string) => void;
};

export default function PermissionMatrix({ matrix, readOnly = false, onToggle }: Props) {
  return (
    <div className="rm-table-wrap">
      <table className="rm-table">
        <thead>
          <tr>
            <th className="rm-th-module">Module</th>
            {PERMISSIONS.map(p => (
              <th key={p} className="rm-th-perm">{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map(mod => {
            // Blue section header (Application, Human Resources, …)
            if (mod.section) {
              return (
                <tr key={mod.key} className="rm-section-row">
                  <td colSpan={PERMISSIONS.length + 1}>{mod.label}</td>
                </tr>
              );
            }

            const level = mod.level ?? 1;

            // Group parent (has children but no checkboxes of its own)
            if (mod.group) {
              return (
                <tr key={mod.key} className={`rm-data-row rm-group-row rm-level-${level}`}>
                  <td className="rm-td-module">
                    <span className="rm-indent" style={{ paddingLeft: (level - 1) * 18 }}>
                      {level > 1 && <span className="rm-sub-indent">└</span>}
                      {mod.label}
                    </span>
                  </td>
                  {PERMISSIONS.map(perm => (
                    <td key={perm} className="rm-td-perm"><span className="rm-na">—</span></td>
                  ))}
                </tr>
              );
            }

            return (
              <tr key={mod.key} className={`rm-data-row rm-level-${level} ${level > 1 ? 'rm-sub-row' : ''}`}>
                <td className="rm-td-module">
                  <span className="rm-indent" style={{ paddingLeft: (level - 1) * 18 }}>
                    {level > 1 && <span className="rm-sub-indent">└</span>}
                    {mod.label}
                  </span>
                </td>
                {PERMISSIONS.map(perm => {
                  const applicable = mod.perms.includes(perm);
                  const checked    = matrix[mod.key]?.[perm] ?? false;
                  return (
                    <td key={perm} className="rm-td-perm">
                      {applicable ? (
                        readOnly ? (
                          checked
                            ? <i className="bi bi-check-circle-fill" style={{ color: '#22c55e', fontSize: 15 }}></i>
                            : <i className="bi bi-circle" style={{ color: '#d1d5db', fontSize: 15 }}></i>
                        ) : (
                          <input
                            type="checkbox"
                            className="rm-checkbox"
                            checked={checked}
                            onChange={() => onToggle?.(mod.key, perm)}
                          />
                        )
                      ) : (
                        <span className="rm-na">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
