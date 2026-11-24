import { z } from 'zod';

export const idSchema = z.string().min(1).max(128);

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  first_name: z.string().trim().max(100).optional(),
  last_name: z.string().trim().max(100).optional(),
  role: z.string().trim().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1).max(254),
  password: z.string().min(1).max(128),
});

export const datasetSchema = z.looseObject({
  id: idSchema,
  name: z.string().trim().min(1).max(255),
  description: z.string().max(5000).optional(),
  columns: z.array(z.any()).optional(),
  data: z.array(z.any()).optional(),
  cleanedData: z.array(z.any()).nullable().optional(),
  cleaningPipeline: z.array(z.any()).optional(),
  tags: z.array(z.string().max(100)).max(100).optional(),
});

export const datasetUpdateSchema = datasetSchema.partial().extend({ name: datasetSchema.shape.name.optional() });

export const versionSchema = z.object({
  transformation_steps: z.array(z.any()).optional(),
  row_count: z.number().int().nonnegative().optional(),
  column_count: z.number().int().nonnegative().optional(),
});

export const dashboardSchema = z.looseObject({
  id: idSchema,
  name: z.string().max(255).optional(),
});

export const modelSchema = z.looseObject({
  id: idSchema,
  name: z.string().max(255).optional(),
});

export const settingsSchema = z.object({
  preferences: z.record(z.string(), z.any()).optional(),
  theme: z.string().max(20).optional(),
});

export const forecastConfigurationSchema = z.object({
  dateColumn: z.string().min(1, 'Date column is required').max(255),
  targetColumn: z.string().min(1, 'Target column is required').max(255),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('sum'),
  frequency: z.enum(['auto', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('auto'),
  horizonDays: z.number().int().min(1).max(3650).optional().default(30),
  horizonSteps: z.number().int().min(1).max(365).optional(),
  model: z
    .enum([
      'auto',
      'naive',
      'seasonal_naive',
      'moving_average',
      'ets',
      'holt_winters',
      'arima',
      'sarima',
      'linear_regression',
      'tsb',
    ])
    .default('auto'),
  groupColumn: z.string().max(255).nullable().optional(),
  groupValue: z.string().max(255).nullable().optional(),
  confidenceLevel: z.enum(['80', '90', '95']).default('95'),
  calendarEffects: z
    .object({
      enabled: z.boolean().default(false),
      country: z.enum(['EG', 'SA', 'AE', 'US', 'GB']).optional().default('EG'),
    })
    .optional(),
});

export const forecastCreateSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1, 'Forecast name is required').max(255),
  mode: z.enum(['general', 'business']).default('general'),
  businessTemplate: z
    .enum([
      'sales',
      'revenue',
      'profit',
      'expenses',
      'inventory',
      'demand',
      'website_traffic',
      'general_business',
    ])
    .nullable()
    .optional(),
  datasetId: idSchema,
  configuration: forecastConfigurationSchema,
  runImmediately: z.boolean().optional(),
});

export const forecastUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  mode: z.enum(['general', 'business']).optional(),
  businessTemplate: z
    .enum([
      'sales',
      'revenue',
      'profit',
      'expenses',
      'inventory',
      'demand',
      'website_traffic',
      'general_business',
    ])
    .nullable()
    .optional(),
  datasetId: idSchema.optional(),
  configuration: forecastConfigurationSchema.partial().optional(),
});

export const forecastRunSchema = z.object({
  configuration: forecastConfigurationSchema.partial().optional(),
});

export const forecastDetectSchema = z.object({
  datasetId: idSchema,
  dateColumn: z.string().min(1).max(255),
  targetColumn: z.string().min(1).max(255),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('sum'),
  groupColumn: z.string().max(255).nullable().optional(),
  groupValue: z.string().max(255).nullable().optional(),
});

export const forecastScenarioSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1, 'Scenario name is required').max(120),
  assumptions: z.object({
    growthRateDeltaPct: z.number().min(-95).max(500).optional().default(0),
    volumeDeltaPct: z.number().min(-95).max(500).optional().default(0),
    priceChangePct: z.number().min(-95).max(500).optional().default(0),
    priceElasticity: z.number().min(-10).max(5).optional().default(0),
    costDeltaPct: z.number().min(-95).max(500).optional().default(0),
    salesDeltaPct: z.number().min(-95).max(500).optional().default(0),
    demandDeltaPct: z.number().min(-95).max(500).optional().default(0),
    expenseDeltaPct: z.number().min(-95).max(500).optional().default(0),
  }),
});

