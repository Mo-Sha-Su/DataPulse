/**
 * Bilingual English / Arabic translation dictionary and type contract.
 * Both `en` and `ar` must define an identical key set (verified by `i18n.test.ts`).
 */

export type Language = 'en' | 'ar';
export type TranslateFn = (key: keyof Translations, params?: Record<string, string | number>) => string;

export interface Translations {
  // Brand & Navigation
  brandName: string;
  brandTagline: string;
  home: string;
  features: string;
  pricing: string;
  about: string;
  dashboards: string;
  dataHub: string;
  visualGallery: string;
  workbench: string;
  signIn: string;
  signUp: string;
  getStartedFree: string;
  logOut: string;
  account: string;
  quickTour: string;
  help: string;
  settings: string;

  // Onboarding Tutorial
  tourWelcomeTitle: string;
  tourWelcomeDesc: string;
  tourCanvasTitle: string;
  tourCanvasDesc: string;
  tourDataHubTitle: string;
  tourDataHubDesc: string;
  tourDataLabTitle: string;
  tourDataLabDesc: string;
  tourReadyTitle: string;
  tourReadyDesc: string;
  tourStep1Title: string;
  tourStep1Desc: string;
  tourStep2Title: string;
  tourStep2Desc: string;
  tourStep3Title: string;
  tourStep3Desc: string;
  tourStep4Title: string;
  tourStep4Desc: string;
  tourStep5Title: string;
  tourStep5Desc: string;
  tourStep6Title: string;
  tourStep6Desc: string;
  tourStep7Title: string;
  tourStep7Desc: string;
  exploreSection: string;
  next: string;
  previous: string;
  skipTour: string;
  getStarted: string;
  dontShowAgain: string;
  stepOf: string;

  // Data Lab & Dialogs
  dataLabTitle: string;
  dataLabSubtitle: string;
  discard: string;
  applyAndClose: string;
  savingChanges: string;
  addFile: string;
  uploadFile: string;
  newEmptyQuery: string;
  addDatasetMenu: string;
  openExistingDataset: string;
  closeTabTip: string;
  allTabsClosedTitle: string;
  allTabsClosedDesc: string;
  closeDataset: string;
  stepsHistory: string;
  sourceStep: string;
  columnInspector: string;
  dataQuality: string;
  valid: string;
  empty: string;
  errors: string;
  selectedColumnLabel: string;
  selectedRowLabel: string;
  selectedCellLabel: string;
  cellValue: string;
  copyValue: string;
  copied: string;
  filterByValue: string;
  replaceValue: string;
  clearSelection: string;
  noColumnsInView: string;
  bringInDataTitle: string;
  bringInDataDesc: string;
  appliedSuccessToast: string;

  // Confirmation Modals
  unsavedChangesTitle: string;
  unsavedChangesDesc: string;
  saveAndApply: string;
  discardChanges: string;
  continueEditing: string;
  closeDatasetConfirmTitle: string;
  closeDatasetConfirmDesc: string;
  selectAllRows: string;
  selectedCount: string;

  // General Actions & Tooltips
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  close: string;
  search: string;
  filter: string;
  sort: string;
  loading: string;
  retry: string;
  rows: string;
  columns: string;

  // Workspace & Dashboard Hub
  workspaceEyebrow: string;
  welcomeBackUser: string;
  dashboardHubDesc: string;
  newDashboardOrReport: string;
  workspaces: string;
  interactiveDashboards: string;
  printableReports: string;
  workspaceHistory: string;
  all: string;
  dashboardsTab: string;
  reportsTab: string;
  searchByName: string;
  allTime: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  sortBy: string;
  sortNewest: string;
  sortOldest: string;
  sortName: string;
  nothingHereYet: string;
  noMatches: string;
  clearSearchFilters: string;
  createFirstDashboardDesc: string;
  createACanvas: string;
  open: string;
  reportBadge: string;
  dashboardBadge: string;
  usedFor: string;
  widgets: string;
  models: string;
  canvas: string;
  createModalTitle: string;
  createModalDesc: string;
  projectType: string;
  interactiveDashboardTitle: string;
  interactiveDashboardDesc: string;
  printableReportTitle: string;
  printableReportDesc: string;
  canvasPreset: string;
  canvasName: string;
  dashboardNamePlaceholder: string;
  reportNamePlaceholder: string;
  usedForLabel: string;
  usedForPlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  chooseIcon: string;
  attachDatasets: string;
  noDatasetsInHub: string;
  createCanvasBtn: string;
  deleteCanvasTitle: string;
  deleteCanvasDesc: string;
  deletePermanently: string;
  logoutConfirmTitle: string;
  logoutConfirmDesc: string;
  accountSettings: string;
  helpDocumentation: string;

  // Data Hub
  dataHubHeroTitle: string;
  dataHubHeroDesc: string;
  uploadDataset: string;
  recordsUnderManagement: string;
  cleanedInDataLab: string;
  stillRaw: string;
  searchDatasetsPlaceholder: string;
  filterByTag: string;
  allTags: string;
  bringInFirstDataset: string;
  noDatasetsMatch: string;
  clearSearchTag: string;
  uploadCsvExcelStart: string;
  openInDataLab: string;
  newDashboardWithData: string;
  deleteDataset: string;
  deleteDatasetConfirm: string;
  rawDataset: string;
  cleanedDataset: string;

  // Data Lab Column Actions & Grid
  renameColumnAction: string;
  duplicateColumnAction: string;
  splitColumnAction: string;
  mergeColumnsAction: string;
  replaceValuesAction: string;
  replaceErrorsAction: string;
  fillDownAction: string;
  fillUpAction: string;
  moveLeftAction: string;
  moveRightAction: string;
  removeColumnAction: string;
  previewingRows: string;
  showMoreRows: string;
  showAllRows: string;
  cellError: string;

  // Top Toolbar & Menus
  menuFile: string;
  menuEdit: string;
  menuView: string;
  menuInsert: string;
  menuFormat: string;
  menuHelp: string;
  newDashboard: string;
  newReport: string;
  saveNow: string;
  saved: string;
  saving: string;
  unsavedChanges: string;
  preview: string;
  exitPreview: string;
  exportPdf: string;
  exportPdfModalTitle: string;
  exportPdfModalSubtitle: string;
  pdfFilenameLabel: string;
  pageSizeLabel: string;
  orientationLabel: string;
  portrait: string;
  landscape: string;
  pageMarginsLabel: string;
  pageRangeLabel: string;
  allPages: string;
  currentPageOnly: string;
  customPagesLabel: string;
  exportResolution: string;
  generatePdfBtn: string;
  generatingPdfStatus: string;
  pdfExportError: string;

  // Modal: Select Datasets
  selectDatasetsForTitle: string;
  selectDatasetsSubtitle: string;
  searchGlobalDatasetsPlaceholder: string;
  warningDeselectedInUse: string;
  applySelectionBtn: string;

  // Modal: Dataset Preview
  searchRecordsPlaceholder: string;
  showingMatchingRows: string;

  // Modal: Manage Dashboards
  dashboardManagerTitle: string;
  exportDashboardJson: string;
  importJson: string;
  pasteDashboardJson: string;
  applyImportedDashboard: string;
  availableDashboards: string;
  activeWorkspaceBadge: string;
  loadWorkspaceBtn: string;
  invalidJsonError: string;

  canvasSettings: string;
  dataModel: string;
  backToCanvas: string;
  globalFilters: string;
  selectDatasets: string;
  newPage: string;
  addPage: string;
  deletePage: string;
  renamePage: string;
  page: string;
  undo: string;
  redo: string;
  gridSnap: string;
  showGrid: string;
  zoom: string;

  // Left Sidebar
  visualizations: string;
  datasets: string;
  dragVisualHint: string;
  searchVisuals: string;
  dataCleaningStudio: string;
  starSchemaModel: string;
  noDatasetsAttached: string;
  addDatasetToDashboard: string;
  inspectColumns: string;

  // Right Config Panel
  widgetSettings: string;
  dataTab: string;
  styleTab: string;
  advancedTab: string;
  selectDataset: string;
  xAxisField: string;
  yAxisField: string;
  seriesField: string;
  aggregation: string;
  sum: string;
  average: string;
  count: string;
  min: string;
  max: string;
  chartTitle: string;
  primaryColor: string;
  colorPalette: string;
  backgroundColor: string;
  numberFormat: string;
  currencySymbol: string;

  // Data Model
  modelWorkspaceTitle: string;
  modelWorkspaceDesc: string;
  addFactTable: string;
  addDimensionTable: string;
  createRelationship: string;
  autoDetectRelationships: string;

  openSavedProjects: string;
  saveReport: string;
  exploreData: string;
  backToHub: string;
  renameReportTitle: string;
  deleteActivePage: string;
  fitPage: string;
  fitWidth: string;
  resetZoom: string;
  keyboardShortcuts: string;
  aboutDataPulse: string;
  canvasSizeSettings: string;
  manualDimensions: string;
  width: string;
  height: string;
  lockRatio: string;
  unlockRatio: string;
  allWidgets: string;
  chartsCategory: string;
  analyticsCategory: string;
  threeDCategory: string;
  uploadCsvExcel: string;
  uploadCsvExcelHint: string;
  selectData: string;
  loadedDatasets: string;
  noDatasetsSelected: string;
  attachDatasetsHint: string;
  inspect: string;
  transform: string;
  dataBinding: string;
  stylingOptions: string;
  sampleData: string;
  targetDataset: string;
  reset: string;
  applyConfiguration: string;
  transparentBackground: string;
  syncAllDatasets: string;
  autoDetectSchema: string;
  factTableBtn: string;
  dimensionTableBtn: string;
  relationshipBtn: string;
  measuresBtn: string;
  score: string;
  searchFieldsPlaceholder: string;
  searchChartTypes: string;
  insertWidgets: string;
  standardChart: string;
  kpiMetricCard: string;
  richTextBlock: string;
  scatter3dGraph: string;
  insertNewPage: string;

  // Auth Pages
  backToHome: string;
  welcomeBackTitle: string;
  welcomeBackSubtitle: string;
  emailAddress: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  firstNameLabel: string;
  lastNameLabel: string;
  dontHaveAccount: string;
  createOneFree: string;
  alreadyHaveAccount: string;
  createAccountTitle: string;
  startFreeTrial: string;
  createAccountBtn: string;
  signInBtn: string;
  enterEmailError: string;
  enterValidEmailError: string;
  enterPasswordError: string;
  passwordsDoNotMatch: string;
  passwordMinLength: string;
  enterFullNameError: string;
  termsAgreementText: string;
  termsOfService: string;
  privacyPolicy: string;
  agreeTermsError: string;
  roleLabel: string;
  roleAnalyst: string;
  roleDeveloper: string;
  roleViewer: string;
  roleAdmin: string;
  passwordStrength: string;
  passwordStrengthWeak: string;
  passwordStrengthFair: string;
  passwordStrengthGood: string;
  passwordStrengthStrong: string;

  // Home & Marketing Pages
  heroTitle1: string;
  heroTitleHighlight: string;
  heroDescription: string;
  exploreAllFeatures: string;
  exploreDataPulseTitle: string;
  exploreDataPulseSubtitle: string;
  productFeaturesTitle: string;
  productFeaturesDesc: string;
  transparentPricingTitle: string;
  transparentPricingDesc: string;
  enterpriseArchitectureTitle: string;
  enterpriseArchitectureDesc: string;
  readyToTransformTitle: string;
  readyToTransformDesc: string;
  launchCanvasBtn: string;
  allRightsReserved: string;

  // Plurals (6 Arabic forms: zero, one, two, few, many, other)
  rows_zero: string;
  rows_one: string;
  rows_two: string;
  rows_few: string;
  rows_many: string;
  rows_other: string;

  columns_zero: string;
  columns_one: string;
  columns_two: string;
  columns_few: string;
  columns_many: string;
  columns_other: string;

  datasets_zero: string;
  datasets_one: string;
  datasets_two: string;
  datasets_few: string;
  datasets_many: string;
  datasets_other: string;

  steps_zero: string;
  steps_one: string;
  steps_two: string;
  steps_few: string;
  steps_many: string;
  steps_other: string;

  selected_zero: string;
  selected_one: string;
  selected_two: string;
  selected_few: string;
  selected_many: string;
  selected_other: string;

  // Navbar, Status Badge & Error Boundary
  navHomeTitle: string;
  navGoToHub: string;
  navAccountMenu: string;
  navSectionsLabel: string;
  dbConnectionTitle: string;
  dbStatusLabel: string;
  dbCompactLabel: string;
  dbLabel: string;
  dbConnected: string;
  dbDisconnected: string;
  dbLatency: string;
  dbLatencyMs: string;
  dbTables: string;
  dbDatasets: string;
  dbDashboards: string;
  dbServerless: string;
  dbLivePooler: string;
  dbRefreshStatus: string;
  errorBoundaryWidgetMsg: string;
  errorBoundaryPageTitle: string;
  errorBoundaryPageDesc: string;
  reloadPage: string;

  // Auth extras
  authSigningIn: string;
  authInvalidCredentials: string;
  authConnectionError: string;
  authCreatingAccount: string;
  authRegistrationFailed: string;
  authRegistrationError: string;
  authPasswordsMatch: string;
  authFirstNamePlaceholder: string;
  authLastNamePlaceholder: string;

  // Marketing Pages (Features, Pricing, About, Sample Graphs)
  featuresHeroBadge: string;
  featuresHeroTitle1: string;
  featuresHeroTitle2: string;
  featuresHeroDesc: string;
  featuresTryBtn: string;
  featuresZeroLatency: string;
  featuresEngineReady: string;
  featuresFullStackTitle: string;
  featuresFullStackDesc: string;
  featuresCard1Title: string;
  featuresCard1Desc: string;
  featuresCard2Title: string;
  featuresCard2Desc: string;
  featuresCard3Title: string;
  featuresCard3Desc: string;
  featuresCard4Title: string;
  featuresCard4Desc: string;
  featuresCard5Title: string;
  featuresCard5Desc: string;
  featuresCard6Title: string;
  featuresCard6Desc: string;
  featuresCtaTitle: string;
  featuresCtaDesc: string;
  featuresViewGallery: string;

  pricingHeroBadge: string;
  pricingHeroTitle1: string;
  pricingHeroTitle2: string;
  pricingHeroDesc: string;
  pricingMonthly: string;
  pricingAnnual: string;
  pricingSave20: string;
  pricingIncludedCapabilities: string;
  pricingCompareTitle: string;
  pricingColFeature: string;
  pricingColStarter: string;
  pricingColPro: string;
  pricingColEnterprise: string;
  pricingRow1Label: string;
  pricingRow1Starter: string;
  pricingRow1Pro: string;
  pricingRow1Ent: string;
  pricingRow2Label: string;
  pricingRow2Starter: string;
  pricingRow2Pro: string;
  pricingRow2Ent: string;
  pricingRow3Label: string;
  pricingRow3Starter: string;
  pricingRow3Pro: string;
  pricingRow3Ent: string;
  pricingRow4Label: string;
  pricingRow4Starter: string;
  pricingRow4Pro: string;
  pricingRow4Ent: string;
  pricingRow5Label: string;
  pricingRow5Starter: string;
  pricingRow5Pro: string;
  pricingRow5Ent: string;
  pricingFaqTitle: string;
  pricingFaqDesc: string;
  pricingFaq1Q: string;
  pricingFaq1A: string;
  pricingFaq2Q: string;
  pricingFaq2A: string;
  pricingFaq3Q: string;
  pricingFaq3A: string;
  pricingFaq4Q: string;
  pricingFaq4A: string;
  pricingFaq5Q: string;
  pricingFaq5A: string;
  pricingNeedCustomTitle: string;
  pricingNeedCustomDesc: string;
  pricingSpeakEngineer: string;

  aboutArchFlowTitle: string;
  aboutArchBoundary: string;
  aboutArchStep1Title: string;
  aboutArchStep1Desc: string;
  aboutArchStep1Badge: string;
  aboutArchStep2Title: string;
  aboutArchStep2Desc: string;
  aboutArchStep2Badge: string;
  aboutArchStep3Title: string;
  aboutArchStep3Desc: string;
  aboutArchStep3Badge: string;
  aboutArchStep4Title: string;
  aboutArchStep4Desc: string;
  aboutArchStep4Badge: string;
  aboutPrinciplesTitle: string;
  aboutPrinciplesDesc: string;

  galleryInteractiveDemo: string;
  galleryUsageTitle: string;
  galleryOverviewTitle: string;
  galleryBestUseCases: string;
  galleryProTip: string;
  galleryCtaTitle: string;
  galleryCtaDesc: string;
  galleryBuildBtn: string;
  galleryCatComparison: string;
  galleryCatTrends: string;
  galleryCatComposition: string;
  galleryCatKpi: string;
  galleryBarTitle: string;
  galleryBarSummary: string;
  galleryBarUse1: string;
  galleryBarUse2: string;
  galleryBarUse3: string;
  galleryBarInsight: string;
  galleryLineTitle: string;
  galleryLineSummary: string;
  galleryLineUse1: string;
  galleryLineUse2: string;
  galleryLineUse3: string;
  galleryLineInsight: string;
  galleryAreaTitle: string;
  galleryAreaSummary: string;
  galleryAreaUse1: string;
  galleryAreaUse2: string;
  galleryAreaUse3: string;
  galleryAreaInsight: string;
  galleryDonutTitle: string;
  galleryDonutSummary: string;
  galleryDonutUse1: string;
  galleryDonutUse2: string;
  galleryDonutUse3: string;
  galleryDonutInsight: string;
  galleryScatterTitle: string;
  galleryScatterSummary: string;
  galleryScatterUse1: string;
  galleryScatterUse2: string;
  galleryScatterUse3: string;
  galleryScatterInsight: string;
  galleryKpiTitle: string;
  galleryKpiSummary: string;
  galleryKpiUse1: string;
  galleryKpiUse2: string;
  galleryKpiUse3: string;
  galleryKpiInsight: string;
  galleryKpiMrrLabel: string;
  galleryKpiMrrDelta: string;
  galleryKpiChurnLabel: string;
  galleryKpiChurnDelta: string;
  galleryKpiCacLabel: string;
  galleryKpiCacValue: string;
  galleryKpiCacDelta: string;

  // App, Hubs, Canvas, Toolbar, Sidebar, Filters, Widgets
  appNewDashboardName: string;
  appNewReportName: string;
  appUntitledDashboard: string;
  appCannotDeleteLastPage: string;
  appLoadingWorkspace: string;
  appSavingError: string;
  appNewPageName: string;
  hubCreateErrorFallback: string;
  hubTypePresetDesktop: string;
  hubTypePresetTablet: string;
  hubTypePresetA4Portrait: string;
  hubTypePresetA4Landscape: string;
  hubTypePresetLetter: string;
  dataHubNumericCol: string;
  dataHubTextCol: string;
  dataHubDateCol: string;
  dataHubBoolCol: string;
  dataHubDeleteTitle: string;
  dataHubDeleteWarning: string;
  dataHubDeleting: string;
  dataHubNoDescription: string;

  toolbarRenamePrompt: string;
  toolbarDuplicatePage: string;
  toolbarMovePageLeft: string;
  toolbarMovePageRight: string;
  toolbarShortcutsTitle: string;
  toolbarShortcutUndo: string;
  toolbarShortcutRedo: string;
  toolbarShortcutDelete: string;
  toolbarShortcutPalette: string;
  toolbarShortcutClose: string;
  toolbarAboutDesc: string;
  toolbarQuickPresets: string;
  toolbarSize16x9: string;
  toolbarSizeA4: string;
  toolbarSizeLetter: string;
  toolbarAspectLocked: string;
  toolbarClickToRename: string;
  toolbarNewPagePrefix: string;
  toolbarGridSnapTip: string;
  toolbarShowGridTip: string;
  toolbarUndoTip: string;
  toolbarRedoTip: string;
  toolbarPreviewTip: string;
  toolbarSaveTip: string;

  sidebarCustomVisuals: string;
  sidebarSearchEmpty: string;
  sidebarNoMatch: string;
  sidebarRowsShort: string;
  sidebarColsShort: string;
  sidebarRemoveDataset: string;

  canvasEmptyTitle: string;
  canvasEmptyDesc: string;
  canvasQuickSizeTitle: string;
  canvasPresetCustom: string;
  canvasPageHeaderPlaceholder: string;
  canvasPageFooterPlaceholder: string;
  canvasOfPages: string;
  canvasGridBgLabel: string;

  widgetEditTitle: string;
  widgetDuplicateTitle: string;
  widgetDeleteTitle: string;
  widgetConfigureData: string;
  widgetNoDataTitle: string;
  widgetNoDataDesc: string;
  widgetLoading3d: string;
  widget3dUnavailable: string;
  widgetChartError: string;
  widgetTextPlaceholder: string;
  widgetSelectFieldPrompt: string;
  widgetRecordsLabel: string;
  widgetComparePrev: string;

  configNoWidgetTitle: string;
  configNoWidgetDesc: string;
  configDatasetLabel: string;
  configAutoSelect: string;
  configNone: string;
  configValueFormat: string;
  configFormatAuto: string;
  configFormatCurrency: string;
  configFormatPercent: string;
  configFormatCompact: string;
  configFormatDecimal: string;
  configDecimals: string;
  configLegendPosition: string;
  configShowLegend: string;
  configShowGrid: string;
  configShowLabels: string;
  configFontSize: string;
  configFontFamily: string;
  configTextAlign: string;
  configTextContent: string;
  configPadding: string;
  configBorderRadius: string;
  configAccentColor: string;
  configSamplePreviewTitle: string;
  configNoSampleRows: string;
  configAxisXLabel: string;
  configAxisYLabel: string;
  configAggDistinct: string;
  configPaletteDefault: string;
  configPaletteVibrant: string;
  configPaletteOcean: string;
  configPaletteSunset: string;
  configPaletteForest: string;
  configPaletteMono: string;
  configShowHeader: string;
  configShowBorder: string;
  configBorderColor: string;
  configTitleColor: string;
  configAlignStart: string;
  configAlignCenter: string;
  configAlignEnd: string;

  filterBarClearAll: string;
  filterOpEquals: string;
  filterOpContains: string;
  filterOpGreater: string;
  filterOpLess: string;

  exportPdfCustomSize: string;
  exportPdfMarginTop: string;
  exportPdfMarginRight: string;
  exportPdfMarginBottom: string;
  exportPdfMarginLeft: string;
  exportPdfActiveView: string;
  exportPdfCustomPlaceholder: string;
  exportPdfQualityDesc: string;
  exportPdf2x: string;
  exportPdf3x: string;
  exportPdfDefaultName: string;
  exportPdfPagesCount: string;
  exportPdfPageSingular: string;

  importErrorRead: string;
  importErrorNoRows: string;
  importErrorSave: string;
  importProgressPrep: string;
  importProgressSaving: string;
  importProgressDone: string;
  importDefaultDatasetPlaceholder: string;
  importReading: string;
  tourGoToStep: string;
  tourProgressLabel: string;

  // 31 Widget Definitions
  widget_bar_name: string; widget_bar_desc: string;
  widget_stacked_bar_name: string; widget_stacked_bar_desc: string;
  widget_column_name: string; widget_column_desc: string;
  widget_line_name: string; widget_line_desc: string;
  widget_area_name: string; widget_area_desc: string;
  widget_stacked_area_name: string; widget_stacked_area_desc: string;
  widget_pie_name: string; widget_pie_desc: string;
  widget_donut_name: string; widget_donut_desc: string;
  widget_scatter_name: string; widget_scatter_desc: string;
  widget_bubble_name: string; widget_bubble_desc: string;
  widget_radar_name: string; widget_radar_desc: string;
  widget_polar_name: string; widget_polar_desc: string;
  widget_heatmap_name: string; widget_heatmap_desc: string;
  widget_treemap_name: string; widget_treemap_desc: string;
  widget_funnel_name: string; widget_funnel_desc: string;
  widget_waterfall_name: string; widget_waterfall_desc: string;
  widget_boxplot_name: string; widget_boxplot_desc: string;
  widget_histogram_name: string; widget_histogram_desc: string;
  widget_kpi_name: string; widget_kpi_desc: string;
  widget_gauge_name: string; widget_gauge_desc: string;
  widget_sparkline_name: string; widget_sparkline_desc: string;
  widget_table_name: string; widget_table_desc: string;
  widget_pivot_name: string; widget_pivot_desc: string;
  widget_slicer_name: string; widget_slicer_desc: string;
  widget_textbox_name: string; widget_textbox_desc: string;
  widget_combo_name: string; widget_combo_desc: string;
  widget_bullet_name: string; widget_bullet_desc: string;
  widget_metric_name: string; widget_metric_desc: string;
  widget_progress_name: string; widget_progress_desc: string;
  widget_target_vs_actual_name: string; widget_target_vs_actual_desc: string;
  widget_candlestick_name: string; widget_candlestick_desc: string;
  widget_ohlc_name: string; widget_ohlc_desc: string;
  widget_scatter3d_name: string; widget_scatter3d_desc: string;
  widget_surface3d_name: string; widget_surface3d_desc: string;
  widget_bar3d_name: string; widget_bar3d_desc: string;
  widget_mesh3d_name: string; widget_mesh3d_desc: string;
  widget_bubble3d_name: string; widget_bubble3d_desc: string;
  widget_line3d_name: string; widget_line3d_desc: string;
  widget_contour3d_name: string; widget_contour3d_desc: string;
  widget_volume3d_name: string; widget_volume3d_desc: string;
  widget_cone3d_name: string; widget_cone3d_desc: string;
  widget_streamtube3d_name: string; widget_streamtube3d_desc: string;
  widget_isosurface3d_name: string; widget_isosurface3d_desc: string;

  // Data Lab & Data Cleaning
  labActingOn: string;
  labQuickCommands: string;
  labSearchPlaceholder: string;
  labAllActions: string;
  labClosePalette: string;
  labNoMatchingCommands: string;
  labRequiresColumn: string;
  labRequiresNumber: string;
  labRequiresDate: string;
  labSelectColumnFirst: string;
  labGroupClean: string;
  labGroupCleanBlurb: string;
  labGroupRows: string;
  labGroupRowsBlurb: string;
  labGroupColumns: string;
  labGroupColumnsBlurb: string;
  labGroupCompute: string;
  labGroupComputeBlurb: string;

  labAction_trim_label: string; labAction_trim_hint: string;
  labAction_clean_label: string; labAction_clean_hint: string;
  labAction_upper_label: string; labAction_upper_hint: string;
  labAction_lower_label: string; labAction_lower_hint: string;
  labAction_title_label: string; labAction_title_hint: string;
  labAction_replace_label: string; labAction_replace_hint: string;
  labAction_nulls_label: string; labAction_nulls_hint: string;
  labAction_errors_label: string; labAction_errors_hint: string;
  labAction_filldown_label: string; labAction_filldown_hint: string;
  labAction_fillup_label: string; labAction_fillup_hint: string;
  labAction_sortasc_label: string; labAction_sortasc_hint: string;
  labAction_sortdesc_label: string; labAction_sortdesc_hint: string;
  labAction_dupes_label: string; labAction_dupes_hint: string;
  labAction_removeblank_label: string; labAction_removeblank_hint: string;
  labAction_keeptop_label: string; labAction_keeptop_hint: string;
  labAction_keepbottom_label: string; labAction_keepbottom_hint: string;
  labAction_keeprange_label: string; labAction_keeprange_hint: string;
  labAction_removetop_label: string; labAction_removetop_hint: string;
  labAction_removebottom_label: string; labAction_removebottom_hint: string;
  labAction_removealt_label: string; labAction_removealt_hint: string;
  labAction_split_label: string; labAction_split_hint: string;
  labAction_merge_label: string; labAction_merge_hint: string;
  labAction_rename_label: string; labAction_rename_hint: string;
  labAction_duplicate_label: string; labAction_duplicate_hint: string;
  labAction_left_label: string; labAction_left_hint: string;
  labAction_right_label: string; labAction_right_hint: string;
  labAction_remove_label: string; labAction_remove_hint: string;
  labAction_custom_label: string; labAction_custom_hint: string;
  labAction_math_label: string; labAction_math_hint: string;
  labAction_round_label: string; labAction_round_hint: string;
  labAction_roundup_label: string; labAction_roundup_hint: string;
  labAction_rounddown_label: string; labAction_rounddown_hint: string;
  labAction_abs_label: string; labAction_abs_hint: string;
  labAction_date_year_label: string; labAction_date_year_hint: string;
  labAction_date_month_label: string; labAction_date_month_hint: string;
  labAction_date_month_name_label: string; labAction_date_month_name_hint: string;
  labAction_date_quarter_label: string; labAction_date_quarter_hint: string;
  labAction_date_day_label: string; labAction_date_day_hint: string;
  labAction_date_day_name_label: string; labAction_date_day_name_hint: string;

  labInspectorColumnTitle: string;
  labInspectorHealthTitle: string;
  labInspectorSelectColHint: string;
  labInspectorProfile: string;
  labInspectorNulls: string;
  labInspectorErrors: string;
  labInspectorDistinct: string;
  labInspectorMin: string;
  labInspectorMax: string;
  labInspectorMean: string;
  labInspectorMostCommon: string;
  labInspectorTopValues: string;
  labInspectorSuggestedFixes: string;
  labInspectorApply: string;
  labInspectorNoFixes: string;
  labInspectorTableSummary: string;
  labInspectorDuplicateRows: string;
  labInspectorRemoveDupesBtn: string;
  labFixTrimTitle: string;
  labFixTrimDetail: string;
  labFixNullsTitle: string;
  labFixNullsDetail: string;
  labFixErrorsTitle: string;
  labFixErrorsDetail: string;
  labFixCaseTitle: string;
  labFixCaseDetail: string;
  labFixDupesTitle: string;
  labFixDupesDetail: string;

  labStatusMCode: string;
  labStatusCopyCode: string;
  labStatusCopiedCode: string;
  labStatusSelectedCell: string;

  labRailViewingStep: string;
  labRailJumpLatest: string;
  labRailSourceSize: string;
  labRailMoveUp: string;
  labRailMoveDown: string;
  labRailRename: string;
  labRailEditSettings: string;
  labRailDeleteStep: string;
  labRailRenameQuery: string;
  labRailDeltaAddedRows: string;
  labRailDeltaRemovedRows: string;
  labRailDeltaAddedCols: string;
  labRailDeltaRemovedCols: string;
  labRailDeltaNoChange: string;

  labStepType_source: string;
  labStepType_changed_type: string;
  labStepType_promoted_headers: string;
  labStepType_removed_columns: string;
  labStepType_renamed_column: string;
  labStepType_duplicated_column: string;
  labStepType_reordered_columns: string;
  labStepType_split_column: string;
  labStepType_merged_columns: string;
  labStepType_filter_rows: string;
  labStepType_sort_rows: string;
  labStepType_removed_top_rows: string;
  labStepType_removed_bottom_rows: string;
  labStepType_removed_alternate_rows: string;
  labStepType_kept_top_rows: string;
  labStepType_kept_bottom_rows: string;
  labStepType_kept_range_rows: string;
  labStepType_remove_duplicates: string;
  labStepType_remove_blank_rows: string;
  labStepType_replace_values: string;
  labStepType_replace_errors: string;
  labStepType_fill_down: string;
  labStepType_fill_up: string;
  labStepType_transform_text: string;
  labStepType_transform_number: string;
  labStepType_transform_date: string;
  labStepType_added_custom_column: string;

  labTabsNewQuery: string;
  labTabsCloseTab: string;

  labGridClickRowTip: string;
  labGridClickCellTip: string;
  labGridSelectAllTip: string;
  labGridCount: string;
  labGridSum: string;
  labGridAvg: string;
  labGridMin: string;
  labGridMax: string;
  labGridDistinct: string;
  labGridEmpty: string;
  labGridCopiedTsv: string;
  labGridCtrlCCopy: string;
  labGridSortAsc: string;
  labGridSortDesc: string;
  labGridClearSort: string;
  labGridTextFilters: string;
  labGridNumberFilters: string;
  labGridSearchValues: string;
  labGridSelectAllValues: string;
  labGridClearAllValues: string;
  labGridNoMatches: string;
  labGridColumnMenuTip: string;

  manageRowsRemoveTopTitle: string;
  manageRowsRemoveTopDesc: string;
  manageRowsRemoveBottomTitle: string;
  manageRowsRemoveBottomDesc: string;
  manageRowsRemoveBlankTitle: string;
  manageRowsRemoveBlankDesc: string;
  manageRowsRemoveAltTitle: string;
  manageRowsRemoveAltDesc: string;
  manageRowsKeepTopTitle: string;
  manageRowsKeepTopDesc: string;
  manageRowsKeepBottomTitle: string;
  manageRowsKeepBottomDesc: string;
  manageRowsKeepRangeTitle: string;
  manageRowsKeepRangeDesc: string;
  manageRowsCountRemove: string;
  manageRowsCountKeep: string;
  manageRowsCurrentTotal: string;
  manageRowsStartIndex: string;
  manageRowsFirstToRemove: string;
  manageRowsApply: string;

  mergeModalTitle: string;
  mergeSelectColumns: string;
  mergeMinTwoWarning: string;
  mergeSeparatorLabel: string;
  mergeSepSpace: string;
  mergeSepComma: string;
  mergeSepDash: string;
  mergeSepSemicolon: string;
  mergeSepNone: string;
  mergeSepCustom: string;
  mergeNewColName: string;
  mergeNewColPlaceholder: string;
  mergeCustomSepLabel: string;
  mergeCustomSepPlaceholder: string;
  mergeDropOriginals: string;
  mergePreviewLabel: string;
  mergeEmptyCell: string;
  mergeSubmitBtn: string;

  removeDupesTitle: string;
  removeDupesDesc: string;
  removeDupesSelectedOf: string;
  removeDupesSelectAll: string;
  removeDupesClearAll: string;
  removeDupesSubmitBtn: string;

  replaceValuesTitle: string;
  replaceValuesFindLabel: string;
  replaceValuesFindPlaceholder: string;
  replaceValuesNullHint: string;
  replaceValuesWithLabel: string;
  replaceValuesWithPlaceholder: string;
  replaceValuesMatchEntire: string;
  replaceValuesMatchSubstring: string;
  replaceValuesAffectedLabel: string;
  replaceValuesSubmitBtn: string;

  splitColTitle: string;
  splitByLabel: string;
  splitModeDelimiter: string;
  splitModeChars: string;
  splitModePositions: string;
  splitSelectDelimiter: string;
  splitDelimSpace: string;
  splitDelimComma: string;
  splitDelimSemicolon: string;
  splitDelimColon: string;
  splitDelimTab: string;
  splitDelimCustom: string;
  splitCustomDelimLabel: string;
  splitAtLabel: string;
  splitAtLeftmost: string;
  splitAtRightmost: string;
  splitAtEvery: string;
  splitCharCountLabel: string;
  splitPositionsLabel: string;
  splitPositionsHint: string;
  splitPreviewTitle: string;
  splitGeneratesCols: string;
  splitSubmitBtn: string;

  transformPrefixTitle: string;
  transformPrefixLabel: string;
  transformSuffixTitle: string;
  transformSuffixLabel: string;
  transformExtractFirstTitle: string;
  transformExtractFirstLabel: string;
  transformExtractLastTitle: string;
  transformExtractLastLabel: string;
  transformExtractRangeTitle: string;
  transformExtractRangeStart: string;
  transformExtractRangeLength: string;
  transformExtractBeforeTitle: string;
  transformExtractAfterTitle: string;
  transformDelimiterLabel: string;
  transformMathTitle: string;
  transformMathOpLabel: string;
  transformMathValLabel: string;
  transformOpAdd: string;
  transformOpSub: string;
  transformOpMul: string;
  transformOpDiv: string;
  transformOpMod: string;
  transformRoundTitle: string;
  transformRoundLabel: string;
  transformReplaceErrorsTitle: string;
  transformReplaceErrorsLabel: string;
  transformReplaceNullsTitle: string;
  transformNullStrategyLabel: string;
  transformNullZero: string;
  transformNullCustom: string;
  transformNullAvg: string;
  transformNullMedian: string;
  transformNullMin: string;
  transformNullMax: string;
  transformNullFillDown: string;
  transformNullFillUp: string;
  transformCustomValLabel: string;
  transformRenameStepTitle: string;
  transformRenameStepLabel: string;
  transformRenameColTitle: string;
  transformRenameColLabel: string;
  transformCustomColTitle: string;
  transformOkBtn: string;

  labPageUnnamedQuery: string;
  labPageLoadDatasetError: string;
  labPageSaveError: string;

  // Data Model & Modals
  dmStatsSummary: string;
  dmDimDateTitle: string;
  dmMeasuresTitle: string;
  dmValidationTitle: string;
  dmVersionsTitle: string;
  dmZoomOut: string;
  dmZoomIn: string;
  dmResetView: string;
  dmLegendTitle: string;
  dmLegendFact: string;
  dmLegendDim: string;
  dmLegendJoin: string;
  dmEmptyTitle: string;
  dmEmptyNoDatasetsDesc: string;
  dmEmptyReadyDesc: string;
  dmBackToSelectDatasets: string;

  dmCardCollapse: string;
  dmCardExpand: string;
  dmCardRemoveTable: string;
  dmCardPrimaryKey: string;
  dmCardForeignKeys: string;
  dmCardMeasures: string;
  dmCardAttributes: string;
  dmCardHierarchies: string;
  dmCardFooterFact: string;
  dmCardFooterDim: string;

  dmDimModalTitle: string;
  dmDimModalDesc: string;
  dmSourceDataset: string;
  dmDimTableName: string;
  dmUniquePrimaryKey: string;
  dmIncludedAttributes: string;
  dmSelectAll: string;
  dmClearOptional: string;
  dmCreateDimBtn: string;
  dmRowsSuffix: string;

  dmFactModalTitle: string;
  dmFactModalDesc: string;
  dmFactTableName: string;
  dmOptionalPrimaryKey: string;
  dmNoCompositeKey: string;
  dmForeignKeysLabel: string;
  dmMeasuresLabel: string;
  dmCreateFactBtn: string;

  dmRelModalCreateTitle: string;
  dmRelModalEditTitle: string;
  dmRelModalDesc: string;
  dmRelFromDim: string;
  dmRelToFact: string;
  dmRelSelectTable: string;
  dmRelSelectCol: string;
  dmRelFromTableLabel: string;
  dmRelFromColLabel: string;
  dmRelToTableLabel: string;
  dmRelToColLabel: string;
  dmRelCardinalityLabel: string;
  dmRelOneToMany: string;
  dmRelOneToManySub: string;
  dmRelManyToOne: string;
  dmRelManyToOneSub: string;
  dmRelOneToOne: string;
  dmRelOneToOneSub: string;
  dmRelValidVerified: string;
  dmRelCreateBtn: string;
  dmRelUpdateBtn: string;
  dmRelErrBothTables: string;
  dmRelErrSelfRel: string;
  dmRelErrBothCols: string;
  dmRelErrDuplicate: string;
  dmRelWarnDupKeys: string;
  dmRelWarnOrphansPct: string;
  dmRelWarnOrphansCount: string;
  dmRelWarnTypeMismatch: string;

  dmDateModalTitle: string;
  dmDateModalDesc: string;
  dmDateStartYear: string;
  dmDateEndYear: string;
  dmDateSchemaPreview: string;
  dmDateEstimatedRows: string;
  dmDateUniqueKeys: string;
  dmDateBestPractice: string;
  dmDateGenerateBtn: string;

  dmMeasuresModalTitle: string;
  dmMeasuresModalDesc: string;
  dmMeasuresExisting: string;
  dmMeasuresNone: string;
  dmMeasuresCreateNew: string;
  dmMeasuresNameLabel: string;
  dmMeasuresNamePlaceholder: string;
  dmMeasuresAggLabel: string;
  dmMeasuresTargetTable: string;
  dmMeasuresTargetCol: string;
  dmMeasuresNumerator: string;
  dmMeasuresDenominator: string;
  dmMeasuresSelectDenom: string;
  dmMeasuresFormatLabel: string;
  dmMeasuresCurrencyLabel: string;
  dmMeasuresGeneratedFormula: string;
  dmMeasuresAddBtn: string;
  dmMeasuresDoneBtn: string;
  dmMeasuresDeleteTip: string;
  dmAggSumDesc: string;
  dmAggAvgDesc: string;
  dmAggCountDesc: string;
  dmAggDistinctDesc: string;
  dmAggMinDesc: string;
  dmAggMaxDesc: string;
  dmAggDivideDesc: string;
  dmFmtCurrencyOpt: string;
  dmFmtPercentOpt: string;
  dmFmtCompactOpt: string;
  dmFmtNumberOpt: string;

  dmValidationDrawerTitle: string;
  dmValidationDrawerDesc: string;
  dmValidationScoreLabel: string;
  dmValidationChecksPassed: string;
  dmValidationObservations: string;
  dmValidationCorePassed: string;
  dmValidationCorePassedDesc: string;
  dmValidationPerfectTitle: string;
  dmValidationPerfectDesc: string;
  dmValidationObsHeading: string;
  dmValidationRecommendation: string;
  dmValidationCloseBtn: string;

  dmVersionsModalTitle: string;
  dmVersionsModalDesc: string;
  dmVersionsSnapshotTitle: string;
  dmVersionsNameLabel: string;
  dmVersionsNotesLabel: string;
  dmVersionsSaveBtn: string;
  dmVersionsHistoryTitle: string;
  dmVersionsNone: string;
  dmVersionsRevertBtn: string;
  dmVersionsConfirmRevert: string;
  dmVersionsConfirmYes: string;
  dmVersionsFacts: string;
  dmVersionsDims: string;
  dmVersionsRels: string;
  dmVersionsMeasures: string;

  dmSuggestModalTitle: string;
  dmSuggestModalDesc: string;
  dmSuggestConfidence: string;
  dmSuggestConfidenceHigh: string;
  dmSuggestConfidenceMedium: string;
  dmSuggestConfidenceLow: string;
  dmSuggestFactsTitle: string;
  dmSuggestDimsTitle: string;
  dmSuggestRelsTitle: string;
  dmSuggestLogicTitle: string;
  dmSuggestRejectBtn: string;
  dmSuggestApplyBtn: string;
  dmSuggestMatchPct: string;
  dmSuggestMeasuresCount: string;
  dmSuggestFkCount: string;
  dmSuggestAttrCount: string;

  // Features Tabs
  featTabHubLabel: string; featTabHubTitle: string; featTabHubDesc: string;
  featTabHubH1: string; featTabHubH2: string; featTabHubH3: string; featTabHubH4: string; featTabHubBadge: string;
  featTabExploreLabel: string; featTabExploreTitle: string; featTabExploreDesc: string;
  featTabExploreH1: string; featTabExploreH2: string; featTabExploreH3: string; featTabExploreH4: string; featTabExploreBadge: string;
  featTabModelLabel: string; featTabModelTitle: string; featTabModelDesc: string;
  featTabModelH1: string; featTabModelH2: string; featTabModelH3: string; featTabModelH4: string; featTabModelBadge: string;
  featTabWidgetsLabel: string; featTabWidgetsTitle: string; featTabWidgetsDesc: string;
  featTabWidgetsH1: string; featTabWidgetsH2: string; featTabWidgetsH3: string; featTabWidgetsH4: string; featTabWidgetsBadge: string;
  featTabSecLabel: string; featTabSecTitle: string; featTabSecDesc: string;
  featTabSecH1: string; featTabSecH2: string; featTabSecH3: string; featTabSecH4: string; featTabSecBadge: string;

  // Pricing Plans
  pricingPerMonth: string;
  pricingPlanFreeName: string; pricingPlanFreeBadge: string; pricingPlanFreeDesc: string; pricingPlanFreeCta: string;
  pricingPlanFreeF1: string; pricingPlanFreeF2: string; pricingPlanFreeF3: string; pricingPlanFreeF4: string;
  pricingPlanFreeF5: string; pricingPlanFreeF6: string; pricingPlanFreeF7: string;
  pricingPlanProName: string; pricingPlanProBadge: string; pricingPlanProOffer: string; pricingPlanProDesc: string; pricingPlanProCta: string;
  pricingPlanProF1: string; pricingPlanProF2: string; pricingPlanProF3: string; pricingPlanProF4: string;
  pricingPlanProF5: string; pricingPlanProF6: string; pricingPlanProF7: string; pricingPlanProF8: string;
  pricingPlanEntName: string; pricingPlanEntBadge: string; pricingPlanEntDesc: string; pricingPlanEntCta: string;
  pricingPlanEntF1: string; pricingPlanEntF2: string; pricingPlanEntF3: string; pricingPlanEntF4: string;
  pricingPlanEntF5: string; pricingPlanEntF6: string; pricingPlanEntF7: string; pricingPlanEntF8: string;

  // About Page
  aboutBadge: string; aboutHeroTitle1: string; aboutHeroTitle2: string; aboutHeroDesc: string;
  aboutStat1Label: string; aboutStat2Label: string; aboutStat3Label: string; aboutStat4Label: string;
  aboutStoryEyebrow: string; aboutStoryTitle: string; aboutStoryP1: string; aboutStoryP2: string;
  aboutStoryC1: string; aboutStoryC2: string;
  aboutPillar1Title: string; aboutPillar1Desc: string;
  aboutPillar2Title: string; aboutPillar2Desc: string;
  aboutPillar3Title: string; aboutPillar3Desc: string;
  aboutPillar4Title: string; aboutPillar4Desc: string;
  aboutCtaTitle: string; aboutCtaDesc: string;

  // Sample Graphs Extras
  galleryHeroBadge: string; galleryHeroTitle1: string; galleryHeroTitle2: string; galleryHeroDesc: string;
  galleryCatAll: string; galleryKpiTargetLabel: string; galleryKpiOnTrack: string;

  // Onboarding Tour Steps
  tourModalCloseAria: string;
  tourFinishTour: string;
  tourBack: string;
  tourLiveTargetLabel: string;
  tourGoToDataHub: string;
  tourGoToDataLab: string;
  tourGoToDashboards: string;
  tourGoToDataModel: string;
  tourGoToForecasts: string;
  tourGoToGallery: string;
  tourWhenToUseLabel: string;
  tourUploadFirstDataset: string;
  tourCreateFirstDashboard: string;
  tourSignUpAction: string;
  tourS1Title: string; tourS1Desc: string; tourS1Tip: string;
  tourS1FlowHub: string; tourS1FlowHubSub: string;
  tourS1FlowLab: string; tourS1FlowLabSub: string;
  tourS1FlowModel: string; tourS1FlowModelSub: string;
  tourS1FlowDash: string; tourS1FlowDashSub: string;
  tourS1FlowForecast: string; tourS1FlowForecastSub: string;
  tourS1Pt1: string; tourS1Pt2: string; tourS1Pt3: string;
  tourS2Title: string; tourS2Desc: string; tourS2Tip: string;
  tourS2UploadBtn: string; tourS2File1Meta: string; tourS2File2Meta: string;
  tourS2FormatsLabel: string; tourS2FormatsHint: string;
  tourS2Pt1: string; tourS2Pt2: string; tourS2Pt3: string;
  tourS3Title: string; tourS3Desc: string; tourS3Tip: string;
  tourS3FilterAction: string; tourS3DedupeAction: string; tourS3ColAction: string;
  tourS3ApplyBtn: string; tourS3PipelineTitle: string;
  tourS3Pt1: string; tourS3Pt2: string; tourS3Pt3: string;
  tourS4Title: string; tourS4Desc: string; tourS4Tip: string;
  tourS4DimTitle: string; tourS4FactTitle: string; tourS4MeasureLabel: string;
  tourS4MeasureSample: string; tourS4ConnectedDash: string;
  tourS4Pt1: string; tourS4Pt2: string; tourS4Pt3: string;
  tourS5Title: string; tourS5Desc: string; tourS5Tip: string;
  tourS5ChartPanel: string; tourS5Canvas: string; tourS5Config: string;
  tourS5Filters: string; tourS5ChartTypes: string;
  tourS5Rev: string; tourS5Target: string;
  tourS5Pt1: string; tourS5Pt2: string; tourS5Pt3: string;
  tourFcTitle: string; tourFcDesc: string; tourFcTip: string;
  tourFcTemplateLabel: string; tourFcPresetSales: string; tourFcHorizonLabel: string;
  tourFcSummarySample: string; tourFcPinBtn: string;
  tourFcPt1: string; tourFcPt2: string; tourFcPt3: string;
  tourS6Title: string; tourS6Desc: string; tourS6Tip: string;
  tourS6Page1: string; tourS6Page2: string; tourS6ExportPdf: string; tourS6HeaderSample: string;
  tourS6Pt1: string; tourS6Pt2: string; tourS6Pt3: string;
  tourS7Title: string; tourS7Desc: string; tourS7Tip: string;
  tourS7LangLabel: string; tourS7LangAction: string; tourS7NavLabel: string;
  tourS7NavShortcut1: string; tourS7NavShortcut2: string; tourS7NavShortcut3: string;
  tourS7ReplayHint: string; tourS7ReadyHint: string;
  tourS8TabDash: string; tourS8TabDashDesc: string;
  tourS8TabData: string; tourS8TabDataDesc: string;
  tourS8TabFc: string; tourS8TabFcDesc: string;
  tourS8TabGallery: string; tourS8TabGalleryDesc: string;
  tourS8AutoSaveNote: string;

  // Dataset Import Modal
  importTitle: string; importSubtitle: string; importDropzoneTitle: string; importChangeFile: string;
  importDetectedEnc: string; importWarnFffdTitle: string; importWarnFffdDesc: string;
  importDatasetNameLabel: string; importEncodingLabel: string; importExcelSheetLabel: string; importSeparatorLabel: string;
  importSepAuto: string; importSepComma: string; importSepSemi: string; importSepTab: string; importSepPipe: string;
  importParsingText: string; importPreviewTitle: string; importPreviewMeta: string;
  importSaveErrorTitle: string; importSubmitBtn: string;
  importUnitB: string; importUnitKB: string; importUnitMB: string;

  // Batch E: Data Lab, Column Inspector, Step Rail, Filters, Grid, Modals
  labRequiresText: string;
  labClickColHint: string;
  labFindAction: string;
  labSearchAllActions: string;
  labPalettePlaceholderCol: string;
  labPalettePlaceholderAll: string;
  labPaletteNoMatch: string;
  labPaletteNavigate: string;
  labPaletteRun: string;
  labPaletteCount: string;
  labAction_prefix_label: string; labAction_prefix_hint: string;
  labAction_suffix_label: string; labAction_suffix_hint: string;
  labInspectorTitle: string;
  labInspectorHide: string;
  labInspectorShow: string;
  labInspectorHealthDesc: string;
  labInspectorNeedsAttention: string;
  labInspectorIssueSingular: string;
  labInspectorIssuePlural: string;
  labInspectorTableFixes: string;
  labInspectorNoTableIssues: string;
  labInspectorColumnLabel: string;
  labInspectorValid: string;
  labInspectorEmpty: string;
  labInspectorErrorsLabel: string;
  labInspectorDistinctLabel: string;
  labInspectorEveryUnique: string;
  labInspectorPctUnique: string;
  labInspectorMedianSub: string;
  labInspectorLengthLabel: string;
  labInspectorCharsSub: string;
  labInspectorBlankValue: string;
  labInspectorSmartFixes: string;
  labInspectorApplyAffected: string;
  labInspectorHealthBarAria: string;
  labInspectorScoreRingAria: string;
  labFixCaseTitleLower: string;
  labFixCaseDetailCount: string;
  labFixEmptyDetail: string;
  labFixNullsZeroTitle: string;
  labFixNullsUnknownTitle: string;
  labFixConvertTitle: string;
  labFixConvertNumWhy: string;
  labFixConvertDateWhy: string;
  labFixConvertNumStillWhy: string;
  labFixConvertDateStillWhy: string;
  labFixDupesDetailExact: string;
  labFixBlankRowsDetail: string;
  labStatusRows: string;
  labStatusCols: string;
  labStatusError: string;
  labStatusErrors: string;
  labStatusHealth: string;
  labStatusStepOf: string;
  labStatusMCodeBtn: string;
  labRailPipelineTitle: string;
  labRailSaveNameAria: string;
  labRailStepCount: string;
  labRailViewingStepOf: string;
  labRailOutputLabel: string;
  labRailOutputHint: string;
  labRailSettings: string;
  labRailDeltaAddedRowsPlural: string;
  labRailDeltaRemovedRowsPlural: string;
  labRailDeltaAddedColsPlural: string;
  labRailDeltaRemovedColsPlural: string;
  labRailEmptyFilled: string;
  labRailErrorsAdded: string;
  labRailErrorsFixed: string;
  labStepMeta_headers: string;
  labStepMeta_type: string;
  labStepMeta_rename: string;
  labStepMeta_remove_columns: string;
  labStepMeta_duplicate: string;
  labStepMeta_reorder: string;
  labStepMeta_move: string;
  labStepMeta_replace: string;
  labStepMeta_fix_errors: string;
  labStepMeta_fill_empty: string;
  labStepMeta_fill_down: string;
  labStepMeta_fill_up: string;
  labStepMeta_filter: string;
  labStepMeta_remove_rows: string;
  labStepMeta_keep_rows: string;
  labStepMeta_sort: string;
  labStepMeta_text: string;
  labStepMeta_math: string;
  labStepMeta_date: string;
  labStepMeta_split: string;
  labStepMeta_merge: string;
  labStepMeta_dedupe: string;
  labStepMeta_custom_column: string;
  labTabsQueriesAria: string;
  labTabsBlankHint: string;
  labLeaveWithoutApply: string;
  homeLinkTitle: string;
  labApplyBtnTitle: string;
  labSavingProgress: string;
  labTimeoutError: string;
  labSaveFailedFallback: string;
  labFailedCountBadge: string;
  labBlankQueryDesc: string;
  labQueryPrefix: string;
  labSourceImportedFrom: string;
  labDuplicateSuffix: string;
  colType_Text: string;
  colType_WholeNumber: string;
  colType_DecimalNumber: string;
  colType_Currency: string;
  colType_Percentage: string;
  colType_Date: string;
  colType_DateTime: string;
  colType_Time: string;
  colType_Boolean: string;
  filterSortAsc: string;
  filterSortDesc: string;
  filterSmallToLarge: string;
  filterLargeToSmall: string;
  filterAToZ: string;
  filterZToA: string;
  filterNumberMenu: string;
  filterDateMenu: string;
  filterTextMenu: string;
  filterDistinctCount: string;
  filterApplyBtn: string;
  filterNumberTitle: string;
  filterDateTitle: string;
  filterTextTitle: string;
  filterBackToList: string;
  filterConditionLabel: string;
  filterValueLabel: string;
  filterValue2Label: string;
  filterEnterValPlaceholder: string;
  filterSecondBoundPlaceholder: string;
  filterBackBtn: string;
  filterOpNotEqualsShort: string;
  filterOpGreaterEqual: string;
  filterOpLessEqual: string;
  filterOpBetween: string;
  filterOpBefore: string;
  filterOpAfter: string;
  filterOpThisYear: string;
  filterOpThisMonth: string;
  filterOpNotContains: string;
  filterOpStartsWith: string;
  filterOpEndsWith: string;
  labGridTipBar: string;
  labGridCopyCellTip: string;
  labGridFilterCellTip: string;
  labGridReplaceColTip: string;
  labGridTableAria: string;
  labGridRowNumAria: string;
  labGridTypeTip: string;
  labGridChangeType: string;
  labGridFilterSortColTip: string;
  labGridColOpsTip: string;
  labGridPctValid: string;
  labGridToFix: string;
  labGridQualityStripTip: string;
  labGridConvError: string;
  labGridCtxFilterValue: string;
  labGridCtxReplaceValues: string;
  labGridCtxCopyCell: string;
  labGridCtxCopyRow: string;
  labGridCtxCopySelection: string;
  labGridCtxSelectCol: string;
  labGridCtxSelectRow: string;
  labGridCtxSplitCol: string;
  labGridCtxReplaceErrors: string;
  labGridCtxFillDown: string;
  labGridCtxFillUp: string;
  labGridCtxRenameCol: string;
  labGridCtxDuplicateCol: string;
  labGridCtxMoveLeft: string;
  labGridCtxMoveRight: string;
  labGridCtxRemoveCol: string;
  labGridFilteredChip: string;
  labGridSortedChip: string;
  labGridNullBadge: string;
  labGridShowingRows: string;
  labGridShowAllBtn: string;
  labGridShowMoreBtn: string;
  labGridSummaryColLabel: string;
  labGridSummaryRowLabel: string;
  labGridSummaryCellsLabel: string;
  labGridSelRowSummary: string;
  labGridSelRowsSelected: string;
  labGridSelCellSummary: string;
  labGridSelRangeSummary: string;
  labGridSelColSummary: string;
  labGridSelColsSelected: string;
  labActingRow: string;
  labActingRows: string;
  labActingCells: string;
  labGridCtxFilterThisValue: string;
  labGridCtxReplaceThisValue: string;
  labGridCtxRemoveRow: string;
  labGridCtxRemoveRows: string;
  labGridCtxKeepSelectedRows: string;
  labStepRemovedRowN: string;
  labStepRemovedNRows: string;
  labStepKeptRowN: string;
  labStepKeptNRows: string;
  labCustomColNameLabel: string;
  labCustomColNamePlaceholder: string;
  labCustomColExprLabel: string;
  labCustomColExprPlaceholder: string;
  labCustomColInsertColLabel: string;
  labCustomColFormulaHint: string;
  labCustomColModeLabel: string;
  labCustomColModeMath: string;
  labCustomColModeConcat: string;
  labCustomColFirstLabel: string;
  labCustomColSecondModeCol: string;
  labCustomColSecondModeNum: string;
  labCustomColSecondLabel: string;
  labCustomColConstLabel: string;
  labReplaceNullsPlaceholder: string;
  labSelectCellFirst: string;
  labRequiresColumnScope: string;
  labScopeCellOnly: string;
  labScopeColumn: string;
  labScopeCellTag: string;
  labAction_editcell_label: string;
  labAction_editcell_hint: string;
  labAction_clearcell_label: string;
  labAction_clearcell_hint: string;
  labStepMeta_edit_cell: string;
  labStepEditedCell: string;
  labStepClearedCell: string;
  labRowOnlyTag: string;
  labEditCellBtn: string;
  labClearCellBtn: string;
  labGridEditCellTip: string;
  labGridClearCellTip: string;
  labGridCtxCellOnlyHeading: string;
  labGridCtxEditCell: string;
  labGridCtxClearCell: string;
  labGridCtxReplaceThisCellOnly: string;
  labGridCtxTrimCell: string;
  labGridCtxUpperCell: string;
  labGridCtxLowerCell: string;
  labGridCtxReplaceColValues: string;
  labModalCellOnlyToggle: string;

  // Batch F: App, Hubs, Filters, Toolbar, Sidebar, Config, Canvas, Widgets
  appCannotSaveDatasetErr: string;
  appNewDashboardTitle: string;
  appPageN: string;
  appNewWidgetTitle: string;
  appUntitledDashboardDesc: string;
  appUntitledReportTitle: string;
  appUntitledReportDesc: string;
  appWidgetCopySuffix: string;
  appOpeningDataLab: string;
  appAnalyticsSuffix: string;
  appAnalyticsForDesc: string;
  appExitPreviewEsc: string;
  hubLoadErrorFallback: string;
  hubSaveErrorFallback: string;
  hubDeleteErrorFallback: string;
  hubUserFallback: string;
  hubPresetFhd: string;
  hubPresetLaptop: string;
  hubPresetA4Portrait: string;
  hubPresetA4Landscape: string;
  hubPresetUsLetter: string;
  dataHubColMixSummary: string;
  dataHubColMixAria: string;
  dataHubRowsBadge: string;
  dataHubColsBadge: string;
  dataHubHealthLabel: string;
  dataHubUpdatedLabel: string;
  dataHubCancelBtn: string;
  dataHubConfirmDeleteBtn: string;
  filterAddBtn: string;
  filterChooseColumn: string;
  filterSearchColumns: string;
  filterSearchValues: string;
  filterNoColumns: string;
  filterNoValues: string;
  filterFromLabel: string;
  filterToLabel: string;
  filterApply: string;
  filterCancel: string;
  filterValuesLimitHint: string;
  filterSelectVisible: string;
  filterClearValues: string;
  filterLegacyDroppedNotice: string;
  filterRemoveChipAria: string;
  filterEditChipAria: string;
  filterRowsOf: string;
  menuEditReportTitleAria: string;
  menuRenameReportTip: string;
  menuDoubleClickRenamePage: string;
  menuRenamePageTip: string;
  menuDeletePageTip: string;
  menuAddReportPage: string;
  menuPrevPage: string;
  menuNextPage: string;
  toolbarCanvasLabel: string;
  toolbarAdjustCanvasTip: string;
  toolbarCanvasSizeSettings: string;
  toolbarManualDimPx: string;
  toolbarRatioLocked: string;
  toolbarUnlockRatio: string;
  toolbarWidthLabel: string;
  toolbarHeightLabel: string;
  toolbarQuickRatios: string;
  toolbarPaperSizePreset: string;
  toolbarScreenSizePreset: string;
  toolbarZoomScale: string;
  toolbarGridSnapping: string;
  toolbarOn: string;
  toolbarOff: string;
  toolbarGotIt: string;
  toolbarAboutTitle: string;
  toolbarAboutSubtitle: string;
  toolbarAboutVersionDesc: string;
  toolbarShortcutSaveDesc: string;
  toolbarShortcutExportDesc: string;
  toolbarShortcutExitDesc: string;
  toolbarShortcutRenameDesc: string;
  toolbarDoubleClick: string;
  leftHomeTitle: string;
  leftAddWidgetTip: string;
  leftDefaultDatasetName: string;
  leftCatCharts: string;
  leftCatAnalytics: string;
  leftCat3d: string;
  configModelDriven: string;
  configNoModelYet: string;
  configTextPlaceholder: string;
  configBold: string;
  configItalic: string;
  configAlignTip: string;
  configTransparentBg: string;
  configSelectFieldOpt: string;
  configNoneOpt: string;
  configFieldRowReq: string;
  configFieldParentCatReq: string;
  configFieldStageReq: string;
  configFieldCatLabelsReq: string;
  configFieldXReq: string;
  configFieldActualReq: string;
  configFieldPrevOpt: string;
  configFieldCatXReq: string;
  configFieldColReq: string;
  configFieldChildCatReq: string;
  configFieldValReq: string;
  configFieldYReq: string;
  configFieldTargetReq: string;
  configFieldCurrReq: string;
  configFieldNumColReq: string;
  configFieldNumFieldReq: string;
  configFieldZReq: string;
  configFieldValMetricOpt: string;
  configFieldSizeByOpt: string;
  configFieldTargetOpt: string;
  configFieldGroupByOpt: string;
  configFieldColorByOpt: string;
  configAggMethod: string;
  configPrefix: string;
  configSuffix: string;
  configMaxTargetVal: string;
  configSortDir: string;
  configSortDefault: string;
  configSortAsc: string;
  configSortDesc: string;
  configBinsLabel: string;
  configDensityMode: string;
  configCumulative: string;
  configSpecificViewOpts: string;
  configHorizontalBars: string;
  configSmoothLines: string;
  configShowMarkers: string;
  configDonutStyle: string;
  configShowPctLabels: string;
  configShowTrendline: string;
  configNumFormatting: string;
  configNumRaw: string;
  configNumCurrency: string;
  configNumPct: string;
  configNumCompact: string;
  configWidgetHeaderLabel: string;
  configBgColorLabel: string;
  configBgColorTip: string;
  configTransparentLabel: string;
  configTypographySection: string;
  configFontSizeLabel: string;
  configWeightStyle: string;
  configAlignmentLabel: string;
  configTitleColorLabel: string;
  configTitleColorTip: string;
  configPaletteLabel: string;
  configDisplayOpts: string;
  configAggSampleOutput: string;
  configCategoryXCol: string;
  configMetricYCol: string;
  configFontInter: string;
  configFontSegoe: string;
  configFontGeorgia: string;
  configFontMono: string;
  configBgPureWhite: string;
  configBgSoftSlate: string;
  configBgSkyMist: string;
  configBgMintTint: string;
  configBgAmberGlow: string;
  configBgRoseBlush: string;
  configBgDeepObsidian: string;
  canvasPrintMargin: string;
  canvasNoDatasetsTitle: string;
  canvasNoDatasetsDesc: string;
  canvasNoDatasetsHint: string;
  canvasNoWidgetsTitle: string;
  canvasNoWidgetsDesc: string;
  canvasNoWidgetsHint: string;
  canvasResizeWidthTip: string;
  canvasResizeHeightTip: string;
  canvasResizeCornerTip: string;
  canvasSizeBadgeLabel: string;
  canvasAdjustSizeTitle: string;
  canvasAdjustSizeBtn: string;
  canvasManualSizeTitle: string;
  canvasWidthPx: string;
  canvasHeightPx: string;
  canvasLockRatio: string;
  canvasLocked: string;
  canvasUnlocked: string;
  canvasPopularPresets: string;
  canvasApplySize: string;
  canvasPresetFhd: string;
  canvasPresetLaptop: string;
  canvasPresetQhd: string;
  canvasPresetSquare: string;
  widgetCloseConfigTip: string;
  widgetOpenConfigTip: string;
  widgetMoveHandleTip: string;
  widgetResizeTip: string;
  chartModelNotice: string;
  chartNoDataMapped: string;
  chartNoDataMappedDesc: string;
  chartValuePrefix: string;
  chartBoxWhiskerTitle: string;
  chartBoxMin: string;
  chartBoxMedian: string;
  chartBoxMax: string;
  analyticsSemanticNotice: string;
  analyticsKpiDefault: string;
  analyticsMetricDefault: string;
  analyticsTargetLabel: string;
  analyticsSparklineDefault: string;
  analyticsProgressDefault: string;
  analyticsCurrentLabel: string;
  analyticsTargetGoalLabel: string;
  analyticsViewSuffix: string;
  analyticsLiveFeed: string;
  analyticsCardDefault: string;
  plotly3dNoData: string;
  plotly3dNoDataDesc: string;
  plotly3dXAxis: string;
  plotly3dYAxis: string;
  plotly3dZAxis: string;
  textBoxDefaultPrompt: string;
  textBoxEditTip: string;
  forecastStudio: string;
  forecasts: string;
  insertForecastChart: string;
  widget_forecast_name: string;
  widget_forecast_desc: string;
  fcAddedToDashboardToast: string;
  fcAddToDashboardBtn: string;
  fcAddToDashboardDesc: string;
  fcAddToDashboardTitle: string;
  fcAddWidgetConfirmBtn: string;
  fcAddWidgetErr: string;
  fcAggAvg: string;
  fcAggCount: string;
  fcAggMax: string;
  fcAggMin: string;
  fcAggSum: string;
  fcAggregationLabel: string;
  fcAllCategoriesAggregated: string;
  fcAllRecords: string;
  fcApplySuggestedFreq: string;
  fcAssumptionCost: string;
  fcAssumptionDemand: string;
  fcAssumptionElasticity: string;
  fcAssumptionExpense: string;
  fcAssumptionGrowth: string;
  fcAssumptionPrice: string;
  fcAssumptionSales: string;
  fcAssumptionVolume: string;
  fcAxisDateLabel: string;
  fcAxisValueLabel: string;
  fcBaselineModeLabel: string;
  fcBaselineTotal: string;
  fcBusinessTemplatesLabel: string;
  fcCancelBtn: string;
  fcCancelledNotice: string;
  fcChartForecastStart: string;
  fcChartPeriodForecast: string;
  fcChartPeriodHistorical: string;
  fcClearOverlay: string;
  fcColBaseline: string;
  fcColModel: string;
  fcColStatus: string;
  fcConfidenceLabel: string;
  fcConfigStaleBanner: string;
  fcCreateNewDashboardOption: string;
  fcCreateScenarioBtn: string;
  fcDataQualityTitle: string;
  fcDatasetLabel: string;
  fcDatasetStaleBanner: string;
  fcDatasetStaleWidget: string;
  fcDateColLabel: string;
  fcDeleteErr: string;
  fcDeleteForecastAria: string;
  fcDeleteScenarioAria: string;
  fcDetectBtn: string;
  fcDetectErr: string;
  fcDetectingBtn: string;
  fcDomainFinance: string;
  fcDomainGeneral: string;
  fcDomainInventory: string;
  fcDomainMarketing: string;
  fcDomainSales: string;
  fcDqDuplicates: string;
  fcDqMissing: string;
  fcDqObserved: string;
  fcDqOutliers: string;
  fcFailedBannerTitle: string;
  fcFreqAuto: string;
  fcFreqDaily: string;
  fcFreqMonthly: string;
  fcFreqOverrideHint: string;
  fcFreqQuarterly: string;
  fcFrequencyLabel: string;
  fcFreqWeekly: string;
  fcFreqYearly: string;
  fcGenerateBtn: string;
  fcGroupColLabel: string;
  fcGroupSuggestHint: string;
  fcGroupValLabel: string;
  fcHelpMae: string;
  fcHelpMape: string;
  fcHelpMase: string;
  fcHelpRmse: string;
  fcHorizonCustomLabel: string;
  fcHorizonLabel: string;
  fcHorizonPeriodsHint: string;
  fcIntervalNoteCv: string;
  fcIntervalNoteEmpirical: string;
  fcIntervalNoteFallback: string;
  fcLegendConfidenceBand: string;
  fcLegendForecast: string;
  fcLegendHistorical: string;
  fcLegendLowerBound: string;
  fcLimitsCaption: string;
  fcLoadListErr: string;
  fcLoadOneErr: string;
  fcMetricsExplainToggle: string;
  fcMissingFieldsErr: string;
  fcModeBusiness: string;
  fcModeGeneral: string;
  fcModeLabel: string;
  fcModelArima: string;
  fcModelArimaDesc: string;
  fcModelAuto: string;
  fcModelAutoDesc: string;
  fcModelEts: string;
  fcModelEtsDesc: string;
  fcModelEvalDesc: string;
  fcModelEvalTitle: string;
  fcModelHoltWinters: string;
  fcModelHoltWintersDesc: string;
  fcModelLabel: string;
  fcModelLinearReg: string;
  fcModelLinearRegDesc: string;
  fcModelMovingAvg: string;
  fcModelMovingAvgDesc: string;
  fcModelNaive: string;
  fcModelNaiveDesc: string;
  fcModelSarima: string;
  fcModelSarimaDesc: string;
  fcModelSeasonalNaive: string;
  fcModelSeasonalNaiveDesc: string;
  fcModelTsb: string;
  fcModelTsbDesc: string;
  fcNameLabel: string;
  fcNamePlaceholder: string;
  fcNetImpact: string;
  fcNewForecastBtn: string;
  fcNo: string;
  fcNoChartData: string;
  fcNoDatasetsDesc: string;
  fcNoDatasetsTitle: string;
  fcOpenFromDataHub: string;
  fcPeriodUnitAuto: string;
  fcPeriodUnitDaily: string;
  fcPeriodUnitMonthly: string;
  fcPeriodUnitQuarterly: string;
  fcPeriodUnitWeekly: string;
  fcPeriodUnitYearly: string;
  fcPresetInventoryTrends: string;
  fcPresetMarketingConversions: string;
  fcPresetMarketingConversionsDesc: string;
  fcPresetMarketingLeads: string;
  fcPresetMarketingLeadsDesc: string;
  fcPresetSalesRevenue: string;
  fcPresetSalesVolume: string;
  fcPresetSalesVolumeDesc: string;
  fcPresetStockConsumption: string;
  fcPresetStockConsumptionDesc: string;
  fcQuickCreateFromData: string;
  fcReadyStateDesc: string;
  fcReadyStateTitle: string;
  fcRefreshForecastBtn: string;
  fcRerunBtn: string;
  fcRetryBtn: string;
  fcRunErrFallback: string;
  fcRunningBtn: string;
  fcRunSuccessNotice: string;
  fcSavedForecastsLabel: string;
  fcSavedScenariosHeading: string;
  fcSaveErrFallback: string;
  fcSaveForecastBtn: string;
  fcSaveSuccessNotice: string;
  fcSavingScenario: string;
  fcScenarioCreateErr: string;
  fcScenarioDefaultName: string;
  fcScenarioDisclaimer: string;
  fcScenarioNameLabel: string;
  fcScenarioNamePlaceholder: string;
  fcScenarioPrefix: string;
  fcScenarioStaleBadge: string;
  fcScenarioStaleNotice: string;
  fcScenarioTotal: string;
  fcSelectedBadge: string;
  fcStepsWord: string;
  fcStudioHeroDesc: string;
  fcStudioHeroTitle: string;
  fcSumAverageForecast: string;
  fcSumEndForecast: string;
  fcSumHorizonCard: string;
  fcSumLastActual: string;
  fcSumSelectedModel: string;
  fcSumTotalHorizon: string;
  fcSumValidationError: string;
  fcTargetColLabel: string;
  fcTargetDashboardLabel: string;
  fcTplDemandDesc: string;
  fcTplDemandTitle: string;
  fcTplExpensesDesc: string;
  fcTplExpensesTitle: string;
  fcTplGeneralBizDesc: string;
  fcTplGeneralBizTitle: string;
  fcTplInventoryDesc: string;
  fcTplInventoryLimitation: string;
  fcTplInventoryTitle: string;
  fcTplProfitDesc: string;
  fcTplProfitTitle: string;
  fcTplRevenueDesc: string;
  fcTplRevenueTitle: string;
  fcTplSalesDesc: string;
  fcTplSalesTitle: string;
  fcTplTrafficDesc: string;
  fcTplTrafficTitle: string;
  fcUncertaintyBeatsBaseline: string;
  fcUncertaintyConfidenceExplain: string;
  fcUncertaintyLimitedBaseline: string;
  fcUncertaintyTitle: string;
  fcUncertaintyTrainingSpan: string;
  fcWhatIfDesc: string;
  fcWhatIfTitle: string;
  fcWidgetConfigHint: string;
  fcWidgetCreateInStudio: string;
  fcWidgetNoResult: string;
  fcWidgetOpenStudioTip: string;
  fcWidgetRefreshTip: string;
  fcWidgetSelectOpt: string;
  fcWidgetSelectPromptDesc: string;
  fcWidgetSelectPromptTitle: string;
  fcWinAll: string;
  fcWinLast30: string;
  fcWinLast90: string;
  fcYes: string;
  hubWelcomeBack: string;
  hubQuickActionsTitle: string;
  hubQaUploadTitle: string;
  hubQaUploadDesc: string;
  hubQaDashboardTitle: string;
  hubQaDashboardDesc: string;
  hubQaReportTitle: string;
  hubQaReportDesc: string;
  hubQaForecastTitle: string;
  hubQaForecastDesc: string;
  hubGettingStartedTitle: string;
  hubGettingStartedStep1: string;
  hubGettingStartedStep2: string;
  hubGettingStartedStep3: string;
  hubDatasetsSummary: string;
  hubRecentTitle: string;
  hubKindDashboard: string;
  hubKindReport: string;
  dhQuickDropHint: string;
  dhActionBuildDash: string;
  dhActionForecast: string;
  cfgSectionEssential: string;
  cfgSectionAdvancedData: string;
  cfgPlainHintDataset: string;
  cfgPlainHintCategory: string;
  cfgPlainHintValue: string;
  cfgPlainHintAggregation: string;
  fcAdvancedOptionsToggle: string;
  fcPlainHintTarget: string;
  fcPlainHintDate: string;
  fcPlainHintHorizon: string;
  fcReliabilityTitle: string;
  fcReliabilityHigh: string;
  fcReliabilityMedium: string;
  fcReliabilityLow: string;
  fcReliabilityScore: string;
  fcTypicalErrorPct: string;
  fcTypicalErrorUnits: string;
  fcWhyThisModel: string;
  fcTechnicalDetailsTitle: string;
  fcDownloadCsvBtn: string;
  fcDownloadExcelBtn: string;
  fcExportFailedErr: string;
  fcForecastAllGroupsBtn: string;
  fcBatchProgress: string;
  fcBatchTitle: string;
  fcBatchDesc: string;
  fcBatchColGroup: string;
  fcBatchColLastActual: string;
  fcBatchColForecastTotal: string;
  fcBatchColChange: string;
  fcBatchColReliability: string;
  fcBatchSkippedLabel: string;
  fcBatchFailedLabel: string;
  fcBatchCloseBtn: string;
  fcCalendarEffectsLabel: string;
  fcCalendarEffectsToggle: string;
  fcCalendarCountryLabel: string;
  fcCalendarCountryEG: string;
  fcCalendarCountrySA: string;
  fcCalendarCountryAE: string;
  fcCalendarCountryUS: string;
  fcCalendarCountryGB: string;
  fcCalendarEffectsTitle: string;
  fcCalendarEffectPeriods: string;
  fcActualAccuracyTitle: string;
  fcActualAccuracyPct: string;
  fcActualAccuracyMae: string;
  fcActualWithin80Yes: string;
  fcActualWithin80No: string;
  benchToggleLeft: string;
  benchToggleRight: string;
  sidebarWhenToUse: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandName: 'Data Pulse',
    brandTagline: 'Intelligence in motion',
    home: 'Home',
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    dashboards: 'Dashboards & Reports',
    dataHub: 'Data Hub',
    visualGallery: 'Visual Gallery',
    workbench: 'Workbench',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    getStartedFree: 'Get Started Free',
    logOut: 'Log out',
    account: 'Account',
    quickTour: 'Show Welcome Tour',
    help: 'Help',
    settings: 'Settings',

    tourWelcomeTitle: 'Welcome to Data Pulse',
    tourWelcomeDesc: 'Your enterprise-grade visual analytics platform. Build interactive 3D graphs, clean datasets in our pipeline studio, and design executive dashboards.',
    tourCanvasTitle: 'Visual Canvas & 3D Graphs',
    tourCanvasDesc: 'Drag and drop 3D surface, scatter, and mesh charts alongside traditional bar, line, and KPI cards on a freeform, responsive workspace.',
    tourDataHubTitle: 'Data Hub & Cloud Database',
    tourDataHubDesc: 'Upload Excel and CSV files once and organize them in one clean folder—ready for any dashboard, report, or forecast.',
    tourDataLabTitle: 'Data Lab (Clean Data)',
    tourDataLabDesc: 'Click any row, column, or cell. Remove duplicates, split columns, fill blanks, and fix messy text step by step.',
    tourReadyTitle: "You're All Set!",
    tourReadyDesc: 'Start exploring now by creating your first dashboard or uploading a spreadsheet.',

    tourStep1Title: 'Welcome to Data Pulse',
    tourStep1Desc: 'Data Pulse brings easy dashboards, forecasts, and PDF reports to your browser with automatic saving and private accounts.',
    tourStep2Title: 'Manage Your Spreadsheets',
    tourStep2Desc: 'Keep your spreadsheets organized in Data Hub with instant previews and safe version history.',
    tourStep3Title: 'Upload Spreadsheets Safely',
    tourStep3Desc: 'Upload your Excel and CSV spreadsheets in seconds. Your files stay private inside your own account.',
    tourStep4Title: 'Clean Messy Files in Data Lab',
    tourStep4Desc: 'Tidy up messy rows visually with point-and-click actions—fix typos, remove duplicates, and fill blanks without formulas.',
    tourStep5Title: 'Link Related Spreadsheets',
    tourStep5Desc: 'Connect separate sheets (like Orders and Customers) using a shared column and save quick totals—no Excel formulas needed.',
    tourStep6Title: 'Create Your First Dashboard',
    tourStep6Desc: 'Build clear, interactive pages with number cards, charts, tables, and filters that update together.',
    tourStep7Title: 'Charts, Forecasts & PDF Reports',
    tourStep7Desc: 'Explore interactive charts and 3D views, forecast future trends, and export clean multi-page PDF reports.',
    exploreSection: 'Explore Section',
    next: 'Next',
    previous: 'Previous',
    skipTour: 'Skip Tour',
    getStarted: 'Get Started',
    dontShowAgain: "Don't show this again",
    stepOf: 'Step {current} of {total}',

    dataLabTitle: 'Data Lab',
    dataLabSubtitle: 'pipeline studio for data cleaning',
    discard: 'Discard',
    applyAndClose: 'Apply & Close',
    savingChanges: 'Saving...',
    addFile: 'Add file',
    uploadFile: 'Upload CSV or Excel',
    newEmptyQuery: 'New empty query',
    addDatasetMenu: 'Add dataset',
    openExistingDataset: 'Open existing dataset',
    closeTabTip: 'Close tab (or middle-click)',
    allTabsClosedTitle: 'No Datasets Open in Data Lab',
    allTabsClosedDesc: 'Import a data file, open an existing dataset from your hub, or start with a new empty query.',
    closeDataset: 'Close dataset',
    stepsHistory: 'Applied Steps',
    sourceStep: 'Source',
    columnInspector: 'Column Inspector',
    dataQuality: 'Data Quality',
    valid: 'valid',
    empty: 'empty',
    errors: 'errors',
    selectedColumnLabel: 'Column',
    selectedRowLabel: 'Row',
    selectedCellLabel: 'Cell',
    cellValue: 'Value',
    copyValue: 'Copy',
    copied: 'Copied!',
    filterByValue: 'Filter by Value',
    replaceValue: 'Replace Value',
    clearSelection: 'Clear Selection',
    noColumnsInView: 'No Columns in Current View',
    bringInDataTitle: 'Bring in your data',
    bringInDataDesc: 'Upload a CSV or Excel spreadsheet to start cleaning, transforming, and modeling your data step by step.',
    appliedSuccessToast: 'Dataset changes successfully saved and applied!',

    unsavedChangesTitle: 'Unsaved Changes in Data Lab',
    unsavedChangesDesc: 'You have modified the cleaning pipeline on this dataset. What would you like to do before closing?',
    saveAndApply: 'Save & Apply',
    discardChanges: 'Discard Changes',
    continueEditing: 'Continue Editing',
    closeDatasetConfirmTitle: 'Close Dataset from Workspace?',
    closeDatasetConfirmDesc: 'Closing this dataset removes it from the current Data Lab editor session. Your original dataset in the Data Hub will remain intact.',
    selectAllRows: 'Select all preview rows',
    selectedCount: '{count} selected',

    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search...',
    filter: 'Filter',
    sort: 'Sort',
    loading: 'Loading...',
    retry: 'Retry',
    rows: 'rows',
    columns: 'columns',
    // Workspace & Dashboard Hub
    workspaceEyebrow: 'Workspace',
    welcomeBackUser: 'Welcome back,',
    dashboardHubDesc: 'Build interactive dashboards and print-ready reports on top of your cleaned, modelled data.',
    newDashboardOrReport: 'New dashboard / report',
    workspaces: 'Workspaces',
    interactiveDashboards: 'Interactive dashboards',
    printableReports: 'Printable reports',
    workspaceHistory: 'Workspace History',
    all: 'All',
    dashboardsTab: 'Dashboards',
    reportsTab: 'Reports',
    searchByName: 'Search by name...',
    allTime: 'All Time',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    sortBy: 'Sort',
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    sortName: 'Name',
    nothingHereYet: 'Nothing here yet',
    noMatches: 'No matches',
    clearSearchFilters: 'Clear the search or filters to see all of your workspaces.',
    createFirstDashboardDesc: 'Create your first interactive dashboard or printable report. It will be saved to your database automatically.',
    createACanvas: 'Create a canvas',
    open: 'Open',
    reportBadge: 'Report',
    dashboardBadge: 'Dashboard',
    usedFor: 'Used for',
    widgets: 'widgets',
    models: 'models',
    canvas: 'canvas',
    createModalTitle: 'Create a new canvas',
    createModalDesc: 'Start an interactive dashboard or a print-ready report',
    projectType: 'Project Type',
    interactiveDashboardTitle: 'Interactive Dashboard',
    interactiveDashboardDesc: 'Fixed 16:9 canvas for screen-based KPIs and exploration',
    printableReportTitle: 'Printable Report',
    printableReportDesc: 'A4 / Letter pages tailored for multi-page export & PDF',
    canvasPreset: 'Canvas Preset',
    canvasName: 'Name',
    dashboardNamePlaceholder: 'e.g. Q4 Executive KPI Board',
    reportNamePlaceholder: 'e.g. Monthly Operational Review',
    usedForLabel: 'Primary use / purpose',
    usedForPlaceholder: 'e.g. Board review, operations tracking',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'Brief overview of this workspace...',
    chooseIcon: 'Choose an icon',
    attachDatasets: 'Attach datasets (optional)',
    noDatasetsInHub: 'No datasets in your Data Hub yet. You can add them later inside the canvas.',
    createCanvasBtn: 'Create Canvas',
    deleteCanvasTitle: 'Delete canvas?',
    deleteCanvasDesc: 'Are you sure you want to permanently delete this workspace? This action cannot be undone.',
    deletePermanently: 'Delete permanently',
    logoutConfirmTitle: 'Sign out of Data Pulse?',
    logoutConfirmDesc: 'You will need to sign in again to access your saved workspaces, data models, and datasets.',
    accountSettings: 'Account Settings',
    helpDocumentation: 'Help & Documentation',

    // Data Hub
    dataHubHeroTitle: 'Your spreadsheets, ready in one place',
    dataHubHeroDesc: 'Upload an Excel or CSV file once, clean it up if needed, and use it in any dashboard, forecast, or report. Everything saves automatically.',
    uploadDataset: 'Upload Spreadsheet',
    recordsUnderManagement: 'Total Rows Uploaded',
    cleanedInDataLab: 'Cleaned Files',
    stillRaw: '{count} not cleaned yet',
    searchDatasetsPlaceholder: 'Search spreadsheets by name or tag…',
    filterByTag: 'Filter by tag',
    allTags: 'All',
    bringInFirstDataset: 'Upload your first spreadsheet',
    noDatasetsMatch: 'No spreadsheets match your search',
    clearSearchTag: 'Try clearing your search or tag filter to see all your files.',
    uploadCsvExcelStart: 'Upload an Excel or CSV file to begin. You can tidy up messy rows in Data Lab anytime.',
    openInDataLab: 'Clean in Data Lab',
    newDashboardWithData: 'Build Dashboard with This',
    deleteDataset: 'Delete spreadsheet',
    deleteDatasetConfirm: 'Are you sure you want to remove this spreadsheet? This cannot be undone.',
    rawDataset: 'Original',
    cleanedDataset: 'Cleaned',

    // Data Lab Column Actions & Grid
    renameColumnAction: 'Rename Column...',
    duplicateColumnAction: 'Duplicate Column',
    splitColumnAction: 'Split Column...',
    mergeColumnsAction: 'Merge Columns...',
    replaceValuesAction: 'Replace Values...',
    replaceErrorsAction: 'Replace Errors...',
    fillDownAction: 'Fill Down',
    fillUpAction: 'Fill Up',
    moveLeftAction: 'Move Left',
    moveRightAction: 'Move Right',
    removeColumnAction: 'Remove Column',
    previewingRows: 'Previewing {current} of {total} rows.',
    showMoreRows: 'Show more (+100)',
    showAllRows: 'Show all',
    cellError: 'Error',

    // Top Toolbar & Menus
    menuFile: 'File',
    menuEdit: 'Edit',
    menuView: 'View',
    menuInsert: 'Insert',
    menuFormat: 'Format',
    menuHelp: 'Help',
    newDashboard: 'New Dashboard',
    newReport: 'New Report',
    saveNow: 'Save Now',
    saved: 'Saved',
    saving: 'Saving...',
    unsavedChanges: 'Unsaved changes',
    preview: 'Preview',
    exitPreview: 'Exit Preview',
    exportPdf: 'Export PDF',
    exportPdfModalTitle: 'Export Print Ready PDF',
    exportPdfModalSubtitle: 'Configure page size, orientation, margins & document quality',
    pdfFilenameLabel: 'PDF Document Filename',
    pageSizeLabel: 'Paper Page Size',
    orientationLabel: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
    pageMarginsLabel: 'Page Margins',
    pageRangeLabel: 'Page Range',
    allPages: 'All Pages',
    currentPageOnly: 'Current Page Only',
    customPagesLabel: 'Custom Pages',
    exportResolution: 'Quality / Resolution',
    generatePdfBtn: 'Generate PDF',
    generatingPdfStatus: 'Generating Vector PDF...',
    pdfExportError: 'An error occurred during PDF generation. Please try again.',

    // Modal: Select Datasets
    selectDatasetsForTitle: 'Pick Spreadsheets for "{name}"',
    selectDatasetsSubtitle: 'Choose which uploaded files you want to use in this dashboard',
    searchGlobalDatasetsPlaceholder: 'Search your spreadsheets by name...',
    warningDeselectedInUse: 'Heads up: these spreadsheets are already used by charts on this dashboard:',
    applySelectionBtn: 'Use Selected Files',

    // Modal: Dataset Preview
    searchRecordsPlaceholder: 'Search rows across any column...',
    showingMatchingRows: 'Showing {current} of {total} matching rows',

    // Modal: Manage Dashboards
    dashboardManagerTitle: 'Saved Dashboards & Templates',
    exportDashboardJson: 'Download Backup (.json)',
    importJson: 'Import Dashboard',
    pasteDashboardJson: 'Upload Saved Dashboard (.json)',
    applyImportedDashboard: 'Choose .json file to open',
    availableDashboards: 'Your Saved Dashboards',
    activeWorkspaceBadge: 'Currently Open',
    loadWorkspaceBtn: 'Open',
    invalidJsonError: "This file doesn't look like a saved Data Pulse dashboard.",

    canvasSettings: 'Page Size & Grid',
    dataModel: 'Link Tables',
    backToCanvas: 'Back to Dashboard',
    globalFilters: 'Page Filters',
    selectDatasets: 'Choose Files',
    newPage: 'New Page',
    addPage: 'Add Page',
    deletePage: 'Delete Page',
    renamePage: 'Rename Page',
    page: 'Page',
    undo: 'Undo',
    redo: 'Redo',
    gridSnap: 'Snap to Grid',
    showGrid: 'Show Grid',
    zoom: 'Zoom',

    // Left Sidebar
    visualizations: 'Charts & Cards',
    datasets: 'Spreadsheets',
    dragVisualHint: 'Click or drag any chart to add it to your page.',
    searchVisuals: 'Search charts...',
    dataCleaningStudio: 'Data Lab (Clean Data)',
    starSchemaModel: 'Link Multiple Spreadsheets',
    noDatasetsAttached: 'No spreadsheets added yet',
    addDatasetToDashboard: 'Add Spreadsheet',
    inspectColumns: 'Preview columns & quality',

    // Right Config Panel
    widgetSettings: 'Chart Settings',
    dataTab: 'Data',
    styleTab: 'Style',
    advancedTab: 'More',
    selectDataset: 'Choose Spreadsheet',
    xAxisField: 'Category / Date (Bottom)',
    yAxisField: 'Number to Measure (Side)',
    seriesField: 'Group / Split By (Optional)',
    aggregation: 'How to Calculate',
    sum: 'Total (Sum)',
    average: 'Average',
    count: 'Count',
    min: 'Lowest',
    max: 'Highest',
    chartTitle: 'Chart Title',
    primaryColor: 'Main Color',
    colorPalette: 'Color Theme',
    backgroundColor: 'Card Background',
    numberFormat: 'Number Style',
    currencySymbol: 'Currency Sign',

    // Data Model
    modelWorkspaceTitle: 'Link Your Spreadsheets',
    modelWorkspaceDesc: 'Connect two related files (like Orders and Customers) using a shared column—no Excel formulas needed.',
    addFactTable: 'Add Main Sales / Orders Sheet',
    addDimensionTable: 'Add Details Sheet',
    createRelationship: 'Link Two Sheets',
    autoDetectRelationships: 'Find Links Automatically',

    openSavedProjects: 'Open Saved Work',
    saveReport: 'Save Report',
    exploreData: 'Preview & clean...',
    backToHub: 'Back to Home Hub',
    renameReportTitle: 'Rename Report',
    deleteActivePage: 'Delete This Page',
    fitPage: 'Fit Page to Screen',
    fitWidth: 'Fit Width',
    resetZoom: 'Reset Zoom',
    keyboardShortcuts: 'Keyboard Shortcuts',
    aboutDataPulse: 'About Data Pulse',
    canvasSizeSettings: 'Page Size & Layout',
    manualDimensions: 'Custom Size (px)',
    width: 'Width',
    height: 'Height',
    lockRatio: 'Keep Proportions',
    unlockRatio: 'Free Resize',
    allWidgets: 'All',
    chartsCategory: 'Charts',
    analyticsCategory: 'Smart Charts',
    threeDCategory: '3D Charts',
    uploadCsvExcel: 'Upload Excel or CSV',
    uploadCsvExcelHint: 'Works with Excel (.xlsx/.xls) and CSV files',
    selectData: 'Pick Data',
    loadedDatasets: 'Files in This Dashboard',
    noDatasetsSelected: 'No spreadsheets selected yet',
    attachDatasetsHint: 'Add a spreadsheet to start creating charts and number cards.',
    inspect: 'Preview',
    transform: 'Clean Data',
    dataBinding: 'Pick Your Columns',
    stylingOptions: 'Colors & Look',
    sampleData: 'Sample Rows',
    targetDataset: 'Spreadsheet',
    reset: 'Reset',
    applyConfiguration: 'Apply Changes',
    transparentBackground: 'Clear Background',
    syncAllDatasets: 'Refresh Files',
    autoDetectSchema: 'Auto-Link Files',
    factTableBtn: '+ Orders / Activity Sheet',
    dimensionTableBtn: '+ Details Sheet',
    relationshipBtn: '+ Link Sheets',
    measuresBtn: 'Saved Totals',
    score: 'Score',
    searchFieldsPlaceholder: 'Search fields / tables...',
    searchChartTypes: 'Search 30+ chart types...',
    insertWidgets: 'Insert Widgets',
    standardChart: 'Standard Chart',
    kpiMetricCard: 'KPI Metric Card',
    richTextBlock: 'Rich Text Block',
    scatter3dGraph: '3D Scatter Graph',
    insertNewPage: 'Insert New Page',

    // Plural forms for English
    rows_zero: '0 rows',
    rows_one: '1 row',
    rows_two: '{count} rows',
    rows_few: '{count} rows',
    rows_many: '{count} rows',
    rows_other: '{count} rows',

    columns_zero: '0 columns',
    columns_one: '1 column',
    columns_two: '{count} columns',
    columns_few: '{count} columns',
    columns_many: '{count} columns',
    columns_other: '{count} columns',

    datasets_zero: '0 datasets',
    datasets_one: '1 dataset',
    datasets_two: '{count} datasets',
    datasets_few: '{count} datasets',
    datasets_many: '{count} datasets',
    datasets_other: '{count} datasets',

    steps_zero: '0 steps',
    steps_one: '1 step',
    steps_two: '{count} steps',
    steps_few: '{count} steps',
    steps_many: '{count} steps',
    steps_other: '{count} steps',

    selected_zero: '0 selected',
    selected_one: '1 selected',
    selected_two: '{count} selected',
    selected_few: '{count} selected',
    selected_many: '{count} selected',
    selected_other: '{count} selected',

    // Auth Pages
    backToHome: 'Back to home',
    welcomeBackTitle: 'Welcome Back',
    welcomeBackSubtitle: 'Enter your credentials to access your dashboard',
    emailAddress: 'Email Address',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    dontHaveAccount: "Don't have an account?",
    createOneFree: 'Create one for free',
    alreadyHaveAccount: 'Already have an account?',
    createAccountTitle: 'Create Account',
    startFreeTrial: 'Start your free trial today',
    createAccountBtn: 'Create Account',
    signInBtn: 'Sign In',
    enterEmailError: 'Please enter your email address',
    enterValidEmailError: 'Please enter a valid email address',
    enterPasswordError: 'Please enter your password',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordMinLength: 'Password must be at least 8 characters',
    enterFullNameError: 'Please enter your full name',
    termsAgreementText: 'I agree to the Terms of Service and Privacy Policy',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    agreeTermsError: 'Please agree to the Terms of Service and Privacy Policy',
    roleLabel: 'Role',
    roleAnalyst: 'Data Analyst',
    roleDeveloper: 'Developer / BI Engineer',
    roleViewer: 'Viewer',
    roleAdmin: 'Administrator',
    passwordStrength: 'Password Strength',
    passwordStrengthWeak: 'Weak',
    passwordStrengthFair: 'Fair',
    passwordStrengthGood: 'Good',
    passwordStrengthStrong: 'Strong',

    // Home & Marketing Pages
    heroTitle1: 'Turn Everyday Spreadsheets Into',
    heroTitleHighlight: 'Clear Answers',
    heroDescription: 'Upload your Excel or CSV files, tidy up messy rows in a few clicks, build clear dashboards and future forecasts, and share printable PDF reports—no coding or formulas needed.',
    exploreAllFeatures: 'See How It Works',
    exploreDataPulseTitle: 'Built for Everyday Teams',
    exploreDataPulseSubtitle: 'Everything works together simply—from uploading your spreadsheet to sharing clear charts and predictions.',
    productFeaturesTitle: 'What You Can Do',
    productFeaturesDesc: 'Upload Excel & CSV files, fix messy rows visually, link related spreadsheets without formulas, and forecast future sales.',
    transparentPricingTitle: 'Simple Pricing',
    transparentPricingDesc: 'Start free and upgrade only when your team needs more space—clear monthly plans with zero surprise fees.',
    enterpriseArchitectureTitle: 'Safe & Private by Default',
    enterpriseArchitectureDesc: 'Your spreadsheets stay private in your account, your original files stay untouched, and everything saves automatically.',
    readyToTransformTitle: 'Ready to Make Sense of Your Spreadsheets?',
    readyToTransformDesc: 'Join small businesses, managers, and teams turning numbers into clear decisions with Data Pulse.',
    launchCanvasBtn: 'Open Workspace',
    allRightsReserved: 'All rights reserved.',

    // Navbar, Status Badge & Error Boundary
    navHomeTitle: 'Data Pulse Home',
    navGoToHub: 'Go to Dashboard Hub',
    navAccountMenu: 'Account menu',
    navSectionsLabel: 'Sections',
    dbConnectionTitle: 'Database connection',
    dbStatusLabel: 'Status',
    dbCompactLabel: 'DB',
    dbLabel: 'Database',
    dbConnected: 'Connected',
    dbDisconnected: 'Disconnected',
    dbLatency: 'Latency',
    dbLatencyMs: '{ms} ms',
    dbTables: 'Tables',
    dbDatasets: 'Datasets',
    dbDashboards: 'Dashboards',
    dbServerless: 'Cloud Storage Active',
    dbLivePooler: 'Live Sync',
    dbRefreshStatus: 'Refresh connection status',
    errorBoundaryWidgetMsg: "This widget couldn't be displayed",
    errorBoundaryPageTitle: 'Something went wrong',
    errorBoundaryPageDesc: 'The app hit an unexpected error. Your saved work is safe. Reload to continue.',
    reloadPage: 'Reload',

    // Auth extras
    authSigningIn: 'Signing in...',
    authInvalidCredentials: 'Invalid email or password',
    authConnectionError: 'Connection error. Please try again.',
    authCreatingAccount: 'Creating Account...',
    authRegistrationFailed: 'Registration failed',
    authRegistrationError: 'Error creating account. Please try again.',
    authPasswordsMatch: 'Passwords match',
    authFirstNamePlaceholder: 'John',
    authLastNamePlaceholder: 'Doe',

    // Marketing Pages
    featuresHeroBadge: 'Simple, Modern Business Analytics',
    featuresHeroTitle1: 'Built for',
    featuresHeroTitle2: 'Clear Everyday Answers',
    featuresHeroDesc: 'Data Pulse brings spreadsheet uploads, visual cleanup, sheet linking, forecasts, and dashboards together in one easy-to-use workspace.',
    featuresTryBtn: 'Try this feature',
    featuresZeroLatency: 'Fast & Responsive',
    featuresEngineReady: 'Ready when you are',
    featuresFullStackTitle: 'Everything You Need in One Place',
    featuresFullStackDesc: 'Turn everyday Excel and CSV spreadsheets into clear charts, predictions, and printable PDF reports.',
    featuresCard1Title: 'Smart File Upload',
    featuresCard1Desc: 'Open Excel and CSV files in seconds. Data Pulse automatically spots dates, currencies, numbers, and Arabic/English text.',
    featuresCard2Title: 'Step-by-Step Data Cleanup',
    featuresCard2Desc: 'Fix messy rows visually with instant undo. Split columns, merge values, fill blanks, and trim spaces without Excel formulas.',
    featuresCard3Title: 'Easy Spreadsheet Linking',
    featuresCard3Desc: 'Connect separate sheets like Orders and Customers using a shared column—like VLOOKUP without typing a single formula.',
    featuresCard4Title: '1-Click Calendar Sheet',
    featuresCard4Desc: 'Create a ready-made Calendar sheet with year, quarter, month, and day names so you can compare dates effortlessly.',
    featuresCard5Title: '30+ Ready-Made Visuals',
    featuresCard5Desc: 'Build bar charts, trend lines, pie charts, number cards, heatmaps, maps, and 3D charts with simple clicks.',
    featuresCard6Title: 'Safe Delete Warnings',
    featuresCard6Desc: 'Before removing a spreadsheet, Data Pulse warns you if any chart, filter, or linked sheet depends on it so nothing breaks.',
    featuresCtaTitle: 'Ready to make your spreadsheets easier to read?',
    featuresCtaDesc: 'Start building dashboards in seconds with sample templates or your own business files.',
    featuresViewGallery: 'Browse Visual Gallery',

    pricingHeroBadge: 'Simple, Clear Pricing',
    pricingHeroTitle1: 'Friendly Plans for',
    pricingHeroTitle2: 'Every Team Size',
    pricingHeroDesc: 'Start completely free with spreadsheet cleanup, dashboards, and PDF exports. Upgrade anytime as your files and team grow.',
    pricingMonthly: 'Monthly Billing',
    pricingAnnual: 'Annual Billing',
    pricingSave20: 'Save 20%',
    pricingIncludedCapabilities: 'What’s Included:',
    pricingCompareTitle: 'Compare Plans Side by Side',
    pricingColFeature: 'Feature',
    pricingColStarter: 'Basic',
    pricingColPro: 'Upgrade',
    pricingColEnterprise: 'Enterprise',
    pricingRow1Label: 'Saved Spreadsheets',
    pricingRow1Starter: 'Up to 5',
    pricingRow1Pro: 'Unlimited',
    pricingRow1Ent: 'Unlimited + Custom Sources',
    pricingRow2Label: 'Data Lab Cleanup',
    pricingRow2Starter: 'Yes',
    pricingRow2Pro: 'Yes + Saved History',
    pricingRow2Ent: 'Yes + Shared Team Presets',
    pricingRow3Label: 'Spreadsheet Linking',
    pricingRow3Starter: 'Basic',
    pricingRow3Pro: 'Full Linking + Saved Totals',
    pricingRow3Ent: 'Full + Multi-Department Setup',
    pricingRow4Label: 'Calendar Dates Sheet',
    pricingRow4Starter: 'Manual',
    pricingRow4Pro: '1-Click Auto Create',
    pricingRow4Ent: '1-Click + Custom Fiscal Years',
    pricingRow5Label: 'Privacy & Account Security',
    pricingRow5Starter: 'Private Workspace',
    pricingRow5Pro: 'Protected Cloud Workspace',
    pricingRow5Ent: 'Dedicated Team Workspace',
    pricingFaqTitle: 'Common Questions',
    pricingFaqDesc: 'Plain answers to questions people ask before getting started.',
    pricingFaq1Q: 'Can I reuse one spreadsheet across multiple dashboards?',
    pricingFaq1A: 'Yes! Upload your file once to Data Hub and use it across as many dashboards, reports, and forecasts as you like without uploading copies.',
    pricingFaq2Q: 'Does cleaning data change my original Excel or CSV file?',
    pricingFaq2A: 'Never. Your original file stays safe. Every cleanup action in Data Lab is saved as a clear step you can review, adjust, or undo anytime.',
    pricingFaq3Q: 'How does linking spreadsheets work without formulas?',
    pricingFaq3A: 'Pick two sheets (like Orders and Customers) and choose the column they share (like Customer ID). Data Pulse matches them automatically so your charts can use columns from both.',
    pricingFaq4Q: 'Are my files and dashboards kept private?',
    pricingFaq4A: 'Yes. Everything you upload and build belongs privately to your account and is checked safely on our server.',
    pricingFaq5Q: 'Can I switch or cancel my plan anytime?',
    pricingFaq5A: 'Yes, you can upgrade, switch, or cancel anytime with zero hidden fees.',
    pricingNeedCustomTitle: 'Need a custom setup for a larger team?',
    pricingNeedCustomDesc: 'We help finance, operations, and business teams move smoothly from manual spreadsheets or legacy tools.',
    pricingSpeakEngineer: 'Talk to Our Team',

    aboutArchFlowTitle: 'How Data Pulse Works',
    aboutArchBoundary: 'Your Data Stays Private',
    aboutArchStep1Title: '1. DATA HUB',
    aboutArchStep1Desc: 'Upload Excel/CSV • Automatic Column & Date Detection',
    aboutArchStep1Badge: 'Upload',
    aboutArchStep2Title: '2. DATA LAB',
    aboutArchStep2Desc: 'Clean Messy Rows • Undoable Steps • Column Health Bar',
    aboutArchStep2Badge: 'Clean',
    aboutArchStep3Title: '3. LINK SHEETS (OPTIONAL)',
    aboutArchStep3Desc: 'Connect Orders & Customers • Calendar Dates • Saved Totals',
    aboutArchStep3Badge: 'Connect',
    aboutArchStep4Title: '4. DASHBOARDS & FORECASTS',
    aboutArchStep4Desc: 'Charts & Filters • Future Estimates • Printable PDFs',
    aboutArchStep4Badge: 'Share',
    aboutPrinciplesTitle: 'What Guides Us',
    aboutPrinciplesDesc: 'Simple choices designed to make everyday numbers easy to understand.',

    galleryInteractiveDemo: 'Interactive Demo',
    galleryUsageTitle: 'Usage & Analytical Purpose',
    galleryOverviewTitle: 'Overview & Definition',
    galleryBestUseCases: 'Best Use Cases',
    galleryProTip: 'Pro Tip:',
    galleryCtaTitle: 'Ready to create your own customized charts?',
    galleryCtaDesc: 'Build drag-and-drop metrics, import custom spreadsheets, and generate interactive executive dashboards in seconds.',
    galleryBuildBtn: 'Build Your Dashboard Now',
    galleryCatComparison: 'Comparison',
    galleryCatTrends: 'Trends & Series',
    galleryCatComposition: 'Composition',
    galleryCatKpi: 'Executive KPI',
    galleryBarTitle: 'Bar Chart: Regional Sales & Revenue',
    galleryBarSummary: 'Bar charts excel at comparing discrete categorical metrics across groups. Using vertical rectangular bars, stakeholders can quickly spot top-performing segments and regional discrepancies at a single glance.',
    galleryBarUse1: 'Comparing revenue across regional markets or store locations',
    galleryBarUse2: 'Benchmarking quarterly department targets vs actual performance',
    galleryBarUse3: 'Displaying discrete survey results or product category counts',
    galleryBarInsight: 'Use bar charts when category labels are distinct and comparison precision is paramount. Avoid over-cluttering with more than 8-10 bars.',
    galleryLineTitle: 'Line Chart: Monthly Active User Growth',
    galleryLineSummary: 'Line charts visualize continuous data over consecutive time intervals, illustrating growth momentum, seasonal velocity, and directional trends cleanly without distracting visual noise.',
    galleryLineUse1: 'Tracking product adoption and daily/monthly active user growth',
    galleryLineUse2: 'Monitoring operational uptime, website traffic, or sensor telemetry',
    galleryLineUse3: 'Evaluating financial market trajectories and stock performance',
    galleryLineInsight: 'Line charts reveal acceleration and deceleration. Connecting data points with smooth splines emphasizes continuity over discrete jumps.',
    galleryAreaTitle: 'Area Chart: Financial Revenue vs Expenses',
    galleryAreaSummary: 'Area charts highlight the volumetric gap between multiple data streams. By shading the space beneath trendlines, they clearly show cumulative growth and margin expansions.',
    galleryAreaUse1: 'Demonstrating net profit margins by comparing revenue vs expense areas',
    galleryAreaUse2: 'Visualizing cumulative bandwidth consumption or cloud storage usage',
    galleryAreaUse3: 'Analyzing stacked market share evolution across multiple products',
    galleryAreaInsight: 'The filled area conveys total volume, making it easy for viewers to visualize profit buffers between revenue and cost ceilings.',
    galleryDonutTitle: 'Donut Chart: Customer Tier Distribution',
    galleryDonutSummary: 'Donut charts display proportional component breakdowns of a whole (100%). The hollow center provides clean negative space for highlighting overall totals or key summaries.',
    galleryDonutUse1: 'Breaking down customer account distribution or subscriber tiers',
    galleryDonutUse2: 'Displaying budget allocation percentages across departments',
    galleryDonutUse3: 'Showing device OS market share or referral traffic sources',
    galleryDonutInsight: 'Best constrained to 3-6 distinct segments. Order categories from largest to smallest slice for maximum readability.',
    galleryScatterTitle: 'Scatter Plot: Customer Satisfaction vs LTV',
    galleryScatterSummary: 'Scatter plots display individual data points mapped across two numeric axes, uncovering mathematical correlations, clusters, anomalies, and statistical distributions.',
    galleryScatterUse1: 'Analyzing the correlation between satisfaction scores and contract size',
    galleryScatterUse2: 'Mapping marketing spend vs conversion volume per campaign',
    galleryScatterUse3: 'Identifying performance outliers in operational efficiency metrics',
    galleryScatterInsight: 'Perfect for detecting positive or negative relationships between independent metrics before running formal regressions.',
    galleryKpiTitle: 'KPI Executive Card & Directional Metrics',
    galleryKpiSummary: 'Executive KPI cards present top-line metrics with zero visual clutter. Combining oversized numerical indicators with sparklines offers immediate clarity for leadership updates.',
    galleryKpiUse1: 'Executive dashboards requiring immediate status checks',
    galleryKpiUse2: 'Mobile summary views for founders, investors, and product leads',
    galleryKpiUse3: 'Highlighting single-number targets against quarterly benchmarks',
    galleryKpiInsight: 'Pair big bold numbers with directional delta indicators (+%) and mini sparklines for immediate context without context switching.',
    galleryKpiMrrLabel: 'Monthly Recurring Revenue',
    galleryKpiMrrDelta: '+18.4% vs previous month',
    galleryKpiChurnLabel: 'Net Churn Rate',
    galleryKpiChurnDelta: '-0.12% improvement',
    galleryKpiCacLabel: 'CAC Payback',
    galleryKpiCacValue: '5.2 Months',
    galleryKpiCacDelta: 'Top decile efficiency',

    // App, Hubs, Canvas, Toolbar, Sidebar, Filters, Widgets
    appNewDashboardName: 'New Dashboard',
    appNewReportName: 'New Report',
    appUntitledDashboard: 'Untitled Dashboard',
    appCannotDeleteLastPage: 'Cannot delete the only remaining page.',
    appLoadingWorkspace: 'Loading workspace...',
    appSavingError: 'Unable to save changes to database. Please retry.',
    appNewPageName: 'Page {n}',
    hubCreateErrorFallback: 'Failed to create workspace. Please try again.',
    hubTypePresetDesktop: '16:9 Desktop (1280×720)',
    hubTypePresetTablet: '4:3 Presentation (1024×768)',
    hubTypePresetA4Portrait: 'A4 Portrait',
    hubTypePresetA4Landscape: 'A4 Landscape',
    hubTypePresetLetter: 'US Letter Portrait',
    dataHubNumericCol: 'num',
    dataHubTextCol: 'text',
    dataHubDateCol: 'date',
    dataHubBoolCol: 'bool',
    dataHubDeleteTitle: 'Delete dataset?',
    dataHubDeleteWarning: 'Any dashboards referencing this dataset may lose their charts. This cannot be undone.',
    dataHubDeleting: 'Deleting...',
    dataHubNoDescription: 'No description provided.',

    toolbarRenamePrompt: 'Rename page',
    toolbarDuplicatePage: 'Duplicate Page',
    toolbarMovePageLeft: 'Move Left',
    toolbarMovePageRight: 'Move Right',
    toolbarShortcutsTitle: 'Keyboard Shortcuts',
    toolbarShortcutUndo: 'Undo last canvas action',
    toolbarShortcutRedo: 'Redo canvas action',
    toolbarShortcutDelete: 'Delete selected widget',
    toolbarShortcutPalette: 'Open Quick Command Palette (Data Lab)',
    toolbarShortcutClose: 'Close open dialog or cancel',
    toolbarAboutDesc: 'Easy visual dashboards, step-by-step spreadsheet cleanup, simple sheet linking, future forecasts, and printable PDF reports.',
    toolbarQuickPresets: 'Quick Canvas Presets',
    toolbarSize16x9: '16:9 HD Dashboard (1280×720)',
    toolbarSizeA4: 'A4 Portrait Report',
    toolbarSizeLetter: 'US Letter Report',
    toolbarAspectLocked: 'Aspect ratio locked',
    toolbarClickToRename: 'Click to rename dashboard/report',
    toolbarNewPagePrefix: 'Page',
    toolbarGridSnapTip: 'Toggle snap-to-grid alignment',
    toolbarShowGridTip: 'Show or hide gridlines',
    toolbarUndoTip: 'Undo (Ctrl+Z)',
    toolbarRedoTip: 'Redo (Ctrl+Y)',
    toolbarPreviewTip: 'Toggle presentation preview mode',
    toolbarSaveTip: 'Save dashboard now',

    sidebarCustomVisuals: 'Visualization Library',
    sidebarSearchEmpty: 'No visuals match your search',
    sidebarNoMatch: 'Try a different keyword.',
    sidebarRowsShort: '{count} rows',
    sidebarColsShort: '{count} cols',
    sidebarRemoveDataset: 'Remove dataset from dashboard',

    canvasEmptyTitle: 'Your canvas is ready',
    canvasEmptyDesc: 'Click or drag any chart from the Visualizations sidebar to add your first visual.',
    canvasQuickSizeTitle: 'Quick Canvas Size',
    canvasPresetCustom: 'Custom',
    canvasPageHeaderPlaceholder: 'Report header...',
    canvasPageFooterPlaceholder: 'Confidential — Internal Report',
    canvasOfPages: 'of {total}',
    canvasGridBgLabel: 'Canvas grid',

    widgetEditTitle: 'Configure widget',
    widgetDuplicateTitle: 'Duplicate widget',
    widgetDeleteTitle: 'Remove widget',
    widgetConfigureData: 'Configure Data',
    widgetNoDataTitle: 'No data bound',
    widgetNoDataDesc: 'Select a dataset and axis fields in the right panel.',
    widgetLoading3d: 'Loading 3D chart...',
    widget3dUnavailable: '3D renderer unavailable for this data.',
    widgetChartError: 'Unable to render chart.',
    widgetTextPlaceholder: 'Double-click or edit in the right panel to customize text...',
    widgetSelectFieldPrompt: 'Select fields in the config panel',
    widgetRecordsLabel: '{count} records',
    widgetComparePrev: 'vs target',

    configNoWidgetTitle: 'No Widget Selected',
    configNoWidgetDesc: 'Click any widget on the canvas to configure its dataset, axes, aggregation, and styling.',
    configDatasetLabel: 'Dataset Source',
    configAutoSelect: 'Auto-select',
    configNone: 'None',
    configValueFormat: 'Value Format',
    configFormatAuto: 'Auto',
    configFormatCurrency: 'Currency ($)',
    configFormatPercent: 'Percentage (%)',
    configFormatCompact: 'Compact (1.2K)',
    configFormatDecimal: 'Decimal (0.00)',
    configDecimals: 'Decimal Places',
    configLegendPosition: 'Legend Position',
    configShowLegend: 'Show Legend',
    configShowGrid: 'Show Gridlines',
    configShowLabels: 'Show Data Labels',
    configFontSize: 'Font Size',
    configFontFamily: 'Font Family',
    configTextAlign: 'Text Alignment',
    configTextContent: 'Text Content',
    configPadding: 'Inner Padding',
    configBorderRadius: 'Corner Radius',
    configAccentColor: 'Accent Color',
    configSamplePreviewTitle: 'Sample Values Preview',
    configNoSampleRows: 'No sample rows available',
    configAxisXLabel: 'X-Axis Label',
    configAxisYLabel: 'Y-Axis Label',
    configAggDistinct: 'Distinct Count',
    configPaletteDefault: 'Corporate Blue',
    configPaletteVibrant: 'Vibrant Rainbow',
    configPaletteOcean: 'Ocean Teal',
    configPaletteSunset: 'Warm Sunset',
    configPaletteForest: 'Emerald Forest',
    configPaletteMono: 'Monochrome Slate',
    configShowHeader: 'Show Widget Header',
    configShowBorder: 'Show Card Border',
    configBorderColor: 'Border Color',
    configTitleColor: 'Title Color',
    configAlignStart: 'Start',
    configAlignCenter: 'Center',
    configAlignEnd: 'End',

    filterBarClearAll: 'Clear all',
    filterOpEquals: 'Equals (=)',
    filterOpContains: 'Contains',
    filterOpGreater: 'Greater than (>)',
    filterOpLess: 'Less than (<)',

    exportPdfCustomSize: 'Custom Physical Size',
    exportPdfMarginTop: 'Top',
    exportPdfMarginRight: 'Right',
    exportPdfMarginBottom: 'Bottom',
    exportPdfMarginLeft: 'Left',
    exportPdfActiveView: 'Active View',
    exportPdfCustomPlaceholder: 'e.g. 1, 2',
    exportPdfQualityDesc: 'Sharper text & vectorized canvas charts',
    exportPdf2x: '2x High',
    exportPdf3x: '3x Ultra HD',
    exportPdfDefaultName: 'Business Report',
    exportPdfPagesCount: '{count} Pages',
    exportPdfPageSingular: '1 Page',

    importErrorRead: 'Failed to read file contents',
    importErrorNoRows: 'No valid data rows found to import.',
    importErrorSave: 'Failed to save dataset to database. Please retry.',
    importProgressPrep: 'Preparing dataset...',
    importProgressSaving: 'Saving to PostgreSQL database...',
    importProgressDone: 'Dataset saved successfully!',
    importDefaultDatasetPlaceholder: 'Enter dataset name',
    importReading: 'Reading...',
    tourGoToStep: 'Go to step {step}',
    tourProgressLabel: 'Tour progress',

    // 31 Widget Definitions
    widget_bar_name: 'Bar Chart', widget_bar_desc: 'Compare categories horizontally with rectangular bars',
    widget_stacked_bar_name: 'Stacked Bar', widget_stacked_bar_desc: 'Show part-to-whole composition across categories',
    widget_column_name: 'Column Chart', widget_column_desc: 'Compare categorical values using vertical columns',
    widget_line_name: 'Line Chart', widget_line_desc: 'Track continuous trends and time-series progression',
    widget_area_name: 'Area Chart', widget_area_desc: 'Emphasize cumulative magnitude across a timeline',
    widget_stacked_area_name: 'Stacked Area', widget_stacked_area_desc: 'Compare stacked volume trends over time',
    widget_pie_name: 'Pie Chart', widget_pie_desc: 'Visualize proportional breakdown of a single total',
    widget_donut_name: 'Donut Chart', widget_donut_desc: 'Modern ring chart highlighting category shares',
    widget_scatter_name: 'Scatter Plot', widget_scatter_desc: 'Explore correlations and clusters between two metrics',
    widget_bubble_name: 'Bubble Chart', widget_bubble_desc: 'Compare three numerical dimensions using bubble size',
    widget_radar_name: 'Radar Chart', widget_radar_desc: 'Compare multivariate performance across radial axes',
    widget_polar_name: 'Polar Area', widget_polar_desc: 'Display cyclic magnitudes using equal-angle sectors',
    widget_heatmap_name: 'Heatmap', widget_heatmap_desc: 'Visualize matrix intensity and density by color scale',
    widget_treemap_name: 'Treemap', widget_treemap_desc: 'Display hierarchical proportions via nested rectangles',
    widget_funnel_name: 'Funnel Chart', widget_funnel_desc: 'Track conversion stages and drop-off rates',
    widget_waterfall_name: 'Waterfall', widget_waterfall_desc: 'Show cumulative positive and negative changes',
    widget_boxplot_name: 'Box Plot', widget_boxplot_desc: 'Inspect quartiles, medians, and statistical outliers',
    widget_histogram_name: 'Histogram', widget_histogram_desc: 'Plot frequency distribution across value bins',
    widget_kpi_name: 'KPI Card', widget_kpi_desc: 'Highlight a headline metric with target variance',
    widget_gauge_name: 'Gauge Meter', widget_gauge_desc: 'Measure progress toward a single target threshold',
    widget_sparkline_name: 'Sparkline', widget_sparkline_desc: 'Compact trendline paired with summary value',
    widget_table_name: 'Data Table', widget_table_desc: 'Display structured records with sortable columns',
    widget_pivot_name: 'Pivot Matrix', widget_pivot_desc: 'Cross-tabulate dimensions with aggregated metrics',
    widget_slicer_name: 'Filter Slicer', widget_slicer_desc: 'Interactive filter control for dashboard pages',
    widget_textbox_name: 'Text Box / Annotation', widget_textbox_desc: 'Add custom text, notes, headers, or descriptions directly onto your dashboard canvas',
    widget_combo_name: 'Combo Chart', widget_combo_desc: 'Combine columns and trendline on dual axes',
    widget_bullet_name: 'Bullet Graph', widget_bullet_desc: 'Compact performance bar against qualitative bands',
    widget_metric_name: 'Metric Card', widget_metric_desc: 'Highlighted statistical card featuring integrated micro-chart overview',
    widget_progress_name: 'Progress Bar', widget_progress_desc: 'Linear status tracking bar showing current percentage of completed milestones',
    widget_target_vs_actual_name: 'Target vs Actual', widget_target_vs_actual_desc: 'Compare current performance against preset key operational benchmarks',
    widget_candlestick_name: 'Candlestick Chart', widget_candlestick_desc: 'Show open, high, low, and close values for financial market movement analysis',
    widget_ohlc_name: 'OHLC Bar Chart', widget_ohlc_desc: 'Financial price volatility tracking with Open-High-Low-Close tick indicators',
    widget_scatter3d_name: '3D Scatter Plot', widget_scatter3d_desc: 'Interactive WebGL 3D point cloud across X, Y, and Z spatial dimensions',
    widget_surface3d_name: '3D Surface Plot', widget_surface3d_desc: 'Continuous 3D mathematical elevation surface topology',
    widget_bar3d_name: '3D Bar Chart', widget_bar3d_desc: 'Volumetric 3D bar matrix across multi-dimensional categories',
    widget_mesh3d_name: '3D Mesh Graph', widget_mesh3d_desc: 'Triangulated 3D geometric surface mesh in interactive perspective',
    widget_bubble3d_name: '3D Bubble Graph', widget_bubble3d_desc: 'Volumetric sphere point clusters with variable radii in 3D space',
    widget_line3d_name: '3D Line Plot', widget_line3d_desc: 'Trajectory ribbon and vector paths traversing 3D coordinate space',
    widget_contour3d_name: '3D Contour Plot', widget_contour3d_desc: 'Topographical iso-level elevation slice lines projected on a 3D surface',
    widget_volume3d_name: '3D Volume Rendering', widget_volume3d_desc: 'Render volumetric density fields with customizable opacity',
    widget_cone3d_name: '3D Cone Plot', widget_cone3d_desc: 'Vector field directional cones in 3D simulation space',
    widget_streamtube3d_name: '3D Streamtube', widget_streamtube3d_desc: 'Flow velocity streamlines and vortex tubes in 3D space',
    widget_isosurface3d_name: '3D Isosurface', widget_isosurface3d_desc: 'Constant density value surfaces in 3D scalar field datasets',

    // Data Lab & Data Cleaning
    labActingOn: 'Acting on',
    labQuickCommands: 'Quick commands',
    labSearchPlaceholder: 'Type a command, column action, or keyword…',
    labAllActions: 'All commands',
    labClosePalette: 'Close command palette',
    labNoMatchingCommands: 'No matching commands found.',
    labRequiresColumn: 'Select a column first',
    labRequiresNumber: 'Requires a number column',
    labRequiresDate: 'Requires a date column',
    labSelectColumnFirst: 'Select a column first',
    labGroupClean: 'Clean',
    labGroupCleanBlurb: 'Fix messy text, missing values, and errors',
    labGroupRows: 'Rows',
    labGroupRowsBlurb: 'Sort, deduplicate, and filter rows',
    labGroupColumns: 'Columns',
    labGroupColumnsBlurb: 'Split, merge, rename, and reorder columns',
    labGroupCompute: 'Compute',
    labGroupComputeBlurb: 'Calculate new columns, round numbers, and extract dates',

    labAction_trim_label: 'Trim spaces', labAction_trim_hint: 'Remove leading and trailing spaces',
    labAction_clean_label: 'Clean control chars', labAction_clean_hint: 'Strip non-printable characters',
    labAction_upper_label: 'UPPERCASE', labAction_upper_hint: 'Convert text to uppercase',
    labAction_lower_label: 'lowercase', labAction_lower_hint: 'Convert text to lowercase',
    labAction_title_label: 'Title Case', labAction_title_hint: 'Capitalize each word',
    labAction_replace_label: 'Replace values', labAction_replace_hint: 'Find and replace exact or partial values',
    labAction_nulls_label: 'Fill / Replace nulls', labAction_nulls_hint: 'Replace empty cells with 0, mean, median, or custom value',
    labAction_errors_label: 'Replace errors', labAction_errors_hint: 'Replace conversion errors with a safe value',
    labAction_filldown_label: 'Fill down', labAction_filldown_hint: 'Copy previous non-empty value downward',
    labAction_fillup_label: 'Fill up', labAction_fillup_hint: 'Copy next non-empty value upward',
    labAction_sortasc_label: 'Sort A→Z', labAction_sortasc_hint: 'Sort rows ascending by selected column',
    labAction_sortdesc_label: 'Sort Z→A', labAction_sortdesc_hint: 'Sort rows descending by selected column',
    labAction_dupes_label: 'Remove duplicates', labAction_dupes_hint: 'Deduplicate rows across selected columns',
    labAction_removeblank_label: 'Remove blank rows', labAction_removeblank_hint: 'Drop rows where all cells are empty',
    labAction_keeptop_label: 'Keep top rows', labAction_keeptop_hint: 'Keep first N rows and discard the rest',
    labAction_keepbottom_label: 'Keep bottom rows', labAction_keepbottom_hint: 'Keep last N rows and discard the rest',
    labAction_keeprange_label: 'Keep row range', labAction_keeprange_hint: 'Keep a contiguous slice of rows',
    labAction_removetop_label: 'Remove top rows', labAction_removetop_hint: 'Drop first N rows from the table',
    labAction_removebottom_label: 'Remove bottom rows', labAction_removebottom_hint: 'Drop last N rows from the table',
    labAction_removealt_label: 'Remove alternate rows', labAction_removealt_hint: 'Remove repeating row intervals',
    labAction_split_label: 'Split column', labAction_split_hint: 'Split by delimiter, length, or positions',
    labAction_merge_label: 'Merge columns', labAction_merge_hint: 'Combine multiple columns with a separator',
    labAction_rename_label: 'Rename column', labAction_rename_hint: 'Change column header name',
    labAction_duplicate_label: 'Duplicate column', labAction_duplicate_hint: 'Create an exact copy of the column',
    labAction_left_label: 'Move left', labAction_left_hint: 'Shift column one position earlier',
    labAction_right_label: 'Move right', labAction_right_hint: 'Shift column one position later',
    labAction_remove_label: 'Remove column', labAction_remove_hint: 'Drop the selected column from the table',
    labAction_custom_label: 'Add custom column', labAction_custom_hint: 'Compute a new column from existing fields',
    labAction_math_label: 'Math operation', labAction_math_hint: 'Add, subtract, multiply, divide, or modulo',
    labAction_round_label: 'Round', labAction_round_hint: 'Round numbers to N decimal places',
    labAction_roundup_label: 'Round up (Ceiling)', labAction_roundup_hint: 'Round numbers upward to nearest integer',
    labAction_rounddown_label: 'Round down (Floor)', labAction_rounddown_hint: 'Round numbers downward to nearest integer',
    labAction_abs_label: 'Absolute value', labAction_abs_hint: 'Convert negative numbers to positive',
    labAction_date_year_label: 'Extract Year', labAction_date_year_hint: 'Replace date with 4-digit year',
    labAction_date_month_label: 'Extract Month', labAction_date_month_hint: 'Replace date with month number (1-12)',
    labAction_date_month_name_label: 'Extract Month Name', labAction_date_month_name_hint: 'Replace date with month name',
    labAction_date_quarter_label: 'Extract Quarter', labAction_date_quarter_hint: 'Replace date with calendar quarter (1-4)',
    labAction_date_day_label: 'Extract Day', labAction_date_day_hint: 'Replace date with day of month (1-31)',
    labAction_date_day_name_label: 'Extract Day Name', labAction_date_day_name_hint: 'Replace date with weekday name',

    labInspectorColumnTitle: 'Column Profile',
    labInspectorHealthTitle: 'Data health',
    labInspectorSelectColHint: 'Click any column header in the grid to inspect its profile and suggested fixes.',
    labInspectorProfile: 'Profile',
    labInspectorNulls: 'Null / empty',
    labInspectorErrors: 'Errors',
    labInspectorDistinct: 'Distinct values',
    labInspectorMin: 'Minimum',
    labInspectorMax: 'Maximum',
    labInspectorMean: 'Mean',
    labInspectorMostCommon: 'Most common',
    labInspectorTopValues: 'Top values',
    labInspectorSuggestedFixes: 'Suggested fixes',
    labInspectorApply: 'Apply',
    labInspectorNoFixes: 'This column looks clean — no obvious anomalies detected.',
    labInspectorTableSummary: 'Table summary',
    labInspectorDuplicateRows: '{count} duplicate rows detected',
    labInspectorRemoveDupesBtn: 'Remove duplicate rows',
    labFixTrimTitle: 'Trim stray spaces',
    labFixTrimDetail: '{count} values have leading or trailing whitespace.',
    labFixNullsTitle: 'Replace empty values',
    labFixNullsDetail: '{count} cells are empty or null.',
    labFixErrorsTitle: 'Replace conversion errors',
    labFixErrorsDetail: '{count} cells failed type conversion.',
    labFixCaseTitle: 'Normalize letter casing',
    labFixCaseDetail: 'Mixed casing variants detected (e.g. "{a}" vs "{b}").',
    labFixDupesTitle: 'Remove duplicate rows',
    labFixDupesDetail: '{count} duplicate rows across the table.',

    labStatusMCode: 'M Formula',
    labStatusCopyCode: 'Copy M code',
    labStatusCopiedCode: 'Copied!',
    labStatusSelectedCell: 'Selected Cell',

    labRailViewingStep: 'Viewing step',
    labRailJumpLatest: 'Latest',
    labRailSourceSize: '{rows} rows × {cols} cols',
    labRailMoveUp: 'Move step up',
    labRailMoveDown: 'Move step down',
    labRailRename: 'Rename step',
    labRailEditSettings: 'Edit step settings',
    labRailDeleteStep: 'Delete step',
    labRailRenameQuery: 'Rename query',
    labRailDeltaAddedRows: '+{n} row',
    labRailDeltaRemovedRows: '−{n} row',
    labRailDeltaAddedCols: '+{n} col',
    labRailDeltaRemovedCols: '−{n} col',
    labRailDeltaNoChange: 'no shape change',

    labStepType_source: 'Source',
    labStepType_changed_type: 'Changed Type',
    labStepType_promoted_headers: 'Promoted Headers',
    labStepType_removed_columns: 'Removed Columns',
    labStepType_renamed_column: 'Renamed Column',
    labStepType_duplicated_column: 'Duplicated Column',
    labStepType_reordered_columns: 'Reordered Columns',
    labStepType_split_column: 'Split Column',
    labStepType_merged_columns: 'Merged Columns',
    labStepType_filter_rows: 'Filtered Rows',
    labStepType_sort_rows: 'Sorted Rows',
    labStepType_removed_top_rows: 'Removed Top Rows',
    labStepType_removed_bottom_rows: 'Removed Bottom Rows',
    labStepType_removed_alternate_rows: 'Removed Alternate Rows',
    labStepType_kept_top_rows: 'Kept Top Rows',
    labStepType_kept_bottom_rows: 'Kept Bottom Rows',
    labStepType_kept_range_rows: 'Kept Range',
    labStepType_remove_duplicates: 'Removed Duplicates',
    labStepType_remove_blank_rows: 'Removed Blank Rows',
    labStepType_replace_values: 'Replaced Values',
    labStepType_replace_errors: 'Replaced Errors',
    labStepType_fill_down: 'Filled Down',
    labStepType_fill_up: 'Filled Up',
    labStepType_transform_text: 'Text Transform',
    labStepType_transform_number: 'Number Transform',
    labStepType_transform_date: 'Date Extract',
    labStepType_added_custom_column: 'Custom Column',

    labTabsNewQuery: 'New query',
    labTabsCloseTab: 'Close tab',

    labGridClickRowTip: 'Click to select row {row}. Hold Shift to select range. Right-click for options.',
    labGridClickCellTip: 'Cell [{col}, Row {row}]. Click to select. Arrow keys navigate. Right-click for options.',
    labGridSelectAllTip: 'Select or deselect all visible rows',
    labGridCount: 'COUNT:',
    labGridSum: 'SUM:',
    labGridAvg: 'AVG:',
    labGridMin: 'MIN:',
    labGridMax: 'MAX:',
    labGridDistinct: 'DISTINCT:',
    labGridEmpty: 'EMPTY:',
    labGridCopiedTsv: 'Copied TSV',
    labGridCtrlCCopy: 'Ctrl+C to copy',
    labGridSortAsc: 'Sort Ascending',
    labGridSortDesc: 'Sort Descending',
    labGridClearSort: 'Clear Sort',
    labGridTextFilters: 'Text Filters',
    labGridNumberFilters: 'Number Filters',
    labGridSearchValues: 'Search values...',
    labGridSelectAllValues: '(Select All)',
    labGridClearAllValues: 'Clear',
    labGridNoMatches: 'No matching values',
    labGridColumnMenuTip: 'Filter, sort, and inspect column options',

    manageRowsRemoveTopTitle: 'Remove Top Rows',
    manageRowsRemoveTopDesc: 'Specify how many rows to remove from the top of the table.',
    manageRowsRemoveBottomTitle: 'Remove Bottom Rows',
    manageRowsRemoveBottomDesc: 'Specify how many rows to remove from the bottom of the table.',
    manageRowsRemoveBlankTitle: 'Remove Blank Rows',
    manageRowsRemoveBlankDesc: 'Remove all rows in the dataset that contain only null or empty values.',
    manageRowsRemoveAltTitle: 'Remove Alternate Rows',
    manageRowsRemoveAltDesc: 'Remove alternating patterns of rows from your dataset.',
    manageRowsKeepTopTitle: 'Keep Top Rows',
    manageRowsKeepTopDesc: 'Keep the specified number of rows from the top of the table and discard the rest.',
    manageRowsKeepBottomTitle: 'Keep Bottom Rows',
    manageRowsKeepBottomDesc: 'Keep the specified number of rows from the bottom of the table and discard the rest.',
    manageRowsKeepRangeTitle: 'Keep Range of Rows',
    manageRowsKeepRangeDesc: 'Keep a contiguous slice of rows starting from a specific row position.',
    manageRowsCountRemove: 'Number of rows to remove',
    manageRowsCountKeep: 'Number of rows to keep',
    manageRowsCurrentTotal: 'Total rows currently: {total}',
    manageRowsStartIndex: 'Starting row index (1-based)',
    manageRowsFirstToRemove: 'First row to remove',
    manageRowsApply: 'Apply',

    mergeModalTitle: 'Merge Columns',
    mergeSelectColumns: 'Select columns to merge in order ({count} selected)',
    mergeMinTwoWarning: 'Please select at least 2 columns to merge.',
    mergeSeparatorLabel: 'Separator',
    mergeSepSpace: 'Space ( )',
    mergeSepComma: 'Comma ( , )',
    mergeSepDash: 'Dash ( - )',
    mergeSepSemicolon: 'Semicolon ( ; )',
    mergeSepNone: 'None (Empty)',
    mergeSepCustom: 'Custom Separator',
    mergeNewColName: 'New Column Name',
    mergeNewColPlaceholder: 'e.g. Full Name',
    mergeCustomSepLabel: 'Custom separator string',
    mergeCustomSepPlaceholder: 'e.g. / or | or _',
    mergeDropOriginals: 'Drop original source columns after merging',
    mergePreviewLabel: 'Preview:',
    mergeEmptyCell: 'empty',
    mergeSubmitBtn: 'Merge Columns',

    removeDupesTitle: 'Remove Duplicates',
    removeDupesDesc: 'Select the columns that will be used to determine duplicate rows. Rows with matching values across all selected columns will be removed, keeping only the first occurrence.',
    removeDupesSelectedOf: '{selected} of {total} columns selected',
    removeDupesSelectAll: 'Select All',
    removeDupesClearAll: 'Clear All',
    removeDupesSubmitBtn: 'Remove Duplicates',

    replaceValuesTitle: 'Replace Values in',
    replaceValuesFindLabel: 'Value To Find',
    replaceValuesFindPlaceholder: 'e.g. USA or null',
    replaceValuesNullHint: 'Type null to target empty/null values.',
    replaceValuesWithLabel: 'Replace With',
    replaceValuesWithPlaceholder: 'e.g. United States',
    replaceValuesMatchEntire: 'Match entire cell contents',
    replaceValuesMatchSubstring: 'Replace text occurrences within cell',
    replaceValuesAffectedLabel: 'Rows affected in current view:',
    replaceValuesSubmitBtn: 'Replace Values',

    splitColTitle: 'Split Column:',
    splitByLabel: 'Split By',
    splitModeDelimiter: 'Delimiter',
    splitModeChars: 'Number of Characters',
    splitModePositions: 'Positions',
    splitSelectDelimiter: 'Select or enter delimiter',
    splitDelimSpace: 'Space ( )',
    splitDelimComma: 'Comma (,)',
    splitDelimSemicolon: 'Semicolon (;)',
    splitDelimColon: 'Colon (:)',
    splitDelimTab: 'Tab (\\t)',
    splitDelimCustom: 'Custom',
    splitCustomDelimLabel: 'Custom delimiter character(s)',
    splitAtLabel: 'Split at',
    splitAtLeftmost: 'Left-most delimiter',
    splitAtRightmost: 'Right-most delimiter',
    splitAtEvery: 'Each occurrence of the delimiter',
    splitCharCountLabel: 'Number of characters',
    splitPositionsLabel: 'Positions (comma-separated indices)',
    splitPositionsHint: 'Zero-based character indices where column will be split.',
    splitPreviewTitle: 'Live Result Preview',
    splitGeneratesCols: 'Generates {count} columns',
    splitSubmitBtn: 'Split Column',

    transformPrefixTitle: 'Add Prefix',
    transformPrefixLabel: 'Prefix text to prepend',
    transformSuffixTitle: 'Add Suffix',
    transformSuffixLabel: 'Suffix text to append',
    transformExtractFirstTitle: 'Extract First Characters',
    transformExtractFirstLabel: 'Number of starting characters to keep',
    transformExtractLastTitle: 'Extract Last Characters',
    transformExtractLastLabel: 'Number of ending characters to keep',
    transformExtractRangeTitle: 'Extract Character Range',
    transformExtractRangeStart: 'Starting position (1-based)',
    transformExtractRangeLength: 'Number of characters to extract',
    transformExtractBeforeTitle: 'Extract Text Before Delimiter',
    transformExtractAfterTitle: 'Extract Text After Delimiter',
    transformDelimiterLabel: 'Delimiter',
    transformMathTitle: 'Number Operation on {col}',
    transformMathOpLabel: 'Operation',
    transformMathValLabel: 'Value',
    transformOpAdd: 'Add (+)',
    transformOpSub: 'Subtract (-)',
    transformOpMul: 'Multiply (*)',
    transformOpDiv: 'Divide (/)',
    transformOpMod: 'Modulo (%)',
    transformRoundTitle: 'Round Decimals',
    transformRoundLabel: 'Number of decimal places',
    transformReplaceErrorsTitle: 'Replace Errors in {col}',
    transformReplaceErrorsLabel: 'Value to replace errors with',
    transformReplaceNullsTitle: 'Replace Null / Missing in {col}',
    transformNullStrategyLabel: 'Choose replacement strategy',
    transformNullZero: 'Replace with 0',
    transformNullCustom: 'Replace with custom value',
    transformNullAvg: 'Replace with column Average (Mean)',
    transformNullMedian: 'Replace with column Median',
    transformNullMin: 'Replace with column Minimum',
    transformNullMax: 'Replace with column Maximum',
    transformNullFillDown: 'Fill Down (from previous non-empty row)',
    transformNullFillUp: 'Fill Up (from next non-empty row)',
    transformCustomValLabel: 'Custom value',
    transformRenameStepTitle: 'Rename Applied Step',
    transformRenameStepLabel: 'Step Name',
    transformRenameColTitle: 'Rename Column',
    transformRenameColLabel: 'New Column Name',
    transformCustomColTitle: 'Add Custom Calculated Column',
    transformOkBtn: 'OK',

    labPageUnnamedQuery: 'Unnamed Query',
    labPageLoadDatasetError: 'Unable to load dataset.',
    labPageSaveError: 'Failed to save dataset changes. Please try again.',

    // Data Model & Modals
    dmStatsSummary: '{facts} Main Sheets • {dims} Details Sheets • {rels} Links • {datasets} Spreadsheets Connected',
    dmDimDateTitle: 'Create a Calendar Dates sheet for monthly & yearly charts',
    dmMeasuresTitle: 'Manage Saved Quick Totals',
    dmValidationTitle: 'Check if your linked sheets line up cleanly',
    dmVersionsTitle: 'Saved Link Versions & Backups',
    dmZoomOut: 'Zoom Out',
    dmZoomIn: 'Zoom In',
    dmResetView: 'Reset View',
    dmLegendTitle: 'How Links Work',
    dmLegendFact: 'Orders / Sales Sheet (Numbers & Totals)',
    dmLegendDim: 'Details Sheet (Customers, Products, Dates)',
    dmLegendJoin: 'How sheets match up',
    dmEmptyTitle: 'No sheets linked yet',
    dmEmptyNoDatasetsDesc: 'Pick at least one spreadsheet for this dashboard first.',
    dmEmptyReadyDesc: 'Your spreadsheets are ready. Click "+ Orders / Activity Sheet", "+ Details Sheet", or "Auto-Link Files" to connect them.',
    dmBackToSelectDatasets: 'Back to Dashboard & Pick Files',

    dmCardCollapse: 'Minimize card',
    dmCardExpand: 'Expand card',
    dmCardRemoveTable: 'Remove Sheet',
    dmCardPrimaryKey: 'ID Column',
    dmCardForeignKeys: 'Matching Columns',
    dmCardMeasures: 'Numbers to Measure',
    dmCardAttributes: 'Detail Columns',
    dmCardHierarchies: 'Date & Group Levels',
    dmCardFooterFact: '{measures} numbers, {keys} links',
    dmCardFooterDim: '{fields} columns',

    dmDimModalTitle: 'Set Up a Details Sheet',
    dmDimModalDesc: 'Pick the ID column and descriptive details (like Customer Name, City, or Category)',
    dmSourceDataset: 'Choose Spreadsheet',
    dmDimTableName: 'Sheet Name',
    dmUniquePrimaryKey: 'Unique ID Column (One unique value per row)',
    dmIncludedAttributes: 'Detail Columns to Include',
    dmSelectAll: 'Select All',
    dmClearOptional: 'Clear Optional',
    dmCreateDimBtn: 'Add Details Sheet',
    dmRowsSuffix: 'rows',

    dmFactModalTitle: 'Set Up Main Sales / Orders Sheet',
    dmFactModalDesc: 'Pick the numbers you want to total (like Sales or Quantity) and columns that match other sheets',
    dmFactTableName: 'Sheet Name',
    dmOptionalPrimaryKey: 'Order / Row ID Column (Optional)',
    dmNoCompositeKey: '(None needed)',
    dmForeignKeysLabel: 'Matching Columns (Connect to Details Sheets)',
    dmMeasuresLabel: 'Number Columns to Measure',
    dmCreateFactBtn: 'Add Main Sheet',

    dmRelModalCreateTitle: 'Link Two Spreadsheets',
    dmRelModalEditTitle: 'Edit Link',
    dmRelModalDesc: 'Match a details sheet (like Customers) to your main sales or orders sheet using a shared column',
    dmRelFromDim: 'Details Sheet',
    dmRelToFact: 'Main Orders / Sales Sheet',
    dmRelSelectTable: 'Choose a sheet',
    dmRelSelectCol: 'Choose matching column',
    dmRelFromTableLabel: 'First Sheet (Details)',
    dmRelFromColLabel: 'Matching Column',
    dmRelToTableLabel: 'Second Sheet (Orders / Activity)',
    dmRelToColLabel: 'Matching Column',
    dmRelCardinalityLabel: 'Match Type',
    dmRelOneToMany: 'One to Many (Most Common)',
    dmRelOneToManySub: 'One customer or product matches many orders',
    dmRelManyToOne: 'Many to One',
    dmRelManyToOneSub: 'Many orders match one customer or product',
    dmRelOneToOne: 'One to One',
    dmRelOneToOneSub: 'One row matches one row',
    dmRelValidVerified: 'Looks great! All matching values line up cleanly.',
    dmRelCreateBtn: 'Save Link',
    dmRelUpdateBtn: 'Save Changes',
    dmRelErrBothTables: 'Please pick both spreadsheets.',
    dmRelErrSelfRel: 'Please pick two different spreadsheets to link.',
    dmRelErrBothCols: 'Please pick the matching column in both sheets.',
    dmRelErrDuplicate: 'These two sheets are already linked.',
    dmRelWarnDupKeys: "Column '{col}' in '{table}' has duplicate values—that can double-count totals when linking.",
    dmRelWarnOrphansPct: "{pct}% of rows in '{toTable}' have values in '{toCol}' that aren't listed in '{fromTable}'.",
    dmRelWarnOrphansCount: '{count} rows ({pct}%) do not have a match in the other sheet.',
    dmRelWarnTypeMismatch: "Different column formats: '{fromCol}' is {fromType}, while '{toCol}' is {toType}.",

    dmDateModalTitle: 'Add a Calendar Dates Sheet',
    dmDateModalDesc: 'Creates a ready-made calendar table (Year, Quarter, Month, Day) to group your charts by date',
    dmDateStartYear: 'Start Year',
    dmDateEndYear: 'End Year',
    dmDateSchemaPreview: 'Included Date Columns',
    dmDateEstimatedRows: 'About {days} daily dates',
    dmDateUniqueKeys: 'All dates unique',
    dmDateBestPractice: 'Tip: Linking your sales sheet to a Calendar sheet makes it easy to compare months, quarters, and years side by side.',
    dmDateGenerateBtn: 'Create Calendar Sheet',

    dmMeasuresModalTitle: 'Saved Quick Totals',
    dmMeasuresModalDesc: 'Save reusable calculations (like Total Sales, Average Order, or Profit Margin) to use on any chart',
    dmMeasuresExisting: 'Your Saved Totals ({count})',
    dmMeasuresNone: 'No saved totals yet. Create one below—no formulas required.',
    dmMeasuresCreateNew: 'Create a Quick Total',
    dmMeasuresNameLabel: 'Name',
    dmMeasuresNamePlaceholder: 'e.g. Total Sales or Profit Margin',
    dmMeasuresAggLabel: 'How to Calculate',
    dmMeasuresTargetTable: 'From Which Sheet',
    dmMeasuresTargetCol: 'Column to Calculate',
    dmMeasuresNumerator: 'Top Number (Numerator)',
    dmMeasuresDenominator: 'Bottom Number (Denominator)',
    dmMeasuresSelectDenom: 'Pick a saved total...',
    dmMeasuresFormatLabel: 'How It Looks',
    dmMeasuresCurrencyLabel: 'Currency Sign',
    dmMeasuresGeneratedFormula: 'Summary',
    dmMeasuresAddBtn: 'Save Quick Total',
    dmMeasuresDoneBtn: 'Done',
    dmMeasuresDeleteTip: 'Remove',
    dmAggSumDesc: 'Sum (Add all numbers together)',
    dmAggAvgDesc: 'Average (Middle value per row)',
    dmAggCountDesc: 'Count (Number of rows)',
    dmAggDistinctDesc: 'Unique Count (Count without repeats)',
    dmAggMinDesc: 'Lowest Value',
    dmAggMaxDesc: 'Highest Value',
    dmAggDivideDesc: 'Divide two totals (Great for Profit Margin %)',
    dmFmtCurrencyOpt: 'Money ($1,250.00)',
    dmFmtPercentOpt: 'Percent (34.5%)',
    dmFmtCompactOpt: 'Short Money ($1.2M / $45K)',
    dmFmtNumberOpt: 'Plain Number (1,250)',

    dmValidationDrawerTitle: 'Link Health Check',
    dmValidationDrawerDesc: 'Checks whether your linked spreadsheets line up cleanly',
    dmValidationScoreLabel: 'Link Health Score',
    dmValidationChecksPassed: '{passed} of {total} checks look good',
    dmValidationObservations: '{count} note(s)',
    dmValidationCorePassed: 'Your linked sheets look good!',
    dmValidationCorePassedDesc: 'Your spreadsheets connect cleanly so charts can combine columns accurately.',
    dmValidationPerfectTitle: 'Everything Lines Up Cleanly!',
    dmValidationPerfectDesc: 'No missing matches or duplicate link issues found.',
    dmValidationObsHeading: 'Suggestions',
    dmValidationRecommendation: 'Tip:',
    dmValidationCloseBtn: 'Close',

    dmVersionsModalTitle: 'Saved Link Versions',
    dmVersionsModalDesc: 'Save a backup point or switch back to an earlier setup anytime',
    dmVersionsSnapshotTitle: 'Save a Backup Point',
    dmVersionsNameLabel: 'Name',
    dmVersionsNotesLabel: 'Notes (optional)',
    dmVersionsSaveBtn: 'Save Backup Point',
    dmVersionsHistoryTitle: 'Saved Backups ({count})',
    dmVersionsNone: 'No backups saved yet. Save one above so you can easily go back later.',
    dmVersionsRevertBtn: 'Restore',
    dmVersionsConfirmRevert: "Switch back to '{name}'?",
    dmVersionsConfirmYes: 'Yes, Restore',
    dmVersionsFacts: '{count} Main',
    dmVersionsDims: '{count} Details',
    dmVersionsRels: '{count} Links',
    dmVersionsMeasures: '{count} Totals',

    dmSuggestModalTitle: 'Suggested Sheet Links',
    dmSuggestModalDesc: 'We checked your column names and found spreadsheets that match',
    dmSuggestConfidence: 'Match quality: {level} ({score}%)',
    dmSuggestConfidenceHigh: 'Strong',
    dmSuggestConfidenceMedium: 'Good',
    dmSuggestConfidenceLow: 'Possible',
    dmSuggestFactsTitle: 'Orders / Activity Sheets ({count})',
    dmSuggestDimsTitle: 'Details Sheets ({count})',
    dmSuggestRelsTitle: 'Suggested Links ({count})',
    dmSuggestLogicTitle: 'Why we matched these',
    dmSuggestRejectBtn: 'Skip & Link Myself',
    dmSuggestApplyBtn: 'Apply Suggested Links',
    dmSuggestMatchPct: '{pct}% Match',
    dmSuggestMeasuresCount: '{count} Totals',
    dmSuggestFkCount: '{count} Links',
    dmSuggestAttrCount: '{count} Columns',

    featTabHubLabel: 'Upload & Organize',
    featTabHubTitle: 'Upload Spreadsheets Once, Use Everywhere',
    featTabHubDesc: 'Upload your Excel or CSV files once into Data Hub and reuse them across any dashboard, forecast, or PDF report without re-uploading.',
    featTabHubH1: 'Your spreadsheets stay private inside your personal workspace',
    featTabHubH2: 'Automatic column & number detection with instant row preview',
    featTabHubH3: 'Your original uploaded file stays safe whenever you clean or forecast',
    featTabHubH4: 'Works smoothly with Excel (.xlsx/.xls), CSV, TSV, and JSON files',
    featTabHubBadge: 'Data Hub',

    featTabExploreLabel: 'Clean Data Visually',
    featTabExploreTitle: 'Fix Messy Spreadsheets Step by Step',
    featTabExploreDesc: 'Remove duplicate rows, fix spelling, trim extra spaces, and fill blank cells using plain buttons—every change is saved as a clear step you can undo anytime.',
    featTabExploreH1: 'Clear step-by-step history you can edit or undo anytime',
    featTabExploreH2: 'Automatically recognizes dates, money, numbers, and text',
    featTabExploreH3: 'Instant column health bar shows valid, empty, and error cells',
    featTabExploreH4: 'Easy math, text cleanup, date formatting, and row filtering',
    featTabExploreBadge: 'Data Lab',

    featTabModelLabel: 'Link Spreadsheets',
    featTabModelTitle: 'Combine Related Files Without Formulas',
    featTabModelDesc: 'Working with two files like Orders and Customers? Link them visually by a shared column—like VLOOKUP without typing a single formula.',
    featTabModelH1: 'Auto-suggests matching columns between your spreadsheets',
    featTabModelH2: '1-click Calendar table to compare months, quarters, and years',
    featTabModelH3: 'Simple visual cards showing how your files connect',
    featTabModelH4: 'Save reusable totals like Total Sales or Profit Margin',
    featTabModelBadge: 'Sheet Linking',

    featTabWidgetsLabel: 'Charts & Dashboards',
    featTabWidgetsTitle: 'Build Clear Dashboards by Drag & Click',
    featTabWidgetsDesc: 'Choose from 30+ chart styles, number cards, and tables. Combine KPIs, trend lines, filters, and maps into pages anyone on your team can understand.',
    featTabWidgetsH1: '30+ chart styles, KPI number cards, tables, and maps',
    featTabWidgetsH2: 'Pick any spreadsheet per chart—no complex setup needed',
    featTabWidgetsH3: 'Interactive page filters update every chart together',
    featTabWidgetsH4: 'One-click PDF export and clean presentation preview',
    featTabWidgetsBadge: 'Dashboard Builder',

    featTabSecLabel: 'Privacy & Safety',
    featTabSecTitle: 'Your Business Data Stays Private',
    featTabSecDesc: 'Every file, dashboard, forecast, and report belongs privately to your account and stays safely stored on our server.',
    featTabSecH1: 'Private account access—your files are never stored loosely in browser storage',
    featTabSecH2: 'Protected sign-in sessions verified automatically on every visit',
    featTabSecH3: 'Everything saves automatically so you never lose your work',
    featTabSecH4: 'Helpful warnings before deleting any file used in a dashboard',
    featTabSecBadge: 'Private & Safe',

    pricingPerMonth: 'per month',
    pricingPlanFreeName: 'Basic',
    pricingPlanFreeBadge: 'Free Forever',
    pricingPlanFreeDesc: 'Great for small business owners, students, and anyone getting started.',
    pricingPlanFreeCta: 'Get Started Free',
    pricingPlanFreeF1: 'Up to 5 Uploaded Spreadsheets',
    pricingPlanFreeF2: 'Unlimited Dashboards & Reports',
    pricingPlanFreeF3: 'Full Data Lab Spreadsheet Cleanup',
    pricingPlanFreeF4: 'Easy Spreadsheet Linking',
    pricingPlanFreeF5: 'All Standard Charts & Number Cards',
    pricingPlanFreeF6: 'Automatic Cloud Saving',
    pricingPlanFreeF7: 'Helpful Onboarding & Guides',

    pricingPlanProName: 'Upgrade',
    pricingPlanProBadge: 'Special Offer',
    pricingPlanProOffer: 'Save $5 · Instead of $30',
    pricingPlanProDesc: 'Get unlimited spreadsheets, full sheet linking, 3D charts, and priority support.',
    pricingPlanProCta: 'Upgrade Now',
    pricingPlanProF1: 'Unlimited Uploaded Spreadsheets',
    pricingPlanProF2: 'Full Multi-Sheet Linking & Saved Totals',
    pricingPlanProF3: '1-Click Calendar Dates Sheet',
    pricingPlanProF4: 'Custom Profit & Ratio Calculations',
    pricingPlanProF5: '3D Charts & Interactive Maps',
    pricingPlanProF6: 'High-Resolution PDF Report Exports',
    pricingPlanProF7: 'Private Cloud Sync & Backups',
    pricingPlanProF8: 'Priority Support',

    pricingPlanEntName: 'Enterprise',
    pricingPlanEntBadge: 'For Larger Teams',
    pricingPlanEntDesc: 'For organizations that need shared team workspaces, custom data connections, and dedicated support.',
    pricingPlanEntCta: 'Contact Sales',
    pricingPlanEntF1: 'Everything in Upgrade',
    pricingPlanEntF2: 'Shared Team Workspaces & Permissions',
    pricingPlanEntF3: 'Custom Database Connections',
    pricingPlanEntF4: 'Large-File & High-Speed Processing',
    pricingPlanEntF5: 'Dedicated Private Cloud Space',
    pricingPlanEntF6: 'Team Activity History & Controls',
    pricingPlanEntF7: 'Custom Chart Extensions',
    pricingPlanEntF8: 'Dedicated Support Contact',

    aboutBadge: 'Our Mission',
    aboutHeroTitle1: 'Making Business Data',
    aboutHeroTitle2: 'Clear for Everyone',
    aboutHeroDesc: 'Data Pulse was built around a simple idea: understanding your sales, cleaning messy Excel files, and sharing great reports should feel fast, friendly, and effortless.',
    aboutStat1Label: 'Rows Organized',
    aboutStat2Label: 'Instant Page Response',
    aboutStat3Label: 'Reliable Uptime',
    aboutStat4Label: 'Active Team Dashboards',
    aboutStoryEyebrow: 'Why We Built Data Pulse',
    aboutStoryTitle: 'Spreadsheets are everywhere. Clear answers shouldn’t be hard to get.',
    aboutStoryP1: 'Too often, teams feel stuck between messy spreadsheets on one side and complicated desktop tools built only for data specialists on the other.',
    aboutStoryP2: 'We built Data Pulse to bridge that gap. Open your browser, upload a file, clean messy columns visually, link related sheets without formulas, forecast what comes next, and export crisp PDF reports in minutes.',
    aboutStoryC1: 'Simple spreadsheet linking with zero coding or formulas',
    aboutStoryC2: 'Every cleanup change saved as a clear, undoable step',
    aboutPillar1Title: 'Fast Right in Your Browser',
    aboutPillar1Desc: 'Charts and page filters update smoothly without waiting around for heavy software to load.',
    aboutPillar2Title: 'Upload Once, Reuse Everywhere',
    aboutPillar2Desc: 'Keep your spreadsheets in one Data Hub and use them across any dashboard, report, or forecast.',
    aboutPillar3Title: 'Private by Default',
    aboutPillar3Desc: 'Your spreadsheets, dashboards, and forecasts belong privately to your account and stay safely protected.',
    aboutPillar4Title: 'Power Without the Learning Curve',
    aboutPillar4Desc: 'Get visual dashboards, forecasts, and PDF reports without installing desktop software or memorizing formulas.',
    aboutCtaTitle: 'Start Exploring Your Numbers Today',
    aboutCtaDesc: 'Free to start—open sample dashboards or upload your first spreadsheet in seconds.',

    galleryHeroBadge: 'Interactive Chart Gallery & Usage Guide',
    galleryHeroTitle1: 'Sample Visualizations &',
    galleryHeroTitle2: 'When to Use Each Graph',
    galleryHeroDesc: 'Explore our curated catalog of analytical charts. Every sample features an interactive rendered preview accompanied by detailed explanations on practical use cases and best practices.',
    galleryCatAll: 'All Graphs',
    galleryKpiTargetLabel: 'Target',
    galleryKpiOnTrack: 'On track',

    tourModalCloseAria: 'Close tour',
    tourFinishTour: 'Finish Tour',
    tourBack: 'Back',
    tourLiveTargetLabel: 'Highlighted on screen',
    tourGoToDataHub: 'Open Data Hub',
    tourGoToDataLab: 'Open Data Lab',
    tourGoToDashboards: 'Open Dashboards',
    tourGoToDataModel: 'Open Link Tables',
    tourGoToForecasts: 'Open Forecast Studio',
    tourGoToGallery: 'Explore Visual Gallery',
    tourWhenToUseLabel: 'Good to know',
    tourUploadFirstDataset: 'Upload First Spreadsheet',
    tourCreateFirstDashboard: 'Create First Dashboard',
    tourSignUpAction: 'Create Free Account',

    tourS1Title: 'Welcome to Data Pulse',
    tourS1Desc: 'Turn everyday Excel or CSV spreadsheets into clear charts, future predictions, and printable PDF reports—with zero coding or complex formulas.',
    tourS1Tip: 'Your original files always stay safe, and your dashboards, cleaned files, and forecasts save automatically to your account.',
    tourS1FlowHub: '1. Upload Files',
    tourS1FlowHubSub: 'Excel & CSV in Data Hub',
    tourS1FlowLab: '2. Clean Up',
    tourS1FlowLabSub: 'Optional Data Lab',
    tourS1FlowDash: '3. Dashboards & PDFs',
    tourS1FlowDashSub: 'Charts, KPIs & Reports',
    tourS1FlowModel: 'Link Sheets',
    tourS1FlowModelSub: 'Optional VLOOKUP-free join',
    tourS1FlowForecast: '4. Forecast Future',
    tourS1FlowForecastSub: 'Predict sales & demand',
    tourS1Pt1: 'Start with any Excel (.xlsx/.xls) or CSV spreadsheet you already have',
    tourS1Pt2: 'Point-and-click cleanup and linking—no Excel formulas or coding needed',
    tourS1Pt3: 'Explore live dashboards, predict next months, and export ready-to-share PDFs',

    tourS2Title: '1. Upload Your Spreadsheets (Data Hub)',
    tourS2Desc: 'Think of Data Hub as your organized folder for spreadsheets. Upload files once and use them across any dashboard, report, or forecast.',
    tourS2Tip: 'Start here whenever you bring in a new Excel or CSV file. You can preview rows immediately before saving.',
    tourS2UploadBtn: 'Upload Dataset',
    tourS2File1Meta: '12,480 rows · 9 columns',
    tourS2File2Meta: '3,120 rows · 6 columns',
    tourS2FormatsLabel: 'Works with',
    tourS2FormatsHint: 'Arabic & English columns auto-detected',
    tourS2Pt1: 'Click Upload Dataset (or drag & drop a file) to preview your columns right away',
    tourS2Pt2: 'See a quick data-health score to spot blank cells before building charts',
    tourS2Pt3: 'Launch a new Dashboard or Clean Data directly from any file card',

    tourS3Title: '2. Tidy Messy Spreadsheets (Data Lab)',
    tourS3Desc: 'Have blank rows, duplicate entries, or extra spaces? Data Lab lets you clean and fix your spreadsheet visually before charting.',
    tourS3Tip: 'Optional step—skip it if your file is already clean! You can undo or remove any cleanup step anytime.',
    tourS3FilterAction: 'Remove Blank / Extra Rows',
    tourS3DedupeAction: 'Remove Duplicates',
    tourS3ColAction: 'Rename or Fix Columns',
    tourS3ApplyBtn: 'Apply & Close',
    tourS3PipelineTitle: 'Your Cleanup Steps',
    tourS3Pt1: 'Click any cell to fix a typo, trim extra spaces, or filter out rows you do not need',
    tourS3Pt2: 'Remove duplicate rows, split combined columns, or fix date & number formats',
    tourS3Pt3: 'Click Apply & Close to save your cleaned spreadsheet safely',

    tourS4Title: '3. Connect Two Spreadsheets (Optional)',
    tourS4Desc: 'Working with one spreadsheet? Skip this! If you have two related files (like Orders and Customers), link them once using a matching column—just like VLOOKUP without formulas.',
    tourS4Tip: 'Only needed when one chart needs columns from two separate spreadsheets at the same time.',
    tourS4DimTitle: 'Customer Details Sheet',
    tourS4FactTitle: 'Orders & Sales Sheet',
    tourS4MeasureLabel: 'Quick Total',
    tourS4MeasureSample: 'Total Sales',
    tourS4ConnectedDash: 'Combined Chart: Sales by City',
    tourS4Pt1: 'Single-file dashboards work automatically—no linking required',
    tourS4Pt2: 'Match two files by a shared column (for example, Customer ID or Product Code)',
    tourS4Pt3: 'Save reusable totals (like Total Revenue or Average Order) to reuse on any page',

    tourS5Title: '4. Build Interactive Dashboards',
    tourS5Desc: 'Pick the chart or number card you want, choose which spreadsheet columns to show, and filter your whole dashboard with a click.',
    tourS5Tip: 'Not sure which chart fits best? Check the Visual Gallery tab in the top bar for plain-English examples.',
    tourS5ChartPanel: '1. Pick a Visual',
    tourS5Canvas: 'Your Dashboard Canvas',
    tourS5Config: '2. Choose Columns',
    tourS5Filters: '3. Top Page Filters',
    tourS5ChartTypes: 'Bar · Line · KPI Card · Pie',
    tourS5Rev: 'Total Sales',
    tourS5Target: 'Monthly Goal',
    tourS5Pt1: 'Add KPI number cards, bar/line/pie charts, tables, or notes from the left panel',
    tourS5Pt2: 'Pick which column to measure and customize colors or titles on the right panel',
    tourS5Pt3: 'Add date or category filters at the top so clicking one filter updates every chart',

    tourFcTitle: '5. Predict What’s Coming Next (Forecast Studio)',
    tourFcDesc: 'See where your numbers are heading next week, next month, or next quarter. Pick a spreadsheet, choose a Business Template, and get an easy-to-read prediction.',
    tourFcTip: 'Ideal for planning inventory, cash flow, or sales targets—and it never changes your original spreadsheet.',
    tourFcTemplateLabel: 'Business Template',
    tourFcPresetSales: 'Sales & Revenue Forecast',
    tourFcHorizonLabel: 'Next 30 Days',
    tourFcSummarySample: 'Expected upward trend (+12% vs. prior period) with seasonal weekend peaks.',
    tourFcPinBtn: 'Add to Dashboard',
    tourFcPt1: 'Choose ready-made Business Templates (Sales, Demand, Cash Flow) with plain-language settings',
    tourFcPt2: 'See projected values with best/worst range, plain-English takeaways, and What-If testing',
    tourFcPt3: 'Reopen past forecasts anytime, pin charts onto a dashboard, or export a clean summary',

    tourS6Title: '6. Share Polished Multi-Page PDF Reports',
    tourS6Desc: 'Need a clean document for a meeting, manager, or client? Create a Report to organize charts, headline numbers, and written notes onto neat printable A4 pages.',
    tourS6Tip: 'Choose Dashboard when exploring live filters; choose Report when preparing a presentation or PDF.',
    tourS6Page1: 'Page 1 · Summary',
    tourS6Page2: 'Page 2 · Details',
    tourS6ExportPdf: 'Export PDF',
    tourS6HeaderSample: 'Monthly Business Summary',
    tourS6Pt1: 'Split long findings into tidy pages with custom titles and page tabs',
    tourS6Pt2: 'Mix summary numbers, charts, and written takeaways on clean printable layouts',
    tourS6Pt3: 'Click Export PDF to download a ready-to-share document with page numbers',

    tourS7Title: '7. Quick Guide: Top Bar & Getting Help',
    tourS7Desc: 'Everything you need is one click away in the top bar. Switch languages anytime, browse chart examples, or reopen this guide whenever you want.',
    tourS7Tip: 'Your work saves automatically as you go. Open your Account menu -> Show Welcome Tour anytime to review these steps.',
    tourS7LangLabel: 'Language & Layout',
    tourS7LangAction: 'Switch Language',
    tourS7NavLabel: 'Quick Keyboard Controls',
    tourS7NavShortcut1: 'Jump to Visual Gallery for chart tips',
    tourS7NavShortcut2: 'Previous / Next Tour Step',
    tourS7NavShortcut3: 'Close This Guide',
    tourS7ReplayHint: 'Reopen anytime from Account Menu -> Show Welcome Tour',
    tourS7ReadyHint: 'Ready to begin? Upload a spreadsheet, try a forecast, or build your first dashboard below.',
    tourS8TabDash: 'Dashboards',
    tourS8TabDashDesc: 'Open or create interactive dashboards & PDF reports',
    tourS8TabData: 'Data Hub',
    tourS8TabDataDesc: 'Upload Excel/CSV files & clean messy columns',
    tourS8TabFc: 'Forecast Studio',
    tourS8TabFcDesc: 'Predict future sales, cash flow & demand',
    tourS8TabGallery: 'Visual Gallery',
    tourS8TabGalleryDesc: 'See examples & when to use each chart type',
    tourS8AutoSaveNote: 'Auto-save enabled · Your files & dashboards stay private to your account',

    importTitle: 'Upload a Spreadsheet',
    importSubtitle: 'Automatically detects columns, dates, and Excel sheets with an instant preview',
    importDropzoneTitle: 'Click to pick a file or drag and drop it here',
    importChangeFile: 'Pick a different file',
    importDetectedEnc: 'Detected text format:',
    importWarnFffdTitle: 'Some letters look garbled',
    importWarnFffdDesc: 'If Arabic or special letters look strange below, try choosing another text format (like Windows-1256 for Arabic).',
    importDatasetNameLabel: 'Spreadsheet Name',
    importEncodingLabel: 'Text Format (if letters look wrong)',
    importExcelSheetLabel: 'Excel Sheet Tab',
    importSeparatorLabel: 'Column Separator',
    importSepAuto: 'Auto Detect',
    importSepComma: 'Comma (,)',
    importSepSemi: 'Semicolon (;)',
    importSepTab: 'Tab (\\t)',
    importSepPipe: 'Pipe (|)',
    importParsingText: 'Reading your file and checking columns...',
    importPreviewTitle: 'Preview (First 15 rows)',
    importPreviewMeta: '{cols} columns • {rows} rows',
    importSaveErrorTitle: 'Could not save spreadsheet',
    importSubmitBtn: 'Save Spreadsheet',
    importUnitB: 'B',
    importUnitKB: 'KB',
    importUnitMB: 'MB',

    // Batch E
    labRequiresText: 'Needs a text column',
    labClickColHint: 'Click a column header to target it',
    labFindAction: 'Find an action…',
    labSearchAllActions: 'Search all actions',
    labPalettePlaceholderCol: 'What should we do to “{col}”?',
    labPalettePlaceholderAll: 'Search every action: trim, split, fill, dedupe…',
    labPaletteNoMatch: 'No action matches “{q}”.',
    labPaletteNavigate: 'navigate',
    labPaletteRun: 'run',
    labPaletteCount: '{count} actions',
    labAction_prefix_label: 'Add prefix…', labAction_prefix_hint: 'Put text in front of every value',
    labAction_suffix_label: 'Add suffix…', labAction_suffix_hint: 'Put text after every value',
    labInspectorTitle: 'Inspector',
    labInspectorHide: 'Hide inspector',
    labInspectorShow: 'Show inspector: profile and smart fixes',
    labInspectorHealthDesc: 'Share of cells that are filled in and valid at this step.',
    labInspectorNeedsAttention: 'Needs attention',
    labInspectorIssueSingular: '{count} issue',
    labInspectorIssuePlural: '{count} issues',
    labInspectorTableFixes: 'Table-wide fixes',
    labInspectorNoTableIssues: 'No duplicate or blank rows.',
    labInspectorColumnLabel: 'Column',
    labInspectorValid: 'Valid',
    labInspectorEmpty: 'Empty',
    labInspectorErrorsLabel: 'Errors',
    labInspectorDistinctLabel: 'Distinct',
    labInspectorEveryUnique: 'every value unique',
    labInspectorPctUnique: '{pct}% unique',
    labInspectorMedianSub: 'median {val}',
    labInspectorLengthLabel: 'Length',
    labInspectorCharsSub: 'characters',
    labInspectorBlankValue: '(blank)',
    labInspectorSmartFixes: 'Smart fixes for this column',
    labInspectorApplyAffected: '{apply} · {count} affected',
    labInspectorHealthBarAria: '{valid} valid, {empty} empty, {errors} errors',
    labInspectorScoreRingAria: 'Data health {value} percent',
    labFixCaseTitleLower: 'Standardise capitalisation (lowercase)',
    labFixCaseDetailCount: '{count} values are spelled with different casing (e.g. {sample})',
    labFixEmptyDetail: '{count} empty cells',
    labFixNullsZeroTitle: 'Fill empty cells with 0',
    labFixNullsUnknownTitle: 'Fill empty cells with "Unknown"',
    labFixConvertTitle: 'Convert to {type}',
    labFixConvertNumWhy: '{count} of {total} values are numbers stored as text',
    labFixConvertDateWhy: '{count} of {total} values look like dates stored as text',
    labFixConvertNumStillWhy: '{count} of {total} values are still text; the column is typed as a number but its cells are not converted yet',
    labFixConvertDateStillWhy: '{count} of {total} values are still text; the column looks like dates but its cells are not converted yet',
    labFixDupesDetailExact: '{count} rows are an exact copy of an earlier row',
    labFixBlankRowsDetail: '{count} rows are completely empty',
    labStatusRows: 'rows',
    labStatusCols: 'cols',
    labStatusError: 'error',
    labStatusErrors: 'errors',
    labStatusHealth: 'health',
    labStatusStepOf: 'step',
    labStatusMCodeBtn: 'M code',
    labRailPipelineTitle: 'Pipeline',
    labRailSaveNameAria: 'Save name',
    labRailStepCount: '{count} steps · each one is saved, reorderable and reversible',
    labRailViewingStepOf: 'Viewing step {current} of {total}. New steps are inserted here.',
    labRailOutputLabel: 'Output',
    labRailOutputHint: 'what “Apply” saves to your dataset',
    labRailSettings: 'Settings',
    labRailDeltaAddedRowsPlural: '+{n} rows',
    labRailDeltaRemovedRowsPlural: '−{n} rows',
    labRailDeltaAddedColsPlural: '+{n} cols',
    labRailDeltaRemovedColsPlural: '−{n} cols',
    labRailEmptyFilled: '{n} empty filled',
    labRailErrorsAdded: '+{n} errors',
    labRailErrorsFixed: '{n} errors fixed',
    labStepMeta_headers: 'Headers',
    labStepMeta_type: 'Type',
    labStepMeta_rename: 'Rename',
    labStepMeta_remove_columns: 'Remove columns',
    labStepMeta_duplicate: 'Duplicate',
    labStepMeta_reorder: 'Reorder',
    labStepMeta_move: 'Move',
    labStepMeta_replace: 'Replace',
    labStepMeta_fix_errors: 'Fix errors',
    labStepMeta_fill_empty: 'Fill empty',
    labStepMeta_fill_down: 'Fill down',
    labStepMeta_fill_up: 'Fill up',
    labStepMeta_filter: 'Filter',
    labStepMeta_remove_rows: 'Remove rows',
    labStepMeta_keep_rows: 'Keep rows',
    labStepMeta_sort: 'Sort',
    labStepMeta_text: 'Text',
    labStepMeta_math: 'Math',
    labStepMeta_date: 'Date',
    labStepMeta_split: 'Split',
    labStepMeta_merge: 'Merge',
    labStepMeta_dedupe: 'Dedupe',
    labStepMeta_custom_column: 'Custom column',
    labTabsQueriesAria: 'Queries',
    labTabsBlankHint: 'Start blank with columns',
    labLeaveWithoutApply: 'Leave Data Lab without applying?',
    homeLinkTitle: 'Data Pulse — Home',
    labApplyBtnTitle: 'Save the transformed table to the database and return (Ctrl+Enter)',
    labSavingProgress: 'Saving {current} of {total}...',
    labTimeoutError: 'Request timed out after 90 seconds while saving to the database. Try reducing dataset size or retrying.',
    labSaveFailedFallback: 'Failed to persist transformed dataset to PostgreSQL database.',
    labFailedCountBadge: 'Failed ({count})',
    labBlankQueryDesc: 'Start with a blank 1-column table',
    labQueryPrefix: 'Query',
    labSourceImportedFrom: 'Imported from {name}',
    labDuplicateSuffix: '(Copy)',
    colType_Text: 'Text',
    colType_WholeNumber: 'Whole Number',
    colType_DecimalNumber: 'Decimal Number',
    colType_Currency: 'Currency',
    colType_Percentage: 'Percentage',
    colType_Date: 'Date',
    colType_DateTime: 'Date/Time',
    colType_Time: 'Time',
    colType_Boolean: 'Boolean',
    filterSortAsc: 'Sort Ascending',
    filterSortDesc: 'Sort Descending',
    filterSmallToLarge: 'Sort Smallest to Largest',
    filterLargeToSmall: 'Sort Largest to Smallest',
    filterAToZ: 'Sort A to Z',
    filterZToA: 'Sort Z to A',
    filterNumberMenu: 'Number Filters',
    filterDateMenu: 'Date Filters',
    filterTextMenu: 'Text Filters',
    filterDistinctCount: '({count} distinct)',
    filterApplyBtn: 'Apply Filter',
    filterNumberTitle: 'Number Filter',
    filterDateTitle: 'Date Filter',
    filterTextTitle: 'Text Filter',
    filterBackToList: 'Back to Value List',
    filterConditionLabel: 'Condition',
    filterValueLabel: 'Value',
    filterValue2Label: 'And Value',
    filterEnterValPlaceholder: 'Enter value...',
    filterSecondBoundPlaceholder: 'Second bound...',
    filterBackBtn: 'Back',
    filterOpNotEqualsShort: 'Does Not Equal',
    filterOpGreaterEqual: 'Greater Than Or Equal To',
    filterOpLessEqual: 'Less Than Or Equal To',
    filterOpBetween: 'Between',
    filterOpBefore: 'Before',
    filterOpAfter: 'After',
    filterOpThisYear: 'This Year',
    filterOpThisMonth: 'This Month',
    filterOpNotContains: 'Does Not Contain',
    filterOpStartsWith: 'Starts With',
    filterOpEndsWith: 'Ends With',
    labGridTipBar: 'Click a cell, row #, or header · Arrow keys navigate · Right-click for options',
    labGridCopyCellTip: 'Copy selected cell value',
    labGridFilterCellTip: 'Filter rows matching this cell value',
    labGridReplaceColTip: 'Replace values in this column',
    labGridTableAria: 'Data Lab transformation table',
    labGridRowNumAria: 'Select all previewed rows',
    labGridTypeTip: 'Type: {type} (Click to change)',
    labGridChangeType: 'Change Data Type',
    labGridFilterSortColTip: 'Filter and sort column',
    labGridColOpsTip: 'Column operations',
    labGridPctValid: '{pct}% valid',
    labGridToFix: 'to fix',
    labGridQualityStripTip: '{valid} valid ({pct}%) · {empty} empty · {errors} errors',
    labGridConvError: 'Conversion Error: Value cannot be parsed cleanly into the target column type.',
    labGridCtxFilterValue: 'Filter by this value',
    labGridCtxReplaceValues: 'Replace values...',
    labGridCtxCopyCell: 'Copy cell value',
    labGridCtxCopyRow: 'Copy selected row(s)',
    labGridCtxCopySelection: 'Copy selection (TSV)',
    labGridCtxSelectCol: 'Select entire column',
    labGridCtxSelectRow: 'Select row',
    labGridCtxSplitCol: 'Split column...',
    labGridCtxReplaceErrors: 'Replace errors...',
    labGridCtxFillDown: 'Fill down',
    labGridCtxFillUp: 'Fill up',
    labGridCtxRenameCol: 'Rename column...',
    labGridCtxDuplicateCol: 'Duplicate column',
    labGridCtxMoveLeft: 'Move column left',
    labGridCtxMoveRight: 'Move column right',
    labGridCtxRemoveCol: 'Remove column',
    labGridFilteredChip: 'Filtered',
    labGridSortedChip: 'Sorted',
    labGridNullBadge: 'null',
    labGridShowingRows: 'Showing {shown} of {total} rows',
    labGridShowAllBtn: 'Show all ({total})',
    labGridShowMoreBtn: 'Show 100 more',
    labGridSummaryColLabel: 'Col:',
    labGridSummaryRowLabel: 'Row',
    labGridSummaryCellsLabel: 'Cells',
    labGridSelRowSummary: 'Row {row} · {cells} cells',
    labGridSelRowsSelected: '{count} rows selected',
    labGridSelCellSummary: 'Cell {col}[{row}] = {value}',
    labGridSelRangeSummary: '{cells} cells selected ({rows}×{cols})',
    labGridSelColSummary: 'Column {col} · {rows} rows',
    labGridSelColsSelected: '{count} columns selected',
    labActingRow: 'Row {row}',
    labActingRows: '{count} rows',
    labActingCells: '{count} cells',
    labGridCtxFilterThisValue: 'Filter to this value',
    labGridCtxReplaceThisValue: 'Replace this value...',
    labGridCtxRemoveRow: 'Remove row',
    labGridCtxRemoveRows: 'Remove {count} rows',
    labGridCtxKeepSelectedRows: 'Keep only selected rows',
    labStepRemovedRowN: 'Removed row {row}',
    labStepRemovedNRows: 'Removed {count} selected rows',
    labStepKeptRowN: 'Kept only row {row}',
    labStepKeptNRows: 'Kept only {count} selected rows',
    labCustomColNameLabel: 'New column name',
    labCustomColNamePlaceholder: 'e.g. Total Amount or Full Name',
    labCustomColExprLabel: 'Visual Calculation',
    labCustomColExprPlaceholder: 'Select columns & operation',
    labCustomColInsertColLabel: 'Source column',
    labCustomColFormulaHint: 'Pick columns and operations visually — no formula syntax required.',
    labCustomColModeLabel: 'Calculation type',
    labCustomColModeMath: 'Math calculation',
    labCustomColModeConcat: 'Combine text columns',
    labCustomColFirstLabel: 'First column',
    labCustomColSecondModeCol: 'Another column',
    labCustomColSecondModeNum: 'Fixed number',
    labCustomColSecondLabel: 'Second column',
    labCustomColConstLabel: 'Number value',
    labReplaceNullsPlaceholder: 'Enter replacement value...',
    labSelectCellFirst: 'Select a cell first',
    labRequiresColumnScope: 'Switch scope to Entire column for table-wide actions',
    labScopeCellOnly: 'This cell only',
    labScopeColumn: 'Entire column',
    labScopeCellTag: 'Cell only',
    labAction_editcell_label: 'Edit cell value',
    labAction_editcell_hint: 'Update only the selected cell',
    labAction_clearcell_label: 'Clear cell (null)',
    labAction_clearcell_hint: 'Set only the selected cell to null',
    labStepMeta_edit_cell: 'Edit cell',
    labStepEditedCell: 'Edited cell {col}[R{row}]',
    labStepClearedCell: 'Cleared cell {col}[R{row}]',
    labRowOnlyTag: 'Row {row} only',
    labEditCellBtn: 'Edit cell',
    labClearCellBtn: 'Clear cell',
    labGridEditCellTip: 'Edit this cell only (or double-click cell)',
    labGridClearCellTip: 'Set only this cell to null',
    labGridCtxCellOnlyHeading: 'This cell only (R{row})',
    labGridCtxEditCell: 'Edit cell value',
    labGridCtxClearCell: 'Clear cell (null)',
    labGridCtxReplaceThisCellOnly: 'Replace this cell only...',
    labGridCtxTrimCell: 'Trim spaces (cell only)',
    labGridCtxUpperCell: 'UPPERCASE (cell only)',
    labGridCtxLowerCell: 'lowercase (cell only)',
    labGridCtxReplaceColValues: 'Replace in entire column...',
    labModalCellOnlyToggle: 'Apply to this cell only (Row {row}) — leave other rows unchanged',

    // Batch F
    appCannotSaveDatasetErr: 'Unable to save cleaned dataset to the database.',
    appNewDashboardTitle: 'New Dashboard {n}',
    appPageN: 'Page {n}',
    appNewWidgetTitle: 'New {type}',
    appUntitledDashboardDesc: 'Interactive visual dashboard',
    appUntitledReportTitle: 'Untitled Report',
    appUntitledReportDesc: 'Printable paginated report',
    appWidgetCopySuffix: '(Copy)',
    appOpeningDataLab: 'Opening Data Lab…',
    appAnalyticsSuffix: '{name} Analytics',
    appAnalyticsForDesc: 'Visual insights for {name}',
    appExitPreviewEsc: 'Press Esc or click to exit preview',
    hubLoadErrorFallback: 'Failed to load workspaces from database.',
    hubSaveErrorFallback: 'Failed to save workspace changes.',
    hubDeleteErrorFallback: 'Failed to delete workspace.',
    hubUserFallback: 'User',
    hubPresetFhd: 'Full HD (16:9)',
    hubPresetLaptop: 'Laptop (1440×900)',
    hubPresetA4Portrait: 'A4 Portrait',
    hubPresetA4Landscape: 'A4 Landscape',
    hubPresetUsLetter: 'US Letter',
    dataHubColMixSummary: '{text} text, {number} number, {date} date',
    dataHubColMixAria: 'Column mix: {text} text, {number} number, {date} date',
    dataHubRowsBadge: '{count} rows',
    dataHubColsBadge: '{count} cols',
    dataHubHealthLabel: '{score}% clean',
    dataHubUpdatedLabel: 'Updated',
    dataHubCancelBtn: 'Cancel',
    dataHubConfirmDeleteBtn: 'Delete permanently',
    filterAddBtn: 'Add filter',
    filterChooseColumn: 'Choose column',
    filterSearchColumns: 'Search columns...',
    filterSearchValues: 'Search values...',
    filterNoColumns: 'No datasets loaded yet.',
    filterNoValues: 'No matching values.',
    filterFromLabel: 'From',
    filterToLabel: 'To',
    filterApply: 'Apply',
    filterCancel: 'Cancel',
    filterValuesLimitHint: 'Showing first 200 distinct values',
    filterSelectVisible: 'Select all',
    filterClearValues: 'Clear',
    filterLegacyDroppedNotice: '{count} filters from the old version could not be converted and were removed.',
    filterRemoveChipAria: 'Remove {column} filter',
    filterEditChipAria: 'Edit {column} filter',
    filterRowsOf: '{filtered} of {total} rows',
    menuEditReportTitleAria: 'Edit report title',
    menuRenameReportTip: 'Click to rename report',
    menuDoubleClickRenamePage: 'Double-click to rename page',
    menuRenamePageTip: 'Rename active page',
    menuDeletePageTip: 'Delete active page',
    menuAddReportPage: 'Add new report page',
    menuPrevPage: 'Previous page',
    menuNextPage: 'Next page',
    toolbarCanvasLabel: 'Canvas:',
    toolbarAdjustCanvasTip: 'Click to adjust canvas size, ratio & presets',
    toolbarCanvasSizeSettings: 'Canvas Size Settings',
    toolbarManualDimPx: 'Manual Dimensions (px)',
    toolbarRatioLocked: 'Aspect ratio locked',
    toolbarUnlockRatio: 'Unlock aspect ratio',
    toolbarWidthLabel: 'Width (px)',
    toolbarHeightLabel: 'Height (px)',
    toolbarQuickRatios: 'Quick Screen Ratios',
    toolbarPaperSizePreset: 'Paper / Print Size',
    toolbarScreenSizePreset: 'Screen / Display Size',
    toolbarZoomScale: 'Zoom & Fit',
    toolbarGridSnapping: 'Grid Snapping',
    toolbarOn: 'ON',
    toolbarOff: 'OFF',
    toolbarGotIt: 'Got it',
    toolbarAboutTitle: 'About Data Pulse',
    toolbarAboutSubtitle: 'Simple Visual Dashboards & Forecasts',
    toolbarAboutVersionDesc: 'All-in-one spreadsheet analytics with automatic cloud saving, Data Lab cleanup, simple sheet linking, and printable PDF reports.',
    toolbarShortcutSaveDesc: 'Save dashboard now',
    toolbarShortcutExportDesc: 'Export report as PDF',
    toolbarShortcutExitDesc: 'Close open popover / exit preview',
    toolbarShortcutRenameDesc: 'Rename active canvas page',
    toolbarDoubleClick: 'Double-click tab',
    leftHomeTitle: 'Data Pulse — Home',
    leftAddWidgetTip: 'Add widget to canvas',
    leftDefaultDatasetName: 'Dataset',
    leftCatCharts: 'Charts',
    leftCatAnalytics: 'Analytics',
    leftCat3d: '3D Graphs',
    configModelDriven: 'Linked Sheets Active',
    configNoModelYet: 'Single spreadsheet',
    configTextPlaceholder: 'Enter heading, KPI narrative, or notes...',
    configBold: 'Bold',
    configItalic: 'Italic',
    configAlignTip: 'Text alignment',
    configTransparentBg: 'Transparent background',
    configSelectFieldOpt: 'Select field...',
    configNoneOpt: '(None)',
    configFieldRowReq: 'Row Dimension (Required)',
    configFieldParentCatReq: 'Parent Category (Required)',
    configFieldStageReq: 'Stage / Category (Required)',
    configFieldCatLabelsReq: 'Category Labels (Required)',
    configFieldXReq: 'X-Axis / Dimension (Required)',
    configFieldActualReq: 'Actual Value Field (Required)',
    configFieldPrevOpt: 'Comparison / Previous Field',
    configFieldCatXReq: 'Category / X Field (Required)',
    configFieldColReq: 'Column Pivot Field (Required)',
    configFieldChildCatReq: 'Sub-Category (Optional)',
    configFieldValReq: 'Value / Metric (Required)',
    configFieldYReq: 'Y-Axis / Metric (Required)',
    configFieldTargetReq: 'Target Benchmark (Required)',
    configFieldCurrReq: 'Current Value (Required)',
    configFieldNumColReq: 'Numeric Column (Required)',
    configFieldNumFieldReq: 'Numeric Field (Required)',
    configFieldZReq: 'Z-Axis Dimension (Required)',
    configFieldValMetricOpt: 'Value Metric (Optional)',
    configFieldSizeByOpt: 'Bubble Size Field (Optional)',
    configFieldTargetOpt: 'Target Value Field (Optional)',
    configFieldGroupByOpt: 'Series / Group By (Optional)',
    configFieldColorByOpt: 'Color / Category Field (Optional)',
    configAggMethod: 'Aggregation Method',
    configPrefix: 'Prefix',
    configSuffix: 'Suffix',
    configMaxTargetVal: 'Max Target Value',
    configSortDir: 'Sort Order',
    configSortDefault: 'Dataset Order',
    configSortAsc: 'Ascending (Low → High)',
    configSortDesc: 'Descending (High → Low)',
    configBinsLabel: 'Histogram Bins',
    configDensityMode: 'Density Normalization',
    configCumulative: 'Cumulative Distribution',
    configSpecificViewOpts: 'Chart Display Options',
    configHorizontalBars: 'Horizontal Bar Orientation',
    configSmoothLines: 'Smooth Curved Lines',
    configShowMarkers: 'Show Data Point Markers',
    configDonutStyle: 'Donut Cutout Center',
    configShowPctLabels: 'Show Percentage Labels',
    configShowTrendline: 'Overlay Trendline',
    configNumFormatting: 'Number Format',
    configNumRaw: 'Raw Number',
    configNumCurrency: 'Currency',
    configNumPct: 'Percentage (%)',
    configNumCompact: 'Compact (1.2K / 3.4M)',
    configWidgetHeaderLabel: 'Widget Title',
    configBgColorLabel: 'Card Background',
    configBgColorTip: 'Background color',
    configTransparentLabel: 'Transparent card',
    configTypographySection: 'Typography & Layout',
    configFontSizeLabel: 'Font Size',
    configWeightStyle: 'Style',
    configAlignmentLabel: 'Alignment',
    configTitleColorLabel: 'Title Color',
    configTitleColorTip: 'Title color',
    configPaletteLabel: 'Chart Color Palette',
    configDisplayOpts: 'Visibility & Axes',
    configAggSampleOutput: 'Sample preview (first 4 rows)',
    configCategoryXCol: 'Category / X',
    configMetricYCol: 'Metric / Y',
    configFontInter: 'Inter (Modern Sans)',
    configFontSegoe: 'Segoe UI (System)',
    configFontGeorgia: 'Georgia (Editorial Serif)',
    configFontMono: 'JetBrains Mono',
    configBgPureWhite: 'Pure White',
    configBgSoftSlate: 'Soft Slate',
    configBgSkyMist: 'Sky Mist',
    configBgMintTint: 'Mint Tint',
    configBgAmberGlow: 'Amber Glow',
    configBgRoseBlush: 'Rose Blush',
    configBgDeepObsidian: 'Deep Obsidian',
    canvasPrintMargin: 'Print Margin',
    canvasNoDatasetsTitle: 'Connect your first dataset',
    canvasNoDatasetsDesc: 'Upload CSV, Excel, TSV, or JSON files from Data Hub or pick an existing dataset to start building visualizations.',
    canvasNoDatasetsHint: 'Click "Select Data" in the top toolbar to attach a dataset.',
    canvasNoWidgetsTitle: 'Blank canvas ready',
    canvasNoWidgetsDesc: 'Drag or click any chart from the Visualizations library on the side panel to place your first widget.',
    canvasNoWidgetsHint: 'Click any item in the left panel to add it to this page.',
    canvasResizeWidthTip: 'Drag to resize canvas width',
    canvasResizeHeightTip: 'Drag to resize canvas height',
    canvasResizeCornerTip: 'Drag to resize canvas dimensions',
    canvasSizeBadgeLabel: '{width} × {height} px',
    canvasAdjustSizeTitle: 'Adjust Canvas Size',
    canvasAdjustSizeBtn: 'Resize Canvas',
    canvasManualSizeTitle: 'Custom Canvas Dimensions',
    canvasWidthPx: 'Width (px)',
    canvasHeightPx: 'Height (px)',
    canvasLockRatio: 'Lock Aspect Ratio',
    canvasLocked: 'Locked',
    canvasUnlocked: 'Unlocked',
    canvasPopularPresets: 'Popular Sizes',
    canvasApplySize: 'Apply Dimensions',
    canvasPresetFhd: '16:9 HD (1280×720)',
    canvasPresetLaptop: 'Laptop (1440×900)',
    canvasPresetQhd: 'QHD (1920×1080)',
    canvasPresetSquare: 'Square (1000×1000)',
    widgetCloseConfigTip: 'Close config panel',
    widgetOpenConfigTip: 'Configure widget data & style',
    widgetMoveHandleTip: 'Drag widget to reposition',
    widgetResizeTip: 'Drag corner to resize widget',
    chartModelNotice: 'Linked Sheets',
    chartNoDataMapped: 'Pick columns to show this chart',
    chartNoDataMappedDesc: 'Choose a category/date column and a number column on the right panel.',
    chartValuePrefix: 'Value:',
    chartBoxWhiskerTitle: 'Range Summary',
    chartBoxMin: 'Low',
    chartBoxMedian: 'Middle',
    chartBoxMax: 'High',
    analyticsSemanticNotice: 'Linked Sheets Active',
    analyticsKpiDefault: 'Key Metric',
    analyticsMetricDefault: 'Metric Summary',
    analyticsTargetLabel: 'Target',
    analyticsSparklineDefault: 'Trend Sparkline',
    analyticsProgressDefault: 'Milestone Progress',
    analyticsCurrentLabel: 'Current',
    analyticsTargetGoalLabel: 'Goal',
    analyticsViewSuffix: 'View',
    analyticsLiveFeed: 'Live Data',
    analyticsCardDefault: 'Analytics Widget',
    plotly3dNoData: '3D Coordinates Required',
    plotly3dNoDataDesc: 'Bind X, Y, and Z numeric fields in the panel to render this WebGL 3D plot.',
    plotly3dXAxis: 'X Axis',
    plotly3dYAxis: 'Y Axis',
    plotly3dZAxis: 'Z Axis',
    textBoxDefaultPrompt: 'Click to edit annotation text...',
    textBoxEditTip: 'Edit text in right panel',
    forecastStudio: 'Forecast Studio',
    forecasts: 'Forecasts',
    insertForecastChart: 'Forecast Chart',
    widget_forecast_name: 'Forecast Chart',
    widget_forecast_desc: 'Embed a live Forecast Studio projection with confidence bands and What-If scenarios.',
    fcAddedToDashboardToast: 'Forecast widget added to dashboard.',
    fcAddToDashboardBtn: 'Add to Dashboard / Report',
    fcAddToDashboardDesc: 'Embed this saved forecast and its confidence bands directly into a dashboard or report.',
    fcAddToDashboardTitle: 'Add Forecast to Dashboard or Report',
    fcAddWidgetConfirmBtn: 'Add Forecast Widget',
    fcAddWidgetErr: 'Could not add forecast widget to dashboard.',
    fcAggAvg: 'Average',
    fcAggCount: 'Count',
    fcAggMax: 'Maximum',
    fcAggMin: 'Minimum',
    fcAggSum: 'Total (Sum)',
    fcAggregationLabel: 'How to Total Values',
    fcAllCategoriesAggregated: 'All categories combined',
    fcAllRecords: 'All rows',
    fcApplySuggestedFreq: 'Use {freq}',
    fcAssumptionCost: 'Cost Change',
    fcAssumptionDemand: 'Demand Change',
    fcAssumptionElasticity: 'Price Elasticity',
    fcAssumptionExpense: 'Expense Change',
    fcAssumptionGrowth: 'Extra Growth Rate',
    fcAssumptionPrice: 'Price Change',
    fcAssumptionSales: 'Sales Change',
    fcAssumptionVolume: 'Volume / Activity Change',
    fcAxisDateLabel: 'Date / Period',
    fcAxisValueLabel: 'Value',
    fcBaselineModeLabel: 'Base Forecast',
    fcBaselineTotal: 'Expected Total',
    fcBusinessTemplatesLabel: 'Ready-Made Business Templates',
    fcCancelBtn: 'Cancel',
    fcCancelledNotice: 'Forecast stopped.',
    fcChartForecastStart: 'Forecast starts',
    fcChartPeriodForecast: 'Future Forecast',
    fcChartPeriodHistorical: 'Past Numbers',
    fcClearOverlay: 'Hide What-If line',
    fcColBaseline: 'Beats Simple Guess',
    fcColModel: 'Method',
    fcColStatus: 'Status',
    fcConfidenceLabel: 'Range Width',
    fcConfigStaleBanner: 'Your forecast settings changed since this run. Click Re-run to update the chart and numbers.',
    fcCreateNewDashboardOption: 'Create a new dashboard with this forecast',
    fcCreateScenarioBtn: 'Save What-If Check',
    fcDataQualityTitle: 'Date & Number Health Check',
    fcDatasetLabel: 'Spreadsheet',
    fcDatasetStaleBanner: 'Your spreadsheet changed since this forecast ran. Click Re-run to update it with the newest rows.',
    fcDatasetStaleWidget: 'Data changed · Refresh',
    fcDateColLabel: 'Date Column',
    fcDeleteErr: 'Could not delete forecast.',
    fcDeleteForecastAria: 'Delete forecast',
    fcDeleteScenarioAria: 'Delete scenario',
    fcDetectBtn: 'Auto-detect time spacing',
    fcDetectErr: 'Could not detect date spacing.',
    fcDetectingBtn: 'Checking...',
    fcDomainFinance: 'Finance',
    fcDomainGeneral: 'General',
    fcDomainInventory: 'Inventory',
    fcDomainMarketing: 'Marketing',
    fcDomainSales: 'Sales',
    fcDqDuplicates: 'Repeated dates',
    fcDqMissing: 'Gaps / missing dates',
    fcDqObserved: 'Dates with data',
    fcDqOutliers: 'Unusual spikes or dips',
    fcFailedBannerTitle: 'Latest forecast run failed (showing previous result)',
    fcFreqAuto: 'Detect Automatically',
    fcFreqDaily: 'Daily',
    fcFreqMonthly: 'Monthly',
    fcFreqOverrideHint: 'Pick Daily, Weekly, or Monthly below—or use our suggested spacing.',
    fcFreqQuarterly: 'Quarterly',
    fcFrequencyLabel: 'Time Spacing',
    fcFreqWeekly: 'Weekly',
    fcFreqYearly: 'Yearly',
    fcGenerateBtn: 'Generate Forecast',
    fcGroupColLabel: 'Break Down By (Optional)',
    fcGroupSuggestHint: 'Optional category',
    fcGroupValLabel: 'Pick Category',
    fcHelpMae: 'Average gap between past guesses and real numbers (smaller is better).',
    fcHelpMape: 'Average percentage off (smaller is better; hidden if actual numbers include 0).',
    fcHelpMase: 'Compares accuracy against simply repeating the last period (under 1.0 means it did better).',
    fcHelpRmse: 'Shows typical error while counting big misses more heavily (smaller is better).',
    fcHorizonCustomLabel: 'Custom periods',
    fcHorizonLabel: 'Next N Periods',
    fcHorizonPeriodsHint: 'Enter 1–{max} periods',
    fcIntervalNoteCv: 'Prediction bands are calibrated using Student-t critical values and rolling historical forecast error.',
    fcIntervalNoteEmpirical: 'Prediction bands come directly from empirical rolling-origin backtest error quantiles ({pct}% interval).',
    fcIntervalNoteFallback: 'Intervals are approximate (short history): fewer than 20 historical backtest errors were available, so analytical Student-t bounds are shown.',
    fcLegendConfidenceBand: '{pct}% Likely Range',
    fcLegendForecast: 'Forecast',
    fcLegendHistorical: 'Past Numbers',
    fcLegendLowerBound: 'Low End ({pct}%)',
    fcLimitsCaption: 'Up to {obs} past periods · up to {days} days ahead',
    fcLoadListErr: 'Could not load saved forecasts.',
    fcLoadOneErr: 'Could not open forecast details.',
    fcMetricsExplainToggle: 'What do these numbers mean?',
    fcMissingFieldsErr: 'Please pick a spreadsheet, a date column, and a number column to forecast.',
    fcModeBusiness: 'Business Templates',
    fcModeGeneral: 'Custom Forecast',
    fcModeLabel: 'Forecast Type',
    fcModelArima: 'Trend & Pattern (ARIMA)',
    fcModelArimaDesc: 'Tracks steady ups, downs, and recent momentum over time.',
    fcModelAuto: 'Automatic (Pick Best Fit)',
    fcModelAutoDesc: 'Tests several methods on your past data and automatically picks the most accurate one.',
    fcModelEts: 'Smooth Trend (ETS)',
    fcModelEtsDesc: 'Focuses more on recent trends while smoothing out random bumps.',
    fcModelEvalDesc: 'Tested across {windows} past check(s) · {train} training / {val} check periods',
    fcModelEvalTitle: 'How Different Methods Scored on Past Data',
    fcModelHoltWinters: 'Seasonal Pattern (Holt-Winters)',
    fcModelHoltWintersDesc: 'Great when numbers rise and fall on a repeating weekly or monthly cycle.',
    fcModelLabel: 'Forecast Method',
    fcModelLinearReg: 'Straight Trend + Calendar',
    fcModelLinearRegDesc: 'Follows overall growth plus regular calendar ups and downs.',
    fcModelMovingAvg: 'Moving Average',
    fcModelMovingAvgDesc: 'Averages recent periods for a calm, steady estimate.',
    fcModelNaive: 'Repeat Last Value',
    fcModelNaiveDesc: 'Uses the most recent value as the baseline.',
    fcModelSarima: 'Seasonal Cycle (SARIMA)',
    fcModelSarimaDesc: 'Tracks both overall trend and repeating seasonal swings.',
    fcModelSeasonalNaive: 'Repeat Last Season',
    fcModelSeasonalNaiveDesc: 'Repeats values from the same point in the previous cycle.',
    fcModelTsb: 'Intermittent Demand (TSB)',
    fcModelTsbDesc: 'Tracks how often demand occurs and typical size when it does—built for series with many zeros.',
    fcNameLabel: 'Forecast Name',
    fcNamePlaceholder: 'e.g. Next Quarter Sales Estimate',
    fcNetImpact: 'Difference',
    fcNewForecastBtn: 'New Forecast',
    fcNo: 'No',
    fcNoChartData: 'No forecast chart yet.',
    fcNoDatasetsDesc: 'Upload an Excel or CSV file with a date column and a number column in Data Hub first.',
    fcNoDatasetsTitle: 'Upload a Spreadsheet to Start Forecasting',
    fcOpenFromDataHub: 'Forecast This File',
    fcPeriodUnitAuto: 'periods',
    fcPeriodUnitDaily: 'days',
    fcPeriodUnitMonthly: 'months',
    fcPeriodUnitQuarterly: 'quarters',
    fcPeriodUnitWeekly: 'weeks',
    fcPeriodUnitYearly: 'years',
    fcPresetInventoryTrends: 'Inventory Levels',
    fcPresetMarketingConversions: 'Purchases & Signups',
    fcPresetMarketingConversionsDesc: 'See how many purchases, bookings, or signups to expect.',
    fcPresetMarketingLeads: 'New Leads',
    fcPresetMarketingLeadsDesc: 'Estimate incoming customer inquiries and leads.',
    fcPresetSalesRevenue: 'Sales Revenue',
    fcPresetSalesVolume: 'Units Sold',
    fcPresetSalesVolumeDesc: 'Estimate future units sold or order counts, optionally by product or region.',
    fcPresetStockConsumption: 'Stock Used',
    fcPresetStockConsumptionDesc: 'Estimate how fast inventory leaves your shelves.',
    fcQuickCreateFromData: 'Create Forecast',
    fcReadyStateDesc: 'Pick your date column, number column, and how far ahead to look on the left—then click Generate Forecast.',
    fcReadyStateTitle: 'Set Up Your Forecast',
    fcRefreshForecastBtn: 'Update Forecast',
    fcRerunBtn: 'Re-run Forecast',
    fcRetryBtn: 'Try Again',
    fcRunErrFallback: 'Could not create forecast.',
    fcRunningBtn: 'Calculating Forecast...',
    fcRunSuccessNotice: 'Forecast is ready and saved!',
    fcSavedForecastsLabel: 'Saved Forecasts',
    fcSavedScenariosHeading: 'Saved What-If Checks',
    fcSaveErrFallback: 'Could not save forecast.',
    fcSaveForecastBtn: 'Save Forecast',
    fcSaveSuccessNotice: 'Forecast saved.',
    fcSavingScenario: 'Calculating...',
    fcScenarioCreateErr: 'Could not calculate What-If check.',
    fcScenarioDefaultName: 'What-If Plan',
    fcScenarioDisclaimer: 'What-If numbers simply add or subtract your chosen percentage from the main forecast so you can test best-case or cautious plans.',
    fcScenarioNameLabel: 'Plan Name',
    fcScenarioNamePlaceholder: 'e.g. +10% Holiday Sale',
    fcScenarioPrefix: 'What-If',
    fcScenarioStaleBadge: 'Older Baseline',
    fcScenarioStaleNotice: 'This What-If plan was calculated against an earlier forecast run and its dates or values may differ from the current baseline.',
    fcScenarioTotal: 'What-If Total',
    fcSelectedBadge: 'Selected',
    fcStepsWord: 'periods',
    fcStudioHeroDesc: 'See where your sales, cash flow, or demand may head next using your uploaded spreadsheets—plus test simple What-If ideas.',
    fcStudioHeroTitle: 'Forecast Your Business Numbers',
    fcSumAverageForecast: 'Average / Period',
    fcSumEndForecast: 'End of Forecast',
    fcSumHorizonCard: 'Looking Ahead',
    fcSumLastActual: 'Latest Actual',
    fcSumSelectedModel: 'Method Used',
    fcSumTotalHorizon: 'Expected Total',
    fcSumValidationError: 'Past Accuracy Check',
    fcTargetColLabel: 'Number Column to Predict',
    fcTargetDashboardLabel: 'Pick Dashboard or Report',
    fcTplDemandDesc: 'Estimate upcoming customer orders and seasonal demand.',
    fcTplDemandTitle: 'Product Demand',
    fcTplExpensesDesc: 'Estimate upcoming costs and monthly expenses.',
    fcTplExpensesTitle: 'Expenses',
    fcTplGeneralBizDesc: 'Forecast any business number column in your spreadsheet.',
    fcTplGeneralBizTitle: 'General Business Number',
    fcTplInventoryDesc: 'Watch average stock levels and inventory movement over time.',
    fcTplInventoryLimitation: 'This chart estimates future demand from past numbers only—it cannot predict exact out-of-stock dates unless you also include incoming replenishment shipments and supplier lead time rules.',
    fcTplInventoryTitle: 'Inventory',
    fcTplProfitDesc: 'Estimate future profit over upcoming weeks or months.',
    fcTplProfitTitle: 'Profit',
    fcTplRevenueDesc: 'Estimate future revenue with likely high and low bounds.',
    fcTplRevenueTitle: 'Revenue',
    fcTplSalesDesc: 'Estimate future sales and order totals, with an option to split by product or region.',
    fcTplSalesTitle: 'Sales',
    fcTplTrafficDesc: 'Estimate upcoming website visitors, clicks, or sessions.',
    fcTplTrafficTitle: 'Website Traffic',
    fcUncertaintyBeatsBaseline: 'This forecast beat a simple guess when tested on your past numbers.',
    fcUncertaintyConfidenceExplain: 'The {pct}% likely range shows normal ups and downs from your past data—unexpected events or big price changes can still fall outside it.',
    fcUncertaintyLimitedBaseline: 'Because past numbers varied a lot, treat far-out dates as rough estimates.',
    fcUncertaintyTitle: 'What to Keep in Mind',
    fcUncertaintyTrainingSpan: 'Based on data from {start} to {end} ({observed} periods with data)',
    fcWhatIfDesc: 'See what happens if sales, prices, demand, or costs go up or down—without changing your main forecast.',
    fcWhatIfTitle: 'Test What-If Ideas',
    fcWidgetConfigHint: 'Connect this card to any saved forecast from Forecast Studio (and any What-If plan).',
    fcWidgetCreateInStudio: 'Create Forecast',
    fcWidgetNoResult: 'This forecast hasn’t run yet.',
    fcWidgetOpenStudioTip: 'Open in Forecast Studio',
    fcWidgetRefreshTip: 'Update forecast',
    fcWidgetSelectOpt: '-- Pick a saved forecast --',
    fcWidgetSelectPromptDesc: 'Open card settings to pick a saved forecast, or create a new one in Forecast Studio.',
    fcWidgetSelectPromptTitle: 'Pick or Create a Forecast',
    fcWinAll: 'All History',
    fcWinLast30: 'Last 30',
    fcWinLast90: 'Last 90',
    fcYes: 'Yes',
    hubWelcomeBack: 'Welcome back, {name}',
    hubQuickActionsTitle: 'Quick Actions',
    hubQaUploadTitle: 'Upload Spreadsheet',
    hubQaUploadDesc: 'CSV or Excel file',
    hubQaDashboardTitle: 'New Dashboard',
    hubQaDashboardDesc: 'Charts & live KPIs',
    hubQaReportTitle: 'New Report',
    hubQaReportDesc: 'Print & export PDF',
    hubQaForecastTitle: 'Run Forecast',
    hubQaForecastDesc: 'Estimate future trends',
    hubGettingStartedTitle: 'Three simple steps to get started',
    hubGettingStartedStep1: 'Upload an Excel or CSV file in Data Hub',
    hubGettingStartedStep2: 'Clean or organize columns visually if needed',
    hubGettingStartedStep3: 'Create a dashboard, printable report, or forecast',
    hubDatasetsSummary: '{count} datasets ready in your workspace',
    hubRecentTitle: 'Your Workspace',
    hubKindDashboard: 'Dashboard',
    hubKindReport: 'Report',
    dhQuickDropHint: 'Drop a CSV or Excel file here, or choose Upload File above',
    dhActionBuildDash: 'Build Dashboard',
    dhActionForecast: 'Forecast',
    cfgSectionEssential: 'Essential Fields',
    cfgSectionAdvancedData: 'More data & number formatting',
    cfgPlainHintDataset: 'Choose which uploaded spreadsheet this chart reads from.',
    cfgPlainHintCategory: 'Column used for groups or labels along the horizontal axis.',
    cfgPlainHintValue: 'Numeric column you want to measure or sum.',
    cfgPlainHintAggregation: 'How rows in the same group are combined (e.g. Sum or Average).',
    fcAdvancedOptionsToggle: 'More options (grouping & confidence)',
    fcPlainHintTarget: 'The business number you want to estimate (e.g. Sales or Revenue).',
    fcPlainHintDate: 'The column that shows when each record happened.',
    fcPlainHintHorizon: 'How many upcoming days, weeks, or months to project.',
    fcReliabilityTitle: 'Forecast Reliability',
    fcReliabilityHigh: 'High Reliability',
    fcReliabilityMedium: 'Medium Reliability',
    fcReliabilityLow: 'Low Reliability',
    fcReliabilityScore: 'Score: {score}/100',
    fcTypicalErrorPct: 'Typical error about {pct}% over the last {n} periods',
    fcTypicalErrorUnits: 'Typical error about {mae} units over the last {n} periods',
    fcWhyThisModel: 'Why this model',
    fcTechnicalDetailsTitle: 'Technical details',
    fcDownloadCsvBtn: 'Download CSV',
    fcDownloadExcelBtn: 'Download Excel',
    fcExportFailedErr: 'Could not export forecast file.',
    fcForecastAllGroupsBtn: 'Forecast all groups',
    fcBatchProgress: 'Forecasting groups: {done} / {total} ({group})',
    fcBatchTitle: 'Group Forecast Summary',
    fcBatchDesc: 'Top {count} groups by volume. Click any completed row to open its full forecast.',
    fcBatchColGroup: 'Group',
    fcBatchColLastActual: 'Last Actual',
    fcBatchColForecastTotal: 'Forecast Total',
    fcBatchColChange: 'Change %',
    fcBatchColReliability: 'Reliability',
    fcBatchSkippedLabel: 'Skipped',
    fcBatchFailedLabel: 'Failed',
    fcBatchCloseBtn: 'Close summary',
    fcCalendarEffectsLabel: 'Calendar & Holiday Effects',
    fcCalendarEffectsToggle: 'Include Ramadan, Eid & public holidays',
    fcCalendarCountryLabel: 'Holiday Calendar Country',
    fcCalendarCountryEG: 'Egypt (EG)',
    fcCalendarCountrySA: 'Saudi Arabia (SA)',
    fcCalendarCountryAE: 'United Arab Emirates (AE)',
    fcCalendarCountryUS: 'United States (US)',
    fcCalendarCountryGB: 'United Kingdom (GB)',
    fcCalendarEffectsTitle: 'Estimated Calendar & Holiday Effects',
    fcCalendarEffectPeriods: '{n} periods',
    fcActualAccuracyTitle: 'Last forecast accuracy',
    fcActualAccuracyPct: 'Realized error: {pct}% across {n} new period(s)',
    fcActualAccuracyMae: 'Realized error: {mae} units across {n} new period(s)',
    fcActualWithin80Yes: 'Actuals stayed within the 80% expected range ({count}/{total}).',
    fcActualWithin80No: 'Actuals fell outside the 80% range in some periods ({count}/{total} inside).',
    benchToggleLeft: 'Charts',
    benchToggleRight: 'Settings',
    sidebarWhenToUse: 'Best for',
  },

  ar: {
    brandName: 'داتا بلس',
    brandTagline: 'ذكاء البيانات أثناء حركتها',
    home: 'الرئيسية',
    features: 'المميزات',
    pricing: 'الأسعار',
    about: 'من نحن',
    dashboards: 'لوحات التحكم والتقارير',
    dataHub: 'مركز البيانات',
    visualGallery: 'معرض الرسومات',
    workbench: 'مساحة العمل',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    getStartedFree: 'ابدأ مجاناً',
    logOut: 'تسجيل الخروج',
    account: 'الحساب',
    quickTour: 'عرض الجولة الترحيبية',
    help: 'المساعدة',
    settings: 'الإعدادات',

    tourWelcomeTitle: 'مرحباً بك في داتا بلس',
    tourWelcomeDesc: 'منصتك المتقدمة لتحليلات البيانات وبناء لوحات التحكم. أنشئ رسوماً بيانية ثلاثية الأبعاد ونظف بياناتك في استوديو متكامل.',
    tourCanvasTitle: 'لوحة العمل والرسوم ثلاثية الأبعاد',
    tourCanvasDesc: 'اسحب وأفلت مخططات الأسطح والنقاط ثلاثية الأبعاد، بجانب بطاقات مؤشرات الأداء والرسوم البيانية الكلاسيكية على مساحة تفاعلية مرنة.',
    tourDataHubTitle: 'مركز البيانات وقواعد البيانات السحابية',
    tourDataHubDesc: 'ارفع ملفات إكسل وCSV مرة واحدة ونظّمها في مكان واحد — لتكون جاهزة لأي لوحة أو تقرير أو توقع.',
    tourDataLabTitle: 'مختبر البيانات (التنظيف)',
    tourDataLabDesc: 'انقر على أي صف أو عمود أو خلية. أزل التكرارات، قسّم الأعمدة، املأ الفراغات، وصحّح الأخطاء خطوة بخطوة.',
    tourReadyTitle: 'أنت جاهز تماماً!',
    tourReadyDesc: 'انطلق الآن لإنشاء لوحتك الأولى أو رفع ملف جدول بيانات خاص بك.',

    tourStep1Title: 'مرحباً بك في داتا بلس',
    tourStep1Desc: 'يجمع داتا بلس بين لوحات التحكم السهلة والتوقعات المستقبلية وتقارير PDF في متصفحك مع حفظ تلقائي وخصوصية كاملة.',
    tourStep2Title: 'إدارة ملفاتك وجداولك',
    tourStep2Desc: 'احفظ ملفاتك منظمة في مركز البيانات مع معاينة فورية وسجل آمن للتغييرات.',
    tourStep3Title: 'رفع ملفاتك بأمان',
    tourStep3Desc: 'ارفع ملفات إكسل وCSV خلال ثوانٍ، وتبقى جميع ملفاتك خاصة داخل حسابك وحدك.',
    tourStep4Title: 'تنظيف الجداول في مختبر البيانات',
    tourStep4Desc: 'رتّب الصفوف غير المنظمة بالنقر فقط — صحّح الأخطاء، أزل التكرارات، واملأ الفراغات بدون معادلات.',
    tourStep5Title: 'ربط الملفات المرتبطة معاً',
    tourStep5Desc: 'صل ملفين منفصلين (مثل الطلبات والعملاء) عبر عمود مشترك واحفظ مجاميع سريعة — بدون أي معادلات إكسل.',
    tourStep6Title: 'أنشئ لوحة تحكمك الأولى',
    tourStep6Desc: 'صمم صفحات تفاعلية واضحة ببطاقات الأرقام والرسوم البيانية والجداول والفلاتر المترابطة.',
    tourStep7Title: 'الرسوم والتوقعات وتقارير PDF',
    tourStep7Desc: 'استكشف الرسوم التفاعلية والعروض ثلاثية الأبعاد، توقّع الأرقام القادمة، وصدّر تقارير PDF أنيقة.',
    exploreSection: 'استكشف هذا القسم',
    next: 'التالي',
    previous: 'السابق',
    skipTour: 'تخطي الجولة',
    getStarted: 'ابدأ الآن',
    dontShowAgain: 'عدم الإظهار مرة أخرى',
    stepOf: 'الخطوة {current} من {total}',

    dataLabTitle: 'مختبر البيانات',
    dataLabSubtitle: 'استوديو تنظيف وتحويل البيانات',
    discard: 'تراجع وإلغاء',
    applyAndClose: 'تطبيق وإغلاق',
    savingChanges: 'جاري الحفظ...',
    addFile: 'إضافة ملف',
    uploadFile: 'رفع ملف CSV أو إكسل',
    newEmptyQuery: 'استعلام فارغ جديد',
    addDatasetMenu: 'إضافة مجموعة بيانات',
    openExistingDataset: 'فتح مجموعة بيانات موجودة',
    closeTabTip: 'إغلاق علامة التبويب (أو بالنقر بالزر الأوسط)',
    allTabsClosedTitle: 'لا توجد مجموعات بيانات مفتوحة في مختبر البيانات',
    allTabsClosedDesc: 'استورد ملف بيانات، أو افتح مجموعة بيانات موجودة من مركزك، أو ابدأ باستعلام فارغ جديد.',
    closeDataset: 'إغلاق مجموعة البيانات',
    stepsHistory: 'الخطوات المطبقة',
    sourceStep: 'المصدر',
    columnInspector: 'فاحص الأعمدة',
    dataQuality: 'جودة البيانات',
    valid: 'صالح',
    empty: 'فارغ',
    errors: 'أخطاء',
    selectedColumnLabel: 'العمود',
    selectedRowLabel: 'الصف',
    selectedCellLabel: 'الخلية',
    cellValue: 'القيمة',
    copyValue: 'نسخ',
    copied: 'تم النسخ!',
    filterByValue: 'تصفية بهذه القيمة',
    replaceValue: 'استبدال القيمة',
    clearSelection: 'إلغاء التحديد',
    noColumnsInView: 'لا توجد أعمدة في العرض الحالي',
    bringInDataTitle: 'أضف بياناتك لبدء العمل',
    bringInDataDesc: 'ارفع ملف CSV أو جدول إكسل للبدء في تنظيف البيانات وتحويلها وفحصها خطوة بخطوة.',
    appliedSuccessToast: 'تم حفظ وتطبيق التعديلات على البيانات بنجاح!',

    unsavedChangesTitle: 'تغييرات غير محفوظة في مختبر البيانات',
    unsavedChangesDesc: 'لقد قمت بإجراء خطوات تنظيف على مجموعة البيانات هذه. ماذا تود أن تفعل قبل الإغلاق؟',
    saveAndApply: 'حفظ وتطبيق',
    discardChanges: 'تجاهل التغييرات',
    continueEditing: 'متابعة التعديل',
    closeDatasetConfirmTitle: 'إغلاق مجموعة البيانات من مساحة العمل؟',
    closeDatasetConfirmDesc: 'إغلاق هذه المجموعة يزيلها من جلسة مختبر البيانات الحالية فقط. ستبقى مجموعتك الأصلية في مركز البيانات دون أي تغيير.',
    selectAllRows: 'تحديد جميع صفوف المعاينة',
    selectedCount: 'تم تحديد {count}',

    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    close: 'إغلاق',
    search: 'بحث...',
    filter: 'تصفية',
    sort: 'فرز',
    loading: 'جاري التحميل...',
    retry: 'إعادة المحاولة',
    rows: 'صفوف',
    columns: 'أعمدة',
    // Workspace & Dashboard Hub
    workspaceEyebrow: 'مساحة العمل',
    welcomeBackUser: 'مرحباً بعودتك،',
    dashboardHubDesc: 'قم ببناء لوحات معلومات تفاعلية وتقارير جاهزة للطباعة بالاعتماد على بياناتك المنظفة والمجهزة.',
    newDashboardOrReport: 'لوحة معلومات / تقرير جديد',
    workspaces: 'مساحات العمل',
    interactiveDashboards: 'لوحات معلومات تفاعلية',
    printableReports: 'تقارير قابلة للطباعة',
    workspaceHistory: 'سجل مساحات العمل',
    all: 'الكل',
    dashboardsTab: 'لوحات المعلومات',
    reportsTab: 'التقارير',
    searchByName: 'البحث بالاسم...',
    allTime: 'كل الأوقات',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    thisYear: 'هذا العام',
    sortBy: 'الترتيب',
    sortNewest: 'الأحدث',
    sortOldest: 'الأقدم',
    sortName: 'الاسم',
    nothingHereYet: 'لا يوجد شيء هنا بعد',
    noMatches: 'لا توجد نتائج مطابقة',
    clearSearchFilters: 'امسح نص البحث أو عوامل التصفية لعرض جميع مساحات العمل الخاصة بك.',
    createFirstDashboardDesc: 'أنشئ أول لوحة معلومات تفاعلية أو تقرير قابل للطباعة، وسيتم حفظها في قاعدة بياناتك تلقائياً.',
    createACanvas: 'إنشاء مساحة عمل',
    open: 'فتح',
    reportBadge: 'تقرير',
    dashboardBadge: 'لوحة معلومات',
    usedFor: 'الاستخدام',
    widgets: 'أدوات',
    models: 'نماذج',
    canvas: 'مساحة عمل',
    createModalTitle: 'إنشاء مساحة عمل جديدة',
    createModalDesc: 'ابدأ لوحة معلومات تفاعلية أو تقريراً جاهزاً للطباعة',
    projectType: 'نوع المشروع',
    interactiveDashboardTitle: 'لوحة معلومات تفاعلية',
    interactiveDashboardDesc: 'مساحة عمل بدقة 16:9 للشاشات ومؤشرات الأداء',
    printableReportTitle: 'تقرير قابل للطباعة',
    printableReportDesc: 'صفحات A4 / رسائل مخصصة للتصدير متعدد الصفحات و PDF',
    canvasPreset: 'أبعاد مساحة العمل',
    canvasName: 'الاسم',
    dashboardNamePlaceholder: 'مثال: لوحة مؤشرات الأداء للربع الرابع',
    reportNamePlaceholder: 'مثال: تقرير المراجعة التشغيلية الشهرية',
    usedForLabel: 'الهدف / الغرض الأساسي',
    usedForPlaceholder: 'مثال: مراجعة مجلس الإدارة، تتبع العمليات',
    descriptionLabel: 'الوصف (اختياري)',
    descriptionPlaceholder: 'نظرة عامة مختصرة حول مساحة العمل هذه...',
    chooseIcon: 'اختر أيقونة',
    attachDatasets: 'ربط مجموعات البيانات (اختياري)',
    noDatasetsInHub: 'لا توجد مجموعات بيانات في مركز البيانات بعد. يمكنك إضافتها لاحقاً من داخل مساحة العمل.',
    createCanvasBtn: 'إنشاء مساحة العمل',
    deleteCanvasTitle: 'حذف مساحة العمل؟',
    deleteCanvasDesc: 'هل أنت متأكد من رغبتك في حذف مساحة العمل هذه نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
    deletePermanently: 'حذف نهائياً',
    logoutConfirmTitle: 'تسجيل الخروج من Data Pulse؟',
    logoutConfirmDesc: 'ستحتاج إلى تسجيل الدخول مجدداً للوصول إلى مساحات العمل والنماذج ومجموعات البيانات الخاصة بك.',
    accountSettings: 'إعدادات الحساب',
    helpDocumentation: 'المساعدة والتوثيق',

    // Data Hub
    dataHubHeroTitle: 'ملفاتك وجداولك جاهزة في مكان واحد',
    dataHubHeroDesc: 'ارفع ملف إكسل أو CSV مرة واحدة، نظّفه بسهولة في مختبر البيانات إذا احتجت، واستخدمه في أي لوحة تحكم أو تقرير أو توقع.',
    uploadDataset: 'رفع ملف',
    recordsUnderManagement: 'إجمالي الصفوف المرفوعة',
    cleanedInDataLab: 'منظّف في مختبر البيانات',
    stillRaw: '{count} أصلي كما هو',
    searchDatasetsPlaceholder: 'ابحث عن ملفاتك بالاسم أو التصنيف…',
    filterByTag: 'تصفية حسب التصنيف',
    allTags: 'الكل',
    bringInFirstDataset: 'أضف أول جدول بيانات لك',
    noDatasetsMatch: 'لا توجد ملفات تطابق بحثك',
    clearSearchTag: 'جرّب مسح كلمة البحث أو اختيار «الكل» لعرض جميع ملفاتك.',
    uploadCsvExcelStart: 'ارفع ملف إكسل أو CSV للبدء، ثم افتحه في مختبر البيانات إذا أردت ترتيبه وتنظيفه خطوة بخطوة.',
    openInDataLab: 'تنظيف البيانات',
    newDashboardWithData: 'إنشاء لوحة بهذا الملف',
    deleteDataset: 'حذف الملف',
    deleteDatasetConfirm: 'هل تريد حذف هذا الملف نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
    rawDataset: 'أصلي',
    cleanedDataset: 'تم التنظيف',

    // Data Lab Column Actions & Grid
    renameColumnAction: 'إعادة تسمية العمود...',
    duplicateColumnAction: 'تكرار العمود',
    splitColumnAction: 'تقسيم العمود...',
    mergeColumnsAction: 'دمج الأعمدة...',
    replaceValuesAction: 'استبدال القيم...',
    replaceErrorsAction: 'استبدال الأخطاء...',
    fillDownAction: 'تعبئة لأسفل',
    fillUpAction: 'تعبئة لأعلى',
    moveLeftAction: 'تحريك لليسار',
    moveRightAction: 'تحريك لليمين',
    removeColumnAction: 'إزالة العمود',
    previewingRows: 'معاينة {current} من أصل {total} صفاً.',
    showMoreRows: 'عرض المزيد (+100)',
    showAllRows: 'عرض الكل',
    cellError: 'خطأ',

    // Top Toolbar & Menus
    menuFile: 'ملف',
    menuEdit: 'تعديل',
    menuView: 'عرض',
    menuInsert: 'إدراج',
    menuFormat: 'تنسيق',
    menuHelp: 'مساعدة',
    newDashboard: 'لوحة معلومات جديدة',
    newReport: 'تقرير جديد',
    saveNow: 'حفظ الآن',
    saved: 'تم الحفظ',
    saving: 'جاري الحفظ...',
    unsavedChanges: 'تعديلات غير محفوظة',
    preview: 'معاينة',
    exitPreview: 'إنهاء المعاينة',
    exportPdf: 'تصدير PDF',
    exportPdfModalTitle: 'تصدير مستند PDF جاهز للطباعة',
    exportPdfModalSubtitle: 'اضبط حجم الصفحة، الاتجاه، الهوامش وجودة المستند',
    pdfFilenameLabel: 'اسم ملف PDF',
    pageSizeLabel: 'حجم صفحة الورق',
    orientationLabel: 'الاتجاه',
    portrait: 'عمودي',
    landscape: 'أفقي',
    pageMarginsLabel: 'هوامش الصفحة',
    pageRangeLabel: 'نطاق الصفحات',
    allPages: 'جميع الصفحات',
    currentPageOnly: 'الصفحة الحالية فقط',
    customPagesLabel: 'صفحات مخصصة',
    exportResolution: 'دقة التصدير',
    generatePdfBtn: 'إنشاء PDF',
    generatingPdfStatus: 'جاري إنشاء مستند PDF...',
    pdfExportError: 'حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.',

    // Modal: Select Datasets
    selectDatasetsForTitle: 'اختر الملفات لـ "{name}"',
    selectDatasetsSubtitle: 'حدد جداول البيانات التي تريد استخدامها داخل هذه اللوحة',
    searchGlobalDatasetsPlaceholder: 'ابحث في ملفاتك بالاسم...',
    warningDeselectedInUse: 'تنبيه: هذه الملفات مستخدمة حالياً في رسوم داخل هذه اللوحة:',
    applySelectionBtn: 'استخدام الملفات المختارة',

    // Modal: Dataset Preview
    searchRecordsPlaceholder: 'ابحث داخل الصفوف في أي عمود...',
    showingMatchingRows: 'عرض {current} من أصل {total} صف مطابق',

    // Modal: Manage Dashboards
    dashboardManagerTitle: 'اللوحات والقوالب المحفوظة',
    exportDashboardJson: 'تنزيل نسخة احتياطية (.json)',
    importJson: 'استيراد لوحة',
    pasteDashboardJson: 'رفع ملف لوحة محفوظة (.json)',
    applyImportedDashboard: 'اختر ملف .json لفتحه',
    availableDashboards: 'لوحاتك المحفوظة',
    activeWorkspaceBadge: 'مفتوحة الآن',
    loadWorkspaceBtn: 'فتح',
    invalidJsonError: 'لا يبدو هذا الملف كلوحة محفوظة من Data Pulse.',

    canvasSettings: 'حجم الصفحة والشبكة',
    dataModel: 'ربط الجداول',
    backToCanvas: 'العودة للوحة',
    globalFilters: 'فلاتر الصفحة',
    selectDatasets: 'اختيار الملفات',
    newPage: 'صفحة جديدة',
    addPage: 'إضافة صفحة',
    deletePage: 'حذف الصفحة',
    renamePage: 'إعادة تسمية الصفحة',
    page: 'صفحة',
    undo: 'تراجع',
    redo: 'إعادة',
    gridSnap: 'محاذاة تلقائية',
    showGrid: 'إظهار الشبكة',
    zoom: 'التكبير',

    // Left Sidebar
    visualizations: 'الرسوم والبطاقات',
    datasets: 'الجداول والملفات',
    dragVisualHint: 'اضغط أو اسحب أي رسم لإضافته إلى صفحتك.',
    searchVisuals: 'ابحث في الرسوم...',
    dataCleaningStudio: 'مختبر البيانات (تنظيف)',
    starSchemaModel: 'ربط أكثر من ملف معاً',
    noDatasetsAttached: 'لم تتم إضافة ملفات بعد',
    addDatasetToDashboard: 'إضافة ملف بيانات',
    inspectColumns: 'معاينة الأعمدة وصحتها',

    // Right Config Panel
    widgetSettings: 'إعدادات الرسم',
    dataTab: 'البيانات',
    styleTab: 'الشكل',
    advancedTab: 'المزيد',
    selectDataset: 'اختر الملف',
    xAxisField: 'الفئة / التاريخ (بالأسفل)',
    yAxisField: 'الرقم المراد قياسه (بالجانب)',
    seriesField: 'تقسيم حسب (اختياري)',
    aggregation: 'طريقة الحساب',
    sum: 'المجموع',
    average: 'المتوسط',
    count: 'العدد',
    min: 'الأقل',
    max: 'الأعلى',
    chartTitle: 'عنوان الرسم',
    primaryColor: 'اللون الرئيسي',
    colorPalette: 'تدرج الألوان',
    backgroundColor: 'لون الخلفية',
    numberFormat: 'شكل الأرقام',
    currencySymbol: 'رمز العملة',

    modelWorkspaceTitle: 'ربط جداول البيانات',
    modelWorkspaceDesc: 'صل ملفين مرتبطين (مثل الطلبات والعملاء) عبر عمود مشترك — بدون أي معادلات.',
    addFactTable: 'إضافة ملف المبيعات / الطلبات',
    addDimensionTable: 'إضافة ملف التفاصيل',
    createRelationship: 'ربط ملفين معاً',
    autoDetectRelationships: 'اكتشاف الروابط تلقائياً',

    openSavedProjects: 'فتح الأعمال المحفوظة',
    saveReport: 'حفظ التقرير',
    exploreData: 'معاينة وتنظيف...',
    backToHub: 'العودة للرئيسية',
    renameReportTitle: 'إعادة تسمية التقرير',
    deleteActivePage: 'حذف هذه الصفحة',
    fitPage: 'ملاءمة الصفحة للشاشة',
    fitWidth: 'ملاءمة العرض',
    resetZoom: 'الحجم الطبيعي',
    keyboardShortcuts: 'اختصارات لوحة المفاتيح',
    aboutDataPulse: 'عن داتا بلس',
    canvasSizeSettings: 'حجم وتنسيق الصفحة',
    manualDimensions: 'أبعاد مخصصة (بكسل)',
    width: 'العرض',
    height: 'الارتفاع',
    lockRatio: 'الحفاظ على التناسب',
    unlockRatio: 'تغيير حر',
    allWidgets: 'الكل',
    chartsCategory: 'الرسوم',
    analyticsCategory: 'رسوم ذكية',
    threeDCategory: 'رسوم ثلاثية الأبعاد',
    uploadCsvExcel: 'رفع ملف إكسل أو CSV',
    uploadCsvExcelHint: 'يدعم ملفات Excel (.xlsx/.xls) وCSV بالعربية والإنجليزية',
    selectData: 'اختر البيانات',
    loadedDatasets: 'الملفات المستخدمة هنا',
    noDatasetsSelected: 'لم تختر ملفاً بعد',
    attachDatasetsHint: 'أضف ملف بيانات لتبدأ بإنشاء الرسوم وبطاقات الأرقام.',
    inspect: 'معاينة',
    transform: 'تنظيف',
    dataBinding: 'اختيار الأعمدة',
    stylingOptions: 'الألوان والتصميم',
    sampleData: 'عينة من الصفوف',
    targetDataset: 'الملف',
    reset: 'إعادة ضبط',
    applyConfiguration: 'تطبيق التغييرات',
    transparentBackground: 'خلفية شفافة',
    syncAllDatasets: 'تحديث الملفات',
    autoDetectSchema: 'ربط الملفات تلقائياً',
    factTableBtn: '+ ملف المبيعات / الطلبات',
    dimensionTableBtn: '+ ملف التفاصيل',
    relationshipBtn: '+ ربط ملفين',
    measuresBtn: 'مجاميع محفوظة',
    score: 'التقييم',
    searchFieldsPlaceholder: 'ابحث في الأعمدة أو الملفات...',
    searchChartTypes: 'ابحث في أكثر من 30 نوع رسم...',
    insertWidgets: 'إضافة رسم أو بطاقة',
    standardChart: 'رسم بياني',
    kpiMetricCard: 'بطاقة رقم مهم (KPI)',
    richTextBlock: 'مربع نص وملاحظات',
    scatter3dGraph: 'رسم ثلاثي الأبعاد',
    insertNewPage: 'إضافة صفحة جديدة',

    // Plural forms for Arabic (6 forms: zero, one, two, few, many, other)
    rows_zero: 'صفر صفوف',
    rows_one: 'صف واحد',
    rows_two: 'صفان',
    rows_few: '{count} صفوف',
    rows_many: '{count} صفاً',
    rows_other: '{count} صف',

    columns_zero: 'صفر أعمدة',
    columns_one: 'عمود واحد',
    columns_two: 'عمودان',
    columns_few: '{count} أعمدة',
    columns_many: '{count} عموداً',
    columns_other: '{count} عمود',

    datasets_zero: 'لا توجد مجموعات بيانات',
    datasets_one: 'مجموعة بيانات واحدة',
    datasets_two: 'مجموعتا بيانات',
    datasets_few: '{count} مجموعات بيانات',
    datasets_many: '{count} مجموعة بيانات',
    datasets_other: '{count} مجموعة بيانات',

    steps_zero: 'لا توجد خطوات',
    steps_one: 'خطوة واحدة',
    steps_two: 'خطوتان',
    steps_few: '{count} خطوات',
    steps_many: '{count} خطوة',
    steps_other: '{count} خطوة',

    selected_zero: 'لم يتم تحديد أي عنصر',
    selected_one: 'عنصر واحد محدد',
    selected_two: 'عنصران محددان',
    selected_few: '{count} عناصر محددة',
    selected_many: '{count} عنصراً محدداً',
    selected_other: '{count} عنصر محدد',

    // Auth Pages
    backToHome: 'العودة للرئيسية',
    welcomeBackTitle: 'مرحباً بعودتك',
    welcomeBackSubtitle: 'أدخل بياناتك لتسجيل الدخول إلى حسابك',
    emailAddress: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    firstNameLabel: 'الاسم الأول',
    lastNameLabel: 'اسم العائلة',
    dontHaveAccount: 'ليس لديك حساب؟',
    createOneFree: 'أنشئ حساباً مجاناً',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    createAccountTitle: 'إنشاء حساب جديد',
    startFreeTrial: 'ابدأ تجربتك المجانية اليوم',
    createAccountBtn: 'إنشاء الحساب',
    signInBtn: 'تسجيل الدخول',
    enterEmailError: 'يرجى إدخال عنوان البريد الإلكتروني',
    enterValidEmailError: 'يرجى إدخال بريد إلكتروني صحيح',
    enterPasswordError: 'يرجى إدخال كلمة المرور',
    passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين',
    passwordMinLength: 'يجب ألا تقل كلمة المرور عن 8 أحرف',
    enterFullNameError: 'يرجى إدخال الاسم بالكامل',
    termsAgreementText: 'أوافق على شروط الخدمة وسياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    privacyPolicy: 'سياسة الخصوصية',
    agreeTermsError: 'يرجى الموافقة على شروط الخدمة وسياسة الخصوصية',
    roleLabel: 'الدور الوظيفي',
    roleAnalyst: 'محلل بيانات',
    roleDeveloper: 'مطور / مهندس ذكاء أعمال',
    roleViewer: 'مستعرض',
    roleAdmin: 'مدير النظام',
    passwordStrength: 'قوة كلمة المرور',
    passwordStrengthWeak: 'ضعيفة',
    passwordStrengthFair: 'مقبولة',
    passwordStrengthGood: 'جيدة',
    passwordStrengthStrong: 'قوية جداً',

    // Home & Marketing Pages
    heroTitle1: 'حوّل جداولك اليومية إلى',
    heroTitleHighlight: 'إجابات واضحة ورسوم ذكية',
    heroDescription: 'ارفع ملفات إكسل أو CSV، ونظّف الصفوف الفوضوية بنقرات بسيطة، وأنشئ لوحات تحكم وتوقعات مستقبلية وتقارير PDF جاهزة للمشاركة — بدون أي برمجة أو معادلات.',
    exploreAllFeatures: 'شاهد كيف يعمل',
    exploreDataPulseTitle: 'مصمم لفرق العمل اليومية',
    exploreDataPulseSubtitle: 'كل شيء مترابط ببساطة — من رفع ملفك إلى مشاركة رسوم واضحة وتوقعات للمستقبل.',
    productFeaturesTitle: 'ماذا يمكنك أن تفعل؟',
    productFeaturesDesc: 'ارفع ملفات إكسل وCSV، نظّف البيانات بصرياً، اربط الجداول المرتبطة بدون معادلات، وتوقّع المبيعات القادمة.',
    transparentPricingTitle: 'أسعار واضحة وبسيطة',
    transparentPricingDesc: 'ابدأ مجاناً، وقم بالترقية فقط عندما يحتاج فريقك إلى مساحة أكبر — باقات شهرية واضحة بدون رسوم مفاجئة.',
    enterpriseArchitectureTitle: 'خصوصية وأمان تلقائياً',
    enterpriseArchitectureDesc: 'تبقى ملفاتك خاصة داخل حسابك، وملفاتك الأصلية لا تتغير أبداً، وكل عملك يُحفظ تلقائياً.',
    readyToTransformTitle: 'هل أنت جاهز لفهم أرقامك بوضوح أكبر؟',
    readyToTransformDesc: 'انضم إلى أصحاب المتاجر والمدراء والفرق التي تحوّل الجداول اليومية إلى قرارات واضحة مع داتا بلس.',
    launchCanvasBtn: 'افتح مساحة العمل',
    allRightsReserved: 'جميع الحقوق محفوظة.',

    // Navbar, Status Badge & Error Boundary
    navHomeTitle: 'الصفحة الرئيسية لداتا بلس',
    navGoToHub: 'الذهاب إلى مركز اللوحات',
    navAccountMenu: 'قائمة الحساب',
    navSectionsLabel: 'الأقسام',
    dbConnectionTitle: 'حالة الحفظ السحابي',
    dbStatusLabel: 'الحالة',
    dbCompactLabel: 'الحفظ',
    dbLabel: 'الحفظ السحابي',
    dbConnected: 'متصل',
    dbDisconnected: 'غير متصل',
    dbLatency: 'سرعة الاستجابة',
    dbLatencyMs: '{ms} مللي ثانية',
    dbTables: 'الجداول',
    dbDatasets: 'الملفات',
    dbDashboards: 'اللوحات',
    dbServerless: 'التخزين السحابي نشط',
    dbLivePooler: 'مزامنة فورية',
    dbRefreshStatus: 'تحديث حالة الاتصال',
    errorBoundaryWidgetMsg: 'تعذّر عرض هذا العنصر',
    errorBoundaryPageTitle: 'حدث خطأ غير متوقع',
    errorBoundaryPageDesc: 'واجه التطبيق خطأً غير متوقع. أعمالك المحفوظة آمنة. أعد تحميل الصفحة للمتابعة.',
    reloadPage: 'إعادة التحميل',

    // Auth extras
    authSigningIn: 'جاري تسجيل الدخول...',
    authInvalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    authConnectionError: 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
    authCreatingAccount: 'جاري إنشاء الحساب...',
    authRegistrationFailed: 'فشل إنشاء الحساب',
    authRegistrationError: 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.',
    authPasswordsMatch: 'كلمتا المرور متطابقتان',
    authFirstNamePlaceholder: 'أحمد',
    authLastNamePlaceholder: 'علي',

    // Marketing Pages
    featuresHeroBadge: 'تحليلات أعمال بسيطة وحديثة',
    featuresHeroTitle1: 'مصمم ليمنحك',
    featuresHeroTitle2: 'إجابات يومية واضحة',
    featuresHeroDesc: 'يجمع داتا بلس بين رفع الجداول، وتنظيفها بصرياً، وربط الملفات معاً، والتوقعات المستقبلية، ولوحات التحكم في مساحة عمل واحدة سهلة الاستخدام.',
    featuresTryBtn: 'جرّب هذه الميزة',
    featuresZeroLatency: 'سريع ومستجيب',
    featuresEngineReady: 'جاهز متى احتجت',
    featuresFullStackTitle: 'كل ما تحتاجه في مكان واحد',
    featuresFullStackDesc: 'حوّل ملفات إكسل وCSV اليومية إلى رسوم واضحة وتوقعات مستقبلية وتقارير PDF جاهزة للطباعة.',
    featuresCard1Title: 'رفع ذكي للملفات',
    featuresCard1Desc: 'افتح ملفات إكسل وCSV في ثوانٍ. يتعرف داتا بلس تلقائياً على التواريخ والمبالغ والأرقام والنصوص العربية والإنجليزية.',
    featuresCard2Title: 'تنظيف البيانات خطوة بخطوة',
    featuresCard2Desc: 'رتّب الصفوف الفوضوية بصرياً مع إمكانية التراجع الفوري. قسّم الأعمدة وادمج القيم واملأ الفراغات بدون معادلات إكسل.',
    featuresCard3Title: 'ربط سهل بين الجداول',
    featuresCard3Desc: 'صل ملفات منفصلة مثل الطلبات والعملاء عبر عمود مشترك — مثل VLOOKUP بدون كتابة أي معادلة.',
    featuresCard4Title: 'جدول تقويم بنقرة واحدة',
    featuresCard4Desc: 'أنشئ جدول تقويم جاهزاً بالسنة والربع والشهر واليوم لتقارن التواريخ والأداء بكل سهولة.',
    featuresCard5Title: 'أكثر من 30 شكلاً بصرياً جاهزاً',
    featuresCard5Desc: 'أنشئ مخططات الأعمدة والخطوط والدوائر وبطاقات الأرقام والخرائط والرسوم ثلاثية الأبعاد بنقرات بسيطة.',
    featuresCard6Title: 'تنبيهات حماية قبل الحذف',
    featuresCard6Desc: 'قبل حذف أي ملف، ينبهك داتا بلس إذا كان مستخدماً في أي رسم أو فلتر أو رابط حتى لا يتعطل عملك.',
    featuresCtaTitle: 'هل أنت مستعد لقراءة جداولك بوضوح أكبر؟',
    featuresCtaDesc: 'ابدأ بناء لوحاتك في ثوانٍ باستخدام النماذج الجاهزة أو ملفات عملك الخاصة.',
    featuresViewGallery: 'تصفح معرض الرسوم',

    pricingHeroBadge: 'أسعار بسيطة وواضحة',
    pricingHeroTitle1: 'باقات مريحة تناسب',
    pricingHeroTitle2: 'كل حجم فريق',
    pricingHeroDesc: 'ابدأ مجاناً بالكامل مع تنظيف الجداول ولوحات التحكم وتصدير PDF، وقم بالترقية في أي وقت مع نمو ملفاتك وفريقك.',
    pricingMonthly: 'الدفع الشهري',
    pricingAnnual: 'الدفع السنوي',
    pricingSave20: 'وفّر 20%',
    pricingIncludedCapabilities: 'ما تتضمنه الباقة:',
    pricingCompareTitle: 'مقارنة الباقات جنباً إلى جنب',
    pricingColFeature: 'الميزة',
    pricingColStarter: 'الأساسية',
    pricingColPro: 'الترقية',
    pricingColEnterprise: 'المؤسسات',
    pricingRow1Label: 'الجداول المحفوظة',
    pricingRow1Starter: 'حتى 5',
    pricingRow1Pro: 'غير محدودة',
    pricingRow1Ent: 'غير محدودة + مصادر مخصصة',
    pricingRow2Label: 'تنظيف مختبر البيانات',
    pricingRow2Starter: 'نعم',
    pricingRow2Pro: 'نعم + سجل محفوظ',
    pricingRow2Ent: 'نعم + قوالب فريق مشتركة',
    pricingRow3Label: 'ربط الجداول',
    pricingRow3Starter: 'أساسي',
    pricingRow3Pro: 'ربط كامل + مجاميع محفوظة',
    pricingRow3Ent: 'كامل + إعدادات متعددة الأقسام',
    pricingRow4Label: 'جدول التواريخ والتقويم',
    pricingRow4Starter: 'يدوي',
    pricingRow4Pro: 'إنشاء تلقائي بنقرة واحدة',
    pricingRow4Ent: 'نقرة واحدة + سنوات مالية مخصصة',
    pricingRow5Label: 'الخصوصية وأمان الحساب',
    pricingRow5Starter: 'مساحة عمل خاصة',
    pricingRow5Pro: 'مساحة سحابية محمية',
    pricingRow5Ent: 'مساحة فريق مخصصة',
    pricingFaqTitle: 'الأسئلة الشائعة',
    pricingFaqDesc: 'إجابات بسيطة على الأسئلة التي يطرحها المستخدمون قبل البدء.',
    pricingFaq1Q: 'هل يمكنني استخدام نفس الملف في عدة لوحات تحكم؟',
    pricingFaq1A: 'نعم! ارفع ملفك مرة واحدة في مركز البيانات واستخدمه في أي عدد من اللوحات والتقارير والتوقعات بدون تكرار أو إعادة رفع.',
    pricingFaq2Q: 'هل يؤدي التنظيف إلى تغيير ملف إكسل أو CSV الأصلي؟',
    pricingFaq2A: 'أبداً. يبقى ملفك الأصلي آمناً كما هو، وكل خطوة تنظيف في مختبر البيانات تُحفظ بوضوح ويمكنك مراجعتها أو التراجع عنها في أي وقت.',
    pricingFaq3Q: 'كيف يعمل ربط الجداول بدون معادلات؟',
    pricingFaq3A: 'اختر ملفين (مثل الطلبات والعملاء) وحدد العمود المشترك بينهما (مثل رقم العميل)، وسيطابقهما داتا بلس تلقائياً لتستخدم أعمدة الملفين في نفس الرسم.',
    pricingFaq4Q: 'هل تبقى ملفاتي ولوحاتي خاصة بي؟',
    pricingFaq4A: 'نعم. كل ما ترفعه وتنشئه خاص بحسابك وحدك ويتم التحقق منه بأمان على خادمنا.',
    pricingFaq5Q: 'هل يمكنني تغيير الباقة أو إلغاؤها في أي وقت؟',
    pricingFaq5A: 'نعم، يمكنك الترقية أو التبديل أو الإلغاء في أي وقت بدون أي رسوم خفية.',
    pricingNeedCustomTitle: 'هل تحتاج إعداداً مخصصاً لفريق أكبر؟',
    pricingNeedCustomDesc: 'نساعد فرق المالية والمبيعات والعمليات على الانتقال بسلاسة من الجداول اليدوية أو الأدوات المعقدة.',
    pricingSpeakEngineer: 'تحدث مع فريقنا',

    aboutArchFlowTitle: 'كيف يعمل داتا بلس',
    aboutArchBoundary: 'بياناتك تبقى خاصة بك',
    aboutArchStep1Title: '١. مركز البيانات',
    aboutArchStep1Desc: 'رفع إكسل وCSV • تعرّف تلقائي على الأعمدة والتواريخ',
    aboutArchStep1Badge: 'رفع',
    aboutArchStep2Title: '٢. مختبر البيانات',
    aboutArchStep2Desc: 'تنظيف الصفوف • خطوات قابلة للتراجع • فحص صحة الأعمدة',
    aboutArchStep2Badge: 'تنظيف',
    aboutArchStep3Title: '٣. ربط الجداول (اختياري)',
    aboutArchStep3Desc: 'ربط الطلبات والعملاء • جدول التقويم • مجاميع محفوظة',
    aboutArchStep3Badge: 'ربط',
    aboutArchStep4Title: '٤. اللوحات والتوقعات',
    aboutArchStep4Desc: 'رسوم وفلاتر • توقعات مستقبلية • تصدير PDF للطباعة',
    aboutArchStep4Badge: 'مشاركة',
    aboutPrinciplesTitle: 'المبادئ التي تقودنا',
    aboutPrinciplesDesc: 'اختيارات بسيطة صُممت لتجعل قراءة أرقامك اليومية سهلة وممتعة.',

    galleryInteractiveDemo: 'عرض تفاعلي',
    galleryUsageTitle: 'الغرض التحليلي والاستخدام',
    galleryOverviewTitle: 'نظرة عامة وتعريف',
    galleryBestUseCases: 'أفضل حالات الاستخدام',
    galleryProTip: 'نصيحة احترافية:',
    galleryCtaTitle: 'هل أنت مستعد لإنشاء مخططاتك المخصصة؟',
    galleryCtaDesc: 'ابنِ مقاييس بالسحب والإفلات واستورد جداولك وأنشئ لوحات تحكم تنفيذية في ثوانٍ.',
    galleryBuildBtn: 'أنشئ لوحة التحكم الآن',
    galleryCatComparison: 'المقارنات',
    galleryCatTrends: 'الاتجاهات والسلاسل',
    galleryCatComposition: 'التوزيع والتكوين',
    galleryCatKpi: 'مؤشرات الأداء',
    galleryBarTitle: 'المخطط الشريطي: المبيعات والإيرادات الإقليمية',
    galleryBarSummary: 'تتفوق المخططات الشريطية في مقارنة المقاييس الفئوية المنفصلة عبر المجموعات، مما يساعد أصحاب المصلحة على تحديد الفئات الأعلى أداءً والفروقات الإقليمية بلمحة.',
    galleryBarUse1: 'مقارنة الإيرادات عبر الأسواق الإقليمية أو مواقع الفروع',
    galleryBarUse2: 'قياس مستهدفات الأقسام الربع سنوية مقابل الأداء الفعلي',
    galleryBarUse3: 'عرض نتائج الاستطلاعات أو أعداد فئات المنتجات',
    galleryBarInsight: 'استخدم المخططات الشريطية عندما تكون تسميات الفئات واضحة ودقة المقارنة أولوية، وتجنب الازدحام بأكثر من 10 أشرطة.',
    galleryLineTitle: 'المخطط الخطي: نمو المستخدمين النشطين شهرياً',
    galleryLineSummary: 'تعرض المخططات الخطية البيانات المستمرة عبر فترات زمنية متتالية لتوضيح زخم النمو والتقلبات الموسمية والاتجاهات بوضوح.',
    galleryLineUse1: 'تتبع تبني المنتج ونمو المستخدمين النشطين يومياً وشهرياً',
    galleryLineUse2: 'مراقبة استقرار التشغيل وزيارات الموقع أو قراءات المستشعرات',
    galleryLineUse3: 'تقييم مسارات الأسواق المالية وأداء الأسهم',
    galleryLineInsight: 'تكشف المخططات الخطية عن التسارع والتباطؤ، والربط بالمنحنيات السلسة يبرز الاستمرارية الزمنية.',
    galleryAreaTitle: 'المخطط المساحي: الإيرادات مقابل المصروفات',
    galleryAreaSummary: 'تبرز المخططات المساحية الفجوة الحجمية بين تدفقات البيانات المتعددة وتوضح النمو التراكمي وتوسع الهوامش بوضوح.',
    galleryAreaUse1: 'إظهار هوامش صافي الربح عبر مقارنة مساحات الإيرادات والمصروفات',
    galleryAreaUse2: 'تصوير استهلاك النطاق الترددي أو السعة التخزينية التراكمية',
    galleryAreaUse3: 'تحليل تطور الحصة السوقية عبر عدة منتجات',
    galleryAreaInsight: 'تنقل المساحة المظللة الحجم الكلي، مما يسهل رؤية فائض الربح بين الإيرادات وسقف التكاليف.',
    galleryDonutTitle: 'المخطط الحلقي: توزيع فئات العملاء',
    galleryDonutSummary: 'تعرض المخططات الحلقية التقسيم النسبي للأجزاء من الكل (100%) مع توفير مساحة وسطية لإبراز الإجماليات.',
    galleryDonutUse1: 'تقسيم حسابات العملاء أو باقات المشتركين',
    galleryDonutUse2: 'عرض نسب توزيع الميزانية عبر الأقسام',
    galleryDonutUse3: 'إظهار الحصة السوقية لأنظمة التشغيل أو مصادر الزيارات',
    galleryDonutInsight: 'يفضل حصرها في 3 إلى 6 فئات وترتيب الشرائح من الأكبر إلى الأصغر.',
    galleryScatterTitle: 'مخطط التشتت: رضا العملاء مقابل القيمة الدائمة',
    galleryScatterSummary: 'يعرض مخطط التشتت نقاط البيانات الفردية عبر محورين رقميين لاكتشاف الارتباطات الإحصائية والتجمعات والقيم الشاذة.',
    galleryScatterUse1: 'تحليل العلاقة بين درجات رضا العملاء وحجم العقود',
    galleryScatterUse2: 'ربط الإنفاق التسويقي بحجم التحويلات لكل حملة',
    galleryScatterUse3: 'تحديد القيم المتطرفة في مقاييس الكفاءة التشغيلية',
    galleryScatterInsight: 'مثالي لاكتشاف العلاقات الطردية أو العكسية بين المقاييس المستقلة قبل تشغيل نماذج الانحدار.',
    galleryKpiTitle: 'بطاقات مؤشرات الأداء التنفيذية (KPI)',
    galleryKpiSummary: 'تقدم بطاقات مؤشرات الأداء أهم الأرقام دون تشويش بصري، مع الجمع بين الأرقام الكبيرة ومخططات الشرارة السريعة.',
    galleryKpiUse1: 'لوحات القيادة التنفيذية التي تتطلب فحص الحالة فوراً',
    galleryKpiUse2: 'ملخصات الهواتف للمؤسسين والمستثمرين وقادة المنتجات',
    galleryKpiUse3: 'إبراز الأرقام الفردية مقارنة بالأهداف الربع سنوية',
    galleryKpiInsight: 'ادمج الأرقام الكبيرة الواضحة مع مؤشرات التغير (+%) والخطوط المصغرة لتوفير سياق فوري.',
    galleryKpiMrrLabel: 'الإيرادات الشهرية المتكررة',
    galleryKpiMrrDelta: '+18.4% مقارنة بالشهر السابق',
    galleryKpiChurnLabel: 'معدل التسرب الصافي',
    galleryKpiChurnDelta: '-0.12% تحسن',
    galleryKpiCacLabel: 'فترة استرداد التكلفة',
    galleryKpiCacValue: '5.2 أشهر',
    galleryKpiCacDelta: 'كفاءة ضمن أعلى 10%',

    // App, Hubs, Canvas, Toolbar, Sidebar, Filters, Widgets
    appNewDashboardName: 'لوحة معلومات جديدة',
    appNewReportName: 'تقرير جديد',
    appUntitledDashboard: 'لوحة معلومات بدون عنوان',
    appCannotDeleteLastPage: 'لا يمكن حذف الصفحة الوحيدة المتبقية.',
    appLoadingWorkspace: 'جاري تحميل مساحة العمل...',
    appSavingError: 'تعذر حفظ التعديلات في قاعدة البيانات. يرجى المحاولة مجدداً.',
    appNewPageName: 'صفحة {n}',
    hubCreateErrorFallback: 'فشل إنشاء مساحة العمل. يرجى المحاولة مرة أخرى.',
    hubTypePresetDesktop: 'شاشة 16:9 (1280×720)',
    hubTypePresetTablet: 'عرض 4:3 (1024×768)',
    hubTypePresetA4Portrait: 'A4 عمودي',
    hubTypePresetA4Landscape: 'A4 أفقي',
    hubTypePresetLetter: 'US Letter عمودي',
    dataHubNumericCol: 'رقمي',
    dataHubTextCol: 'نصي',
    dataHubDateCol: 'تاريخ',
    dataHubBoolCol: 'منطقي',
    dataHubDeleteTitle: 'حذف مجموعة البيانات؟',
    dataHubDeleteWarning: 'قد تفقد اللوحات المرتبطة بمجموعة البيانات هذه مخططاتها. لا يمكن التراجع عن هذا الإجراء.',
    dataHubDeleting: 'جاري الحذف...',
    dataHubNoDescription: 'لم يتم إضافة وصف.',

    toolbarRenamePrompt: 'إعادة تسمية الصفحة',
    toolbarDuplicatePage: 'تكرار الصفحة',
    toolbarMovePageLeft: 'نقل لليسار',
    toolbarMovePageRight: 'نقل لليمين',
    toolbarShortcutsTitle: 'اختصارات لوحة المفاتيح',
    toolbarShortcutUndo: 'التراجع عن آخر إجراء في مساحة العمل',
    toolbarShortcutRedo: 'إعادة الإجراء في مساحة العمل',
    toolbarShortcutDelete: 'حذف العنصر المحدد',
    toolbarShortcutPalette: 'فتح لوحة الأوامر السريعة (مختبر البيانات)',
    toolbarShortcutClose: 'إغلاق النافذة المفتوحة أو الإلغاء',
    toolbarAboutDesc: 'لوحات تحكم مرئية سهلة، تنظيف خطوة بخطوة في مختبر البيانات، ربط بسيط بين الجداول، توقعات مستقبلية، وتقارير PDF للطباعة.',
    toolbarQuickPresets: 'قوالب الأبعاد السريعة',
    toolbarSize16x9: 'لوحة 16:9 عالية الدقة (1280×720)',
    toolbarSizeA4: 'تقرير A4 عمودي',
    toolbarSizeLetter: 'تقرير US Letter',
    toolbarAspectLocked: 'نسبة العرض إلى الارتفاع مقفلة',
    toolbarClickToRename: 'انقر لإعادة تسمية اللوحة أو التقرير',
    toolbarNewPagePrefix: 'صفحة',
    toolbarGridSnapTip: 'تفعيل أو تعطيل المحاذاة للشبكة',
    toolbarShowGridTip: 'إظهار أو إخفاء خطوط الشبكة',
    toolbarUndoTip: 'تراجع (Ctrl+Z)',
    toolbarRedoTip: 'إعادة (Ctrl+Y)',
    toolbarPreviewTip: 'تبديل وضع المعاينة',
    toolbarSaveTip: 'حفظ اللوحة الآن',

    sidebarCustomVisuals: 'مكتبة المخططات والعناصر',
    sidebarSearchEmpty: 'لا توجد مخططات تطابق بحثك',
    sidebarNoMatch: 'جرّب كلمة بحث أخرى.',
    sidebarRowsShort: '{count} صف',
    sidebarColsShort: '{count} عمود',
    sidebarRemoveDataset: 'إزالة مجموعة البيانات من اللوحة',

    canvasEmptyTitle: 'مساحة العمل جاهزة',
    canvasEmptyDesc: 'انقر أو اسحب أي مخطط من الشريط الجانبي للمخططات لإضافة أول عنصر.',
    canvasQuickSizeTitle: 'أبعاد اللوحة السريعة',
    canvasPresetCustom: 'مخصص',
    canvasPageHeaderPlaceholder: 'ترويسة التقرير...',
    canvasPageFooterPlaceholder: 'سري — تقرير داخلي',
    canvasOfPages: 'من {total}',
    canvasGridBgLabel: 'شبكة اللوحة',

    widgetEditTitle: 'إعدادات العنصر',
    widgetDuplicateTitle: 'تكرار العنصر',
    widgetDeleteTitle: 'حذف العنصر',
    widgetConfigureData: 'ربط البيانات',
    widgetNoDataTitle: 'لا توجد بيانات مرتبطة',
    widgetNoDataDesc: 'اختر مجموعة بيانات وحقول المحاور من اللوحة الجانبية.',
    widgetLoading3d: 'جاري تحميل المخطط ثلاثي الأبعاد...',
    widget3dUnavailable: 'العرض ثلاثي الأبعاد غير متاح لهذه البيانات.',
    widgetChartError: 'تعذر عرض المخطط.',
    widgetTextPlaceholder: 'انقر مرتين أو حرّر النص من لوحة الإعدادات لتخصيصه...',
    widgetSelectFieldPrompt: 'اختر الحقول من لوحة الإعدادات',
    widgetRecordsLabel: '{count} سجل',
    widgetComparePrev: 'مقابل الهدف',

    configNoWidgetTitle: 'لم يتم تحديد أي عنصر',
    configNoWidgetDesc: 'انقر على أي عنصر في مساحة العمل لضبط بياناته ومحاوره وتنسيقه.',
    configDatasetLabel: 'مصدر البيانات',
    configAutoSelect: 'تحديد تلقائي',
    configNone: 'بدون',
    configValueFormat: 'تنسيق القيم',
    configFormatAuto: 'تلقائي',
    configFormatCurrency: 'عملة ($)',
    configFormatPercent: 'نسبة مئوية (%)',
    configFormatCompact: 'مختصر (1.2K)',
    configFormatDecimal: 'عشري (0.00)',
    configDecimals: 'الخانات العشرية',
    configLegendPosition: 'موضع وسيلة الإيضاح',
    configShowLegend: 'إظهار وسيلة الإيضاح',
    configShowGrid: 'إظهار خطوط الشبكة',
    configShowLabels: 'إظهار تسميات البيانات',
    configFontSize: 'حجم الخط',
    configFontFamily: 'نوع الخط',
    configTextAlign: 'محاذاة النص',
    configTextContent: 'محتوى النص',
    configPadding: 'الحشو الداخلي',
    configBorderRadius: 'استدارة الزوايا',
    configAccentColor: 'اللون المميز',
    configSamplePreviewTitle: 'معاينة القيم النموذجية',
    configNoSampleRows: 'لا توجد صفوف معاينة متاحة',
    configAxisXLabel: 'تسمية المحور س',
    configAxisYLabel: 'تسمية المحور ص',
    configAggDistinct: 'العدد المميز',
    configPaletteDefault: 'أزرق مؤسسي',
    configPaletteVibrant: 'ألوان نابضة',
    configPaletteOcean: 'أزرق محيطي',
    configPaletteSunset: 'غروب دافئ',
    configPaletteForest: 'أخضر زمردي',
    configPaletteMono: 'رمادي أحادي',
    configShowHeader: 'إظهار ترويسة العنصر',
    configShowBorder: 'إظهار إطار البطاقة',
    configBorderColor: 'لون الإطار',
    configTitleColor: 'لون العنوان',
    configAlignStart: 'البداية',
    configAlignCenter: 'الوسط',
    configAlignEnd: 'النهاية',

    filterBarClearAll: 'مسح الكل',
    filterOpEquals: 'يساوي (=)',
    filterOpContains: 'يحتوي على',
    filterOpGreater: 'أكبر من (>)',
    filterOpLess: 'أصغر من (<)',

    exportPdfCustomSize: 'حجم مادي مخصص',
    exportPdfMarginTop: 'أعلى',
    exportPdfMarginRight: 'يمين',
    exportPdfMarginBottom: 'أسفل',
    exportPdfMarginLeft: 'يسار',
    exportPdfActiveView: 'العرض النشط',
    exportPdfCustomPlaceholder: 'مثال: 1, 2',
    exportPdfQualityDesc: 'نصوص أوضح ومخططات متجهية عالية الدقة',
    exportPdf2x: '2x عالية',
    exportPdf3x: '3x فائقة الدقة',
    exportPdfDefaultName: 'تقرير الأعمال',
    exportPdfPagesCount: '{count} صفحات',
    exportPdfPageSingular: 'صفحة واحدة',

    importErrorRead: 'فشل قراءة محتويات الملف',
    importErrorNoRows: 'لم يتم العثور على صفوف بيانات صالحة للاستيراد.',
    importErrorSave: 'فشل حفظ مجموعة البيانات في قاعدة البيانات. يرجى المحاولة مجدداً.',
    importProgressPrep: 'جاري تجهيز مجموعة البيانات...',
    importProgressSaving: 'جاري الحفظ في قاعدة بيانات PostgreSQL...',
    importProgressDone: 'تم حفظ مجموعة البيانات بنجاح!',
    importDefaultDatasetPlaceholder: 'أدخل اسم مجموعة البيانات',
    importReading: 'جاري القراءة...',
    tourGoToStep: 'الانتقال إلى الخطوة {step}',
    tourProgressLabel: 'تقدم الجولة',

    // 31 Widget Definitions
    widget_bar_name: 'مخطط شريطي أفقي', widget_bar_desc: 'مقارنة الفئات أفقياً باستخدام أشرطة مستطيلة',
    widget_stacked_bar_name: 'شريطي مكدس', widget_stacked_bar_desc: 'عرض تكوين الجزء إلى الكل عبر الفئات',
    widget_column_name: 'مخطط أعمدة', widget_column_desc: 'مقارنة القيم الفئوية باستخدام أعمدة رأسية',
    widget_line_name: 'مخطط خطي', widget_line_desc: 'تتبع الاتجاهات المستمرة وتطور السلاسل الزمنية',
    widget_area_name: 'مخطط مساحي', widget_area_desc: 'إبراز الحجم التراكمي عبر خط زمني',
    widget_stacked_area_name: 'مساحي مكدس', widget_stacked_area_desc: 'مقارنة اتجاهات الحجم المكدس عبر الزمن',
    widget_pie_name: 'مخطط دائري', widget_pie_desc: 'تصوير التوزيع النسبي لإجمالي واحد',
    widget_donut_name: 'مخطط حلقي', widget_donut_desc: 'مخطط حلقي حديث يبرز حصص الفئات',
    widget_scatter_name: 'مخطط تشتت', widget_scatter_desc: 'استكشاف الارتباطات والتجمعات بين مقياسين',
    widget_bubble_name: 'مخطط فقاعي', widget_bubble_desc: 'مقارنة ثلاثة أبعاد رقمية باستخدام حجم الفقاعة',
    widget_radar_name: 'مخطط راداري', widget_radar_desc: 'مقارنة الأداء متعدد المتغيرات عبر محاور شعاعية',
    widget_polar_name: 'مخطط قطبي', widget_polar_desc: 'عرض المقادير الدورية بقطاعات متساوية الزاوية',
    widget_heatmap_name: 'خريطة حرارية', widget_heatmap_desc: 'تصوير كثافة المصفوفة وشدتها بتدرج لوني',
    widget_treemap_name: 'مخطط شجري', widget_treemap_desc: 'عرض النسب الهرمية عبر مستطيلات متداخلة',
    widget_funnel_name: 'مخطط قمعي', widget_funnel_desc: 'تتبع مراحل التحويل ومعدلات التسرب',
    widget_waterfall_name: 'مخطط شلالي', widget_waterfall_desc: 'عرض التغيرات التراكمية الموجبة والسالبة',
    widget_boxplot_name: 'مخطط الصندوق', widget_boxplot_desc: 'فحص الربيعات والوسيط والقيم الشاذة إحصائياً',
    widget_histogram_name: 'مدرج تكراري', widget_histogram_desc: 'رسم توزيع التكرارات عبر فئات القيم',
    widget_kpi_name: 'بطاقة مؤشر أداء', widget_kpi_desc: 'إبراز مقياس رئيسي مع التباين عن الهدف',
    widget_gauge_name: 'مقياس عداد', widget_gauge_desc: 'قياس التقدم نحو هدف محدد',
    widget_sparkline_name: 'خط شرارة مصغر', widget_sparkline_desc: 'خط اتجاه مضغوط مقترن بقيمة ملخصة',
    widget_table_name: 'جدول بيانات', widget_table_desc: 'عرض السجلات المنظمة مع أعمدة قابلة للفرز',
    widget_pivot_name: 'جدول محوري', widget_pivot_desc: 'جدولة متقاطعة للأبعاد مع مقاييس مجمعة',
    widget_slicer_name: 'أداة تصفية', widget_slicer_desc: 'عنصر تحكم تفاعلي لتصفية صفحات اللوحة',
    widget_textbox_name: 'مربع نص / ملاحظات', widget_textbox_desc: 'إضافة نصوص وملاحظات وعناوين وتوضيحات مباشرة على لوحة العرض',
    widget_combo_name: 'مخطط مركب', widget_combo_desc: 'دمج الأعمدة وخط الاتجاه على محورين',
    widget_bullet_name: 'مخطط رصاصي', widget_bullet_desc: 'شريط أداء مضغوط مقارنة بنطاقات نوعية',
    widget_metric_name: 'بطاقة مقياس', widget_metric_desc: 'بطاقة إحصائية مميزة مزودة بمخطط اتجاه مصغر مدمج',
    widget_progress_name: 'شريط التقدم', widget_progress_desc: 'شريط خطي لمتابعة نسبة إنجاز الأهداف والمراحل',
    widget_target_vs_actual_name: 'الهدف مقابل الفعلي', widget_target_vs_actual_desc: 'مقارنة الأداء الفعلي مع معايير الأهداف المحددة مسبقاً',
    widget_candlestick_name: 'مخطط الشموع اليابانية', widget_candlestick_desc: 'عرض قيم الافتتاح والأعلى والأدنى والإغلاق لتحليل حركة الأسواق المالية',
    widget_ohlc_name: 'مخطط OHLC المالي', widget_ohlc_desc: 'تتبع تقلبات الأسعار المالية بمؤشرات الافتتاح والأعلى والأدنى والإغلاق',
    widget_scatter3d_name: 'مخطط تشتت ثلاثي الأبعاد', widget_scatter3d_desc: 'سحابة نقاط WebGL تفاعلية عبر الأبعاد المكانية X وY وZ',
    widget_surface3d_name: 'مخطط سطح ثلاثي الأبعاد', widget_surface3d_desc: 'طوبولوجيا سطح ارتفاع رياضي متصل ثلاثي الأبعاد',
    widget_bar3d_name: 'مخطط أعمدة ثلاثي الأبعاد', widget_bar3d_desc: 'مكعبات حجمية ثلاثية الأبعاد لمقارنة الفئات عبر محاور متعددة',
    widget_mesh3d_name: 'مخطط شبكة ثلاثية الأبعاد', widget_mesh3d_desc: 'شبكة أسطح هندسية مثلثية في منظور ثلاثي الأبعاد تفاعلي',
    widget_bubble3d_name: 'مخطط فقاعي ثلاثي الأبعاد', widget_bubble3d_desc: 'تجمعات كروية حجمية بأنصاف أقطار متغيرة في فضاء ثلاثي الأبعاد',
    widget_line3d_name: 'مخطط خطي ثلاثي الأبعاد', widget_line3d_desc: 'مسارات وأشرطة متجهة تتحرك عبر إحداثيات الفضاء ثلاثي الأبعاد',
    widget_contour3d_name: 'مخطط كنتوري ثلاثي الأبعاد', widget_contour3d_desc: 'خطوط ارتفاع متساوية مسقطة على سطح طوبوغرافي ثلاثي الأبعاد',
    widget_volume3d_name: 'تصيير الحجم ثلاثي الأبعاد', widget_volume3d_desc: 'عرض حقول الكثافة الحجمية مع تخصيص الشفافية',
    widget_cone3d_name: 'مخطط مخروطي ثلاثي الأبعاد', widget_cone3d_desc: 'مخاريط اتجاهية لحقول المتجهات في محاكاة التدفق ثلاثي الأبعاد',
    widget_streamtube3d_name: 'أنابيب التدفق ثلاثية الأبعاد', widget_streamtube3d_desc: 'خطوط وأنابيب سرعة التدفق في فضاء ثلاثي الأبعاد',
    widget_isosurface3d_name: 'السطح المتساوي ثلاثي الأبعاد', widget_isosurface3d_desc: 'أسطح ذات كثافة ثابتة في مجموعات البيانات القياسية ثلاثية الأبعاد',

    // Data Lab & Data Cleaning
    labActingOn: 'التطبيق على',
    labQuickCommands: 'الأوامر السريعة',
    labSearchPlaceholder: 'اكتب أمراً أو إجراء عمود أو كلمة مفتاحية…',
    labAllActions: 'كافة الأوامر',
    labClosePalette: 'إغلاق لوحة الأوامر',
    labNoMatchingCommands: 'لم يتم العثور على أوامر مطابقة.',
    labRequiresColumn: 'اختر عموداً أولاً',
    labRequiresNumber: 'يتطلب عموداً رقمياً',
    labRequiresDate: 'يتطلب عمود تاريخ',
    labSelectColumnFirst: 'اختر عموداً أولاً',
    labGroupClean: 'تنظيف',
    labGroupCleanBlurb: 'إصلاح النصوص والقيم الفارغة والأخطاء',
    labGroupRows: 'الصفوف',
    labGroupRowsBlurb: 'فرز الصفوف وإزالة التكرار والتصفية',
    labGroupColumns: 'الأعمدة',
    labGroupColumnsBlurb: 'تقسيم ودمج وإعادة تسمية وترتيب الأعمدة',
    labGroupCompute: 'حساب',
    labGroupComputeBlurb: 'حساب أعمدة جديدة وتقريب الأرقام واستخراج التواريخ',

    labAction_trim_label: 'إزالة المسافات الزائدة', labAction_trim_hint: 'حذف المسافات في بداية ونهاية النص',
    labAction_clean_label: 'تنظيف الأحرف غير المطبوعة', labAction_clean_hint: 'إزالة محارف التحكم المخفية',
    labAction_upper_label: 'أحرف كبيرة UPPER', labAction_upper_hint: 'تحويل النص إلى أحرف كبيرة',
    labAction_lower_label: 'أحرف صغيرة lower', labAction_lower_hint: 'تحويل النص إلى أحرف صغيرة',
    labAction_title_label: 'حرف استهلالي كبير', labAction_title_hint: 'تكبير الحرف الأول من كل كلمة',
    labAction_replace_label: 'استبدال القيم', labAction_replace_hint: 'البحث عن القيم واستبدالها كلياً أو جزئياً',
    labAction_nulls_label: 'تعبئة / استبدال القيم الفارغة', labAction_nulls_hint: 'استبدال الخلايا الفارغة بصفر أو متوسط أو وسيط أو قيمة مخصصة',
    labAction_errors_label: 'استبدال الأخطاء', labAction_errors_hint: 'استبدال أخطاء التحويل بقيمة آمنة',
    labAction_filldown_label: 'تعبئة لأسفل', labAction_filldown_hint: 'نسخ القيمة غير الفارغة السابقة إلى الأسفل',
    labAction_fillup_label: 'تعبئة لأعلى', labAction_fillup_hint: 'نسخ القيمة غير الفارغة التالية إلى الأعلى',
    labAction_sortasc_label: 'فرز تصاعدي A←Z', labAction_sortasc_hint: 'فرز الصفوف تصاعدياً حسب العمود المحدد',
    labAction_sortdesc_label: 'فرز تنازلي Z←A', labAction_sortdesc_hint: 'فرز الصفوف تنازلياً حسب العمود المحدد',
    labAction_dupes_label: 'إزالة التكرارات', labAction_dupes_hint: 'حذف الصفوف المكررة عبر الأعمدة المحددة',
    labAction_removeblank_label: 'حذف الصفوف الفارغة', labAction_removeblank_hint: 'إزالة الصفوف التي تخلو جميع خلاياها من القيم',
    labAction_keeptop_label: 'الإبقاء على الصفوف العليا', labAction_keeptop_hint: 'الاحتفاظ بأول N صفوف وحذف الباقي',
    labAction_keepbottom_label: 'الإبقاء على الصفوف السفلى', labAction_keepbottom_hint: 'الاحتفاظ بآخر N صفوف وحذف الباقي',
    labAction_keeprange_label: 'الإبقاء على نطاق صفوف', labAction_keeprange_hint: 'الاحتفاظ بشريحة متصلة من الصفوف',
    labAction_removetop_label: 'حذف الصفوف العليا', labAction_removetop_hint: 'إسقاط أول N صفوف من الجدول',
    labAction_removebottom_label: 'حذف الصفوف السفلى', labAction_removebottom_hint: 'إسقاط آخر N صفوف من الجدول',
    labAction_removealt_label: 'حذف صفوف متناوبة', labAction_removealt_hint: 'إزالة صفوف بنمط متكرر',
    labAction_split_label: 'تقسيم العمود', labAction_split_hint: 'التقسيم حسب الفاصل أو عدد الأحرف أو المواضع',
    labAction_merge_label: 'دمج الأعمدة', labAction_merge_hint: 'دمج عدة أعمدة بفاصل محدد',
    labAction_rename_label: 'إعادة تسمية العمود', labAction_rename_hint: 'تغيير اسم ترويسة العمود',
    labAction_duplicate_label: 'تكرار العمود', labAction_duplicate_hint: 'إنشاء نسخة مطابقة من العمود',
    labAction_left_label: 'تحريك للبداية', labAction_left_hint: 'نقل العمود خطوة نحو البداية',
    labAction_right_label: 'تحريك للنهاية', labAction_right_hint: 'نقل العمود خطوة نحو النهاية',
    labAction_remove_label: 'إزالة العمود', labAction_remove_hint: 'حذف العمود المحدد من الجدول',
    labAction_custom_label: 'إضافة عمود محسوب', labAction_custom_hint: 'حساب عمود جديد من الحقول الحالية',
    labAction_math_label: 'عملية حسابية', labAction_math_hint: 'جمع أو طرح أو ضرب أو قسمة أو باقي',
    labAction_round_label: 'تقريب عشري', labAction_round_hint: 'تقريب الأرقام إلى N خانات عشرية',
    labAction_roundup_label: 'تقريب للأعلى', labAction_roundup_hint: 'تقريب الأرقام لأقرب عدد صحيح أعلى',
    labAction_rounddown_label: 'تقريب للأسفل', labAction_rounddown_hint: 'تقريب الأرقام لأقرب عدد صحيح أدنى',
    labAction_abs_label: 'القيمة المطلقة', labAction_abs_hint: 'تحويل الأرقام السالبة إلى موجبة',
    labAction_date_year_label: 'استخراج السنة', labAction_date_year_hint: 'استبدال التاريخ بالسنة المكونة من 4 أرقام',
    labAction_date_month_label: 'استخراج الشهر', labAction_date_month_hint: 'استبدال التاريخ برقم الشهر (1-12)',
    labAction_date_month_name_label: 'استخراج اسم الشهر', labAction_date_month_name_hint: 'استبدال التاريخ باسم الشهر',
    labAction_date_quarter_label: 'استخراج الربع', labAction_date_quarter_hint: 'استبدال التاريخ بربع السنة (1-4)',
    labAction_date_day_label: 'استخراج اليوم', labAction_date_day_hint: 'استبدال التاريخ بيوم الشهر (1-31)',
    labAction_date_day_name_label: 'استخراج اسم اليوم', labAction_date_day_name_hint: 'استبدال التاريخ باسم يوم الأسبوع',

    labInspectorColumnTitle: 'ملف العمود',
    labInspectorHealthTitle: 'صحة البيانات',
    labInspectorSelectColHint: 'انقر على أي ترويسة عمود في الجدول لفحص خصائصه والإصلاحات المقترحة.',
    labInspectorProfile: 'الملف الإحصائي',
    labInspectorNulls: 'فارغ / Null',
    labInspectorErrors: 'أخطاء',
    labInspectorDistinct: 'قيم مميزة',
    labInspectorMin: 'الأدنى',
    labInspectorMax: 'الأعلى',
    labInspectorMean: 'المتوسط',
    labInspectorMostCommon: 'الأكثر شيوعاً',
    labInspectorTopValues: 'أبرز القيم',
    labInspectorSuggestedFixes: 'إصلاحات مقترحة',
    labInspectorApply: 'تطبيق',
    labInspectorNoFixes: 'هذا العمود يبدو نظيفاً — لم يتم رصد أي مشاكل واضحة.',
    labInspectorTableSummary: 'ملخص الجدول',
    labInspectorDuplicateRows: 'تم رصد {count} صفوف مكررة',
    labInspectorRemoveDupesBtn: 'إزالة الصفوف المكررة',
    labFixTrimTitle: 'إزالة المسافات الزائدة',
    labFixTrimDetail: 'توجد مسافات بادئة أو لاحقة في {count} قيمة.',
    labFixNullsTitle: 'استبدال القيم الفارغة',
    labFixNullsDetail: 'توجد {count} خلية فارغة أو Null.',
    labFixErrorsTitle: 'استبدال أخطاء التحويل',
    labFixErrorsDetail: 'فشل تحويل النوع في {count} خلية.',
    labFixCaseTitle: 'توحيد حالة الأحرف',
    labFixCaseDetail: 'تم رصد تباين في حالة الأحرف (مثل "{a}" و "{b}").',
    labFixDupesTitle: 'إزالة الصفوف المكررة',
    labFixDupesDetail: 'توجد {count} صفوف مكررة في الجدول.',

    labStatusMCode: 'معادلة M',
    labStatusCopyCode: 'نسخ كود M',
    labStatusCopiedCode: 'تم النسخ!',
    labStatusSelectedCell: 'الخلية المحددة',

    labRailViewingStep: 'معاينة الخطوة',
    labRailJumpLatest: 'الأحدث',
    labRailSourceSize: '{rows} صف × {cols} عمود',
    labRailMoveUp: 'تحريك الخطوة لأعلى',
    labRailMoveDown: 'تحريك الخطوة لأسفل',
    labRailRename: 'إعادة تسمية الخطوة',
    labRailEditSettings: 'تعديل إعدادات الخطوة',
    labRailDeleteStep: 'حذف الخطوة',
    labRailRenameQuery: 'إعادة تسمية الاستعلام',
    labRailDeltaAddedRows: '+{n} صف',
    labRailDeltaRemovedRows: '−{n} صف',
    labRailDeltaAddedCols: '+{n} عمود',
    labRailDeltaRemovedCols: '−{n} عمود',
    labRailDeltaNoChange: 'لا تغيير في الأبعاد',

    labStepType_source: 'المصدر',
    labStepType_changed_type: 'تغيير النوع',
    labStepType_promoted_headers: 'ترقية الترويسات',
    labStepType_removed_columns: 'إزالة أعمدة',
    labStepType_renamed_column: 'إعادة تسمية عمود',
    labStepType_duplicated_column: 'تكرار عمود',
    labStepType_reordered_columns: 'إعادة ترتيب الأعمدة',
    labStepType_split_column: 'تقسيم عمود',
    labStepType_merged_columns: 'دمج أعمدة',
    labStepType_filter_rows: 'تصفية الصفوف',
    labStepType_sort_rows: 'فرز الصفوف',
    labStepType_removed_top_rows: 'حذف الصفوف العليا',
    labStepType_removed_bottom_rows: 'حذف الصفوف السفلى',
    labStepType_removed_alternate_rows: 'حذف صفوف متناوبة',
    labStepType_kept_top_rows: 'الإبقاء على العليا',
    labStepType_kept_bottom_rows: 'الإبقاء على السفلى',
    labStepType_kept_range_rows: 'الإبقاء على نطاق',
    labStepType_remove_duplicates: 'إزالة التكرارات',
    labStepType_remove_blank_rows: 'حذف الصفوف الفارغة',
    labStepType_replace_values: 'استبدال القيم',
    labStepType_replace_errors: 'استبدال الأخطاء',
    labStepType_fill_down: 'تعبئة لأسفل',
    labStepType_fill_up: 'تعبئة لأعلى',
    labStepType_transform_text: 'تحويل نصي',
    labStepType_transform_number: 'تحويل رقمي',
    labStepType_transform_date: 'استخراج تاريخ',
    labStepType_added_custom_column: 'عمود محسوب',

    labTabsNewQuery: 'استعلام جديد',
    labTabsCloseTab: 'إغلاق التبويب',

    labGridClickRowTip: 'انقر لتحديد الصف {row}. اضغط Shift لتحديد نطاق. انقر بالزر الأيمن للخيارات.',
    labGridClickCellTip: 'الخلية [{col}، الصف {row}]. انقر للتحديد واستخدم الأسهم للتنقل.',
    labGridSelectAllTip: 'تحديد أو إلغاء تحديد جميع الصفوف الظاهرة',
    labGridCount: 'العدد:',
    labGridSum: 'المجموع:',
    labGridAvg: 'المتوسط:',
    labGridMin: 'الأدنى:',
    labGridMax: 'الأعلى:',
    labGridDistinct: 'المميز:',
    labGridEmpty: 'الفارغ:',
    labGridCopiedTsv: 'تم النسخ TSV',
    labGridCtrlCCopy: 'Ctrl+C للنسخ',
    labGridSortAsc: 'فرز تصاعدي',
    labGridSortDesc: 'فرز تنازلي',
    labGridClearSort: 'إلغاء الفرز',
    labGridTextFilters: 'تصفية النص',
    labGridNumberFilters: 'تصفية الأرقام',
    labGridSearchValues: 'بحث في القيم...',
    labGridSelectAllValues: '(تحديد الكل)',
    labGridClearAllValues: 'مسح',
    labGridNoMatches: 'لا توجد قيم مطابقة',
    labGridColumnMenuTip: 'تصفية وفرز وفحص خيارات العمود',

    manageRowsRemoveTopTitle: 'حذف الصفوف العليا',
    manageRowsRemoveTopDesc: 'حدد عدد الصفوف المراد حذفها من أعلى الجدول.',
    manageRowsRemoveBottomTitle: 'حذف الصفوف السفلى',
    manageRowsRemoveBottomDesc: 'حدد عدد الصفوف المراد حذفها من أسفل الجدول.',
    manageRowsRemoveBlankTitle: 'حذف الصفوف الفارغة',
    manageRowsRemoveBlankDesc: 'حذف جميع الصفوف التي تحتوي فقط على قيم فارغة أو Null.',
    manageRowsRemoveAltTitle: 'حذف الصفوف المتناوبة',
    manageRowsRemoveAltDesc: 'حذف أنماط متناوبة من الصفوف في مجموعة البيانات.',
    manageRowsKeepTopTitle: 'الإبقاء على الصفوف العليا',
    manageRowsKeepTopDesc: 'الاحتفاظ بعدد محدد من الصفوف من أعلى الجدول وحذف الباقي.',
    manageRowsKeepBottomTitle: 'الإبقاء على الصفوف السفلى',
    manageRowsKeepBottomDesc: 'الاحتفاظ بعدد محدد من الصفوف من أسفل الجدول وحذف الباقي.',
    manageRowsKeepRangeTitle: 'الإبقاء على نطاق صفوف',
    manageRowsKeepRangeDesc: 'الاحتفاظ بشريحة متصلة من الصفوف بدءاً من موضع صف محدد.',
    manageRowsCountRemove: 'عدد الصفوف المراد حذفها',
    manageRowsCountKeep: 'عدد الصفوف المراد الإبقاء عليها',
    manageRowsCurrentTotal: 'إجمالي الصفوف حالياً: {total}',
    manageRowsStartIndex: 'رقم صف البداية (بدءاً من 1)',
    manageRowsFirstToRemove: 'أول صف للحذف',
    manageRowsApply: 'تطبيق',

    mergeModalTitle: 'دمج الأعمدة',
    mergeSelectColumns: 'اختر الأعمدة المراد دمجها بالترتيب (تم تحديد {count})',
    mergeMinTwoWarning: 'يرجى تحديد عمودين على الأقل للدمج.',
    mergeSeparatorLabel: 'الفاصل',
    mergeSepSpace: 'مسافة ( )',
    mergeSepComma: 'فاصلة ( , )',
    mergeSepDash: 'شرطة ( - )',
    mergeSepSemicolon: 'فاصلة منقوطة ( ; )',
    mergeSepNone: 'بدون فاصل',
    mergeSepCustom: 'فاصل مخصص',
    mergeNewColName: 'اسم العمود الجديد',
    mergeNewColPlaceholder: 'مثال: الاسم الكامل',
    mergeCustomSepLabel: 'نص الفاصل المخصص',
    mergeCustomSepPlaceholder: 'مثال: / أو | أو _',
    mergeDropOriginals: 'حذف الأعمدة الأصلية بعد الدمج',
    mergePreviewLabel: 'معاينة:',
    mergeEmptyCell: 'فارغ',
    mergeSubmitBtn: 'دمج الأعمدة',

    removeDupesTitle: 'إزالة التكرارات',
    removeDupesDesc: 'اختر الأعمدة المستخدمة لتحديد الصفوف المكررة. ستتم إزالة الصفوف المتطابقة مع الإبقاء على الظهور الأول فقط.',
    removeDupesSelectedOf: 'تم تحديد {selected} من أصل {total} عموداً',
    removeDupesSelectAll: 'تحديد الكل',
    removeDupesClearAll: 'مسح الكل',
    removeDupesSubmitBtn: 'إزالة التكرارات',

    replaceValuesTitle: 'استبدال القيم في',
    replaceValuesFindLabel: 'القيمة المراد البحث عنها',
    replaceValuesFindPlaceholder: 'مثال: USA أو null',
    replaceValuesNullHint: 'اكتب null لاستهداف الخلايا الفارغة.',
    replaceValuesWithLabel: 'الاستبدال بـ',
    replaceValuesWithPlaceholder: 'مثال: الولايات المتحدة',
    replaceValuesMatchEntire: 'مطابقة كامل محتوى الخلية',
    replaceValuesMatchSubstring: 'استبدال النص الجزئي داخل الخلية',
    replaceValuesAffectedLabel: 'الصفوف المتأثرة في العرض الحالي:',
    replaceValuesSubmitBtn: 'استبدال القيم',

    splitColTitle: 'تقسيم العمود:',
    splitByLabel: 'التقسيم حسب',
    splitModeDelimiter: 'الفاصل',
    splitModeChars: 'عدد الأحرف',
    splitModePositions: 'المواضع',
    splitSelectDelimiter: 'اختر أو أدخل الفاصل',
    splitDelimSpace: 'مسافة ( )',
    splitDelimComma: 'فاصلة (,)',
    splitDelimSemicolon: 'فاصلة منقوطة (;)',
    splitDelimColon: 'نقطتان (:)',
    splitDelimTab: 'علامة جدولة (\\t)',
    splitDelimCustom: 'مخصص',
    splitCustomDelimLabel: 'محرف الفاصل المخصص',
    splitAtLabel: 'التقسيم عند',
    splitAtLeftmost: 'أول فاصل من البداية',
    splitAtRightmost: 'آخر فاصل من النهاية',
    splitAtEvery: 'كل ظهور للفاصل',
    splitCharCountLabel: 'عدد الأحرف',
    splitPositionsLabel: 'المواضع (مؤشرات مفصولة بفاصلة)',
    splitPositionsHint: 'مؤشرات الأحرف بدءاً من الصفر حيث سيتم تقسيم العمود.',
    splitPreviewTitle: 'معاينة النتيجة المباشرة',
    splitGeneratesCols: 'يُنشئ {count} أعمدة',
    splitSubmitBtn: 'تقسيم العمود',

    transformPrefixTitle: 'إضافة بادئة',
    transformPrefixLabel: 'نص البادئة المضاف في البداية',
    transformSuffixTitle: 'إضافة لاحقة',
    transformSuffixLabel: 'نص اللاحقة المضاف في النهاية',
    transformExtractFirstTitle: 'استخراج الأحرف الأولى',
    transformExtractFirstLabel: 'عدد الأحرف الأولى للاحتفاظ بها',
    transformExtractLastTitle: 'استخراج الأحرف الأخيرة',
    transformExtractLastLabel: 'عدد الأحرف الأخيرة للاحتفاظ بها',
    transformExtractRangeTitle: 'استخراج نطاق أحرف',
    transformExtractRangeStart: 'موضع البداية (بدءاً من 1)',
    transformExtractRangeLength: 'عدد الأحرف المراد استخراجها',
    transformExtractBeforeTitle: 'استخراج النص قبل الفاصل',
    transformExtractAfterTitle: 'استخراج النص بعد الفاصل',
    transformDelimiterLabel: 'الفاصل',
    transformMathTitle: 'عملية حسابية على {col}',
    transformMathOpLabel: 'العملية',
    transformMathValLabel: 'القيمة',
    transformOpAdd: 'جمع (+)',
    transformOpSub: 'طرح (-)',
    transformOpMul: 'ضرب (*)',
    transformOpDiv: 'قسمة (/)',
    transformOpMod: 'باقي القسمة (%)',
    transformRoundTitle: 'تقريب الأرقام العشرية',
    transformRoundLabel: 'عدد الخانات العشرية',
    transformReplaceErrorsTitle: 'استبدال الأخطاء في {col}',
    transformReplaceErrorsLabel: 'القيمة البديلة للأخطاء',
    transformReplaceNullsTitle: 'استبدال القيم الفارغة في {col}',
    transformNullStrategyLabel: 'اختر استراتيجية الاستبدال',
    transformNullZero: 'الاستبدال بالرقم 0',
    transformNullCustom: 'الاستبدال بقيمة مخصصة',
    transformNullAvg: 'الاستبدال بمتوسط العمود',
    transformNullMedian: 'الاستبدال بوسيط العمود',
    transformNullMin: 'الاستبدال بالحد الأدنى للعمود',
    transformNullMax: 'الاستبدال بالحد الأقصى للعمود',
    transformNullFillDown: 'تعبئة لأسفل (من الصف غير الفارغ السابق)',
    transformNullFillUp: 'تعبئة لأعلى (من الصف غير الفارغ التالي)',
    transformCustomValLabel: 'القيمة المخصصة',
    transformRenameStepTitle: 'إعادة تسمية الخطوة المطبقة',
    transformRenameStepLabel: 'اسم الخطوة',
    transformRenameColTitle: 'إعادة تسمية العمود',
    transformRenameColLabel: 'اسم العمود الجديد',
    transformCustomColTitle: 'إضافة عمود محسوب مخصص',
    transformOkBtn: 'موافق',

    labPageUnnamedQuery: 'استعلام بدون اسم',
    labPageLoadDatasetError: 'تعذر تحميل مجموعة البيانات.',
    labPageSaveError: 'فشل حفظ تعديلات مجموعة البيانات. يرجى المحاولة مرة أخرى.',

    // Data Model & Modals
    dmStatsSummary: '{facts} ملفات رئيسية • {dims} ملفات تفاصيل • {rels} روابط • {datasets} ملفات متصلة',
    dmDimDateTitle: 'أنشئ جدول تقويم جاهز للمقارنة حسب الشهر والسنة',
    dmMeasuresTitle: 'إدارة المجاميع السريعة المحفوظة',
    dmValidationTitle: 'فحص هل تتطابق جداولك المربوطة بشكل سليم',
    dmVersionsTitle: 'نسخ احتياطية للروابط',
    dmZoomOut: 'تصغير',
    dmZoomIn: 'تكبير',
    dmResetView: 'إعادة ضبط العرض',
    dmLegendTitle: 'كيف تعمل الروابط',
    dmLegendFact: 'ملف المبيعات / الطلبات (الأرقام والمبالغ)',
    dmLegendDim: 'ملف التفاصيل (العملاء، المنتجات، التواريخ)',
    dmLegendJoin: 'اتجاه المطابقة بين الملفين',
    dmEmptyTitle: 'لا توجد روابط بين الجداول بعد',
    dmEmptyNoDatasetsDesc: 'اختر ملفات بيانات لهذه اللوحة أولاً.',
    dmEmptyReadyDesc: 'ملفاتك جاهزة. اضغط على «+ ملف المبيعات / الطلبات» أو «+ ملف التفاصيل» أو «ربط الملفات تلقائياً» لربطها معاً.',
    dmBackToSelectDatasets: 'العودة للوحة واختيار الملفات',

    dmCardCollapse: 'تصغير البطاقة',
    dmCardExpand: 'توسيع البطاقة',
    dmCardRemoveTable: 'إزالة الملف',
    dmCardPrimaryKey: 'عمود المعرّف (ID)',
    dmCardForeignKeys: 'الأعمدة المطابقة',
    dmCardMeasures: 'الأرقام المراد قياسها',
    dmCardAttributes: 'أعمدة التفاصيل',
    dmCardHierarchies: 'مستويات التاريخ والتجميع',
    dmCardFooterFact: '{measures} أرقام، {keys} روابط',
    dmCardFooterDim: '{fields} أعمدة',

    dmDimModalTitle: 'تجهيز ملف تفاصيل',
    dmDimModalDesc: 'اختر عمود المعرّف الفريد وأعمدة التفاصيل (مثل اسم العميل أو المدينة أو التصنيف)',
    dmSourceDataset: 'اختر الملف',
    dmDimTableName: 'اسم الجدول',
    dmUniquePrimaryKey: 'عمود المعرّف الفريد (قيمة واحدة لكل صف)',
    dmIncludedAttributes: 'أعمدة التفاصيل المضمنة',
    dmSelectAll: 'تحديد الكل',
    dmClearOptional: 'مسح الاختياري',
    dmCreateDimBtn: 'إضافة ملف التفاصيل',
    dmRowsSuffix: 'صفاً',

    dmFactModalTitle: 'تجهيز ملف المبيعات / الطلبات الرئيسي',
    dmFactModalDesc: 'اختر الأرقام التي تريد جمعها (مثل المبيعات أو الكمية) والأعمدة التي تطابق ملفات التفاصيل',
    dmFactTableName: 'اسم الجدول',
    dmOptionalPrimaryKey: 'عمود رقم الطلب / الصف (اختياري)',
    dmNoCompositeKey: '(غير مطلوب)',
    dmForeignKeysLabel: 'الأعمدة المطابقة (لربط ملفات التفاصيل)',
    dmMeasuresLabel: 'الأعمدة الرقمية للقياس',
    dmCreateFactBtn: 'إضافة الملف الرئيسي',

    dmRelModalCreateTitle: 'ربط ملفين معاً',
    dmRelModalEditTitle: 'تعديل الربط',
    dmRelModalDesc: 'صل ملف تفاصيل (مثل العملاء) بملف المبيعات أو الطلبات عبر عمود مشترك بينهما',
    dmRelFromDim: 'ملف التفاصيل',
    dmRelToFact: 'ملف المبيعات / الطلبات الرئيسي',
    dmRelSelectTable: 'اختر ملفاً',
    dmRelSelectCol: 'اختر العمود المشترك',
    dmRelFromTableLabel: 'الملف الأول (التفاصيل)',
    dmRelFromColLabel: 'العمود المشترك',
    dmRelToTableLabel: 'الملف الثاني (المبيعات / الطلبات)',
    dmRelToColLabel: 'العمود المشترك',
    dmRelCardinalityLabel: 'نوع المطابقة',
    dmRelOneToMany: 'واحد إلى متعدد (الأكثر شيوعاً)',
    dmRelOneToManySub: 'عميل أو منتج واحد يطابق عدة طلبات',
    dmRelManyToOne: 'متعدد إلى واحد',
    dmRelManyToOneSub: 'عدة طلبات تطابق عميلاً أو منتجاً واحداً',
    dmRelOneToOne: 'واحد إلى واحد',
    dmRelOneToOneSub: 'صف واحد يطابق صفاً واحداً',
    dmRelValidVerified: 'ممتاز! جميع القيم المشتركة متطابقة ونظيفة تماماً.',
    dmRelCreateBtn: 'حفظ الربط',
    dmRelUpdateBtn: 'حفظ التعديلات',
    dmRelErrBothTables: 'يرجى اختيار كلا الملفين.',
    dmRelErrSelfRel: 'يرجى اختيار ملفين مختلفين للربط.',
    dmRelErrBothCols: 'يرجى اختيار العمود المشترك في كلا الملفين.',
    dmRelErrDuplicate: 'هذان الملفان مربوطان ببعضهما بالفعل.',
    dmRelWarnDupKeys: "العمود '{col}' في '{table}' يحتوي على قيم مكررة — قد يؤدي ذلك لمضاعفة المجاميع عند الربط.",
    dmRelWarnOrphansPct: "{pct}% من الصفوف في '{toTable}' تحتوي على قيم في '{toCol}' غير موجودة في '{fromTable}'.",
    dmRelWarnOrphansCount: '{count} صفاً ({pct}%) ليس لها تطابق في الملف الآخر.',
    dmRelWarnTypeMismatch: "اختلاف في نوع العمود: '{fromCol}' نوعه {fromType} بينما '{toCol}' نوعه {toType}.",

    dmDateModalTitle: 'إضافة جدول تواريخ (تقويم)',
    dmDateModalDesc: 'ينشئ جدول تقويم جاهزاً (السنة، الربع، الشهر، اليوم) لترتيب رسومك حسب الوقت بسهولة',
    dmDateStartYear: 'سنة البداية',
    dmDateEndYear: 'سنة النهاية',
    dmDateSchemaPreview: 'أعمدة التاريخ الجاهزة',
    dmDateEstimatedRows: 'حوالي {days} يوماً',
    dmDateUniqueKeys: 'جميع التواريخ فريدة',
    dmDateBestPractice: 'نصيحة: ربط ملف المبيعات بجدول التقويم يسهّل مقارنة الأشهر والأرباع والسنوات جنباً إلى جنب.',
    dmDateGenerateBtn: 'إنشاء جدول التقويم',

    dmMeasuresModalTitle: 'المجاميع السريعة المحفوظة',
    dmMeasuresModalDesc: 'احفظ حسابات جاهزة (مثل إجمالي المبيعات، متوسط الطلب، أو هامش الربح) لاستخدامها في أي رسم',
    dmMeasuresExisting: 'مجاميعك المحفوظة ({count})',
    dmMeasuresNone: 'لا توجد مجاميع محفوظة بعد. أنشئ واحداً بالأسفل بدون معادلات.',
    dmMeasuresCreateNew: 'إنشاء مجموع سريع',
    dmMeasuresNameLabel: 'الاسم',
    dmMeasuresNamePlaceholder: 'مثال: إجمالي المبيعات أو هامش الربح',
    dmMeasuresAggLabel: 'طريقة الحساب',
    dmMeasuresTargetTable: 'من أي ملف',
    dmMeasuresTargetCol: 'العمود المراد حسابه',
    dmMeasuresNumerator: 'الرقم العلوي (البسط)',
    dmMeasuresDenominator: 'الرقم السفلي (المقام)',
    dmMeasuresSelectDenom: 'اختر مجموعاً محفوظاً...',
    dmMeasuresFormatLabel: 'شكل العرض',
    dmMeasuresCurrencyLabel: 'رمز العملة',
    dmMeasuresGeneratedFormula: 'الملخص',
    dmMeasuresAddBtn: 'حفظ المجموع السريع',
    dmMeasuresDoneBtn: 'تم',
    dmMeasuresDeleteTip: 'إزالة',
    dmAggSumDesc: 'المجموع (جمع كل الأرقام)',
    dmAggAvgDesc: 'المتوسط (معدل القيمة لكل صف)',
    dmAggCountDesc: 'العدد (عدد الصفوف)',
    dmAggDistinctDesc: 'العدد بدون تكرار',
    dmAggMinDesc: 'أقل قيمة',
    dmAggMaxDesc: 'أعلى قيمة',
    dmAggDivideDesc: 'قسمة رقمين (ممتاز لنسبة هامش الربح %)',
    dmFmtCurrencyOpt: 'عملة ($1,250.00)',
    dmFmtPercentOpt: 'نسبة مئوية (34.5%)',
    dmFmtCompactOpt: 'مبالغ مختصرة ($1.2M / $45K)',
    dmFmtNumberOpt: 'رقم عادي (1,250)',

    dmValidationDrawerTitle: 'فحص صحة الروابط',
    dmValidationDrawerDesc: 'يتأكد من أن الملفات المربوطة تتطابق بسلاسة وبدون أخطاء',
    dmValidationScoreLabel: 'نتيجة صحة الروابط',
    dmValidationChecksPassed: '{passed} من أصل {total} فحوصات تبدو ممتازة',
    dmValidationObservations: '{count} ملاحظة',
    dmValidationCorePassed: 'الروابط بين ملفاتك سليمة!',
    dmValidationCorePassedDesc: 'جداولك متصلة بنظافة بحيث تعرض الرسوم البيانات من الملفين بدقة.',
    dmValidationPerfectTitle: 'كل شيء متطابق تماماً!',
    dmValidationPerfectDesc: 'لا توجد قيم ناقصة أو روابط مكررة.',
    dmValidationObsHeading: 'اقتراحات للتحسين',
    dmValidationRecommendation: 'نصيحة:',
    dmValidationCloseBtn: 'إغلاق',

    dmVersionsModalTitle: 'النسخ الاحتياطية للروابط',
    dmVersionsModalDesc: 'احفظ نقطة رجوع أو استعد إعداداً سابقاً بضغطة زر',
    dmVersionsSnapshotTitle: 'حفظ نقطة رجوع حالية',
    dmVersionsNameLabel: 'الاسم',
    dmVersionsNotesLabel: 'ملاحظات (اختياري)',
    dmVersionsSaveBtn: 'حفظ نقطة الرجوع',
    dmVersionsHistoryTitle: 'النسخ المحفوظة ({count})',
    dmVersionsNone: 'لا توجد نسخ محفوظة بعد. احفظ نسخة أعلاه للرجوع إليها بسهولة لاحقاً.',
    dmVersionsRevertBtn: 'استعادة',
    dmVersionsConfirmRevert: "العودة إلى '{name}'؟",
    dmVersionsConfirmYes: 'نعم، استعادة',
    dmVersionsFacts: '{count} رئيسي',
    dmVersionsDims: '{count} تفاصيل',
    dmVersionsRels: '{count} روابط',
    dmVersionsMeasures: '{count} مجاميع',

    dmSuggestModalTitle: 'روابط مقترحة بين ملفاتك',
    dmSuggestModalDesc: 'فحصنا أسماء الأعمدة في ملفاتك ووجدنا جداول متوافقة',
    dmSuggestConfidence: 'جودة التطابق: {level} ({score}%)',
    dmSuggestConfidenceHigh: 'قوية',
    dmSuggestConfidenceMedium: 'جيدة',
    dmSuggestConfidenceLow: 'محتملة',
    dmSuggestFactsTitle: 'ملفات المبيعات / النشاط ({count})',
    dmSuggestDimsTitle: 'ملفات التفاصيل ({count})',
    dmSuggestRelsTitle: 'الروابط المقترحة ({count})',
    dmSuggestLogicTitle: 'لماذا اقترحنا هذا الربط',
    dmSuggestRejectBtn: 'تخطي والربط يدوياً',
    dmSuggestApplyBtn: 'تطبيق الروابط المقترحة',
    dmSuggestMatchPct: 'تطابق {pct}%',
    dmSuggestMeasuresCount: '{count} مجاميع',
    dmSuggestFkCount: '{count} روابط',
    dmSuggestAttrCount: '{count} أعمدة',

    featTabHubLabel: 'رفع وتنظيم الملفات',
    featTabHubTitle: 'ارفع ملفاتك مرة واحدة واستخدمها في كل مكان',
    featTabHubDesc: 'ارفع ملفات إكسل أو CSV مرة واحدة إلى مركز البيانات واستخدمها في أي لوحة تحكم أو توقع أو تقرير PDF بدون إعادة رفع.',
    featTabHubH1: 'ملفاتك تبقى خاصة وآمنة داخل مساحة عملك الشخصية',
    featTabHubH2: 'تعرّف تلقائي على الأعمدة والأرقام مع معاينة فورية للصفوف',
    featTabHubH3: 'ملفك الأصلي يبقى محفوظاً دائماً عند التنظيف أو التوقع',
    featTabHubH4: 'يعمل بسلاسة مع ملفات Excel (.xlsx/.xls) وCSV وTSV وJSON',
    featTabHubBadge: 'مركز البيانات',

    featTabExploreLabel: 'تنظيف البيانات بصرياً',
    featTabExploreTitle: 'رتّب الجداول غير المنظمة خطوة بخطوة',
    featTabExploreDesc: 'احذف التكرارات، صحّح الأخطاء، أزل المسافات الزائدة، واملأ الخلايا الفارغة بأزرار واضحة — وكل خطوة يمكنك التراجع عنها في أي وقت.',
    featTabExploreH1: 'سجل خطوات واضح يمكنك تعديله أو التراجع عنه في أي وقت',
    featTabExploreH2: 'يتعرف تلقائياً على التواريخ والمبالغ والأرقام والنصوص',
    featTabExploreH3: 'شريط صحة فوري يوضح الخلايا السليمة والفارغة والأخطاء',
    featTabExploreH4: 'عمليات حسابية وتنظيف نصوص وتنسيق تواريخ وتصفية صفوف بسهولة',
    featTabExploreBadge: 'مختبر البيانات',

    featTabModelLabel: 'ربط الملفات معاً',
    featTabModelTitle: 'ادمج الملفات المرتبطة بدون معادلات',
    featTabModelDesc: 'تعمل على ملفين مثل الطلبات والعملاء؟ اربطهما بصرياً عبر عمود مشترك — تماماً مثل VLOOKUP بدون كتابة أي معادلة.',
    featTabModelH1: 'يقترح تلقائياً الأعمدة المتطابقة بين ملفاتك',
    featTabModelH2: 'جدول تقويم بنقرة واحدة لمقارنة الأشهر والأرباع والسنوات',
    featTabModelH3: 'بطاقات بصرية بسيطة توضح كيف تتصل ملفاتك ببعضها',
    featTabModelH4: 'احفظ مجاميع جاهزة مثل إجمالي المبيعات أو هامش الربح',
    featTabModelBadge: 'ربط الجداول',

    featTabWidgetsLabel: 'الرسوم ولوحات التحكم',
    featTabWidgetsTitle: 'ابنِ لوحات واضحة بالسحب والنقر',
    featTabWidgetsDesc: 'اختر من أكثر من 30 شكل رسم بياني وبطاقة أرقام وجدول. اجمع المؤشرات والخطوط الزمنية والفلاتر والخرائط في صفحات يفهمها الجميع.',
    featTabWidgetsH1: 'أكثر من 30 نوع رسم بياني وبطاقة أرقام وجداول وخرائط',
    featTabWidgetsH2: 'اختر أي ملف بيانات لكل رسم بدون إعدادات معقدة',
    featTabWidgetsH3: 'فلاتر الصفحة التفاعلية تحدّث جميع الرسوم معاً',
    featTabWidgetsH4: 'تصدير PDF بضغطة زر ووضع عرض أنيق للاجتماعات',
    featTabWidgetsBadge: 'منشئ اللوحات',

    featTabSecLabel: 'الخصوصية والأمان',
    featTabSecTitle: 'بيانات عملك تبقى خاصة بك',
    featTabSecDesc: 'كل ملف ولوحة وتوقع وتقرير يخص حسابك وحدك ويُحفظ بأمان على خادمنا.',
    featTabSecH1: 'دخول خاص بحسابك — لا تُترك بياناتك بشكل مكشوف على المتصفح',
    featTabSecH2: 'جلسات دخول محمية يتم التحقق منها تلقائياً في كل زيارة',
    featTabSecH3: 'حفظ تلقائي مستمر حتى لا تفقد عملك أبداً',
    featTabSecH4: 'تنبيهات مفيدة قبل حذف أي ملف مستخدم داخل لوحة تحكم',
    featTabSecBadge: 'خاص وآمن',

    pricingPerMonth: 'شهرياً',
    pricingPlanFreeName: 'الأساسية',
    pricingPlanFreeBadge: 'مجاني للأبد',
    pricingPlanFreeDesc: 'مناسب لأصحاب الأعمال الصغيرة والطلاب وكل من يبدأ رحلته مع البيانات.',
    pricingPlanFreeCta: 'ابدأ مجاناً',
    pricingPlanFreeF1: 'حتى 5 ملفات جداول مرفوعة',
    pricingPlanFreeF2: 'لوحات تحكم وتقارير غير محدودة',
    pricingPlanFreeF3: 'مختبر البيانات الكامل لتنظيف الجداول',
    pricingPlanFreeF4: 'ربط سهل بين الجداول',
    pricingPlanFreeF5: 'جميع الرسوم القياسية وبطاقات الأرقام',
    pricingPlanFreeF6: 'حفظ سحابي تلقائي',
    pricingPlanFreeF7: 'جولة ترحيبية وإرشادات مبسطة',

    pricingPlanProName: 'الترقية',
    pricingPlanProBadge: 'عرض خاص',
    pricingPlanProOffer: 'وفّر $5 · بدلاً من $30',
    pricingPlanProDesc: 'احصل على عدد غير محدود من الملفات، وربط كامل للجداول، ورسوم ثلاثية الأبعاد، ودعم ذي أولوية.',
    pricingPlanProCta: 'الترقية الآن',
    pricingPlanProF1: 'ملفات وجداول غير محدودة',
    pricingPlanProF2: 'ربط كامل بين الجداول وحفظ المجاميع',
    pricingPlanProF3: 'إنشاء جدول التقويم بنقرة واحدة',
    pricingPlanProF4: 'حسابات مخصصة للربح والنسب',
    pricingPlanProF5: 'رسوم ثلاثية الأبعاد وخرائط تفاعلية',
    pricingPlanProF6: 'تصدير تقارير PDF عالية الدقة',
    pricingPlanProF7: 'مزامنة سحابية خاصة ونسخ احتياطية',
    pricingPlanProF8: 'دعم فني ذو أولوية',

    pricingPlanEntName: 'المؤسسات',
    pricingPlanEntBadge: 'للفرق الكبيرة',
    pricingPlanEntDesc: 'للشركات التي تحتاج مساحات عمل مشتركة للفرق، وربط مصادر خاصة، ودعماً مخصصاً.',
    pricingPlanEntCta: 'تواصل معنا',
    pricingPlanEntF1: 'كل مزايا باقة الترقية',
    pricingPlanEntF2: 'مساحات عمل مشتركة وصلاحيات للفرق',
    pricingPlanEntF3: 'ربط مباشر بقواعد البيانات الخاصة',
    pricingPlanEntF4: 'معالجة سريعة للملفات الكبيرة جداً',
    pricingPlanEntF5: 'مساحة سحابية خاصة ومعزولة بالكامل',
    pricingPlanEntF6: 'سجل نشاطات الفريق وضوابط إضافية',
    pricingPlanEntF7: 'إضافات ورسوم مخصصة للشركة',
    pricingPlanEntF8: 'مسؤول دعم مخصص لفريقك',

    aboutBadge: 'رسالتنا',
    aboutHeroTitle1: 'نجعل أرقام العمل',
    aboutHeroTitle2: 'واضحة للجميع',
    aboutHeroDesc: 'بُني داتا بلس من فكرة بسيطة: فهم مبيعاتك وتنظيف ملفات إكسل ومشاركة التقارير الجميلة يجب أن يكون سريعاً وبسيطاً ومريحاً للجميع.',
    aboutStat1Label: 'صفوف تم تنظيمها',
    aboutStat2Label: 'استجابة فورية',
    aboutStat3Label: 'ثبات واستمرارية الخدمة',
    aboutStat4Label: 'لوحات فرق نشطة',
    aboutStoryEyebrow: 'لماذا أنشأنا داتا بلس',
    aboutStoryTitle: 'جداول البيانات في كل مكان، لكن الإجابات الواضحة يجب ألا تكون صعبة.',
    aboutStoryP1: 'كثيراً ما تشعر الفرق بأنها عالقة بين فوضى جداول إكسل من جهة، وبرامج ثقيلة ومعقدة مصممة فقط لخبراء البيانات من جهة أخرى.',
    aboutStoryP2: 'أنشأنا داتا بلس ليسد هذه الفجوة: افتح متصفحك، ارفع ملفك، نظّف الأعمدة بصرياً، اربط الجداول بدون معادلات، توقّع القادم، وصدّر تقارير PDF مرتبة خلال دقائق.',
    aboutStoryC1: 'ربط بسيط بين الجداول بدون برمجة أو معادلات',
    aboutStoryC2: 'كل خطوة تنظيف محفوظة بوضوح ويمكن التراجع عنها',
    aboutPillar1Title: 'سريع مباشرة في متصفحك',
    aboutPillar1Desc: 'تتحدث الرسوم والفلاتر بسلاسة فورية دون انتظار برامج مكتبية ثقيلة.',
    aboutPillar2Title: 'ارفع مرة واستخدم في كل مكان',
    aboutPillar2Desc: 'احفظ ملفاتك في مركز البيانات واستخدمها في أي لوحة أو تقرير أو توقع بدون تكرار.',
    aboutPillar3Title: 'خصوصية تلقائية بالكامل',
    aboutPillar3Desc: 'ملفاتك ولوحاتك وتوقعاتك خاصة بحسابك وحدك ومحمية بأمان.',
    aboutPillar4Title: 'قوة التحليل بدون تعقيد',
    aboutPillar4Desc: 'احصل على لوحات وتوقعات وتقارير احترافية بدون تثبيت برامج ضخمة أو حفظ معادلات معقدة.',
    aboutCtaTitle: 'ابدأ استكشاف أرقامك اليوم',
    aboutCtaDesc: 'ابدأ مجاناً — تصفح نماذج جاهزة أو ارفع أول ملف جدول خلال ثوانٍ.',

    galleryHeroBadge: 'معرض المخططات البيانية التفاعلي ودليل الاستخدام',
    galleryHeroTitle1: 'نماذج الرسوم البيانية التفاعلية و',
    galleryHeroTitle2: 'دليل اختيار المخطط الأنسب',
    galleryHeroDesc: 'استكشف كتالوج المخططات التحليلية. كل نموذج يتضمن معاينة تفاعلية مباشرة مع شروحات عملية لحالات الاستخدام وأفضل الممارسات.',
    galleryCatAll: 'جميع المخططات',
    galleryKpiTargetLabel: 'الهدف',
    galleryKpiOnTrack: 'في المسار الصحيح',

    tourModalCloseAria: 'إغلاق الجولة',
    tourFinishTour: 'إنهاء الجولة',
    tourBack: 'السابق',
    tourLiveTargetLabel: 'مميز على الشاشة',
    tourGoToDataHub: 'افتح مركز البيانات',
    tourGoToDataLab: 'افتح مختبر البيانات',
    tourGoToDashboards: 'افتح لوحات التحكم',
    tourGoToDataModel: 'افتح ربط الجداول',
    tourGoToForecasts: 'افتح استوديو التوقعات',
    tourGoToGallery: 'تصفح معرض الرسوم',
    tourWhenToUseLabel: 'معلومة مفيدة',
    tourUploadFirstDataset: 'ارفع ملفك الأول',
    tourCreateFirstDashboard: 'أنشئ لوحتك الأولى',
    tourSignUpAction: 'إنشاء حساب مجاني',

    tourS1Title: 'مرحباً بك في داتا بلس',
    tourS1Desc: 'حوّل ملفات إكسل وCSV اليومية إلى لوحات تحكم واضحة، وتوقعات مستقبلية، وتقارير PDF جاهزة للطباعة — بدون أي برمجة أو معادلات معقدة.',
    tourS1Tip: 'ملفاتك الأصلية تبقى محفوظة بأمان دائماً، ويتم حفظ جميع لوحاتك وتنظيفاتك وتوقعاتك تلقائياً في حسابك.',
    tourS1FlowHub: '١. رفع الملفات',
    tourS1FlowHubSub: 'إكسل وCSV في مركز البيانات',
    tourS1FlowLab: '٢. تنظيف البيانات',
    tourS1FlowLabSub: 'خطوة اختيارية في المختبر',
    tourS1FlowDash: '٣. اللوحات والتقارير',
    tourS1FlowDashSub: 'رسوم ومؤشرات وPDF',
    tourS1FlowModel: 'ربط الملفات',
    tourS1FlowModelSub: 'دمج الجداول بدون معادلات',
    tourS1FlowForecast: '٤. توقع المستقبل',
    tourS1FlowForecastSub: 'توقعات المبيعات والطلب',
    tourS1Pt1: 'ابدأ بأي جدول إكسل (.xlsx / .xls) أو ملف CSV لديك بالفعل',
    tourS1Pt2: 'تنظيف وربط البيانات بالنقر فقط — بدون معادلات معقدة أو كود',
    tourS1Pt3: 'استعرض لوحات تفاعلية، توقّع الشهور القادمة، وصدّر تقارير PDF أنيقة',

    tourS2Title: '١. رفع ملفاتك وجداولك (مركز البيانات)',
    tourS2Desc: 'اعتبر مركز البيانات مجلدك المنظم لجميع الجداول. ارفع ملفاتك مرة واحدة واستخدمها في أي لوحة تحكم أو تقرير أو توقع.',
    tourS2Tip: 'ابدأ من هنا كلما أردت إضافة ملف إكسل أو CSV جديد. يمكنك معاينة الصفوف والأعمدة فوراً قبل الحفظ.',
    tourS2UploadBtn: 'رفع مجموعة بيانات',
    tourS2File1Meta: '12,480 صف · 9 أعمدة',
    tourS2File2Meta: '3,120 صف · 6 أعمدة',
    tourS2FormatsLabel: 'يدعم ملفات',
    tourS2FormatsHint: 'التعرف التلقائي على النصوص العربية والإنجليزية',
    tourS2Pt1: 'اضغط «رفع مجموعة بيانات» أو اسحب الملف وأفلته لمعاينة الأعمدة فوراً',
    tourS2Pt2: 'اطّلع على مؤشر صحة الملف لاكتشاف الخلايا الفارغة قبل عمل الرسوم',
    tourS2Pt3: 'أنشئ لوحة تحكم أو افتح التنظيف مباشرة من بطاقة أي ملف',

    tourS3Title: '٢. ترتيب الجداول غير المنظمة (مختبر البيانات)',
    tourS3Desc: 'هل يحتوي ملفك على صفوف فارغة أو تكرارات أو مسافات زائدة؟ يتيح لك مختبر البيانات تنظيف الجدول بصرياً وبضغطة زر.',
    tourS3Tip: 'خطوة اختيارية — يمكنك تخطيها إذا كان ملفك جاهزاً! ويمكنك التراجع أو حذف أي تعديل في أي وقت.',
    tourS3FilterAction: 'حذف الصفوف الفارغة أو الزائدة',
    tourS3DedupeAction: 'إزالة الصفوف المكررة',
    tourS3ColAction: 'تعديل أو تسمية الأعمدة',
    tourS3ApplyBtn: 'تطبيق وإغلاق',
    tourS3PipelineTitle: 'خطوات التنظيف',
    tourS3Pt1: 'انقر على أي خلية لتعديلها، أو امسح المسافات الزائدة وصفِّ الصفوف غير المطلوبة',
    tourS3Pt2: 'أزل التكرارات، قسّم الأعمدة المدمجة، واضبط صيغ التواريخ والأرقام بسهولة',
    tourS3Pt3: 'اضغط «تطبيق وإغلاق» لحفظ النسخة النظيفة من جدولك بأمان',

    tourS4Title: '٣. ربط أكثر من ملف معاً (اختياري)',
    tourS4Desc: 'تعمل على ملف واحد فقط؟ تخطَّ هذه الخطوة! وإذا كان لديك ملفان مرتبطان (مثل الطلبات والعملاء)، اربطهما مرة واحدة عبر عمود مشترك — تماماً مثل VLOOKUP بدون معادلات.',
    tourS4Tip: 'تحتاج هذه الخطوة فقط عندما تريد جمع بيانات من ملفين مختلفين داخل رسم بياني واحد.',
    tourS4DimTitle: 'ملف بيانات العملاء',
    tourS4FactTitle: 'ملف المبيعات والطلبات',
    tourS4MeasureLabel: 'إجمالي سريع',
    tourS4MeasureSample: 'إجمالي المبيعات',
    tourS4ConnectedDash: 'رسم مشترك: المبيعات حسب المدينة',
    tourS4Pt1: 'لوحات الملف الواحد تعمل مباشرة بدون أي خطوة ربط',
    tourS4Pt2: 'صل ملفين معاً عبر عمود متطابق (مثل رقم العميل أو رمز المنتج)',
    tourS4Pt3: 'احفظ مجاميع جاهزة (مثل صافي المبيعات أو متوسط الطلب) لإعادة استخدامها بسهولة',

    tourS5Title: '٤. بناء لوحات التحكم التفاعلية',
    tourS5Desc: 'اختر شكل الرسم أو بطاقة الأرقام، وحدد الأعمدة التي تريد عرضها من جدولك، ثم رشّح اللوحة بالكامل بنقرة واحدة.',
    tourS5Tip: 'غير متأكد أي رسم يناسب بياناتك؟ تفقّد «معرض الرسوم» في الشريط العلوي لمشاهدة أمثلة مشروحة ببساطة.',
    tourS5ChartPanel: '١. اختر الشكل',
    tourS5Canvas: 'مساحة لوحة التحكم',
    tourS5Config: '٢. اختر الأعمدة',
    tourS5Filters: '٣. فلاتر الصفحة العلوية',
    tourS5ChartTypes: 'أعمدة · خطي · بطاقة رقم · دائري',
    tourS5Rev: 'إجمالي المبيعات',
    tourS5Target: 'الهدف الشهري',
    tourS5Pt1: 'أضف بطاقات أرقام (KPI) ورسوماً بيانية وجداول من اللوحة الجانبية اليسرى',
    tourS5Pt2: 'اختر العمود المراد قياسه وعدّل العناوين والألوان من اللوحة اليمنى',
    tourS5Pt3: 'أضف فلاتر التاريخ أو الفئة بالأعلى لتحديث جميع الرسوم معاً فورياً',

    tourFcTitle: '٥. توقع المستقبل (استوديو التوقعات)',
    tourFcDesc: 'تعرّف على الاتجاه المتوقع لأرقامك خلال الأسبوع أو الشهر القادم. اختر ملفك، وحدد قالباً جاهزاً للأعمال، واحصل على توقع واضح بلغة بسيطة.',
    tourFcTip: 'مثالي لتخطيط المخزون والسيولة وأهداف المبيعات — ولا يقوم بتعديل ملفك الأصلي أبداً.',
    tourFcTemplateLabel: 'قالب الأعمال',
    tourFcPresetSales: 'توقع المبيعات والإيرادات',
    tourFcHorizonLabel: 'الـ 30 يوماً القادمة',
    tourFcSummarySample: 'اتجاه تصاعدي متوقع (+12% مقارنة بالفترة السابقة) مع ذروة موسمية أسبوعية.',
    tourFcPinBtn: 'أضف للوحة التحكم',
    tourFcPt1: 'استخدم قوالب جاهزة (المبيعات، الطلب، التدفق النقدي) بإعدادات واضحة بدون تعقيد إحصائي',
    tourFcPt2: 'اطّلع على التوقع المتوقع والحد الأدنى/الأعلى وملخص الأعمال وتجارب «ماذا لو»',
    tourFcPt3: 'أعد فتح التوقعات المحفوظة في أي وقت، أو ثبّت الرسم في لوحة التحكم، أو صدّر تقريراً',

    tourS6Title: '٦. إنشاء وتصدير تقارير PDF متعددة الصفحات',
    tourS6Desc: 'تحتاج مستنداً مرتباً لاجتماع أو مدير أو عميل؟ أنشئ «تقريراً» لترتيب الأرقام والرسوم والملاحظات في صفحات A4 جاهزة للطباعة.',
    tourS6Tip: 'اختر «لوحة تحكم» للاستكشاف التفاعلي والفلاتر، واختر «تقرير» عند تجهيز مستند رسمي أو PDF.',
    tourS6Page1: 'صفحة ١ · الملخص',
    tourS6Page2: 'صفحة ٢ · التفاصيل',
    tourS6ExportPdf: 'تصدير PDF',
    tourS6HeaderSample: 'ملخص الأداء الشهري',
    tourS6Pt1: 'قسّم تقريرك إلى صفحات مرتبة بعناوين وتبويبات واضحة',
    tourS6Pt2: 'اجمع بين بطاقات الأرقام والرسوم والنصوص التوضيحية داخل تخطيط ثابت للطباعة',
    tourS6Pt3: 'اضغط «تصدير PDF» لتحميل مستند جاهز للمشاركة مع ترقيم الصفحات',

    tourS7Title: '٧. دليل سريع: الشريط العلوي والمساعدة',
    tourS7Desc: 'كل أقسام المنصة على بُعد نقرة واحدة في الشريط العلوي. بدّل اللغة في أي وقت، استلهم من معرض الرسوم، أو أعد تشغيل هذا الدليل متى احتجت.',
    tourS7Tip: 'يتم حفظ عملك تلقائياً باستمرار. يمكنك فتح قائمة الحساب ← عرض الجولة الترحيبية في أي وقت لمراجعة الخطوات.',
    tourS7LangLabel: 'اللغة والاتجاه',
    tourS7LangAction: 'تبديل اللغة',
    tourS7NavLabel: 'اختصارات لوحة المفاتيح',
    tourS7NavShortcut1: 'معرض الرسوم لاختيار الرسم المناسب',
    tourS7NavShortcut2: 'الخطوة السابقة / التالية',
    tourS7NavShortcut3: 'إغلاق هذا الدليل',
    tourS7ReplayHint: 'أعد فتح الدليل أي وقت من قائمة الحساب ← عرض الجولة الترحيبية',
    tourS7ReadyHint: 'جاهز للبدء؟ ارفع ملفك الأول، جرّب التوقعات، أو أنشئ لوحتك الأولى أدناه.',
    tourS8TabDash: 'لوحات التحكم',
    tourS8TabDashDesc: 'عرض وإنشاء اللوحات التفاعلية وتقارير PDF',
    tourS8TabData: 'مركز البيانات',
    tourS8TabDataDesc: 'رفع ملفات إكسل وCSV وتنظيف الجداول',
    tourS8TabFc: 'استوديو التوقعات',
    tourS8TabFcDesc: 'توقع المبيعات والطلب والتدفق النقدي المستقبلي',
    tourS8TabGallery: 'معرض الرسوم',
    tourS8TabGalleryDesc: 'أمثلة بصرية تشرح متى تستخدم كل نوع رسم بياني',
    tourS8AutoSaveNote: 'الحفظ التلقائي مفعّل · ملفاتك ولوحاتك محفوظة بشكل خاص في حسابك',

    importTitle: 'رفع جدول بيانات',
    importSubtitle: 'يتعرف تلقائياً على الأعمدة والتواريخ وأوراق الإكسل مع معاينة فورية',
    importDropzoneTitle: 'اضغط لاختيار ملف أو اسحبه وأفلته هنا',
    importChangeFile: 'اختر ملفاً آخر',
    importDetectedEnc: 'تنسيق النص المكتشف:',
    importWarnFffdTitle: 'تظهر بعض الحروف بشكل غير واضح',
    importWarnFffdDesc: 'إذا بدت الحروف العربية غريبة في المعاينة بالأسفل، جرّب اختيار تنسيق نص آخر (مثل Windows-1256 للعربية).',
    importDatasetNameLabel: 'اسم الملف',
    importEncodingLabel: 'تنسيق النص (إذا ظهرت الحروف غريبة)',
    importExcelSheetLabel: 'ورقة الإكسل (Sheet)',
    importSeparatorLabel: 'فاصل الأعمدة',
    importSepAuto: 'كشف تلقائي',
    importSepComma: 'فاصلة (,)',
    importSepSemi: 'فاصلة منقوطة (;)',
    importSepTab: 'مسافة جدولة (Tab)',
    importSepPipe: 'خط عمودي (|)',
    importParsingText: 'جاري قراءة ملفك وفحص الأعمدة...',
    importPreviewTitle: 'معاينة سريعة (أول 15 صفاً)',
    importPreviewMeta: '{cols} أعمدة • {rows} صفاً',
    importSaveErrorTitle: 'تعذر حفظ الملف',
    importSubmitBtn: 'حفظ الملف',
    importUnitB: 'بايت',
    importUnitKB: 'ك.ب',
    importUnitMB: 'م.ب',

    // Batch E
    labRequiresText: 'يتطلب عموداً نصياً',
    labClickColHint: 'انقر على ترويسة أي عمود لاستهدافه',
    labFindAction: 'ابحث عن إجراء…',
    labSearchAllActions: 'البحث في جميع الإجراءات',
    labPalettePlaceholderCol: 'ماذا تريد أن تفعل بالعمود «{col}»؟',
    labPalettePlaceholderAll: 'ابحث عن أي إجراء: إزالة المسافات، تقسيم، تعبئة، تكرار…',
    labPaletteNoMatch: 'لا يوجد إجراء يطابق «{q}».',
    labPaletteNavigate: 'تنقل',
    labPaletteRun: 'تنفيذ',
    labPaletteCount: '{count} إجراء',
    labAction_prefix_label: 'إضافة بادئة…', labAction_prefix_hint: 'إضافة نص في بداية كل قيمة',
    labAction_suffix_label: 'إضافة لاحقة…', labAction_suffix_hint: 'إضافة نص في نهاية كل قيمة',
    labInspectorTitle: 'الفاحص',
    labInspectorHide: 'إخفاء الفاحص',
    labInspectorShow: 'إظهار الفاحص: الملف الإحصائي والإصلاحات الذكية',
    labInspectorHealthDesc: 'نسبة الخلايا الممتلئة والصالحة عند هذه الخطوة.',
    labInspectorNeedsAttention: 'يحتاج إلى مراجعة',
    labInspectorIssueSingular: '{count} مشكلة',
    labInspectorIssuePlural: '{count} مشاكل',
    labInspectorTableFixes: 'إصلاحات على مستوى الجدول',
    labInspectorNoTableIssues: 'لا توجد صفوف مكررة أو فارغة.',
    labInspectorColumnLabel: 'العمود',
    labInspectorValid: 'صالح',
    labInspectorEmpty: 'فارغ',
    labInspectorErrorsLabel: 'أخطاء',
    labInspectorDistinctLabel: 'المميز',
    labInspectorEveryUnique: 'كل القيم فريدة',
    labInspectorPctUnique: '{pct}% فريد',
    labInspectorMedianSub: 'الوسيط {val}',
    labInspectorLengthLabel: 'الطول',
    labInspectorCharsSub: 'محارف',
    labInspectorBlankValue: '(فارغ)',
    labInspectorSmartFixes: 'إصلاحات ذكية لهذا العمود',
    labInspectorApplyAffected: '{apply} · {count} خلية متأثرة',
    labInspectorHealthBarAria: '{valid} صالح، {empty} فارغ، {errors} أخطاء',
    labInspectorScoreRingAria: 'صحة البيانات {value} بالمئة',
    labFixCaseTitleLower: 'توحيد حالة الأحرف (أحرف صغيرة)',
    labFixCaseDetailCount: 'توجد {count} قيم مكتوبة بحالات أحرف مختلفة (مثل {sample})',
    labFixEmptyDetail: '{count} خلايا فارغة',
    labFixNullsZeroTitle: 'تعبئة الخلايا الفارغة بالرقم 0',
    labFixNullsUnknownTitle: 'تعبئة الخلايا الفارغة بـ "Unknown"',
    labFixConvertTitle: 'تحويل إلى {type}',
    labFixConvertNumWhy: '{count} من أصل {total} قيمة هي أرقام مخزنة كنص',
    labFixConvertDateWhy: '{count} من أصل {total} قيمة تبدو كتواريخ مخزنة كنص',
    labFixConvertNumStillWhy: '{count} من أصل {total} قيمة لا تزال نصية؛ العمود مُعرّف كرقم لكن خلاياه لم تُحوّل بعد',
    labFixConvertDateStillWhy: '{count} من أصل {total} قيمة لا تزال نصية؛ العمود يبدو كتاريخ لكن خلاياه لم تُحوّل بعد',
    labFixDupesDetailExact: '{count} صفوف هي نسخة مطابقة تماماً لصفوف سابقة',
    labFixBlankRowsDetail: '{count} صفوف فارغة بالكامل',
    labStatusRows: 'صف',
    labStatusCols: 'عمود',
    labStatusError: 'خطأ',
    labStatusErrors: 'أخطاء',
    labStatusHealth: 'الصحة',
    labStatusStepOf: 'الخطوة',
    labStatusMCodeBtn: 'كود M',
    labRailPipelineTitle: 'مسار التحويل',
    labRailSaveNameAria: 'حفظ الاسم',
    labRailStepCount: '{count} خطوات · كل خطوة محفوظة وقابلة لإعادة الترتيب والتراجع',
    labRailViewingStepOf: 'تعاين الخطوة {current} من {total}. ستُدرج الخطوات الجديدة هنا.',
    labRailOutputLabel: 'المخرجات',
    labRailOutputHint: 'ما سيحفظه زر «تطبيق» في مجموعة بياناتك',
    labRailSettings: 'الإعدادات',
    labRailDeltaAddedRowsPlural: '+{n} صفوف',
    labRailDeltaRemovedRowsPlural: '−{n} صفوف',
    labRailDeltaAddedColsPlural: '+{n} أعمدة',
    labRailDeltaRemovedColsPlural: '−{n} أعمدة',
    labRailEmptyFilled: 'تعبئة {n} فارغ',
    labRailErrorsAdded: '+{n} أخطاء',
    labRailErrorsFixed: 'إصلاح {n} أخطاء',
    labStepMeta_headers: 'الترويسات',
    labStepMeta_type: 'النوع',
    labStepMeta_rename: 'إعادة التسمية',
    labStepMeta_remove_columns: 'حذف أعمدة',
    labStepMeta_duplicate: 'تكرار',
    labStepMeta_reorder: 'إعادة ترتيب',
    labStepMeta_move: 'تحريك',
    labStepMeta_replace: 'استبدال',
    labStepMeta_fix_errors: 'إصلاح الأخطاء',
    labStepMeta_fill_empty: 'تعبئة الفارغ',
    labStepMeta_fill_down: 'تعبئة لأسفل',
    labStepMeta_fill_up: 'تعبئة لأعلى',
    labStepMeta_filter: 'تصفية',
    labStepMeta_remove_rows: 'حذف صفوف',
    labStepMeta_keep_rows: 'الإبقاء على صفوف',
    labStepMeta_sort: 'فرز',
    labStepMeta_text: 'نص',
    labStepMeta_math: 'حساب',
    labStepMeta_date: 'تاريخ',
    labStepMeta_split: 'تقسيم',
    labStepMeta_merge: 'دمج',
    labStepMeta_dedupe: 'إزالة التكرار',
    labStepMeta_custom_column: 'عمود محسوب',
    labTabsQueriesAria: 'الاستعلامات',
    labTabsBlankHint: 'البدء بجدول فارغ بأعمدة',
    labLeaveWithoutApply: 'مغادرة مختبر البيانات بدون حفظ التغييرات؟',
    homeLinkTitle: 'داتا بلس — الرئيسية',
    labApplyBtnTitle: 'حفظ الجدول المحوّل في قاعدة البيانات والعودة (Ctrl+Enter)',
    labSavingProgress: 'جاري الحفظ {current} من {total}...',
    labTimeoutError: 'انتهت مهلة الطلب بعد 90 ثانية أثناء الحفظ في قاعدة البيانات. جرّب تقليل حجم البيانات أو إعادة المحاولة.',
    labSaveFailedFallback: 'تعذر حفظ مجموعة البيانات المحوّلة في قاعدة بيانات PostgreSQL.',
    labFailedCountBadge: 'فشل ({count})',
    labBlankQueryDesc: 'ابدأ بجدول فارغ من عمود واحد',
    labQueryPrefix: 'استعلام',
    labSourceImportedFrom: 'مستورد من {name}',
    labDuplicateSuffix: '(نسخة)',
    colType_Text: 'نص',
    colType_WholeNumber: 'عدد صحيح',
    colType_DecimalNumber: 'عدد عشري',
    colType_Currency: 'عملة',
    colType_Percentage: 'نسبة مئوية',
    colType_Date: 'تاريخ',
    colType_DateTime: 'تاريخ ووقت',
    colType_Time: 'وقت',
    colType_Boolean: 'منطقي',
    filterSortAsc: 'فرز تصاعدي',
    filterSortDesc: 'فرز تنازلي',
    filterSmallToLarge: 'فرز من الأصغر إلى الأكبر',
    filterLargeToSmall: 'فرز من الأكبر إلى الأصغر',
    filterAToZ: 'فرز من أ إلى ي (A → Z)',
    filterZToA: 'فرز من ي إلى أ (Z → A)',
    filterNumberMenu: 'عوامل تصفية الأرقام',
    filterDateMenu: 'عوامل تصفية التواريخ',
    filterTextMenu: 'عوامل تصفية النصوص',
    filterDistinctCount: '({count} قيمة مميزة)',
    filterApplyBtn: 'تطبيق التصفية',
    filterNumberTitle: 'تصفية الأرقام',
    filterDateTitle: 'تصفية التواريخ',
    filterTextTitle: 'تصفية النصوص',
    filterBackToList: 'العودة إلى قائمة القيم',
    filterConditionLabel: 'الشرط',
    filterValueLabel: 'القيمة',
    filterValue2Label: 'والقيمة',
    filterEnterValPlaceholder: 'أدخل القيمة...',
    filterSecondBoundPlaceholder: 'الحد الثاني...',
    filterBackBtn: 'رجوع',
    filterOpNotEqualsShort: 'لا يساوي',
    filterOpGreaterEqual: 'أكبر من أو يساوي',
    filterOpLessEqual: 'أصغر من أو يساوي',
    filterOpBetween: 'بين قيمتين',
    filterOpBefore: 'قبل تاريخ',
    filterOpAfter: 'بعد تاريخ',
    filterOpThisYear: 'هذه السنة',
    filterOpThisMonth: 'هذا الشهر',
    filterOpNotContains: 'لا يحتوي على',
    filterOpStartsWith: 'يبدأ بـ',
    filterOpEndsWith: 'ينتهي بـ',
    labGridTipBar: 'انقر على خلية أو رقم صف أو ترويسة · الأسهم للتنقل · الزر الأيمن للخيارات',
    labGridCopyCellTip: 'نسخ قيمة الخلية المحددة',
    labGridFilterCellTip: 'تصفية الصفوف المطابقة لقيمة هذه الخلية',
    labGridReplaceColTip: 'استبدال القيم في هذا العمود',
    labGridTableAria: 'جدول التحويل في مختبر البيانات',
    labGridRowNumAria: 'تحديد كافة الصفوف المعروضة',
    labGridTypeTip: 'النوع: {type} (انقر للتغيير)',
    labGridChangeType: 'تغيير نوع البيانات',
    labGridFilterSortColTip: 'تصفية وفرز العمود',
    labGridColOpsTip: 'عمليات العمود',
    labGridPctValid: '{pct}% صالح',
    labGridToFix: 'بحاجة لإصلاح',
    labGridQualityStripTip: '{valid} صالح ({pct}%) · {empty} فارغ · {errors} أخطاء',
    labGridConvError: 'خطأ تحويل: تعذر تحليل القيمة بشكل سليم إلى نوع العمود المستهدف.',
    labGridCtxFilterValue: 'تصفية بهذه القيمة',
    labGridCtxReplaceValues: 'استبدال القيم...',
    labGridCtxCopyCell: 'نسخ قيمة الخلية',
    labGridCtxCopyRow: 'نسخ الصفوف المحددة',
    labGridCtxCopySelection: 'نسخ التحديد (TSV)',
    labGridCtxSelectCol: 'تحديد العمود بالكامل',
    labGridCtxSelectRow: 'تحديد الصف',
    labGridCtxSplitCol: 'تقسيم العمود...',
    labGridCtxReplaceErrors: 'استبدال الأخطاء...',
    labGridCtxFillDown: 'تعبئة لأسفل',
    labGridCtxFillUp: 'تعبئة لأعلى',
    labGridCtxRenameCol: 'إعادة تسمية العمود...',
    labGridCtxDuplicateCol: 'تكرار العمود',
    labGridCtxMoveLeft: 'تحريك العمود لليسار',
    labGridCtxMoveRight: 'تحريك العمود لليمين',
    labGridCtxRemoveCol: 'إزالة العمود',
    labGridFilteredChip: 'مُصفّى',
    labGridSortedChip: 'مُرتّب',
    labGridNullBadge: 'null',
    labGridShowingRows: 'عرض {shown} من أصل {total} صف',
    labGridShowAllBtn: 'عرض الكل ({total})',
    labGridShowMoreBtn: 'عرض 100 إضافية',
    labGridSummaryColLabel: 'العمود:',
    labGridSummaryRowLabel: 'الصف',
    labGridSummaryCellsLabel: 'الخلايا',
    labGridSelRowSummary: 'الصف {row} · {cells} خلية',
    labGridSelRowsSelected: '{count} صفوف محددة',
    labGridSelCellSummary: 'الخلية {col}[{row}] = {value}',
    labGridSelRangeSummary: '{cells} خلايا محددة ({rows}×{cols})',
    labGridSelColSummary: 'العمود {col} · {rows} صف',
    labGridSelColsSelected: '{count} أعمدة محددة',
    labActingRow: 'الصف {row}',
    labActingRows: '{count} صفوف',
    labActingCells: '{count} خلايا',
    labGridCtxFilterThisValue: 'تصفية إلى هذه القيمة',
    labGridCtxReplaceThisValue: 'استبدال هذه القيمة...',
    labGridCtxRemoveRow: 'إزالة الصف',
    labGridCtxRemoveRows: 'إزالة {count} صفوف',
    labGridCtxKeepSelectedRows: 'الاحتفاظ بالصفوف المحددة فقط',
    labStepRemovedRowN: 'تمت إزالة الصف {row}',
    labStepRemovedNRows: 'تمت إزالة {count} صفوف محددة',
    labStepKeptRowN: 'تم الإبقاء على الصف {row} فقط',
    labStepKeptNRows: 'تم الإبقاء على {count} صفوف محددة فقط',
    labCustomColNameLabel: 'اسم العمود الجديد',
    labCustomColNamePlaceholder: 'مثال: إجمالي المبلغ أو الاسم الكامل',
    labCustomColExprLabel: 'العملية الحسابية البصرية',
    labCustomColExprPlaceholder: 'اختر الأعمدة والعملية',
    labCustomColInsertColLabel: 'العمود المصدر',
    labCustomColFormulaHint: 'اختر الأعمدة والعمليات بصرياً دون الحاجة لكتابة أي صيغ برمجية.',
    labCustomColModeLabel: 'نوع العملية',
    labCustomColModeMath: 'حساب رياضي',
    labCustomColModeConcat: 'دمج عمودين كنص',
    labCustomColFirstLabel: 'العمود الأول',
    labCustomColSecondModeCol: 'عمود آخر',
    labCustomColSecondModeNum: 'رقم ثابت',
    labCustomColSecondLabel: 'العمود الثاني',
    labCustomColConstLabel: 'القيمة الرقمية',
    labReplaceNullsPlaceholder: 'أدخل القيمة البديلة...',
    labSelectCellFirst: 'اختر خلية أولاً',
    labRequiresColumnScope: 'بدّل النطاق إلى العمود بالكامل لتنفيذ هذا الإجراء',
    labScopeCellOnly: 'هذه الخلية فقط',
    labScopeColumn: 'العمود بالكامل',
    labScopeCellTag: 'خلية فقط',
    labAction_editcell_label: 'تعديل قيمة الخلية',
    labAction_editcell_hint: 'تحديث الخلية المحددة فقط دون باقي الخلايا',
    labAction_clearcell_label: 'مسح الخلية (فارغ)',
    labAction_clearcell_hint: 'تعيين الخلية المحددة كفارغة فقط',
    labStepMeta_edit_cell: 'تعديل خلية',
    labStepEditedCell: 'تعديل الخلية {col}[صف {row}]',
    labStepClearedCell: 'مسح الخلية {col}[صف {row}]',
    labRowOnlyTag: 'الصف {row} فقط',
    labEditCellBtn: 'تعديل الخلية',
    labClearCellBtn: 'مسح الخلية',
    labGridEditCellTip: 'تعديل هذه الخلية فقط (أو انقر نقراً مزدوجاً)',
    labGridClearCellTip: 'تفريغ هذه الخلية فقط',
    labGridCtxCellOnlyHeading: 'هذه الخلية فقط (صف {row})',
    labGridCtxEditCell: 'تعديل قيمة الخلية',
    labGridCtxClearCell: 'مسح الخلية (فارغ)',
    labGridCtxReplaceThisCellOnly: 'استبدال هذه الخلية فقط...',
    labGridCtxTrimCell: 'إزالة المسافات (هذه الخلية فقط)',
    labGridCtxUpperCell: 'أحرف كبيرة (هذه الخلية فقط)',
    labGridCtxLowerCell: 'أحرف صغيرة (هذه الخلية فقط)',
    labGridCtxReplaceColValues: 'استبدال في العمود بالكامل...',
    labModalCellOnlyToggle: 'التطبيق على هذه الخلية فقط (الصف {row}) — دون التأثير على باقي الصفوف',

    // Batch F
    appCannotSaveDatasetErr: 'تعذر حفظ مجموعة البيانات المنظفة في قاعدة البيانات.',
    appNewDashboardTitle: 'لوحة تحكم جديدة {n}',
    appPageN: 'صفحة {n}',
    appNewWidgetTitle: '{type} جديد',
    appUntitledDashboardDesc: 'لوحة تحكم بصرية تفاعلية',
    appUntitledReportTitle: 'تقرير بدون عنوان',
    appUntitledReportDesc: 'تقرير متعدد الصفحات قابل للطباعة',
    appWidgetCopySuffix: '(نسخة)',
    appOpeningDataLab: 'جاري فتح مختبر البيانات…',
    appAnalyticsSuffix: 'تحليلات {name}',
    appAnalyticsForDesc: 'رؤى بصرية لمجموعة بيانات {name}',
    appExitPreviewEsc: 'اضغط Esc أو انقر للخروج من المعاينة',
    hubLoadErrorFallback: 'تعذر تحميل مساحات العمل من قاعدة البيانات.',
    hubSaveErrorFallback: 'تعذر حفظ تعديلات مساحة العمل.',
    hubDeleteErrorFallback: 'تعذر حذف مساحة العمل.',
    hubUserFallback: 'المستخدم',
    hubPresetFhd: 'شاشة كاملة HD (16:9)',
    hubPresetLaptop: 'حاسوب محمول (1440×900)',
    hubPresetA4Portrait: 'ورق A4 عمودي',
    hubPresetA4Landscape: 'ورق A4 أفقي',
    hubPresetUsLetter: 'ورق US Letter',
    dataHubColMixSummary: '{text} نصي، {number} رقمي، {date} تاريخ',
    dataHubColMixAria: 'توزيع الأعمدة: {text} نصي، {number} رقمي، {date} تاريخ',
    dataHubRowsBadge: '{count} صف',
    dataHubColsBadge: '{count} عمود',
    dataHubHealthLabel: 'جودة {score}%',
    dataHubUpdatedLabel: 'آخر تحديث',
    dataHubCancelBtn: 'إلغاء',
    dataHubConfirmDeleteBtn: 'حذف نهائياً',
    filterAddBtn: 'إضافة فلتر',
    filterChooseColumn: 'اختر العمود',
    filterSearchColumns: 'ابحث عن عمود...',
    filterSearchValues: 'ابحث في القيم...',
    filterNoColumns: 'لا توجد بيانات محمّلة بعد.',
    filterNoValues: 'لا توجد قيم مطابقة.',
    filterFromLabel: 'من',
    filterToLabel: 'إلى',
    filterApply: 'تطبيق',
    filterCancel: 'إلغاء',
    filterValuesLimitHint: 'عرض أول 200 قيمة مميزة',
    filterSelectVisible: 'تحديد الكل',
    filterClearValues: 'مسح',
    filterLegacyDroppedNotice: 'تعذر تحويل {count} من فلاتر الإصدار القديم وتمت إزالتها.',
    filterRemoveChipAria: 'إزالة فلتر {column}',
    filterEditChipAria: 'تعديل فلتر {column}',
    filterRowsOf: '{filtered} من {total} صف',
    menuEditReportTitleAria: 'تعديل عنوان التقرير',
    menuRenameReportTip: 'انقر لإعادة تسمية التقرير',
    menuDoubleClickRenamePage: 'انقر مرتين لإعادة تسمية الصفحة',
    menuRenamePageTip: 'إعادة تسمية الصفحة النشطة',
    menuDeletePageTip: 'حذف الصفحة النشطة',
    menuAddReportPage: 'إضافة صفحة تقرير جديدة',
    menuPrevPage: 'الصفحة السابقة',
    menuNextPage: 'الصفحة التالية',
    toolbarCanvasLabel: 'اللوحة:',
    toolbarAdjustCanvasTip: 'انقر لضبط أبعاد اللوحة والنسبة والقوالب',
    toolbarCanvasSizeSettings: 'إعدادات أبعاد اللوحة',
    toolbarManualDimPx: 'الأبعاد اليدوية (بكسل)',
    toolbarRatioLocked: 'نسبة العرض للارتفاع مقفلة',
    toolbarUnlockRatio: 'إلغاء قفل النسبة',
    toolbarWidthLabel: 'العرض (بكسل)',
    toolbarHeightLabel: 'الارتفاع (بكسل)',
    toolbarQuickRatios: 'نسب الشاشة السريعة',
    toolbarPaperSizePreset: 'مقاس ورق / طباعة',
    toolbarScreenSizePreset: 'مقاس شاشة / عرض',
    toolbarZoomScale: 'التكبير والملاءمة',
    toolbarGridSnapping: 'المحاذاة للشبكة',
    toolbarOn: 'مفعّل',
    toolbarOff: 'معطّل',
    toolbarGotIt: 'فهمت',
    toolbarAboutTitle: 'حول داتا بلس',
    toolbarAboutSubtitle: 'لوحات تحكم وتوقعات سهلة للجميع',
    toolbarAboutVersionDesc: 'مساحة عمل متكاملة لتحليل الجداول مع حفظ سحابي تلقائي، وتنظيف بيانات بصري، وربط سهل بين الجداول، وتقارير PDF للطباعة.',
    toolbarShortcutSaveDesc: 'حفظ اللوحة الآن',
    toolbarShortcutExportDesc: 'تصدير التقرير بصيغة PDF',
    toolbarShortcutExitDesc: 'إغلاق النافذة المفتوحة أو إنهاء المعاينة',
    toolbarShortcutRenameDesc: 'إعادة تسمية صفحة اللوحة النشطة',
    toolbarDoubleClick: 'نقر مزدوج على التبويب',
    leftHomeTitle: 'داتا بلس — الرئيسية',
    leftAddWidgetTip: 'إضافة عنصر إلى اللوحة',
    leftDefaultDatasetName: 'ملف بيانات',
    leftCatCharts: 'الرسوم البيانية',
    leftCatAnalytics: 'رسوم ذكية',
    leftCat3d: 'رسوم ثلاثية الأبعاد',
    configModelDriven: 'الجداول المربوطة مفعّلة',
    configNoModelYet: 'ملف واحد مباشر',
    configTextPlaceholder: 'أدخل عنواناً أو ملخص مؤشرات أو ملاحظات...',
    configBold: 'عريض',
    configItalic: 'مائل',
    configAlignTip: 'محاذاة النص',
    configTransparentBg: 'خلفية شفافة',
    configSelectFieldOpt: 'اختر حقلاً...',
    configNoneOpt: '(بدون)',
    configFieldRowReq: 'بُعد الصفوف (مطلوب)',
    configFieldParentCatReq: 'الفئة الرئيسية (مطلوب)',
    configFieldStageReq: 'المرحلة / الفئة (مطلوب)',
    configFieldCatLabelsReq: 'تسميات الفئات (مطلوب)',
    configFieldXReq: 'المحور س / البُعد (مطلوب)',
    configFieldActualReq: 'حقل القيمة الفعلية (مطلوب)',
    configFieldPrevOpt: 'حقل المقارنة / السابق',
    configFieldCatXReq: 'حقل الفئة / المحور س (مطلوب)',
    configFieldColReq: 'حقل الأعمدة المحوري (مطلوب)',
    configFieldChildCatReq: 'الفئة الفرعية (اختياري)',
    configFieldValReq: 'القيمة / المقياس (مطلوب)',
    configFieldYReq: 'المحور ص / المقياس (مطلوب)',
    configFieldTargetReq: 'معيار الهدف (مطلوب)',
    configFieldCurrReq: 'القيمة الحالية (مطلوب)',
    configFieldNumColReq: 'العمود الرقمي (مطلوب)',
    configFieldNumFieldReq: 'الحقل الرقمي (مطلوب)',
    configFieldZReq: 'بُعد المحور ع (Z) (مطلوب)',
    configFieldValMetricOpt: 'مقياس القيمة (اختياري)',
    configFieldSizeByOpt: 'حقل حجم الفقاعة (اختياري)',
    configFieldTargetOpt: 'حقل القيمة المستهدفة (اختياري)',
    configFieldGroupByOpt: 'السلسلة / التجميع حسب (اختياري)',
    configFieldColorByOpt: 'حقل اللون / الفئة (اختياري)',
    configAggMethod: 'طريقة التجميع',
    configPrefix: 'البادئة',
    configSuffix: 'اللاحقة',
    configMaxTargetVal: 'القيمة القصوى للهدف',
    configSortDir: 'اتجاه الفرز',
    configSortDefault: 'ترتيب البيانات الأصلي',
    configSortAsc: 'تصاعدي (الأصغر ← الأكبر)',
    configSortDesc: 'تنازلي (الأكبر ← الأصغر)',
    configBinsLabel: 'عدد الفئات التكرارية',
    configDensityMode: 'تطبيع الكثافة',
    configCumulative: 'توزيع تراكمي',
    configSpecificViewOpts: 'خيارات عرض المخطط',
    configHorizontalBars: 'أشرطة أفقية',
    configSmoothLines: 'خطوط منحنية سلسة',
    configShowMarkers: 'إظهار نقاط البيانات',
    configDonutStyle: 'نمط حلقي مفرّغ الوسط',
    configShowPctLabels: 'إظهار النسب المئوية',
    configShowTrendline: 'إظهار خط الاتجاه',
    configNumFormatting: 'تنسيق الأرقام',
    configNumRaw: 'رقم خام',
    configNumCurrency: 'عملة',
    configNumPct: 'نسبة مئوية (%)',
    configNumCompact: 'مختصر (1.2K / 3.4M)',
    configWidgetHeaderLabel: 'عنوان العنصر',
    configBgColorLabel: 'خلفية البطاقة',
    configBgColorTip: 'لون الخلفية',
    configTransparentLabel: 'بطاقة شفافة',
    configTypographySection: 'الخطوط والتنسيق',
    configFontSizeLabel: 'حجم الخط',
    configWeightStyle: 'النمط',
    configAlignmentLabel: 'المحاذاة',
    configTitleColorLabel: 'لون العنوان',
    configTitleColorTip: 'لون العنوان',
    configPaletteLabel: 'لوحة ألوان المخطط',
    configDisplayOpts: 'الظهور والمحاور',
    configAggSampleOutput: 'معاينة العينة (أول 4 صفوف)',
    configCategoryXCol: 'الفئة / س',
    configMetricYCol: 'المقياس / ص',
    configFontInter: 'Inter (حديث بدون زوائد)',
    configFontSegoe: 'Segoe UI (النظام)',
    configFontGeorgia: 'Georgia (كلاسيكي)',
    configFontMono: 'JetBrains Mono (أحادي العرض)',
    configBgPureWhite: 'أبيض ناصع',
    configBgSoftSlate: 'رمادي فاتح',
    configBgSkyMist: 'سماوي خفيف',
    configBgMintTint: 'نعناعي هادئ',
    configBgAmberGlow: 'كهرماني دافئ',
    configBgRoseBlush: 'وردي خفيف',
    configBgDeepObsidian: 'داكن عميق',
    canvasPrintMargin: 'هامش الطباعة',
    canvasNoDatasetsTitle: 'اربط أول مجموعة بيانات',
    canvasNoDatasetsDesc: 'ارفع ملفات CSV أو إكسل أو TSV أو JSON من مركز البيانات أو اختر مجموعة بيانات حالية للبدء في تصميم المخططات.',
    canvasNoDatasetsHint: 'انقر على «تحديد البيانات» في الشريط العلوي لربط مجموعة بيانات.',
    canvasNoWidgetsTitle: 'لوحة العمل فارغة وجاهزة',
    canvasNoWidgetsDesc: 'اسحب أو انقر على أي مخطط من مكتبة الرسوم البيانية في اللوحة الجانبية لإضافة أول عنصر.',
    canvasNoWidgetsHint: 'انقر على أي عنصر في اللوحة الجانبية لإضافته إلى هذه الصفحة.',
    canvasResizeWidthTip: 'اسحب لتغيير عرض اللوحة',
    canvasResizeHeightTip: 'اسحب لتغيير ارتفاع اللوحة',
    canvasResizeCornerTip: 'اسحب الزاوية لتغيير أبعاد اللوحة',
    canvasSizeBadgeLabel: '{width} × {height} بكسل',
    canvasAdjustSizeTitle: 'ضبط حجم اللوحة',
    canvasAdjustSizeBtn: 'تغيير حجم اللوحة',
    canvasManualSizeTitle: 'أبعاد اللوحة المخصصة',
    canvasWidthPx: 'العرض (بكسل)',
    canvasHeightPx: 'الارتفاع (بكسل)',
    canvasLockRatio: 'قفل نسبة العرض للارتفاع',
    canvasLocked: 'مقفل',
    canvasUnlocked: 'مفتوح',
    canvasPopularPresets: 'مقاسات شائعة',
    canvasApplySize: 'تطبيق الأبعاد',
    canvasPresetFhd: 'عالي الدقة 16:9 (1280×720)',
    canvasPresetLaptop: 'لابتوب (1440×900)',
    canvasPresetQhd: 'فائق الدقة (1920×1080)',
    canvasPresetSquare: 'مربع (1000×1000)',
    widgetCloseConfigTip: 'إغلاق لوحة الإعدادات',
    widgetOpenConfigTip: 'إعداد بيانات ومظهر العنصر',
    widgetMoveHandleTip: 'اسحب العنصر لتغيير موضعه',
    widgetResizeTip: 'اسحب الزاوية لتغيير حجم العنصر',
    chartModelNotice: 'جداول مربوطة',
    chartNoDataMapped: 'اختر الأعمدة لعرض الرسم',
    chartNoDataMappedDesc: 'حدد عمود الفئة أو التاريخ وعمود الأرقام من اللوحة الجانبية.',
    chartValuePrefix: 'القيمة:',
    chartBoxWhiskerTitle: 'ملخص النطاق',
    chartBoxMin: 'الأدنى',
    chartBoxMedian: 'المنتصف',
    chartBoxMax: 'الأعلى',
    analyticsSemanticNotice: 'الجداول المربوطة مفعّلة',
    analyticsKpiDefault: 'مؤشر رئيسي',
    analyticsMetricDefault: 'ملخص المقياس',
    analyticsTargetLabel: 'الهدف',
    analyticsSparklineDefault: 'مؤشر اتجاه مصغر',
    analyticsProgressDefault: 'تقدم الهدف',
    analyticsCurrentLabel: 'الحالي',
    analyticsTargetGoalLabel: 'الهدف',
    analyticsViewSuffix: 'عرض',
    analyticsLiveFeed: 'بيانات حية',
    analyticsCardDefault: 'بطاقة تحليلية',
    plotly3dNoData: 'الإحداثيات ثلاثية الأبعاد مطلوبة',
    plotly3dNoDataDesc: 'اربط الحقول الرقمية X وY وZ في اللوحة لعرض هذا المخطط ثلاثي الأبعاد.',
    plotly3dXAxis: 'المحور X',
    plotly3dYAxis: 'المحور Y',
    plotly3dZAxis: 'المحور Z',
    textBoxDefaultPrompt: 'انقر لتعديل النص التوضيحي...',
    textBoxEditTip: 'عدّل النص من اللوحة الجانبية',
    forecastStudio: 'استوديو التوقعات',
    forecasts: 'التوقعات',
    insertForecastChart: 'رسم التوقع',
    widget_forecast_name: 'رسم التوقع',
    widget_forecast_desc: 'عرض توقع محفوظ مع النطاق المتوقع وتجارب «ماذا لو».',
    fcAddedToDashboardToast: 'تمت إضافة بطاقة التوقع إلى لوحتك.',
    fcAddToDashboardBtn: 'أضف إلى لوحة / تقرير',
    fcAddToDashboardDesc: 'اعرض هذا التوقع المحفوظ والنطاق المتوقع مباشرة داخل أي لوحة تحكم أو تقرير.',
    fcAddToDashboardTitle: 'إضافة التوقع إلى لوحة أو تقرير',
    fcAddWidgetConfirmBtn: 'إضافة رسم التوقع',
    fcAddWidgetErr: 'تعذر إضافة رسم التوقع إلى اللوحة.',
    fcAggAvg: 'المتوسط',
    fcAggCount: 'العدد',
    fcAggMax: 'الأعلى',
    fcAggMin: 'الأقل',
    fcAggSum: 'المجموع',
    fcAggregationLabel: 'طريقة الحساب',
    fcAllCategoriesAggregated: 'جميع الفئات معاً',
    fcAllRecords: 'جميع الصفوف',
    fcApplySuggestedFreq: 'استخدام {freq}',
    fcAssumptionCost: 'تغير التكلفة',
    fcAssumptionDemand: 'تغير الطلب',
    fcAssumptionElasticity: 'مرونة السعر',
    fcAssumptionExpense: 'تغير المصروفات',
    fcAssumptionGrowth: 'نسبة نمو إضافية',
    fcAssumptionPrice: 'تغير السعر',
    fcAssumptionSales: 'تغير المبيعات',
    fcAssumptionVolume: 'تغير الحجم / النشاط',
    fcAxisDateLabel: 'التاريخ / الفترة',
    fcAxisValueLabel: 'القيمة',
    fcBaselineModeLabel: 'التوقع الأساسي',
    fcBaselineTotal: 'الإجمالي المتوقع',
    fcBusinessTemplatesLabel: 'قوالب أعمال جاهزة',
    fcCancelBtn: 'إلغاء',
    fcCancelledNotice: 'تم إيقاف التوقع.',
    fcChartForecastStart: 'بداية التوقع',
    fcChartPeriodForecast: 'التوقع القادم',
    fcChartPeriodHistorical: 'الأرقام السابقة',
    fcClearOverlay: 'إخفاء خط «ماذا لو»',
    fcColBaseline: 'يتفوق على التقدير البسيط',
    fcColModel: 'الطريقة',
    fcColStatus: 'الحالة',
    fcConfidenceLabel: 'عرض النطاق المتوقع',
    fcConfigStaleBanner: 'تغيرت إعدادات التوقع منذ آخر تشغيل. اضغط «إعادة التشغيل» لتحديث الرسم والأرقام.',
    fcCreateNewDashboardOption: 'إنشاء لوحة تحكم جديدة بهذا التوقع',
    fcCreateScenarioBtn: 'حفظ تجربة ماذا لو',
    fcDataQualityTitle: 'فحص التواريخ والأرقام',
    fcDatasetLabel: 'ملف البيانات',
    fcDatasetStaleBanner: 'تغيّر ملف البيانات منذ آخر تشغيل لهذا التوقع. اضغط «إعادة التشغيل» لتحديثه بأحدث الصفوف.',
    fcDatasetStaleWidget: 'تحدّثت البيانات · تحديث',
    fcDateColLabel: 'عمود التاريخ',
    fcDeleteErr: 'تعذر حذف التوقع.',
    fcDeleteForecastAria: 'حذف التوقع',
    fcDeleteScenarioAria: 'حذف التجربة',
    fcDetectBtn: 'اكتشاف الفواصل الزمنية تلقائياً',
    fcDetectErr: 'تعذر اكتشاف الفواصل الزمنية.',
    fcDetectingBtn: 'جارٍ الفحص...',
    fcDomainFinance: 'المالية',
    fcDomainGeneral: 'عام',
    fcDomainInventory: 'المخزون',
    fcDomainMarketing: 'التسويق',
    fcDomainSales: 'المبيعات',
    fcDqDuplicates: 'تواريخ مكررة',
    fcDqMissing: 'فجوات / تواريخ ناقصة',
    fcDqObserved: 'تواريخ تحتوي بيانات',
    fcDqOutliers: 'قفزات أو هبوط غير معتاد',
    fcFailedBannerTitle: 'فشل آخر تشغيل للتوقع (يُعرض الناتج السابق)',
    fcFreqAuto: 'اكتشاف تلقائي',
    fcFreqDaily: 'يومي',
    fcFreqMonthly: 'شهري',
    fcFreqOverrideHint: 'اختر يومي أو أسبوعي أو شهري أدناه — أو اعتمد الاقتراح الذكي.',
    fcFreqQuarterly: 'ربع سنوي',
    fcFrequencyLabel: 'الفاصل الزمني',
    fcFreqWeekly: 'أسبوعي',
    fcFreqYearly: 'سنوي',
    fcGenerateBtn: 'احسب التوقع',
    fcGroupColLabel: 'تقسيم حسب (اختياري)',
    fcGroupSuggestHint: 'تصنيف اختياري',
    fcGroupValLabel: 'اختر الفئة',
    fcHelpMae: 'متوسط الفرق بين التقديرات السابقة والأرقام الفعلية (الأصغر أفضل).',
    fcHelpMape: 'متوسط نسبة الخطأ المئوية (الأصغر أفضل؛ يُخفى إذا احتوت البيانات على أصفار).',
    fcHelpMase: 'يقارن الدقة بمجرد تكرار الفترة السابقة (أقل من 1.0 يعني أداء أفضل).',
    fcHelpRmse: 'يوضح الخطأ المعتاد مع إعطاء وزن أكبر للأخطاء الكبيرة (الأصغر أفضل).',
    fcHorizonCustomLabel: 'عدد مخصص',
    fcHorizonLabel: 'عدد الفترات القادمة',
    fcHorizonPeriodsHint: 'أدخل من 1 إلى {max} فترة',
    fcIntervalNoteCv: 'تمت معايرة نطاقات الثقة بناءً على أخطاء الاختبار التاريخي المتدرج وقيم t للعينات المحدودة.',
    fcIntervalNoteEmpirical: 'تم بناء نطاقات الثقة مباشرة من التجزئة التجريبية لأخطاء الاختبار التاريخي المتدرج (نطاق {pct}%).',
    fcIntervalNoteFallback: 'النطاقات تقريبية (سجل قصير): توفر أقل من 20 خطأ تحقق تاريخي، لذا تُعرض حدود تحليلية تقريبية.',
    fcLegendConfidenceBand: 'النطاق المرجح {pct}%',
    fcLegendForecast: 'التوقع',
    fcLegendHistorical: 'الأرقام السابقة',
    fcLegendLowerBound: 'الحد الأدنى ({pct}%)',
    fcLimitsCaption: 'حتى {obs} فترة سابقة · حتى {days} يوماً قادماً',
    fcLoadListErr: 'تعذر تحميل التوقعات المحفوظة.',
    fcLoadOneErr: 'تعذر فتح تفاصيل التوقع.',
    fcMetricsExplainToggle: 'ماذا تعني هذه الأرقام؟',
    fcMissingFieldsErr: 'يرجى اختيار ملف البيانات وعمود التاريخ والعمود الرقمي المراد توقعه.',
    fcModeBusiness: 'قوالب الأعمال',
    fcModeGeneral: 'توقع مخصص',
    fcModeLabel: 'نوع التوقع',
    fcModelArima: 'الاتجاه والنمط (ARIMA)',
    fcModelArimaDesc: 'يتابع الصعود والهبوط المستمر وزخم الفترة الأخيرة عبر الزمن.',
    fcModelAuto: 'تلقائي (اختيار الأنسب)',
    fcModelAutoDesc: 'يجرّب عدة طرق على بياناتك السابقة ويختار أدقها تلقائياً.',
    fcModelEts: 'اتجاه سلس (ETS)',
    fcModelEtsDesc: 'يركز على الاتجاه الحديث مع تنعيم التقلبات العشوائية.',
    fcModelEvalDesc: 'تم الاختبار على {windows} فترة/فترات سابقة · {train} تدريب / {val} فحص',
    fcModelEvalTitle: 'نتائج مقارنة الطرق على بياناتك السابقة',
    fcModelHoltWinters: 'نمط موسمي (Holt-Winters)',
    fcModelHoltWintersDesc: 'ممتاز عندما ترتفع الأرقام وتنخفض في دورة أسبوعية أو شهرية متكررة.',
    fcModelLabel: 'طريقة التوقع',
    fcModelLinearReg: 'اتجاه مستقيم + التقويم',
    fcModelLinearRegDesc: 'يتابع النمو العام مع التغيرات المتكررة في التقويم.',
    fcModelMovingAvg: 'المتوسط المتحرك',
    fcModelMovingAvgDesc: 'يحسب متوسط الفترات الأخيرة لتقدير هادئ ومستقر.',
    fcModelNaive: 'تكرار آخر رقم',
    fcModelNaiveDesc: 'يستخدم أحدث قيمة مسجلة كنقطة أساس.',
    fcModelSarima: 'دورة موسمية (SARIMA)',
    fcModelSarimaDesc: 'يتابع الاتجاه العام مع التقلبات الموسمية المتكررة.',
    fcModelSeasonalNaive: 'تكرار الموسم السابق',
    fcModelSeasonalNaiveDesc: 'يكرر القيم من نفس النقطة في الدورة السابقة.',
    fcModelTsb: 'الطلب المتقطع (TSB)',
    fcModelTsbDesc: 'يتتبع تكرار حدوث الطلب ومتوسط حجمه عند الحدوث — مصمم للبيانات التي تحتوي على أصفار كثيرة.',
    fcNameLabel: 'اسم التوقع',
    fcNamePlaceholder: 'مثال: توقعات مبيعات الربع القادم',
    fcNetImpact: 'الفرق',
    fcNewForecastBtn: 'توقع جديد',
    fcNo: 'لا',
    fcNoChartData: 'لا يوجد رسم توقع بعد.',
    fcNoDatasetsDesc: 'ارفع ملف إكسل أو CSV يحتوي على عمود تاريخ وعمود رقمي في مركز البيانات أولاً.',
    fcNoDatasetsTitle: 'ارفع ملفاً لتبدأ بالتوقع',
    fcOpenFromDataHub: 'توقع لهذا الملف',
    fcPeriodUnitAuto: 'فترات',
    fcPeriodUnitDaily: 'أيام',
    fcPeriodUnitMonthly: 'أشهر',
    fcPeriodUnitQuarterly: 'أرباع',
    fcPeriodUnitWeekly: 'أسابيع',
    fcPeriodUnitYearly: 'سنوات',
    fcPresetInventoryTrends: 'مستويات المخزون',
    fcPresetMarketingConversions: 'المشتريات والتسجيلات',
    fcPresetMarketingConversionsDesc: 'شاهد عدد الطلبات أو المشتريات أو التسجيلات المتوقعة.',
    fcPresetMarketingLeads: 'العملاء المهتمون',
    fcPresetMarketingLeadsDesc: 'تقدير الاستفسارات والعملاء المحتملين القادمين.',
    fcPresetSalesRevenue: 'إيرادات المبيعات',
    fcPresetSalesVolume: 'الكميات المباعة',
    fcPresetSalesVolumeDesc: 'تقدير عدد القطع أو الطلبات القادمة، مع خيار التقسيم حسب المنتج أو المنطقة.',
    fcPresetStockConsumption: 'المخزون المستهلك',
    fcPresetStockConsumptionDesc: 'تقدير سرعة سحب المخزون من مستودعك عبر الفترات.',
    fcQuickCreateFromData: 'إنشاء توقع',
    fcReadyStateDesc: 'اختر عمود التاريخ والعمود الرقمي والمدة القادمة على الجانب ثم اضغط «احسب التوقع».',
    fcReadyStateTitle: 'تجهيز التوقع',
    fcRefreshForecastBtn: 'تحديث التوقع',
    fcRerunBtn: 'إعادة التشغيل',
    fcRetryBtn: 'حاول مجدداً',
    fcRunErrFallback: 'تعذر حساب التوقع.',
    fcRunningBtn: 'جارٍ حساب التوقع...',
    fcRunSuccessNotice: 'تم تجهيز التوقع وحفظه بنجاح!',
    fcSavedForecastsLabel: 'التوقعات المحفوظة',
    fcSavedScenariosHeading: 'تجارب «ماذا لو» المحفوظة',
    fcSaveErrFallback: 'تعذر حفظ التوقع.',
    fcSaveForecastBtn: 'حفظ التوقع',
    fcSaveSuccessNotice: 'تم حفظ التوقع.',
    fcSavingScenario: 'جارٍ الحساب...',
    fcScenarioCreateErr: 'تعذر حساب تجربة ماذا لو.',
    fcScenarioDefaultName: 'خطة ماذا لو',
    fcScenarioDisclaimer: 'تضيف أرقام «ماذا لو» أو تطرح النسبة التي تختارها فوق التوقع الأساسي لمساعدتك على اختبار خطة متفائلة أو حذرة.',
    fcScenarioNameLabel: 'اسم الخطة',
    fcScenarioNamePlaceholder: 'مثال: حملة موسمية +10%',
    fcScenarioPrefix: 'ماذا لو',
    fcScenarioStaleBadge: 'نسخة سابقة',
    fcScenarioStaleNotice: 'تم حساب خطة «ماذا لو» هذه على تشغيل سابق، وقد تختلف تواريخها أو قيمها عن التوقع الأساسي الحالي.',
    fcScenarioTotal: 'إجمالي الخطة',
    fcSelectedBadge: 'مختار',
    fcStepsWord: 'فترات',
    fcStudioHeroDesc: 'اعرف إلى أين تتجه مبيعاتك أو مصروفاتك أو طلب العملاء اعتماداً على ملفاتك — وجرّب خطط «ماذا لو» بسهولة.',
    fcStudioHeroTitle: 'توقّع أرقام عملك القادمة',
    fcSumAverageForecast: 'المتوسط / فترة',
    fcSumEndForecast: 'القيمة في نهاية المدة',
    fcSumHorizonCard: 'المدة القادمة',
    fcSumLastActual: 'آخر رقم فعلي',
    fcSumSelectedModel: 'الطريقة المستخدمة',
    fcSumTotalHorizon: 'الإجمالي المتوقع',
    fcSumValidationError: 'دقة الاختبار على الماضي',
    fcTargetColLabel: 'العمود الرقمي المراد توقعه',
    fcTargetDashboardLabel: 'اختر لوحة تحكم أو تقريراً',
    fcTplDemandDesc: 'تقدير طلبات العملاء القادمة والمواسم.',
    fcTplDemandTitle: 'الطلب على المنتجات',
    fcTplExpensesDesc: 'تقدير التكاليف والمصروفات الشهرية القادمة.',
    fcTplExpensesTitle: 'المصروفات',
    fcTplGeneralBizDesc: 'توقّع أي عمود رقمي مهم في جدول بياناتك.',
    fcTplGeneralBizTitle: 'رقم أعمال عام',
    fcTplInventoryDesc: 'راقب متوسط مستويات المخزون وحركته عبر الوقت.',
    fcTplInventoryLimitation: 'يقدّر هذا الرسم الطلب القادم من الأرقام السابقة فقط — ولا يحسب تاريخ نفاد المخزون بدقة ما لم تضف بيانات التوريد الوارد ومهلة الموردين وقواعد المخزون.',
    fcTplInventoryTitle: 'المخزون',
    fcTplProfitDesc: 'تقدير صافي الأرباح خلال الأسابيع أو الأشهر القادمة.',
    fcTplProfitTitle: 'الأرباح',
    fcTplRevenueDesc: 'تقدير الإيرادات القادمة مع الحد الأعلى والأدنى المتوقع.',
    fcTplRevenueTitle: 'الإيرادات',
    fcTplSalesDesc: 'تقدير المبيعات وإجماليات الطلبات، مع خيار التقسيم حسب المنتج أو المنطقة.',
    fcTplSalesTitle: 'المبيعات',
    fcTplTrafficDesc: 'تقدير الزيارات والنقرات القادمة لموقعك.',
    fcTplTrafficTitle: 'زيارات الموقع',
    fcUncertaintyBeatsBaseline: 'تفوّق هذا التوقع على التخمين البسيط عند اختباره على أرقامك السابقة.',
    fcUncertaintyConfidenceExplain: 'يعرض النطاق المرجح {pct}% التقلبات الطبيعية من بياناتك السابقة — والأحداث المفاجئة أو تغيّر الأسعار الكبير قد يخرج عن هذا النطاق.',
    fcUncertaintyLimitedBaseline: 'بما أن الأرقام السابقة كانت متقلبة، يُنصح باعتبار التواريخ البعيدة تقديرات تقريبية.',
    fcUncertaintyTitle: 'ملاحظات مهمة للتوقع',
    fcUncertaintyTrainingSpan: 'مبني على البيانات من {start} إلى {end} ({observed} فترة تحتوي بيانات)',
    fcWhatIfDesc: 'جرّب ماذا يحدث لو ارتفعت أو انخفضت المبيعات أو الأسعار أو الطلب أو المصروفات — دون تغيير توقعك الأساسي.',
    fcWhatIfTitle: 'تجربة خطط «ماذا لو»',
    fcWidgetConfigHint: 'اربط هذه البطاقة بأي توقع محفوظ من استوديو التوقعات (مع أي خطة ماذا لو).',
    fcWidgetCreateInStudio: 'إنشاء توقع',
    fcWidgetNoResult: 'لم يتم تشغيل هذا التوقع بعد.',
    fcWidgetOpenStudioTip: 'فتح في استوديو التوقعات',
    fcWidgetRefreshTip: 'تحديث التوقع',
    fcWidgetSelectOpt: '-- اختر توقعاً محفوظاً --',
    fcWidgetSelectPromptDesc: 'افتح إعدادات البطاقة لاختيار توقع محفوظ أو أنشئ توقعاً جديداً في استوديو التوقعات.',
    fcWidgetSelectPromptTitle: 'اختر أو أنشئ توقعاً',
    fcWinAll: 'كل السجل',
    fcWinLast30: 'آخر 30',
    fcWinLast90: 'آخر 90',
    fcYes: 'نعم',
    hubWelcomeBack: 'مرحباً بعودتك، {name}',
    hubQuickActionsTitle: 'إجراءات سريعة',
    hubQaUploadTitle: 'رفع ملف بيانات',
    hubQaUploadDesc: 'ملف CSV أو Excel',
    hubQaDashboardTitle: 'لوحة تحكم جديدة',
    hubQaDashboardDesc: 'رسوم بيانية ومؤشرات',
    hubQaReportTitle: 'تقرير جديد',
    hubQaReportDesc: 'مستند للطباعة وPDF',
    hubQaForecastTitle: 'تشغيل تنبؤ',
    hubQaForecastDesc: 'توقع الاتجاهات القادمة',
    hubGettingStartedTitle: 'ثلاث خطوات بسيطة للبدء',
    hubGettingStartedStep1: 'ارفع ملف Excel أو CSV في مركز البيانات',
    hubGettingStartedStep2: 'نظف أو رتّب الأعمدة بسهولة إذا احتجت',
    hubGettingStartedStep3: 'أنشئ لوحة تحكم أو تقريراً للطباعة أو تنبؤاً',
    hubDatasetsSummary: '{count} مجموعة بيانات جاهزة في مساحة عملك',
    hubRecentTitle: 'مساحة العمل الخاصة بك',
    hubKindDashboard: 'لوحة تحكم',
    hubKindReport: 'تقرير',
    dhQuickDropHint: 'اسحب ملف CSV أو Excel هنا، أو اضغط على رفع ملف أعلاه',
    dhActionBuildDash: 'إنشاء لوحة',
    dhActionForecast: 'تنبؤ',
    cfgSectionEssential: 'البيانات الأساسية',
    cfgSectionAdvancedData: 'خيارات البيانات وتنسيق الأرقام',
    cfgPlainHintDataset: 'اختر ملف البيانات الذي يعتمد عليه هذا الرسم.',
    cfgPlainHintCategory: 'العمود المستخدم لتسميات المجموعات على المحور الأفقي.',
    cfgPlainHintValue: 'العمود الرقمي الذي تريد قياسه أو جمعه.',
    cfgPlainHintAggregation: 'طريقة دمج القيم داخل كل مجموعة (مثل المجموع أو المتوسط).',
    fcAdvancedOptionsToggle: 'خيارات إضافية (التجميع ونطاق الثقة)',
    fcPlainHintTarget: 'الرقم التجاري الذي تريد تقديره (مثل المبيعات أو الإيرادات).',
    fcPlainHintDate: 'العمود الذي يوضح تاريخ أو وقت كل سجل.',
    fcPlainHintHorizon: 'عدد الأيام أو الأسابيع أو الأشهر القادمة المراد تقديرها.',
    fcReliabilityTitle: 'موثوقية التوقع',
    fcReliabilityHigh: 'موثوقية عالية',
    fcReliabilityMedium: 'موثوقية متوسطة',
    fcReliabilityLow: 'موثوقية منخفضة',
    fcReliabilityScore: 'الدرجة: {score}/100',
    fcTypicalErrorPct: 'الخطأ المعتاد حوالي {pct}% خلال آخر {n} فترة',
    fcTypicalErrorUnits: 'الخطأ المعتاد حوالي {mae} وحدة خلال آخر {n} فترة',
    fcWhyThisModel: 'لماذا هذه الطريقة',
    fcTechnicalDetailsTitle: 'التفاصيل التقنية',
    fcDownloadCsvBtn: 'تنزيل CSV',
    fcDownloadExcelBtn: 'تنزيل Excel',
    fcExportFailedErr: 'تعذر تصدير ملف التوقع.',
    fcForecastAllGroupsBtn: 'توقع لجميع المجموعات',
    fcBatchProgress: 'جارٍ التوقع للمجموعات: {done} / {total} ({group})',
    fcBatchTitle: 'ملخص توقعات المجموعات',
    fcBatchDesc: 'أعلى {count} مجموعة حسب الحجم. اضغط على أي صف مكتمل لفتح التوقع الكامل.',
    fcBatchColGroup: 'المجموعة',
    fcBatchColLastActual: 'آخر فعلي',
    fcBatchColForecastTotal: 'إجمالي التوقع',
    fcBatchColChange: 'نسبة التغير',
    fcBatchColReliability: 'الموثوقية',
    fcBatchSkippedLabel: 'تم التخطي',
    fcBatchFailedLabel: 'فشل',
    fcBatchCloseBtn: 'إغلاق الملخص',
    fcCalendarEffectsLabel: 'تأثيرات التقويم والأعياد',
    fcCalendarEffectsToggle: 'تضمين رمضان والأعياد والعطلات الرسمية',
    fcCalendarCountryLabel: 'دولة تقويم العطلات',
    fcCalendarCountryEG: 'مصر (EG)',
    fcCalendarCountrySA: 'السعودية (SA)',
    fcCalendarCountryAE: 'الإمارات (AE)',
    fcCalendarCountryUS: 'الولايات المتحدة (US)',
    fcCalendarCountryGB: 'المملكة المتحدة (GB)',
    fcCalendarEffectsTitle: 'تأثيرات التقويم والأعياد المقدّرة',
    fcCalendarEffectPeriods: '{n} فترات',
    fcActualAccuracyTitle: 'دقة التوقع السابق',
    fcActualAccuracyPct: 'الخطأ الفعلي: {pct}% عبر {n} فترة جديدة',
    fcActualAccuracyMae: 'الخطأ الفعلي: {mae} وحدة عبر {n} فترة جديدة',
    fcActualWithin80Yes: 'بقيت القيم الفعلية ضمن النطاق المرجح 80% ({count}/{total}).',
    fcActualWithin80No: 'خرجت بعض القيم الفعلية عن نطاق 80% ({count}/{total} داخل النطاق).',
    benchToggleLeft: 'الرسوم',
    benchToggleRight: 'الإعدادات',
    sidebarWhenToUse: 'الأنسب لـ',
  },
};
