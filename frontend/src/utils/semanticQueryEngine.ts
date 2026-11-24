import { Dataset, WidgetConfig, DataFilter, AggregationMethod, NumberFormatType } from '../types/dashboard';
import {
  DataModelState,
  FactTable,
  DimensionTable,
  Relationship,
  ModelMeasure,
  ModelValidationIssue,
} from '../types/dataModel';
import { applyFilters, formatNumber, processWidgetData, ProcessedDataPoint } from './dataProcessor';

export interface SemanticQueryPoint extends ProcessedDataPoint {
  rawRecord?: Record<string, any>;
  dimensionValues?: Record<string, any>;
  [key: string]: any;
}

export interface SemanticQueryResult {
  data: SemanticQueryPoint[];
  columns: string[];
  summary: {
    sum: number;
    avg: number;
    min: number;
    max: number;
    count: number;
  };
  modelUsed: boolean;
  errors?: ModelValidationIssue[];
  notice?: string;
}

export interface SemanticQueryRequest {
  model?: DataModelState;
  datasets: Dataset[];
  xAxisField?: string;
  yAxisField?: string;
  zAxisField?: string;
  secondaryField?: string;
  aggregation?: AggregationMethod;
  numberFormat?: NumberFormatType;
  currencySymbol?: string;
  globalFilters?: DataFilter[];
  sortBy?: 'none' | 'asc' | 'desc';
  limit?: number;
}

/**
 * Checks if the dashboard has an active, populated Data Model with at least one fact or dimension table.
 */
export function hasActiveDataModel(model?: DataModelState): boolean {
  if (!model) return false;
  const hasFacts = Array.isArray(model.factTables) && model.factTables.length > 0;
  const hasDims = Array.isArray(model.dimensionTables) && model.dimensionTables.length > 0;
  return hasFacts || hasDims;
}

/**
 * Parses field strings such as:
 * - "DIM_CUSTOMER.Country" -> { tableName: "DIM_CUSTOMER", columnName: "Country" }
 * - "DIM_CUSTOMER[Country]" -> { tableName: "DIM_CUSTOMER", columnName: "Country" }
 * - "Total Sales" -> { isMeasure: true, measureName: "Total Sales" }
 */
export function parseFieldReference(
  fieldStr: string | undefined,
  model?: DataModelState
): {
  raw: string;
  tableName?: string;
  columnName?: string;
  measure?: ModelMeasure;
} {
  if (!fieldStr || typeof fieldStr !== 'string') {
    return { raw: '' };
  }

  const clean = fieldStr.trim();
  if (!clean) return { raw: '' };

  // 1. Check if it matches a calculated measure by exact or bracket name
  if (model && Array.isArray(model.measures)) {
    const unbracketed = clean.replace(/^\[|\]$/g, '').toLowerCase();
    const matchedMeasure = model.measures.find(
      (m) =>
        m.name.toLowerCase() === clean.toLowerCase() ||
        m.name.toLowerCase() === unbracketed ||
        m.id === clean
    );
    if (matchedMeasure) {
      return { raw: clean, measure: matchedMeasure };
    }
  }

  // 2. Bracket notation: TABLE[COLUMN]
  const bracketMatch = clean.match(/^([A-Za-z0-9_ -]+)\[([A-Za-z0-9_ -]+)\]$/);
  if (bracketMatch) {
    return {
      raw: clean,
      tableName: bracketMatch[1].trim(),
      columnName: bracketMatch[2].trim(),
    };
  }

  // 3. Dot notation: TABLE.COLUMN
  if (clean.includes('.')) {
    const parts = clean.split('.');
    return {
      raw: clean,
      tableName: parts[0].trim(),
      columnName: parts.slice(1).join('.').trim(),
    };
  }

  // 4. Bare column name: look up in model tables
  if (model) {
    // Check dimension tables first
    for (const dim of model.dimensionTables || []) {
      if (
        dim.primaryKey?.toLowerCase() === clean.toLowerCase() ||
        dim.attributes?.some((a) => a.toLowerCase() === clean.toLowerCase())
      ) {
        return { raw: clean, tableName: dim.name, columnName: clean };
      }
    }
    // Check fact tables
    for (const fact of model.factTables || []) {
      if (
        fact.measures?.some((m) => m.toLowerCase() === clean.toLowerCase()) ||
        fact.foreignKeys?.some((k) => k.toLowerCase() === clean.toLowerCase()) ||
        fact.primaryKey?.toLowerCase() === clean.toLowerCase()
      ) {
        return { raw: clean, tableName: fact.name, columnName: clean };
      }
    }
  }

  return { raw: clean, columnName: clean };
}

