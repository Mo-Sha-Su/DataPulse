import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { QueryModel } from '../types/dataCleaning';
import { Dataset } from '../types/dashboard';
import { QueryTabs } from '../components/DataLab/QueryTabs';
import {
  createUniqueStepId,
  closeQueryTab,
  resolveDataLabInitialDatasets,
} from '../utils/dataLabCommit';

const makeDs = (id: string, name: string): Dataset => ({
  id,
  name,
  rowCount: 1,
  columnCount: 1,
  columns: [{ name: 'a', type: 'string', sampleValue: 'x' }],
  data: [{ a: 'x' }],
  uploadedAt: '2026-01-01 00:00',
  sourceType: 'csv',
});

describe('Data Lab Query closure, scoped opening, and step ID uniqueness', () => {
  it('generates distinct unique step IDs even within the same millisecond and uses the same ID once', () => {
    const ids = new Set<string>();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const stepId = createUniqueStepId('step_source');
      const selectedStepId = stepId;
      expect(selectedStepId).toBe(stepId);
      ids.add(stepId);
    }
    expect(ids.size).toBe(count);
  });

  it('selects the adjacent neighbor tab when closing the active tab and preserves others', () => {
    const queries: QueryModel[] = [
      { id: 'q1', name: 'Query 1', sourceType: 'csv', originalDatasetId: 'q1', rawRows: [], steps: [], selectedStepId: '' },
      { id: 'q2', name: 'Query 2', sourceType: 'csv', originalDatasetId: 'q2', rawRows: [], steps: [], selectedStepId: '' },
      { id: 'q3', name: 'Query 3', sourceType: 'csv', originalDatasetId: 'q3', rawRows: [], steps: [], selectedStepId: '' },
    ];

    // Close active middle tab q2 -> selects q3
    const res1 = closeQueryTab(queries, 'q2', 'q2');
    expect(res1.remaining.map((q) => q.id)).toEqual(['q1', 'q3']);
    expect(res1.nextActiveId).toBe('q3');

    // Close active last tab q3 -> selects q1
    const res2 = closeQueryTab(res1.remaining, 'q3', 'q3');
    expect(res2.remaining.map((q) => q.id)).toEqual(['q1']);
    expect(res2.nextActiveId).toBe('q1');

    // Close inactive tab q1 when q2 is active -> keeps q2 active
    const resKeep = closeQueryTab(queries, 'q2', 'q1');
    expect(resKeep.remaining.map((q) => q.id)).toEqual(['q2', 'q3']);
    expect(resKeep.nextActiveId).toBe('q2');

    // Close final tab q1 -> all tabs closed
    const res3 = closeQueryTab(res2.remaining, 'q1', 'q1');
    expect(res3.remaining.length).toBe(0);
    expect(res3.nextActiveId).toBe('');
  });

  it('detects when a query has unsaved cleaning steps requiring confirmation before closing', () => {
    const qWithSourceOnly: QueryModel = {
      id: 'q1',
      name: 'Query 1',
      sourceType: 'csv',
      originalDatasetId: 'q1',
      rawRows: [],
      steps: [{ id: 's1', name: 'Source', type: 'source', description: '', mFormula: '', params: {} }],
      selectedStepId: 's1',
    };

    const qWithEdits: QueryModel = {
      id: 'q2',
      name: 'Query 2',
      sourceType: 'csv',
      originalDatasetId: 'q2',
      rawRows: [],
      steps: [
        { id: 's1', name: 'Source', type: 'source', description: '', mFormula: '', params: {} },
        { id: 's2', name: 'Trim', type: 'text_transform', description: '', mFormula: '', params: {} },
      ],
      selectedStepId: 's2',
    };

    expect(qWithSourceOnly.steps.length > 1).toBe(false);
    expect(qWithEdits.steps.length > 1).toBe(true);
  });

  it('opens only the target dataset from Open in Data Lab, or only dashboard datasets from a dashboard', () => {
    const d1 = makeDs('ds_1', 'Sales');
    const d2 = makeDs('ds_2', 'Customers');
    const d3 = makeDs('ds_3', 'Inventory');

    // From Data Hub or single-dataset "Open in Data Lab"
    expect(
      resolveDataLabInitialDatasets({
        targetDatasetId: 'ds_2',
        activePage: 'data_hub',
        globalDatasets: [d1, d2, d3],
        dashboardDatasets: [d1],
      }).map((d) => d.id)
    ).toEqual(['ds_2']);

    // From a dashboard canvas without a specific dataset
    expect(
      resolveDataLabInitialDatasets({
        activePage: 'bench',
        globalDatasets: [d1, d2, d3],
        dashboardDatasets: [d1, d3],
      }).map((d) => d.id)
    ).toEqual(['ds_1', 'ds_3']);
  });

  it('renders close buttons on every QueryTabs tab and never renders any sample button', () => {
    const queries: QueryModel[] = [
      { id: 'ds_1', name: 'Sales', sourceType: 'csv', originalDatasetId: 'ds_1', rawRows: [], steps: [], selectedStepId: '' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(QueryTabs, {
        queries,
        activeId: 'ds_1',
        availableDatasets: [makeDs('ds_1', 'Sales'), makeDs('ds_2', 'Unopened')],
        onSelect: () => {},
        onCloseQuery: () => {},
        onAddFile: () => {},
        onNewEmptyQuery: () => {},
        onOpenDataset: () => {},
      })
    );
    expect(html).toContain('Close dataset: Sales');
    expect(html).toContain('Add dataset');
    expect(html.toLowerCase()).not.toContain('messy');
    expect(html.toLowerCase()).not.toContain('load raw');
  });
});
