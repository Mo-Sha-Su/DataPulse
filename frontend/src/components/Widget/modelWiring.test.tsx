import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CanvasWorkspace } from '../Canvas/CanvasWorkspace';
import { WidgetCard } from './WidgetCard';
import { DEFAULT_CANVAS } from '../../data/dashboardDefaults';
import { countryFilter, datasets, kpiWidget, model } from '../../test/modelFixtures';

/**
 * Regression: CanvasWorkspace/WidgetCard used to drop `dataModel` (and hand renderers only the widget's own
 * dataset), so the Data Model had no effect on any widget. A KPI filtered by a *dimension* attribute is the
 * simplest observable: 350 only if the model joins customers to sales, 750 if the model is ignored.
 */
const noop = () => {};
const widget = kpiWidget({ yAxisField: 'Amount' });
const filters = [countryFilter('US')];

describe('Data Model reaches rendered widgets', () => {
  it('WidgetCard: model present -> value is filtered through the relationship', () => {
    const html = renderToStaticMarkup(
      <WidgetCard widget={widget} datasets={datasets} canvas={DEFAULT_CANVAS} globalFilters={filters} dataModel={model}
        isSelected={false} onSelect={noop} onUpdatePosition={noop} onDuplicate={noop} onDelete={noop} onOpenConfig={noop} />
    );
    expect(html).toContain('350');
    expect(html).not.toContain('750');
  });

  it('WidgetCard: no model -> raw single-table mode (filter cannot reach the sales table)', () => {
    const html = renderToStaticMarkup(
      <WidgetCard widget={widget} datasets={datasets} canvas={DEFAULT_CANVAS} globalFilters={filters}
        isSelected={false} onSelect={noop} onUpdatePosition={noop} onDuplicate={noop} onDelete={noop} onOpenConfig={noop} />
    );
    expect(html).toContain('750');
  });

  it('CanvasWorkspace passes the model down to its widgets', () => {
    const render = (dataModel?: typeof model) =>
      renderToStaticMarkup(
        <CanvasWorkspace widgets={[widget]} datasets={datasets} canvas={DEFAULT_CANVAS} globalFilters={filters} dataModel={dataModel}
          selectedWidgetId={null} configuringWidgetId={null} onSelectWidget={noop} onUpdateWidgetPosition={noop}
          onDuplicateWidget={noop} onDeleteWidget={noop} onOpenWidgetConfig={noop} />
      );
    expect(render(model)).toContain('350');
    expect(render(undefined)).toContain('750');
  });
});