/**
 * Validates whether the requested query can be executed safely against the Data Model.
 */
export function validateSemanticQuery(
  model: DataModelState,
  datasets: Dataset[],
  xRef: ReturnType<typeof parseFieldReference>,
  yRef: ReturnType<typeof parseFieldReference>
): ModelValidationIssue[] {
  const issues: ModelValidationIssue[] = [];
  const datasetMap = new Map<string, Dataset>();
  datasets.forEach((d) => datasetMap.set(d.id, d));

  const allTables = [
    ...(model.dimensionTables || []).map((d) => ({ ...d, isFact: false })),
    ...(model.factTables || []).map((f) => ({ ...f, isFact: true, primaryKey: f.primaryKey || '' })),
  ];

  // Helper to find table by name or id
  const findTable = (tableName?: string) => {
    if (!tableName) return undefined;
    return allTables.find(
      (t) =>
        t.name.toLowerCase() === tableName.toLowerCase() ||
        t.id.toLowerCase() === tableName.toLowerCase()
    );
  };

  const xTable = findTable(xRef.tableName);
  let yTable = findTable(yRef.tableName);
  if (!yTable && yRef.measure) {
    yTable = findTable(yRef.measure.targetTable);
  }

  // Validate Dimension Table Dataset
  if (xTable && !datasetMap.has(xTable.datasetId)) {
    issues.push({
      id: `err_missing_ds_${xTable.id}`,
      severity: 'error',
      title: `Dataset Missing for Table '${xTable.name}'`,
      message: `The underlying dataset for table '${xTable.name}' is not loaded in current dashboard context.`,
      tableId: xTable.id,
      suggestedAction: 'Attach the dataset in Dashboard Datasets modal.',
    });
  }

  // Validate Fact Table Dataset
  if (yTable && !datasetMap.has(yTable.datasetId)) {
    issues.push({
      id: `err_missing_ds_${yTable.id}`,
      severity: 'error',
      title: `Dataset Missing for Table '${yTable.name}'`,
      message: `The underlying dataset for table '${yTable.name}' is not loaded in current dashboard context.`,
      tableId: yTable.id,
      suggestedAction: 'Attach the dataset in Dashboard Datasets modal.',
    });
  }

  // Helper to match relationship between two tables by ID or Name
  const matchesRelationship = (r: Relationship, t1Id: string, t1Name: string, t2Id: string, t2Name: string) => {
    const fromMatchesT1 = r.fromTableId === t1Id || (r as any).fromTable === t1Name;
    const toMatchesT2 = r.toTableId === t2Id || (r as any).toTable === t2Name;
    const fromMatchesT2 = r.fromTableId === t2Id || (r as any).fromTable === t2Name;
    const toMatchesT1 = r.toTableId === t1Id || (r as any).toTable === t1Name;
    return (fromMatchesT1 && toMatchesT2) || (fromMatchesT2 && toMatchesT1);
  };

  // Validate Relationship if X and Y come from distinct tables
  if (xTable && yTable && xTable.id !== yTable.id) {
    const hasDirectRel = (model.relationships || []).some(
      (r) =>
        r.isActive !== false &&
        matchesRelationship(r, xTable.id, xTable.name, yTable.id, yTable.name)
    );

    if (!hasDirectRel) {
      issues.push({
        id: `err_missing_rel_${xTable.id}_${yTable.id}`,
        severity: 'error',
        title: `No Relationship Between '${xTable.name}' and '${yTable.name}'`,
        message: `Tables '${xTable.name}' and '${yTable.name}' are not connected in the Data Model. Analytical aggregation cannot cross tables without an explicit relationship.`,
        suggestedAction: 'Open the Data Model editor and create a relationship linking the primary and foreign keys.',
      });
    }
  }

  return issues;
}

