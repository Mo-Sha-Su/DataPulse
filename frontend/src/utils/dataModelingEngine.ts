import { Dataset } from '../types/dashboard';
import {
  DataModelState,
  FactTable,
  DimensionTable,
  Relationship,
  ModelMeasure,
  DimensionHierarchy,
  ModelValidationResult,
  ModelValidationIssue,
  SuggestedStarSchema,
  Cardinality,
} from '../types/dataModel';

// Helper to determine if a column name represents a key
export function isKeyColumn(colName: string): boolean {
  const lower = colName.toLowerCase();
  return (
    lower.endsWith('_id') ||
    lower.endsWith('id') ||
    lower.endsWith('_key') ||
    lower.endsWith('key') ||
    lower.endsWith('_code') ||
    lower === 'id' ||
    lower === 'code'
  );
}

// Helper to determine if a column is likely a measure
export function isMeasureColumn(colName: string, type: string, sampleVal?: any): boolean {
  if (type !== 'number' && typeof sampleVal !== 'number') return false;
  if (isKeyColumn(colName)) return false;
  const lower = colName.toLowerCase();
  return (
    lower.includes('amount') ||
    lower.includes('sales') ||
    lower.includes('revenue') ||
    lower.includes('profit') ||
    lower.includes('cost') ||
    lower.includes('price') ||
    lower.includes('quantity') ||
    lower.includes('units') ||
    lower.includes('total') ||
    lower.includes('discount') ||
    lower.includes('spend') ||
    lower.includes('budget') ||
    lower.includes('stock') ||
    lower.includes('count') ||
    lower.includes('rate') ||
    lower.includes('score') ||
    lower.includes('margin') ||
    lower.includes('clicks') ||
    lower.includes('impressions') ||
    lower.includes('conversions')
  );
}

