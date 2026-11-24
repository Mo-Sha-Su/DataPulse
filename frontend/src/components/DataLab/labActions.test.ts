import { describe, expect, it, vi } from 'vitest';
import { GROUPS, buildLabActions, disabledReason, searchActions, typeFamily, LabHandlers } from './labActions';

const handlers = (): LabHandlers & Record<string, any> => {
  const fn = () => vi.fn();
  return {
    newSource: fn(), removeColumn: fn(), duplicateColumn: fn(), renameColumn: fn(), moveColumn: fn(),
    openSplit: fn(), openMerge: fn(), openReplaceValues: fn(), openReplaceErrors: fn(), openReplaceNulls: fn(),
    openRemoveDuplicates: fn(), openManageRows: fn(), sort: fn(), fillDown: fn(), fillUp: fn(), text: fn(), number: fn(),
    date: fn(), addCustomColumn: fn(), editCell: fn(), clearCell: fn(),
  } as any;
};

describe('Data Lab action registry', () => {
  const h = handlers();
  const actions = buildLabActions(h);

  it('has unique ids and every action belongs to a known group', () => {
    const ids = actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(GROUPS.map((g) => g.id));
    actions.forEach((a) => expect(groups.has(a.group)).toBe(true));
    GROUPS.forEach((g) => expect(actions.some((a) => a.group === g.id)).toBe(true));
  });

  it('wires each action to its handler with the right argument', () => {
    const run = (id: string) => actions.find((a) => a.id === id)!.run();
    run('trim'); expect(h.text).toHaveBeenCalledWith('trim');
    run('title'); expect(h.text).toHaveBeenCalledWith('capitalize');
    run('sortdesc'); expect(h.sort).toHaveBeenCalledWith('desc');
    run('keeptop'); expect(h.openManageRows).toHaveBeenCalledWith('keep_top');
    run('removealt'); expect(h.openManageRows).toHaveBeenCalledWith('remove_alternate');
    run('left'); expect(h.moveColumn).toHaveBeenCalledWith('left');
    run('round'); expect(h.number).toHaveBeenCalledWith('round');
    run('date_month_name'); expect(h.date).toHaveBeenCalledWith('month_name');
    run('dupes'); expect(h.openRemoveDuplicates).toHaveBeenCalled();
    run('edit_cell'); expect(h.editCell).toHaveBeenCalled();
    run('clear_cell'); expect(h.clearCell).toHaveBeenCalled();
  });

  it('explains why an action is unavailable', () => {
    const trim = actions.find((a) => a.id === 'trim')!;
    const math = actions.find((a) => a.id === 'math')!;
    const month = actions.find((a) => a.id === 'date_month')!;
    const merge = actions.find((a) => a.id === 'merge')!;
    expect(disabledReason(trim, null)).toMatch(/select a column/i);
    expect(disabledReason(trim, 'Region', 'Text')).toBeNull();
    expect(disabledReason(math, 'Region', 'Text')).toMatch(/number/i);
    expect(disabledReason(math, 'Qty', 'Whole Number')).toBeNull();
    expect(disabledReason(month, 'Name', 'Text')).toMatch(/date/i);
    expect(disabledReason(month, 'When', 'Date')).toBeNull();
    expect(disabledReason(merge, null)).toBeNull(); // table-level actions never need a column
  });

  it('enforces single-cell scope and cell-required constraints accurately', () => {
    const editCell = actions.find((a) => a.id === 'edit_cell')!;
    const clearCell = actions.find((a) => a.id === 'clear_cell')!;
    const trim = actions.find((a) => a.id === 'trim')!;
    const replace = actions.find((a) => a.id === 'replace')!;
    const math = actions.find((a) => a.id === 'math')!;
    const split = actions.find((a) => a.id === 'split')!;
    const dupes = actions.find((a) => a.id === 'dupes')!;
    const sortAsc = actions.find((a) => a.id === 'sortasc')!;

    // Needs a selected cell when no cell is selected
    expect(disabledReason(editCell, 'Region', 'Text', undefined, { scope: 'column', hasSelectedCell: false })).toMatch(/select a cell/i);
    expect(disabledReason(clearCell, 'Region', 'Text', undefined, { scope: 'column', hasSelectedCell: false })).toMatch(/select a cell/i);

    // Enabled when a cell is selected
    expect(disabledReason(editCell, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toBeNull();
    expect(disabledReason(clearCell, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toBeNull();

    // Cell-compatible operations work in cell scope (respecting column type constraints)
    expect(disabledReason(trim, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toBeNull();
    expect(disabledReason(replace, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toBeNull();
    expect(disabledReason(math, 'Qty', 'Whole Number', undefined, { scope: 'cell', hasSelectedCell: true })).toBeNull();

    // Structural / multi-row operations are blocked when scoped to a single cell
    expect(disabledReason(split, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toMatch(/entire column/i);
    expect(disabledReason(dupes, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toMatch(/entire column/i);
    expect(disabledReason(sortAsc, 'Region', 'Text', undefined, { scope: 'cell', hasSelectedCell: true })).toMatch(/entire column/i);
  });

  it('maps column types to families', () => {
    expect(typeFamily('Text')).toBe('text');
    expect(typeFamily('Currency')).toBe('number');
    expect(typeFamily('Date/Time')).toBe('date');
    expect(typeFamily('Boolean')).toBe('other');
    expect(typeFamily(undefined)).toBe('other');
  });

  it('searches by label, keyword and hint, best match first', () => {
    expect(searchActions(actions, 'dup')[0].id).toBe('duplicate');
    expect(searchActions(actions, 'dedupe').map((a) => a.id)).toContain('dupes');
    expect(searchActions(actions, 'whitespace')[0].id).toBe('trim');
    expect(searchActions(actions, 'floor').map((a) => a.id)).toEqual(['rounddown']);
    expect(searchActions(actions, 'zzzz')).toEqual([]);
    expect(searchActions(actions, '  ')).toHaveLength(actions.length);
    expect(searchActions(actions, 'fill').map((a) => a.id)).toEqual(expect.arrayContaining(['nulls', 'filldown', 'fillup']));
  });
});