/**
 * Safely evaluates simple calculated measure expressions without unsafe eval().
 * Supports tokens: [Measure Name], numbers, +, -, *, /, and DIVIDE(a, b).
 */
export function evaluateCalculatedMeasureFormula(
  formula: string,
  measureValues: Record<string, number>
): number {
  if (!formula || typeof formula !== 'string') return 0;

  // 1. Handle DIVIDE(a, b) or DIVIDE(a, b, alt)
  const divideMatch = formula.match(/^DIVIDE\s*\(\s*(.+?)\s*,\s*(.+?)(?:\s*,\s*(.+?))?\s*\)$/i);
  if (divideMatch) {
    const numerator = evaluateCalculatedMeasureFormula(divideMatch[1], measureValues);
    const denominator = evaluateCalculatedMeasureFormula(divideMatch[2], measureValues);
    const alt = divideMatch[3] ? evaluateCalculatedMeasureFormula(divideMatch[3], measureValues) : 0;
    if (denominator === 0 || isNaN(denominator) || !isFinite(denominator)) {
      return alt;
    }
    return numerator / denominator;
  }

  // 2. Replace measure references [Name] with numeric values
  let expr = formula;
  for (const [name, val] of Object.entries(measureValues)) {
    const regex = new RegExp(`\\[${escapeRegex(name)}\\]`, 'gi');
    expr = expr.replace(regex, String(val));
  }

  // Replace remaining unbracketed measure names if applicable
  for (const [name, val] of Object.entries(measureValues)) {
    const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
    expr = expr.replace(regex, String(val));
  }

  // 3. Safe simple arithmetic evaluation using tokenizer
  try {
    return safeCalculateExpression(expr);
  } catch {
    return 0;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safe Recursive Descent Parser for arithmetic expressions (+, -, *, /)
 */
function safeCalculateExpression(expr: string): number {
  const sanitized = expr.replace(/[^0-9+\-*/.() \t]/g, '');
  const tokens = sanitized.match(/([0-9]+(?:\.[0-9]+)?|[+\-*/()])/g) || [];
  let pos = 0;

  function parsePrimary(): number {
    const token = tokens[pos];
    if (token === '(') {
      pos++;
      const val = parseAddSub();
      if (tokens[pos] === ')') pos++;
      return val;
    }
    if (token === '-') {
      pos++;
      return -parsePrimary();
    }
    if (token === '+') {
      pos++;
      return parsePrimary();
    }
    pos++;
    return parseFloat(token) || 0;
  }

  function parseMulDiv(): number {
    let val = parsePrimary();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++];
      const right = parsePrimary();
      if (op === '*') val *= right;
      else val = right !== 0 ? val / right : 0;
    }
    return val;
  }

  function parseAddSub(): number {
    let val = parseMulDiv();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseMulDiv();
      if (op === '+') val += right;
      else val -= right;
    }
    return val;
  }

  return parseAddSub();
}

/**
 * Execute analytical query using the Data Model semantic layer.
 */