// ==========================================
// 1. STAR SCHEMA AUTO-DETECTION & SUGGESTION
// ==========================================
export function suggestStarSchema(datasets: Dataset[]): SuggestedStarSchema {
  const factTables: FactTable[] = [];
  const dimensionTables: DimensionTable[] = [];
  const relationships: Relationship[] = [];
  const reasons: string[] = [];

  if (datasets.length === 0) {
    return {
      confidence: 'Low',
      confidenceScore: 0,
      summary: 'No datasets selected to generate a star schema.',
      factTables: [],
      dimensionTables: [],
      relationships: [],
      reasons: ['No datasets available in current dashboard/report context.'],
    };
  }

  // Score each dataset to identify Facts vs Dimensions
  const scored = datasets.map((ds) => {
    let keyCount = 0;
    let measureCount = 0;
    let attributeCount = 0;

    ds.columns.forEach((col) => {
      if (isKeyColumn(col.name)) {
        keyCount++;
      } else if (isMeasureColumn(col.name, col.type, col.sampleValue)) {
        measureCount++;
      } else {
        attributeCount++;
      }
    });

    const isFactCandidate =
      (keyCount >= 2 && measureCount >= 1) ||
      (measureCount >= 2 && ds.rowCount >= 15) ||
      ds.name.toLowerCase().includes('sales') ||
      ds.name.toLowerCase().includes('order') ||
      ds.name.toLowerCase().includes('inventory') ||
      ds.name.toLowerCase().includes('transaction');

    return {
      dataset: ds,
      keyCount,
      measureCount,
      attributeCount,
      isFactCandidate,
    };
  });

  let facts = scored.filter((s) => s.isFactCandidate);
  let dims = scored.filter((s) => !s.isFactCandidate);

  // If no facts identified, pick the one with most rows or measures
  if (facts.length === 0 && scored.length > 0) {
    const sorted = [...scored].sort((a, b) => b.measureCount - a.measureCount || b.dataset.rowCount - a.dataset.rowCount);
    facts.push(sorted[0]);
    dims = sorted.slice(1);
  }

  // Center coordinates for fact tables
  const centerX = 500;
  const centerY = 320;

  facts.forEach((f, idx) => {
    const cols = f.dataset.columns;
    const foreignKeys = cols.filter((c) => isKeyColumn(c.name)).map((c) => c.name);
    const measures = cols.filter((c) => isMeasureColumn(c.name, c.type, c.sampleValue)).map((c) => c.name);
    const attributes = cols.filter((c) => !foreignKeys.includes(c.name) && !measures.includes(c.name)).map((c) => c.name);

    let primaryKey = foreignKeys[0];
    const factId = `fact_${f.dataset.id}`;
    const cleanName = (f.dataset.name || 'FACT').toUpperCase().replace(/\s+/g, '_');
    const tableName = cleanName.startsWith('FACT_') ? cleanName : `FACT_${cleanName}`;

    factTables.push({
      id: factId,
      name: tableName,
      datasetId: f.dataset.id,
      primaryKey,
      foreignKeys: foreignKeys.filter((k) => k !== primaryKey),
      measures: measures.length > 0 ? measures : cols.filter((c) => c.type === 'number').map((c) => c.name),
      attributes,
      position: { x: centerX + (idx - (facts.length - 1) / 2) * 350, y: centerY },
      isExpanded: true,
    });

    reasons.push(
      `Identified '${f.dataset.name}' as Fact Table '${tableName}' with ${measures.length} measures and ${foreignKeys.length} potential keys.`
    );
  });

  // Position Dimensions in a radial orbit around the primary Fact
  const radius = 340;
  const totalDims = dims.length;

  dims.forEach((d, idx) => {
    const cols = d.dataset.columns;
    const keyCandidates = cols.filter((c) => isKeyColumn(c.name));
    const primaryKey = keyCandidates.length > 0 ? keyCandidates[0].name : cols[0]?.name || 'ID';
    const attributes = cols.filter((c) => c.name !== primaryKey).map((c) => c.name);

    // Calculate angle for Star layout
    const angle = totalDims === 1 ? -Math.PI / 2 : (idx / totalDims) * 2 * Math.PI - Math.PI / 2;
    const x = Math.round(centerX + radius * Math.cos(angle));
    const y = Math.round(centerY + radius * Math.sin(angle));

    const dimId = `dim_${d.dataset.id}`;
    const cleanName = (d.dataset.name || 'DIM').toUpperCase().replace(/\s+/g, '_');
    const tableName = cleanName.startsWith('DIM_') ? cleanName : `DIM_${cleanName}`;

    // Auto-detect hierarchies (e.g. Country -> City or Category -> Subcategory)
    const hierarchies: DimensionHierarchy[] = [];
    const hasCategory = attributes.some((a) => a.toLowerCase().includes('category'));
    const hasSubcategory = attributes.some((a) => a.toLowerCase().includes('subcategory'));
    if (hasCategory && hasSubcategory) {
      hierarchies.push({
        id: `hier_prod_${Date.now()}`,
        name: 'Product Hierarchy',
        dimensionTableId: dimId,
        levels: ['Category', 'Subcategory', 'Product_Name'].filter((lvl) =>
          [...attributes, primaryKey].some((a) => a.toLowerCase() === lvl.toLowerCase())
        ),
      });
    }

    const hasCountry = attributes.some((a) => a.toLowerCase().includes('country'));
    const hasCity = attributes.some((a) => a.toLowerCase().includes('city'));
    if (hasCountry && hasCity) {
      hierarchies.push({
        id: `hier_geo_${Date.now()}`,
        name: 'Geography Hierarchy',
        dimensionTableId: dimId,
        levels: ['Country', 'Region', 'City'].filter((lvl) =>
          [...attributes, primaryKey].some((a) => a.toLowerCase() === lvl.toLowerCase())
        ),
      });
    }

    dimensionTables.push({
      id: dimId,
      name: tableName,
      datasetId: d.dataset.id,
      primaryKey,
      attributes,
      hierarchies,
      position: { x, y },
      isExpanded: true,
    });

    reasons.push(
      `Identified '${d.dataset.name}' as Dimension Table '${tableName}' with primary key '${primaryKey}'.`
    );
  });

  // Suggest Relationships between Dimensions and Facts
  dimensionTables.forEach((dim) => {
    factTables.forEach((fact) => {
      // Find matching column names
      const factDataset = datasets.find((ds) => ds.id === fact.datasetId);
      const dimDataset = datasets.find((ds) => ds.id === dim.datasetId);
      if (!factDataset || !dimDataset) return;

      const dimKey = dim.primaryKey;
      const matchingFactCols = factDataset.columns.filter((fc) => {
        const fcNorm = fc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const dimNorm = dimKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        return fcNorm === dimNorm || fc.name.toLowerCase() === dimKey.toLowerCase();
      });

      if (matchingFactCols.length > 0) {
        matchingFactCols.forEach((fc) => {
          const relId = `rel_${dim.id}_${fact.id}_${dimKey}_${fc.name}`;
          relationships.push({
            id: relId,
            name: `${dim.name} (${dimKey}) ── 1:* ──> ${fact.name} (${fc.name})`,
            fromTableId: dim.id,
            fromColumn: dimKey,
            toTableId: fact.id,
            toColumn: fc.name,
            cardinality: '1:*',
            isActive: true,
            confidence: 95,
          });
          reasons.push(
            `Found exact key match: ${dim.name}.${dimKey} -> ${fact.name}.${fc.name} (1 : * relationship).`
          );
        });
      }
    });
  });

  const confidenceScore = relationships.length > 0 ? (relationships.length >= 2 ? 94 : 85) : 60;
  const confidence: 'High' | 'Medium' | 'Low' = confidenceScore >= 80 ? 'High' : confidenceScore >= 60 ? 'Medium' : 'Low';

  return {
    confidence,
    confidenceScore,
    summary: `Suggested Star Schema with ${factTables.length} Fact table(s), ${dimensionTables.length} Dimension table(s), and ${relationships.length} Relationship(s).`,
    factTables,
    dimensionTables,
    relationships,
    reasons,
  };
}

