import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StepRail } from './StepRail';
import { ColumnInspector } from './ColumnInspector';
import { CommandBar } from './CommandBar';
import { CommandPalette } from './CommandPalette';
import { LabStatusBar } from './LabStatusBar';
import { TransformParamModal } from '../DataCleaning/TransformParamModal';
import { buildLabActions } from './labActions';
import { evaluatePipeline, tracePipeline } from '../../utils/transformationEngine';
import { DataCleaningStep } from '../../types/dataCleaning';

const rows = [
  { id: 'a', city: ' Paris ', qty: null },
  { id: 'b', city: 'paris', qty: 4 },
  { id: 'b', city: 'paris', qty: 4 },
];
const mk = (id: string, type: DataCleaningStep['type'], name: string, params: any = {}): DataCleaningStep => ({ id, name, type, description: `${name} desc`, mFormula: '', params });
const steps = [mk('s0', 'source', 'Source'), mk('s1', 'remove_duplicates', 'Removed Duplicates', { columns: ['id', 'city', 'qty'] })];
const noop = () => {};

describe('Data Lab components render real data', () => {
  it('StepRail shows each step with what it did to the data', () => {
    const html = renderToStaticMarkup(
      <StepRail queryName="Orders" sourceType="csv" steps={steps} trace={tracePipeline(rows, steps)} selectedStepId="s1"
        onSelectStep={noop} onDeleteStep={noop} onRenameStep={noop} onEditStepSettings={noop} onMoveStepUp={noop} onMoveStepDown={noop} onQueryNameChange={noop} />
    );
    expect(html).toContain('Orders');
    expect(html).toContain('Removed Duplicates');
    expect(html).toContain('−1 row'); // 3 rows -> 2 rows
    expect(html).toContain('3 rows × 3 cols'); // source size
    expect(html).toContain('2 × 3'); // output
    expect(html).not.toContain('Viewing step'); // latest step selected
  });

  it('StepRail warns when you are looking at an earlier step', () => {
    const html = renderToStaticMarkup(
      <StepRail queryName="Orders" sourceType="csv" steps={steps} trace={tracePipeline(rows, steps)} selectedStepId="s0"
        onSelectStep={noop} onDeleteStep={noop} onRenameStep={noop} onEditStepSettings={noop} onMoveStepUp={noop} onMoveStepDown={noop} onQueryNameChange={noop} />
    );
    expect(html).toContain('Viewing step');
    expect(html).toContain('Latest');
  });

  it('ColumnInspector profiles the selected column and offers fixes from the actual values', () => {
    const ev = evaluatePipeline(rows, [steps[0]]);
    const html = renderToStaticMarkup(<ColumnInspector columns={ev.columns} rows={ev.rows} selectedColumn="city" onApply={noop} onSelectColumn={noop} />);
    expect(html).toContain('city');
    expect(html).toContain('Trim stray spaces');
    expect(html).toContain('Most common');
    expect(html).toContain('Apply');
  });

  it('ColumnInspector with no selection shows table-wide health and duplicate rows', () => {
    const ev = evaluatePipeline(rows, [steps[0]]);
    const html = renderToStaticMarkup(<ColumnInspector columns={ev.columns} rows={ev.rows} selectedColumn={null} onApply={noop} onSelectColumn={noop} />);
    expect(html).toContain('Data health');
    expect(html).toContain('Remove duplicate rows');
  });

  it('CommandBar lists every category and tells you what is targeted', () => {
    const actions = buildLabActions(new Proxy({}, { get: () => () => {} }) as any);
    const html = renderToStaticMarkup(<CommandBar actions={actions} selectedColumn="qty" selectedType="Whole Number" onOpenPalette={noop} />);
    ['Clean', 'Rows', 'Columns', 'Compute'].forEach((g) => expect(html).toContain(g));
    expect(html).toContain('Acting on');
    expect(html).toContain('qty');
  });

  it('CommandPalette renders and disables column actions when nothing is selected', () => {
    const actions = buildLabActions(new Proxy({}, { get: () => () => {} }) as any);
    const html = renderToStaticMarkup(<CommandPalette actions={actions} selectedColumn={null} onClose={noop} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Select a column first');
    expect(html).toContain('Remove duplicates');
  });

  it('LabStatusBar does not expose any code or formula drawer', () => {
    const html = renderToStaticMarkup(
      <LabStatusBar rows={3} columns={3} errors={0} stepIndex={1} stepCount={2} stepName="Removed Duplicates" score={98} />
    );
    expect(html).not.toContain('M code');
    expect(html).not.toContain('<pre');
    expect(html).toContain('Removed Duplicates');
  });

  it('TransformParamModal renders visual point-and-click selectors for custom columns', () => {
    const html = renderToStaticMarkup(
      <TransformParamModal
        isOpen={true}
        type="custom_column"
        column="qty"
        availableColumns={['id', 'city', 'qty']}
        onClose={noop}
        onApply={noop}
      />
    );
    expect(html).toContain('Math calculation');
    expect(html).toContain('Combine text columns');
    expect(html).toContain('<select');
    expect(html).toContain('no formula syntax required');
    expect(html).not.toContain('[Price]');
  });

  it('evaluatePipeline computes visual add_custom_column math and concat steps cleanly', () => {
    const customRows = [
      { first: 'Ada', last: 'Lovelace', price: 25, qty: 4 },
      { first: 'Grace', last: 'Hopper', price: 10, qty: 3 },
    ];
    const customSteps: DataCleaningStep[] = [
      mk('s0', 'source', 'Source'),
      mk('s1', 'add_custom_column', 'Added Total', {
        newColumnName: 'Total',
        formulaType: 'math',
        col1: 'price',
        col2: 'qty',
        operator: '*',
        constantValue: 0,
      }),
      mk('s2', 'add_custom_column', 'Added Taxed', {
        newColumnName: 'Taxed',
        formulaType: 'math',
        col1: 'Total',
        col2: '',
        operator: '+',
        constantValue: 5,
      }),
      mk('s3', 'add_custom_column', 'Added Full Name', {
        newColumnName: 'Full Name',
        formulaType: 'concat',
        col1: 'first',
        col2: 'last',
        operator: '+',
        constantValue: 0,
      }),
    ];
    const result = evaluatePipeline(customRows, customSteps);
    expect(result.rows[0].Total).toBe(100);
    expect(result.rows[0].Taxed).toBe(105);
    expect(result.rows[0]['Full Name']).toBe('Ada Lovelace');
    expect(result.rows[1].Total).toBe(30);
    expect(result.rows[1].Taxed).toBe(35);
    expect(result.rows[1]['Full Name']).toBe('Grace Hopper');
  });
});