export function executeSemanticQuery(req: SemanticQueryRequest): SemanticQueryResult {
  const {
    model,
    datasets,
    xAxisField,
    yAxisField,
    zAxisField,
    secondaryField,
    aggregation = 'sum',
    numberFormat = 'number',
    currencySymbol = '$',
    globalFilters = [],
    sortBy = 'none',
    limit,
  } = req;

  if (!model || !hasActiveDataModel(model)) {
    return {
      data: [],
      columns: [],
      summary: { sum: 0, avg: 0, min: 0, max: 0, count: 0 },
      modelUsed: false,
      notice: 'No active Data Model present on dashboard.',
    };
  }

  const datasetMap = new Map<string, Dataset>();
  datasets.forEach((d) => datasetMap.set(d.id, d));

  const xRef = parseFieldReference(xAxisField, model);
  const yRef = parseFieldReference(yAxisField, model);
  const zRef = zAxisField ? parseFieldReference(zAxisField, model) : undefined;
  const secRef = secondaryField ? parseFieldReference(secondaryField, model) : undefined;

  // 1. Validate query constraints against Data Model
  const validationIssues = validateSemanticQuery(model, datasets, xRef, yRef);
  const errors = validationIssues.filter((i) => i.severity === 'error');
  if (errors.length > 0) {
    return {
      data: [],
      columns: [],
      summary: { sum: 0, avg: 0, min: 0, max: 0, count: 0 },
      modelUsed: true,
      errors,
      notice: errors[0].message,
    };
  }

  // 2. Identify the Primary Fact Table and Dimension Tables
  let factTable = model.factTables.find((f) => {
    if (yRef.tableName && f.name.toLowerCase() === yRef.tableName.toLowerCase()) return true;
    if (yRef.measure?.targetTable && (f.name === yRef.measure.targetTable || f.id === yRef.measure.targetTable)) return true;
    return false;
  }) || model.factTables[0];

  let dimTable = model.dimensionTables.find((d) => {
    if (xRef.tableName && d.name.toLowerCase() === xRef.tableName.toLowerCase()) return true;
    return false;
  }) || model.dimensionTables[0];

  // If no fact table exists in model, but dimension tables exist, query dimension table directly
  if (!factTable && dimTable) {
    const dimDs = datasetMap.get(dimTable.datasetId);
    const rawDimRows = dimDs?.cleanedData && dimDs.cleanedData.length > 0 ? dimDs.cleanedData : dimDs?.data || [];
    const filteredRows = applyFilters(rawDimRows, globalFilters);

    // Group directly on dimension table
    const groups = new Map<string, number[]>();
    const colName = xRef.columnName || dimTable.primaryKey;
    filteredRows.forEach((r) => {
      const key = String(r[colName] ?? 'Unspecified');
      const val = yRef.columnName ? parseFloat(r[yRef.columnName]) : 1;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(isNaN(val) ? 1 : val);
    });

    const resultPoints: SemanticQueryPoint[] = [];
    groups.forEach((vals, k) => {
      const aggregatedY = vals.reduce((a, b) => a + b, 0);
      resultPoints.push({
        x: k,
        y: aggregatedY,
        formattedY: formatNumber(aggregatedY, numberFormat, currencySymbol),
      });
    });

    return {
      data: resultPoints,
      columns: [colName, yRef.columnName || 'Count'],
      summary: calculateMetrics(resultPoints),
      modelUsed: true,
    };
  }

  if (!factTable) {
    return {
      data: [],
      columns: [],
      summary: { sum: 0, avg: 0, min: 0, max: 0, count: 0 },
      modelUsed: true,
      notice: 'No Fact table identified in Data Model.',
    };
  }

  const factDs = datasetMap.get(factTable.datasetId);
  const rawFactRows = factDs?.cleanedData && factDs.cleanedData.length > 0 ? factDs.cleanedData : factDs?.data || [];
  if (rawFactRows.length === 0) {
    return {
      data: [],
      columns: [],
      summary: { sum: 0, avg: 0, min: 0, max: 0, count: 0 },
      modelUsed: true,
      notice: `Fact table '${factTable.name}' contains zero rows.`,
    };
  }

  // 3. Resolve active relationships between dimension tables and the target fact table
  const activeRelationships = (model.relationships || []).filter((r) => r.isActive !== false);

  // Map of dimension table ID -> join keys with this fact table
  const dimJoins = new Map<string, { dimKey: string; factKey: string; dimTable: DimensionTable }>();
  (model.dimensionTables || []).forEach((dim) => {
    const rel = activeRelationships.find((r) => {
      const fromIsDim = r.fromTableId === dim.id || (r as any).fromTable === dim.name;
      const toIsFact = r.toTableId === factTable.id || (r as any).toTable === factTable.name;
      const fromIsFact = r.fromTableId === factTable.id || (r as any).fromTable === factTable.name;
      const toIsDim = r.toTableId === dim.id || (r as any).toTable === dim.name;
      return (fromIsDim && toIsFact) || (fromIsFact && toIsDim);
    });
    if (rel) {
      const isDimFrom = rel.fromTableId === dim.id || (rel as any).fromTable === dim.name;
      const dimKey = isDimFrom ? rel.fromColumn : rel.toColumn;
      const factKey = isDimFrom ? rel.toColumn : rel.fromColumn;
      dimJoins.set(dim.id, { dimKey, factKey, dimTable: dim });
    }
  });

  // 4. SEMANTIC FILTER PROPAGATION
  // Evaluate filters on dimension tables first, then propagate the allowed key sets to Fact table
  const allFilters = (globalFilters || []).filter(Boolean);
  const factAllowedKeyFilters: { factKey: string; allowedKeys: Set<string> }[] = [];
  const directFactFilters: DataFilter[] = [];

  allFilters.forEach((filter) => {
    const rawFilterCol = filter.column || '';
    if (!rawFilterCol) return;

    const dotIdx = rawFilterCol.indexOf('.');
    const cleanTbl = dotIdx !== -1 ? rawFilterCol.slice(0, dotIdx).trim() : undefined;
    const cleanCol = dotIdx !== -1 ? rawFilterCol.slice(dotIdx + 1).trim() : rawFilterCol.trim();

    // Check if filter belongs to a specific dimension table
    let matchedDim: DimensionTable | undefined;
    for (const dim of model.dimensionTables || []) {
      if (
        (cleanTbl && cleanTbl.toLowerCase() === dim.name.toLowerCase()) ||
        (!cleanTbl && (dim.primaryKey === cleanCol || dim.attributes?.includes(cleanCol))) ||
        (filter.datasetId && filter.datasetId === dim.datasetId)
      ) {
        matchedDim = dim;
        break;
      }
    }

    if (matchedDim && dimJoins.has(matchedDim.id)) {
      const joinInfo = dimJoins.get(matchedDim.id)!;
      const dimDs = datasetMap.get(matchedDim.datasetId);
      const rawDimRows = dimDs?.cleanedData && dimDs.cleanedData.length > 0 ? dimDs.cleanedData : dimDs?.data || [];
      const filteredDimRows = applyFilters(rawDimRows, [{ ...filter, column: cleanCol }]);
      const allowedKeys = new Set(filteredDimRows.map((r) => String(r[joinInfo.dimKey] ?? '')));
      factAllowedKeyFilters.push({ factKey: joinInfo.factKey, allowedKeys });
    } else if (!filter.datasetId || filter.datasetId === factTable.datasetId) {
      // Direct filter on Fact table
      directFactFilters.push({ ...filter, column: cleanCol });
    }
  });

  // Apply both direct filters and propagated relationship filters to Fact table rows
  let filteredFactRows = directFactFilters.length > 0 ? applyFilters(rawFactRows, directFactFilters) : rawFactRows;
  factAllowedKeyFilters.forEach(({ factKey, allowedKeys }) => {
    filteredFactRows = filteredFactRows.filter((r) => allowedKeys.has(String(r[factKey] ?? '')));
  });

  if (filteredFactRows.length === 0) {
    return {
      data: [],
      columns: [],
      summary: { sum: 0, avg: 0, min: 0, max: 0, count: 0 },
      modelUsed: true,
      notice: 'No records matched the current filter context.',
    };
  }

  // 5. MATERIALIZE JOINED CONTEXT FOR ANALYTICAL AGGREGATION
  // Build lookup maps for all dimensions connected to this fact table
  const dimRowLookups = new Map<string, Map<string, Record<string, any>>>();
  dimJoins.forEach(({ dimKey, dimTable: dim }) => {
    const dimDs = datasetMap.get(dim.datasetId);
    const rawDimRows = dimDs?.cleanedData && dimDs.cleanedData.length > 0 ? dimDs.cleanedData : dimDs?.data || [];
    const lookup = new Map<string, Record<string, any>>();
    rawDimRows.forEach((r) => {
      const k = String(r[dimKey] ?? '');
      if (k) lookup.set(k, r);
    });
    dimRowLookups.set(dim.id, lookup);
  });

  // Construct denormalized row projection for fast dimension grouping
  const projectedRows = filteredFactRows.map((factRow) => {
    const rowCtx: Record<string, any> = { ...factRow };

    // Attach all dimension attributes with both qualified and unqualified names
    dimJoins.forEach(({ factKey, dimTable: dim }) => {
      const factVal = String(factRow[factKey] ?? '');
      const dimRow = dimRowLookups.get(dim.id)?.get(factVal);
      if (dimRow) {
        Object.keys(dimRow).forEach((attr) => {
          rowCtx[`${dim.name}.${attr}`] = dimRow[attr];
          if (rowCtx[attr] === undefined) {
            rowCtx[attr] = dimRow[attr];
          }
        });
      }
    });

    return rowCtx;
  });

  // 6. RESOLVE DIMENSION KEY & GROUPING
  const xCol = xRef.columnName || xRef.raw || '';
  const xTbl = xRef.tableName || '';
  const resolveRowVal = (row: Record<string, any>, col: string, tbl?: string) => {
    if (tbl && row[`${tbl}.${col}`] !== undefined) return row[`${tbl}.${col}`];
    if (row[col] !== undefined) return row[col];
    return undefined;
  };

  // Group projected rows by X dimension (if specified)
  const isKpiOrMetric = !xAxisField || xAxisField.trim() === '' || ['kpi', 'metric'].includes(req.aggregation || '');
  const groups = new Map<string, { rows: Record<string, any>[]; rawX: any }>();

  if (isKpiOrMetric) {
    groups.set('Total', { rows: projectedRows, rawX: 'Total' });
  } else {
    projectedRows.forEach((row) => {
      const val = resolveRowVal(row, xCol, xTbl);
      const key = val !== undefined && val !== null ? String(val) : 'Unspecified';
      if (!groups.has(key)) {
        groups.set(key, { rows: [], rawX: val });
      }
      groups.get(key)!.rows.push(row);
    });
  }

  // 7. EVALUATE MEASURES PER GROUP
  const resultPoints: SemanticQueryPoint[] = [];

  // Pre-fetch all defined measures for calculated measure evaluation
  const allModelMeasures = model.measures || [];

  groups.forEach((groupData, key) => {
    const groupRows = groupData.rows;

    // Helper to calculate a single base measure on this group's rows
    const calcBaseMeasure = (colName: string, agg: AggregationMethod | string = aggregation): number => {
      const numbers = groupRows
        .map((r) => {
          const v = r[colName];
          return v !== undefined && v !== null ? parseFloat(v) : NaN;
        })
        .filter((n) => !isNaN(n) && isFinite(n));

      switch (agg) {
        case 'sum':
          return numbers.reduce((a, b) => a + b, 0);
        case 'avg':
          return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
        case 'count':
          return groupRows.length;
        case 'distinct_count':
          return new Set(groupRows.map((r) => r[colName])).size;
        case 'min':
          return numbers.length > 0 ? Math.min(...numbers) : 0;
        case 'max':
          return numbers.length > 0 ? Math.max(...numbers) : 0;
        default:
          return numbers.reduce((a, b) => a + b, 0);
      }
    };

    // Recursive measure evaluator handling base aggregations and calculated measures with cycle prevention
    const evaluateMeasureByName = (mName: string, callStack = new Set<string>()): number => {
      const cleanName = mName.replace(/^\[|\]$/g, '').trim();
      if (callStack.has(cleanName.toLowerCase())) {
        return 0; // Prevent circular recursion
      }
      const nextStack = new Set(callStack);
      nextStack.add(cleanName.toLowerCase());

      const defined = allModelMeasures.find(
        (m) => m.name.toLowerCase() === cleanName.toLowerCase() || m.id === cleanName
      );

      if (!defined) {
        return calcBaseMeasure(cleanName, aggregation);
      }

      // 1. Ratio DIVIDE
      if (defined.aggregation === 'divide') {
        const num = evaluateMeasureByName(defined.targetColumn, nextStack);
        const denom = defined.secondaryMeasure ? evaluateMeasureByName(defined.secondaryMeasure, nextStack) : 1;
        return denom !== 0 ? num / denom : 0;
      }

      // 2. Multi-measure calculated formula: e.g. [Total Sales] - [Total Cost]
      const expr = defined.expression || '';
      const isCalculatedFormula =
        (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) &&
        !expr.startsWith('SUM(') &&
        !expr.startsWith('AVG(') &&
        !expr.startsWith('COUNT(') &&
        !expr.startsWith('MIN(') &&
        !expr.startsWith('MAX(');

      if (isCalculatedFormula) {
        const measureValues: Record<string, number> = {};
        const bracketTokens: string[] = expr.match(/\[(.*?)\]/g) || [];
        bracketTokens.forEach((tok) => {
          const tokName = tok.replace(/^\[|\]$/g, '').trim();
          if (!callStack.has(tokName.toLowerCase())) {
            measureValues[tokName] = evaluateMeasureByName(tokName, nextStack);
          }
        });
        allModelMeasures.forEach((other) => {
          if (other.name !== defined.name && expr.includes(other.name)) {
            if (measureValues[other.name] === undefined && !callStack.has(other.name.toLowerCase())) {
              measureValues[other.name] = evaluateMeasureByName(other.name, nextStack);
            }
          }
        });
        return evaluateCalculatedMeasureFormula(expr, measureValues);
      }

      // 3. Base Column Aggregation (SUM, AVG, etc.)
      return calcBaseMeasure(defined.targetColumn || defined.name, defined.aggregation);
    };

    // Calculate Y-Axis value
    let yVal = 0;
    if (yRef.measure) {
      yVal = evaluateMeasureByName(yRef.measure.name);
    } else if (yRef.columnName) {
      yVal = calcBaseMeasure(yRef.columnName, aggregation);
    } else {
      yVal = groupRows.length;
    }

    // Calculate Z-Axis / Secondary if requested
    let zVal: number | undefined;
    if (zRef?.columnName) {
      const zNum = parseFloat(groupRows[0]?.[zRef.columnName]);
      zVal = !isNaN(zNum) ? zNum : undefined;
    }

    let secVal: number | undefined;
    if (secRef?.columnName) {
      const secNum = parseFloat(groupRows[0]?.[secRef.columnName]);
      secVal = !isNaN(secNum) ? secNum : undefined;
    }

    // Format Y
    const formatToUse = yRef.measure?.format || numberFormat;
    const symbolToUse = yRef.measure?.currencySymbol || currencySymbol;
    const pctVal = formatToUse === 'percentage' && Math.abs(yVal) <= 1 ? yVal * 100 : yVal;
    const formattedY = formatNumber(pctVal, formatToUse, symbolToUse);

    resultPoints.push({
      x: isKpiOrMetric ? (groupRows[0]?.[xCol] ?? key) : key,
      y: yVal,
      z: zVal,
      secondary: secVal,
      formattedY,
      rawRecord: groupRows[0],
      originalGroup: groupRows,
    });
  });

  // 8. SORTING & LIMITS
  if (sortBy === 'asc') {
    resultPoints.sort((a, b) => a.y - b.y);
  } else if (sortBy === 'desc') {
    resultPoints.sort((a, b) => b.y - a.y);
  }

  const finalPoints = limit && limit > 0 ? resultPoints.slice(0, limit) : resultPoints;

  return {
    data: finalPoints,
    columns: [xCol || 'Category', yRef.measure?.name || yRef.columnName || 'Value'],
    summary: calculateMetrics(finalPoints),
    modelUsed: true,
  };
}