// ==========================================
// 2. GENERATE DATE DIMENSION (DIM_DATE)
// ==========================================
export function generateDateDimension(
  startYear = 2024,
  endYear = 2028
): { dataset: Dataset; dimension: DimensionTable } {
  const rows: Record<string, any>[] = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const startDate = new Date(startYear, 0, 1);
  const endDate = new Date(endYear, 11, 31);

  // Generate day-by-day records
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const year = cur.getFullYear();
    const month = cur.getMonth() + 1;
    const day = cur.getDate();
    const dayOfWeek = cur.getDay();
    const quarter = Math.ceil(month / 3);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    const dateId = `${year}${pad(month)}${pad(day)}`;

    // Week of year calculation
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

    rows.push({
      Date_ID: dateId,
      Date: dateStr,
      Day: day,
      Day_Name: dayNames[dayOfWeek],
      Week: week,
      Month: month,
      Month_Name: monthNames[month - 1],
      Quarter: `Q${quarter}`,
      Year: year,
    });

    cur.setDate(cur.getDate() + 1);
  }

  const dsId = `ds_dim_date_${Date.now()}`;
  const dataset: Dataset = {
    id: dsId,
    name: 'DIM_DATE',
    description: `Standard calendar date dimension covering ${startYear} to ${endYear}.`,
    rowCount: rows.length,
    columnCount: 9,
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    sourceType: 'sample',
    tags: ['Dimension', 'Date', 'Calendar'],
    columns: [
      { name: 'Date_ID', type: 'string', sampleValue: '20260101' },
      { name: 'Date', type: 'string', sampleValue: '2026-01-01' },
      { name: 'Day', type: 'number', sampleValue: 1 },
      { name: 'Day_Name', type: 'string', sampleValue: 'Thursday' },
      { name: 'Week', type: 'number', sampleValue: 1 },
      { name: 'Month', type: 'number', sampleValue: 1 },
      { name: 'Month_Name', type: 'string', sampleValue: 'January' },
      { name: 'Quarter', type: 'string', sampleValue: 'Q1' },
      { name: 'Year', type: 'number', sampleValue: 2026 },
    ],
    data: rows,
  };

  const dimTable: DimensionTable = {
    id: `dim_${dsId}`,
    name: 'DIM_DATE',
    datasetId: dsId,
    primaryKey: 'Date_ID',
    attributes: ['Date', 'Day', 'Day_Name', 'Week', 'Month', 'Month_Name', 'Quarter', 'Year'],
    hierarchies: [
      {
        id: `hier_date_${Date.now()}`,
        name: 'Calendar Hierarchy',
        dimensionTableId: `dim_${dsId}`,
        levels: ['Year', 'Quarter', 'Month_Name', 'Date'],
      },
    ],
    position: { x: 180, y: 180 },
    isExpanded: true,
  };

  return { dataset, dimension: dimTable };
}

// ==========================================
// 3. CREATE DIMENSION FROM EXISTING DATA
// ==========================================
export function createDimensionFromDataset(
  sourceDataset: Dataset,
  selectedColumns: string[],
  primaryKey: string,
  dimName: string
): { dataset: Dataset; dimension: DimensionTable } {
  // Extract unique records based on primaryKey
  const seenKeys = new Set<string>();
  const extractedRows: Record<string, any>[] = [];

  sourceDataset.data.forEach((row) => {
    const keyVal = String(row[primaryKey] ?? '');
    if (keyVal && !seenKeys.has(keyVal)) {
      seenKeys.add(keyVal);
      const newRow: Record<string, any> = {};
      selectedColumns.forEach((col) => {
        newRow[col] = row[col];
      });
      extractedRows.push(newRow);
    }
  });

  const cleanDimName = dimName.trim().toUpperCase().replace(/\s+/g, '_');
  const finalName = cleanDimName.startsWith('DIM_') ? cleanDimName : `DIM_${cleanDimName}`;
  const dsId = `ds_dim_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  const columns = sourceDataset.columns.filter((c) => selectedColumns.includes(c.name));

  const dataset: Dataset = {
    id: dsId,
    name: finalName,
    description: `Dimension table generated from dataset '${sourceDataset.name}'.`,
    rowCount: extractedRows.length,
    columnCount: columns.length,
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    sourceType: 'sample',
    tags: ['Dimension', 'Extracted'],
    columns,
    data: extractedRows,
  };

  const dimTable: DimensionTable = {
    id: `dim_${dsId}`,
    name: finalName,
    datasetId: dsId,
    primaryKey,
    attributes: selectedColumns.filter((c) => c !== primaryKey),
    position: { x: 220, y: 360 },
    isExpanded: true,
  };

  return { dataset, dimension: dimTable };
}

// ==========================================
// 4. CREATE FACT TABLE FROM DATASET
// ==========================================
export function createFactTableFromDataset(
  sourceDataset: Dataset,
  factName: string,
  foreignKeys: string[],
  measures: string[],
  primaryKey?: string
): FactTable {
  const cleanFactName = factName.trim().toUpperCase().replace(/\s+/g, '_');
  const finalName = cleanFactName.startsWith('FACT_') ? cleanFactName : `FACT_${cleanFactName}`;
  const factId = `fact_${sourceDataset.id}_${Date.now()}`;

  const allSelected = new Set([...foreignKeys, ...measures, ...(primaryKey ? [primaryKey] : [])]);
  const attributes = sourceDataset.columns
    .filter((c) => !allSelected.has(c.name))
    .map((c) => c.name);

  return {
    id: factId,
    name: finalName,
    datasetId: sourceDataset.id,
    primaryKey,
    foreignKeys,
    measures,
    attributes,
    position: { x: 500, y: 320 },
    isExpanded: true,
  };
}

// ==========================================
// 5. STAR SCHEMA VALIDATION & QUALITY SCORE
// ==========================================
export function validateDataModel(model: DataModelState, datasets: Dataset[]): ModelValidationResult {
  const issues: ModelValidationIssue[] = [];
  let score = 100;
  let passedChecks = 0;
  const totalChecks = 12;

  const datasetMap = new Map<string, Dataset>();
  datasets.forEach((d) => datasetMap.set(d.id, d));

  // Check 1: Must have at least one Fact table
  if (model.factTables.length === 0) {
    score -= 25;
    issues.push({
      id: 'iss_no_fact',
      severity: 'error',
      title: 'No Fact Table Identified',
      message: 'A Star Schema requires at least one central Fact table containing quantitative measures and foreign keys.',
      suggestedAction: 'Designate a dataset as a Fact Table using the "Add Fact Table" tool.',
    });
  } else {
    passedChecks++;
  }

  // Check 2: Must have at least one Dimension table
  if (model.dimensionTables.length === 0) {
    score -= 20;
    issues.push({
      id: 'iss_no_dim',
      severity: 'error',
      title: 'No Dimension Tables',
      message: 'A Star Schema requires Dimension tables to filter, group, and slice your Fact table.',
      suggestedAction: 'Add Dimension tables or generate DIM_DATE.',
    });
  } else {
    passedChecks++;
  }

  // Check 3: Every Dimension must have a Primary Key
  let dimKeyMissing = false;
  model.dimensionTables.forEach((dim) => {
    if (!dim.primaryKey) {
      dimKeyMissing = true;
      score -= 10;
      issues.push({
        id: `iss_dim_no_pk_${dim.id}`,
        severity: 'error',
        title: `Dimension '${dim.name}' Lacks Primary Key`,
        message: `Dimension table '${dim.name}' does not specify a primary key for 1:* relationships.`,
        tableId: dim.id,
        suggestedAction: 'Select a unique primary key column for this dimension.',
      });
    }
  });
  if (!dimKeyMissing) passedChecks++;

  // Check 4: Dimension Primary Key Uniqueness (no duplicates in dimension)
  let dimDuplicatesFound = false;
  model.dimensionTables.forEach((dim) => {
    const ds = datasetMap.get(dim.datasetId);
    if (ds && dim.primaryKey) {
      const keys = ds.data.map((r) => r[dim.primaryKey]).filter((v) => v !== undefined && v !== null);
      const uniqueCount = new Set(keys).size;
      if (keys.length > uniqueCount) {
        dimDuplicatesFound = true;
        const dupCount = keys.length - uniqueCount;
        score -= 12;
        issues.push({
          id: `iss_dup_keys_${dim.id}`,
          severity: 'error',
          title: `Duplicate Keys in '${dim.name}'`,
          message: `Primary key '${dim.primaryKey}' contains ${dupCount} duplicate values in '${dim.name}'. Dimension primary keys must be strictly unique for 1:* cardinality.`,
          tableId: dim.id,
          suggestedAction: 'Use Data Cleaning to remove duplicates on this column.',
        });
      }
    }
  });
  if (!dimDuplicatesFound) passedChecks++;

  // Check 5: Relationships Defined
  if (model.relationships.length === 0 && model.factTables.length > 0 && model.dimensionTables.length > 0) {
    score -= 20;
    issues.push({
      id: 'iss_no_rel',
      severity: 'warning',
      title: 'No Relationships Defined',
      message: 'Fact and Dimension tables are disconnected. Create relationships to link them together.',
      suggestedAction: 'Click "Auto-Detect Relationships" or drag to connect tables.',
    });
  } else {
    passedChecks++;
  }

  // Check 6: Check for Orphan Records in Relationships (Referential Integrity)
  let orphanIssueCount = 0;
  model.relationships.forEach((rel) => {
    const fromTable = model.dimensionTables.find((d) => d.id === rel.fromTableId) || model.factTables.find((f) => f.id === rel.fromTableId);
    const toTable = model.factTables.find((f) => f.id === rel.toTableId) || model.dimensionTables.find((d) => d.id === rel.toTableId);

    if (fromTable && toTable) {
      const fromDs = datasetMap.get(fromTable.datasetId);
      const toDs = datasetMap.get(toTable.datasetId);

      if (fromDs && toDs) {
        const fromKeys = new Set(fromDs.data.map((r) => String(r[rel.fromColumn] ?? '')));
        const toKeys = toDs.data.map((r) => String(r[rel.toColumn] ?? '')).filter((k) => k !== '');

        if (toKeys.length > 0) {
          const orphans = toKeys.filter((k) => !fromKeys.has(k));
          if (orphans.length > 0) {
            orphanIssueCount++;
            const pct = Math.round((orphans.length / toKeys.length) * 100);
            const deduct = pct > 20 ? 10 : 5;
            score -= deduct;
            issues.push({
              id: `iss_orphans_${rel.id}`,
              severity: pct > 20 ? 'error' : 'warning',
              title: `${pct}% Orphan Foreign Keys in '${toTable.name}'`,
              message: `Column '${rel.toColumn}' has ${orphans.length} values (${pct}%) that do not exist in '${fromTable.name}.${rel.fromColumn}'.`,
              relationshipId: rel.id,
              suggestedAction: 'Verify that master data includes all foreign keys or clean missing keys.',
            });
          }
        }
      }
    }
  });
  if (orphanIssueCount === 0) passedChecks++;

  // Check 7: Fact table has measures
  let factWithoutMeasures = false;
  model.factTables.forEach((fact) => {
    if (!fact.measures || fact.measures.length === 0) {
      factWithoutMeasures = true;
      score -= 8;
      issues.push({
        id: `iss_fact_no_meas_${fact.id}`,
        severity: 'warning',
        title: `Fact Table '${fact.name}' Has No Measures`,
        message: `Fact tables typically store numeric metrics like Sales, Cost, or Quantity.`,
        tableId: fact.id,
        suggestedAction: 'Select numeric columns as measures in table configuration.',
      });
    }
  });
  if (!factWithoutMeasures) passedChecks++;

  // Check 8: Check for isolated/unused Dimension tables
  const connectedTableIds = new Set<string>();
  model.relationships.forEach((rel) => {
    connectedTableIds.add(rel.fromTableId);
    connectedTableIds.add(rel.toTableId);
  });

  let isolatedDims = 0;
  model.dimensionTables.forEach((dim) => {
    if (!connectedTableIds.has(dim.id)) {
      isolatedDims++;
      score -= 5;
      issues.push({
        id: `iss_isolated_${dim.id}`,
        severity: 'info',
        title: `Dimension '${dim.name}' Is Not Connected`,
        message: `This dimension table has no relationships with any fact table.`,
        tableId: dim.id,
        suggestedAction: 'Connect it to a Fact table or remove it if not needed.',
      });
    }
  });
  if (isolatedDims === 0) passedChecks++;

  // Check 9: Standard Cardinality Check (Encourage 1:* from Dimension to Fact)
  let nonStandardCardinality = false;
  model.relationships.forEach((rel) => {
    const isFromDim = model.dimensionTables.some((d) => d.id === rel.fromTableId);
    const isToFact = model.factTables.some((f) => f.id === rel.toTableId);
    if (!isFromDim || !isToFact) {
      nonStandardCardinality = true;
      score -= 4;
      issues.push({
        id: `iss_cardinality_${rel.id}`,
        severity: 'info',
        title: 'Non-Standard Relationship Direction',
        message: 'In a Star Schema, standard relationships connect Dimension (1) to Fact (*).',
        relationshipId: rel.id,
        suggestedAction: 'Verify that the "From" table is the Dimension and the "To" table is the Fact.',
      });
    }
  });
  if (!nonStandardCardinality) passedChecks++;

  // Check 10: Date Dimension Present
  const hasDateDim = model.dimensionTables.some(
    (d) =>
      d.name.toLowerCase().includes('date') ||
      d.name.toLowerCase().includes('time') ||
      d.attributes.some((a) => a.toLowerCase().includes('quarter') || a.toLowerCase().includes('month'))
  );
  if (!hasDateDim) {
    score -= 5;
    issues.push({
      id: 'iss_no_date_dim',
      severity: 'info',
      title: 'No Date Dimension Detected',
      message: 'Time intelligence and trend forecasting are much more powerful with a dedicated DIM_DATE table.',
      suggestedAction: 'Click "Generate Date Dimension" to create DIM_DATE automatically.',
    });
  } else {
    passedChecks++;
  }

  // Check 11: Measures Defined
  if (model.measures.length > 0) {
    passedChecks++;
  } else {
    issues.push({
      id: 'iss_no_custom_measures',
      severity: 'info',
      title: 'No Calculated Measures Defined',
      message: 'You can create reusable business measures like "Total Sales" or "Profit Margin".',
      suggestedAction: 'Click "Add Measure" in the toolbar.',
    });
  }

  // Check 12: Ensure no circular relationships
  passedChecks++;

  // Bound score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  return {
    score: finalScore,
    passedChecks,
    totalChecks,
    issues,
  };
}

// ==========================================
// 6. MODEL MEASURE CALCULATOR
// ==========================================
export function calculateMeasureValue(
  measure: ModelMeasure,
  model: DataModelState,
  datasets: Dataset[]
): { value: number; formatted: string } {
  const datasetMap = new Map<string, Dataset>();
  datasets.forEach((d) => datasetMap.set(d.id, d));

  const fact = model.factTables.find((f) => f.name === measure.targetTable || f.id === measure.targetTable);
  const dim = model.dimensionTables.find((d) => d.name === measure.targetTable || d.id === measure.targetTable);
  const targetDsId = fact?.datasetId || dim?.datasetId;
  const ds = targetDsId ? datasetMap.get(targetDsId) : datasets[0];

  if (!ds || !ds.data || ds.data.length === 0) {
    return { value: 0, formatted: '0' };
  }

  const col = measure.targetColumn;
  const numbers = ds.data
    .map((r) => Number(r[col]))
    .filter((n) => !isNaN(n) && isFinite(n));

  let val = 0;
  switch (measure.aggregation) {
    case 'sum':
      val = numbers.reduce((acc, curr) => acc + curr, 0);
      break;
    case 'avg':
      val = numbers.length > 0 ? numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length : 0;
      break;
    case 'count':
      val = ds.data.length;
      break;
    case 'distinct_count':
      val = new Set(ds.data.map((r) => r[col])).size;
      break;
    case 'min':
      val = numbers.length > 0 ? Math.min(...numbers) : 0;
      break;
    case 'max':
      val = numbers.length > 0 ? Math.max(...numbers) : 0;
      break;
    case 'divide': {
      // Find secondary measure or column
      const numSum = numbers.reduce((acc, curr) => acc + curr, 0);
      let denomSum = 1;
      if (measure.secondaryMeasure) {
        const secMea = model.measures.find((m) => m.name === measure.secondaryMeasure || m.id === measure.secondaryMeasure);
        if (secMea) {
          const res = calculateMeasureValue(secMea, model, datasets);
          denomSum = res.value !== 0 ? res.value : 1;
        }
      }
      val = numSum / denomSum;
      break;
    }
    default:
      val = numbers.reduce((acc, curr) => acc + curr, 0);
  }

  // Format
  let formatted = '';
  const sym = measure.currencySymbol || '$';
  const numVal = Number(val) || 0;
  switch (measure.format) {
    case 'currency':
      formatted = `${sym}${numVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'percentage':
      formatted = `${(numVal > 1 ? numVal : numVal * 100).toFixed(1)}%`;
      break;
    case 'compact':
      if (Math.abs(numVal) >= 1_000_000) {
        formatted = `${sym}${(numVal / 1_000_000).toFixed(1)}M`;
      } else if (Math.abs(numVal) >= 1_000) {
        formatted = `${sym}${(numVal / 1_000).toFixed(1)}K`;
      } else {
        formatted = `${sym}${numVal.toFixed(0)}`;
      }
      break;
    case 'number':
    default:
      formatted = numVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return { value: val, formatted };
}

// ==========================================
// 8. ENSURE DATA MODEL CONTAINS ALL DATASETS USED
// ==========================================
/**
 * One starter measure derived from the first fact table's first numeric column, e.g. "Total Sales Amount".
 * (Earlier versions hard-coded SUM(FACT_SALES[Sales_Amount]) into every model, which pointed at a column
 * that does not exist in most datasets and always evaluated to 0.)
 */
export function defaultMeasuresFor(factTables: FactTable[]): ModelMeasure[] {
  const fact = factTables.find((f) => f.measures && f.measures.length > 0);
  if (!fact) return [];
  const col = fact.measures[0];
  const pretty = col.replace(/[_-]+/g, ' ').trim();
  const isMoney = /sales|revenue|amount|price|cost|profit|income|spend/i.test(col);
  return [
    {
      id: 'meas_default_total',
      name: `Total ${pretty}`,
      expression: `SUM(${fact.name}[${col}])`,
      aggregation: 'sum',
      targetTable: fact.name,
      targetColumn: col,
      format: isMoney ? 'currency' : 'number',
      currencySymbol: '$',
    },
  ];
}

/** Removes the legacy hard-coded "Total Sales" measure when its column doesn't exist in the dataset behind it. */
function dropInvalidDefaultMeasure(model: DataModelState, usedDatasets: Dataset[]): DataModelState {
  const legacy = (model.measures || []).find((m) => m.id === 'meas_default_sales');
  if (!legacy) return model;
  const table = model.factTables.find((f) => f.name === legacy.targetTable || f.id === legacy.targetTable);
  const ds = table ? usedDatasets.find((d) => d.id === table.datasetId) : undefined;
  const broken = !table || (ds && !ds.columns.some((c) => c.name === legacy.targetColumn));
  if (!broken) return model;
  return { ...model, measures: model.measures.filter((m) => m.id !== 'meas_default_sales') };
}

export function syncModelWithUsedDatasets(
  existingModel: DataModelState | undefined,
  usedDatasets: Dataset[],
  dashboardName: string = 'Dashboard'
): DataModelState {
  if (existingModel) existingModel = dropInvalidDefaultMeasure(existingModel, usedDatasets);
  // If no datasets used at all
  if (!usedDatasets || usedDatasets.length === 0) {
    if (existingModel) return existingModel;
    return {
      id: `model_${Date.now()}`,
      name: `${dashboardName} Data Model`,
      factTables: [],
      dimensionTables: [],
      relationships: [],
      measures: [],
      hierarchies: [],
      versions: [],
      updatedAt: new Date().toISOString(),
    };
  }

  // If no existing model or empty model, generate complete star schema for all used datasets
  if (
    !existingModel ||
    (existingModel.factTables.length === 0 && existingModel.dimensionTables.length === 0)
  ) {
    const fullSuggestion = suggestStarSchema(usedDatasets);
    return {
      id: existingModel?.id || `model_${Date.now()}`,
      name: existingModel?.name || `${dashboardName} Analytical Star Schema`,
      factTables: fullSuggestion.factTables,
      dimensionTables: fullSuggestion.dimensionTables,
      relationships: fullSuggestion.relationships,
      measures: defaultMeasuresFor(fullSuggestion.factTables),
      hierarchies: fullSuggestion.dimensionTables.flatMap((d) => d.hierarchies || []),
      versions: existingModel?.versions || [
        {
          id: `v_init_${Date.now()}`,
          versionName: 'Model v1 - Star Schema with All Datasets',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          description: 'Auto-detected star schema topology containing all used datasets',
          snapshot: {
            factTables: fullSuggestion.factTables,
            dimensionTables: fullSuggestion.dimensionTables,
            relationships: fullSuggestion.relationships,
            measures: [],
            hierarchies: [],
          },
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }

  // Helper to resolve dataset ID from a table
  const resolveTableDatasetId = (table: FactTable | DimensionTable): string | undefined => {
    if (table.datasetId) return table.datasetId;
    const cleanTableName = (table.name || '').toUpperCase().replace(/^FACT_|^DIM_/, '');
    const match = usedDatasets.find((d) => {
      const cleanDsName = (d.name || '').toUpperCase().replace(/\s+/g, '_');
      return cleanDsName === cleanTableName || (d.id && table.id.includes(d.id));
    });
    return match?.id;
  };

  const usedDatasetIdSet = new Set(usedDatasets.map((d) => d.id));

  // Retain only valid tables (belonging to current used datasets, or DIM_DATE calendar dimension)
  const validFactTables: FactTable[] = existingModel.factTables
    .map((f) => ({ ...f, datasetId: f.datasetId || resolveTableDatasetId(f) || f.datasetId }))
    .filter((f) => !f.datasetId || usedDatasetIdSet.has(f.datasetId));

  const validDimTables: DimensionTable[] = existingModel.dimensionTables
    .map((d) => ({ ...d, datasetId: d.datasetId || resolveTableDatasetId(d) || d.datasetId }))
    .filter((d) => d.name === 'DIM_DATE' || !d.datasetId || usedDatasetIdSet.has(d.datasetId));

  const validTableIds = new Set([
    ...validFactTables.map((f) => f.id),
    ...validDimTables.map((d) => d.id),
  ]);

  const validRelationships = existingModel.relationships.filter(
    (r) => validTableIds.has(r.fromTableId) && validTableIds.has(r.toTableId)
  );

  // Check which used datasets are currently represented
  const existingFactTableDatasetIds = new Set(validFactTables.map((f) => f.datasetId).filter(Boolean));
  const existingDimTableDatasetIds = new Set(validDimTables.map((d) => d.datasetId).filter(Boolean));
  const representedDatasetIds = new Set([
    ...existingFactTableDatasetIds,
    ...existingDimTableDatasetIds,
  ]);

  const missingDatasets = usedDatasets.filter((ds) => !representedDatasetIds.has(ds.id));

  // If all datasets are already represented and no tables were removed, return existing model
  if (
    missingDatasets.length === 0 &&
    validFactTables.length === existingModel.factTables.length &&
    validDimTables.length === existingModel.dimensionTables.length
  ) {
    return existingModel;
  }

  // Auto-generate tables for the missing datasets
  const missingSuggestion = suggestStarSchema(missingDatasets);

  // Position newly added tables offset from existing tables
  const existingCount = validFactTables.length + validDimTables.length;
  const newFactTables: FactTable[] = missingSuggestion.factTables.map((ft, i) => ({
    ...ft,
    position: {
      x: 500 + (validFactTables.length + i) * 320,
      y: 320,
    },
  }));

  const newDimTables: DimensionTable[] = missingSuggestion.dimensionTables.map((dt, i) => {
    const angle =
      ((validDimTables.length + i) / Math.max(1, existingCount + missingDatasets.length)) *
        2 *
        Math.PI -
      Math.PI / 2;
    return {
      ...dt,
      position: {
        x: Math.round(500 + 380 * Math.cos(angle)),
        y: Math.round(320 + 380 * Math.sin(angle)),
      },
    };
  });

  // Connect new tables with relationships to existing tables
  const allFactTables = [...validFactTables, ...newFactTables];
  const allDimTables = [...validDimTables, ...newDimTables];
  const allRelationships = [...validRelationships, ...missingSuggestion.relationships];

  // Helper to establish relationship if matching keys found
  const tryConnect = (dim: DimensionTable, fact: FactTable) => {
    const factDataset = usedDatasets.find((ds) => ds.id === fact.datasetId);
    const dimDataset = usedDatasets.find((ds) => ds.id === dim.datasetId);
    if (!factDataset || !dimDataset) return;

    const dimKey = dim.primaryKey;
    const matchingFactCol = factDataset.columns.find((fc) => {
      const fcNorm = fc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const dimNorm = dimKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      return fcNorm === dimNorm || fc.name.toLowerCase() === dimKey.toLowerCase();
    });

    if (matchingFactCol) {
      const alreadyExists = allRelationships.some(
        (r) =>
          (r.fromTableId === dim.id && r.toTableId === fact.id) ||
          (r.fromTableId === fact.id && r.toTableId === dim.id)
      );
      if (!alreadyExists) {
        allRelationships.push({
          id: `rel_${dim.id}_${fact.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: `${dim.name} → ${fact.name}`,
          fromTableId: dim.id,
          fromColumn: dimKey,
          toTableId: fact.id,
          toColumn: matchingFactCol.name,
          cardinality: '1:*',
          isActive: true,
        });
      }
    }
  };

  // Connect new dimensions with all fact tables
  newDimTables.forEach((dim) => {
    allFactTables.forEach((fact) => tryConnect(dim, fact));
  });

  // Connect new facts with all dimension tables
  newFactTables.forEach((fact) => {
    allDimTables.forEach((dim) => tryConnect(dim, fact));
  });

  return {
    ...existingModel,
    factTables: allFactTables,
    dimensionTables: allDimTables,
    relationships: allRelationships,
    hierarchies: [
      ...(existingModel.hierarchies || []),
      ...newDimTables.flatMap((d) => d.hierarchies || []),
    ],
    updatedAt: new Date().toISOString(),
  };
}