function calculateMetrics(points: SemanticQueryPoint[]) {
  if (!points || points.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
  }
  const yValues = points.map((p) => p.y);
  const sum = yValues.reduce((a, b) => a + b, 0);
  const avg = sum / yValues.length;
  const min = Math.min(...yValues);
  const max = Math.max(...yValues);
  return { sum, avg, min, max, count: points.length };
}

/**
 * Unified query router for widgets.
 * Automatically delegates to Semantic Query Engine if model is active,
 * or falls back to raw dataset processing for backward compatibility.
 */
export function queryWidgetData(args: {
  config: WidgetConfig;
  dataset?: Dataset;
  dataModel?: DataModelState;
  datasets?: Dataset[];
  globalFilters?: DataFilter[];
}): {
  data: ProcessedDataPoint[];
  modelUsed: boolean;
  error?: string;
  summary: { sum: number; avg: number; min: number; max: number; count: number };
} {
  const { config, dataset, dataModel, datasets = [], globalFilters = [] } = args;

  // 1. ROUTING: Check if dashboard has an active Data Model
  if (hasActiveDataModel(dataModel)) {
    const availableDatasets = datasets.length > 0 ? datasets : dataset ? [dataset] : [];
    const semanticRes = executeSemanticQuery({
      model: dataModel,
      datasets: availableDatasets,
      xAxisField: config.xAxisField,
      yAxisField: config.yAxisField,
      zAxisField: config.zAxisField,
      secondaryField: config.secondaryField,
      aggregation: config.aggregation,
      numberFormat: config.numberFormat,
      currencySymbol: config.currencySymbol,
      globalFilters,
      sortBy: config.sortBy,
    });

    if (semanticRes.errors && semanticRes.errors.length > 0) {
      return {
        data: [],
        modelUsed: true,
        error: semanticRes.errors[0].message,
        summary: { sum: 0, avg: 0, min: 0, max: 0, count: 0 },
      };
    }

    return {
      data: semanticRes.data,
      modelUsed: true,
      error: semanticRes.notice,
      summary: semanticRes.summary,
    };
  }

  // 2. RAW DATA MODE: Backwards-compatible raw dataset processing (filter exactly once)
  const rawRows = dataset?.cleanedData && dataset.cleanedData.length > 0 ? dataset.cleanedData : dataset?.data || [];
  const applicableGlobal = (globalFilters || []).filter(
    (f) => !f.datasetId || f.datasetId === dataset?.id
  );
  const filteredRows = applicableGlobal.length > 0 ? applyFilters(rawRows, applicableGlobal) : rawRows;
  const filteredDataset = dataset ? { ...dataset, data: filteredRows, cleanedData: undefined } : undefined;

  const processed = processWidgetData(
    filteredDataset,
    config.xAxisField,
    config.yAxisField,
    config.aggregation,
    config.zAxisField,
    config.secondaryField,
    config.numberFormat,
    config.currencySymbol
  );

  const yVals = processed.map((p) => p.y);
  const sum = yVals.reduce((a, b) => a + b, 0);
  const avg = yVals.length > 0 ? sum / yVals.length : 0;
  const min = yVals.length > 0 ? Math.min(...yVals) : 0;
  const max = yVals.length > 0 ? Math.max(...yVals) : 0;

  return {
    data: processed,
    modelUsed: false,
    summary: { sum, avg, min, max, count: processed.length },
  };
}
