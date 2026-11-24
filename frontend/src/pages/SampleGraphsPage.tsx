import React, { useState } from 'react';
import { User } from '../types/auth';
import { BrandHomeLink } from '../components/BrandLogo';
import { AppNavbar } from '../components/Navbar/AppNavbar';
import { AnimatedBackground } from '../components/AnimatedBackground';
import {
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  Sliders,
  Lightbulb,
} from 'lucide-react';
import { useLanguage, LanguageToggle } from '../i18n/LanguageContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  currentUser: User | null;
  onNavigate: (page: any, dashboardId?: string) => void;
  onLogout?: () => void;
}

type CategoryFilter = 'all' | 'comparison' | 'trends' | 'composition' | 'kpi';

interface SampleGraphItem {
  id: string;
  title: string;
  category: CategoryFilter;
  categoryLabel: string;
  renderChart: () => React.ReactNode;
  summary: string;
  bestUseCases: string[];
  keyInsight: string;
}

export const SampleGraphsPage: React.FC<Props> = ({ currentUser, onNavigate, onLogout }) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const sampleGraphs: SampleGraphItem[] = [
    {
      id: 'bar_chart',
      title: t('galleryBarTitle'),
      category: 'comparison',
      categoryLabel: t('galleryCatComparison'),
      renderChart: () => (
        <div dir="ltr" className="w-full h-64 sm:h-72">
          <Bar
            data={{
              labels: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'],
              datasets: [
                { label: 'Q1 Revenue ($K)', data: [120, 95, 140, 60, 45], backgroundColor: '#0284C7', borderRadius: 6 },
                { label: 'Q2 Target ($K)', data: [140, 110, 160, 75, 55], backgroundColor: '#7DD3FC', borderRadius: 6 },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
                tooltip: { backgroundColor: '#0B1739', padding: 10, cornerRadius: 8 },
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#E2E8F0' }, ticks: { font: { size: 11 } } },
              },
            }}
          />
        </div>
      ),
      summary: t('galleryBarSummary'),
      bestUseCases: [t('galleryBarUse1'), t('galleryBarUse2'), t('galleryBarUse3')],
      keyInsight: t('galleryBarInsight'),
    },
    {
      id: 'line_chart',
      title: t('galleryLineTitle'),
      category: 'trends',
      categoryLabel: t('galleryCatTrends'),
      renderChart: () => (
        <div dir="ltr" className="w-full h-64 sm:h-72">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
              datasets: [
                {
                  label: 'Active Users (k)',
                  data: [12.4, 14.2, 18.5, 22.1, 28.0, 35.4, 42.1, 51.0, 58.6, 64.2],
                  borderColor: '#0B1739',
                  backgroundColor: 'rgba(11, 23, 57, 0.08)',
                  fill: true,
                  tension: 0.35,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
                tooltip: { backgroundColor: '#0B1739', padding: 10, cornerRadius: 8 },
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#E2E8F0' }, ticks: { font: { size: 11 } } },
              },
            }}
          />
        </div>
      ),
      summary: t('galleryLineSummary'),
      bestUseCases: [t('galleryLineUse1'), t('galleryLineUse2'), t('galleryLineUse3')],
      keyInsight: t('galleryLineInsight'),
    },
    {
      id: 'area_chart',
      title: t('galleryAreaTitle'),
      category: 'trends',
      categoryLabel: t('galleryCatTrends'),
      renderChart: () => (
        <div dir="ltr" className="w-full h-64 sm:h-72">
          <Line
            data={{
              labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025'],
              datasets: [
                {
                  label: 'Gross Revenue ($K)',
                  data: [450, 580, 720, 890, 1100, 1350],
                  borderColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  fill: true,
                  tension: 0.3,
                },
                {
                  label: 'Operating Expenses ($K)',
                  data: [320, 390, 480, 540, 620, 710],
                  borderColor: '#F43F5E',
                  backgroundColor: 'rgba(244, 63, 94, 0.14)',
                  fill: true,
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
                tooltip: { backgroundColor: '#0B1739', padding: 10, cornerRadius: 8 },
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: { grid: { color: '#E2E8F0' }, ticks: { font: { size: 11 } } },
              },
            }}
          />
        </div>
      ),
      summary: t('galleryAreaSummary'),
      bestUseCases: [t('galleryAreaUse1'), t('galleryAreaUse2'), t('galleryAreaUse3')],
      keyInsight: t('galleryAreaInsight'),
    },
    {
      id: 'donut_chart',
      title: t('galleryDonutTitle'),
      category: 'composition',
      categoryLabel: t('galleryCatComposition'),
      renderChart: () => (
        <div dir="ltr" className="w-full h-64 sm:h-72 flex items-center justify-center">
          <Pie
            data={{
              labels: ['Enterprise Tier', 'Mid-Market', 'Small Business', 'Free Self-Serve'],
              datasets: [
                {
                  data: [42, 28, 18, 12],
                  backgroundColor: ['#0B1739', '#0284C7', '#38BDF8', '#10B981'],
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
                tooltip: { backgroundColor: '#0B1739', padding: 10, cornerRadius: 8 },
              },
              cutout: '65%',
            }}
          />
        </div>
      ),
      summary: t('galleryDonutSummary'),
      bestUseCases: [t('galleryDonutUse1'), t('galleryDonutUse2'), t('galleryDonutUse3')],
      keyInsight: t('galleryDonutInsight'),
    },
    {
      id: 'scatter_plot',
      title: t('galleryScatterTitle'),
      category: 'comparison',
      categoryLabel: t('galleryCatComparison'),
      renderChart: () => (
        <div dir="ltr" className="w-full h-64 sm:h-72">
          <Scatter
            data={{
              datasets: [
                {
                  label: 'Accounts (CSAT vs LTV)',
                  data: [
                    { x: 4.2, y: 15 }, { x: 5.8, y: 28 }, { x: 6.5, y: 34 },
                    { x: 7.1, y: 52 }, { x: 7.8, y: 68 }, { x: 8.4, y: 85 },
                    { x: 8.9, y: 110 }, { x: 9.2, y: 135 }, { x: 9.6, y: 160 },
                    { x: 6.0, y: 22 }, { x: 7.5, y: 48 }, { x: 8.1, y: 76 },
                  ],
                  backgroundColor: '#0284C7',
                  pointRadius: 6,
                  pointHoverRadius: 9,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } },
                tooltip: { backgroundColor: '#0B1739', padding: 10, cornerRadius: 8 },
              },
              scales: {
                x: { title: { display: true, text: 'CSAT Score (1-10)', font: { size: 11, weight: 'bold' } }, grid: { color: '#E2E8F0' } },
                y: { title: { display: true, text: 'Annual LTV ($K)', font: { size: 11, weight: 'bold' } }, grid: { color: '#E2E8F0' } },
              },
            }}
          />
        </div>
      ),
      summary: t('galleryScatterSummary'),
      bestUseCases: [t('galleryScatterUse1'), t('galleryScatterUse2'), t('galleryScatterUse3')],
      keyInsight: t('galleryScatterInsight'),
    },
    {
      id: 'kpi_card',
      title: t('galleryKpiTitle'),
      category: 'kpi',
      categoryLabel: t('galleryCatKpi'),
      renderChart: () => (
        <div className="w-full h-64 sm:h-72 flex flex-col justify-center gap-3 text-start">
          <div className="p-4 rounded-xl bg-navy-900 text-white border border-navy-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-300 font-medium">{t('galleryKpiMrrLabel')}</div>
              <div dir="ltr" className="text-3xl font-black text-white tracking-tight mt-1 text-start tabular">$148,920</div>
              <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {t('galleryKpiMrrDelta')}
              </div>
            </div>
            <div dir="ltr" className="w-24 h-12 shrink-0">
              <Line
                data={{
                  labels: ['1', '2', '3', '4', '5', '6'],
                  datasets: [{ data: [110, 118, 125, 132, 140, 148], borderColor: '#38BDF8', borderWidth: 2.5, pointRadius: 0, fill: false }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  scales: { x: { display: false }, y: { display: false } },
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">{t('galleryKpiChurnLabel')}</div>
              <div dir="ltr" className="text-xl font-extrabold text-navy-900 mt-0.5 text-start tabular">0.84%</div>
              <div className="text-[11px] font-semibold text-sky-600 mt-0.5">{t('galleryKpiChurnDelta')}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium">{t('galleryKpiCacLabel')}</div>
              <div className="text-xl font-extrabold text-navy-900 mt-0.5 tabular">{t('galleryKpiCacValue')}</div>
              <div className="text-[11px] font-semibold text-emerald-600">{t('galleryKpiCacDelta')}</div>
            </div>
          </div>
        </div>
      ),
      summary: t('galleryKpiSummary'),
      bestUseCases: [t('galleryKpiUse1'), t('galleryKpiUse2'), t('galleryKpiUse3')],
      keyInsight: t('galleryKpiInsight'),
    },
  ];

  const filteredGraphs =
    selectedCategory === 'all'
      ? sampleGraphs
      : sampleGraphs.filter((g) => g.category === selectedCategory);

  return (
    <div className="min-h-dvh bg-[#f7f9fc] text-navy-900 font-sans flex flex-col relative overflow-x-clip selection:bg-sky-600 selection:text-white">
      <AnimatedBackground variant="subtle" />
      {currentUser ? (
        <AppNavbar
          active="sample_graphs"
          currentUser={currentUser}
          onNavigate={onNavigate}
          onLogout={onLogout || (() => onNavigate('home'))}
        />
      ) : (
        <nav className="sticky top-0 min-h-16 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-50 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-6 md:px-10">
          <div className="min-w-0 shrink">
            <BrandHomeLink size={30} textSize="text-base sm:text-lg" onNavigateHome={() => onNavigate('home')} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LanguageToggle className="h-9" />
            <button
              type="button"
              onClick={() => onNavigate('home')}
              aria-label={t('backToHome')}
              title={t('backToHome')}
              className="h-9 px-2.5 sm:px-3.5 rounded-xl text-slate-700 hover:text-sky-600 border border-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
              <span className="hidden sm:inline">{t('backToHome')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="h-9 px-3 sm:px-4 rounded-xl bg-navy-900 hover:bg-sky-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span>{t('launchCanvasBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 shrink-0" />
            </button>
          </div>
        </nav>
      )}

      <main className="relative z-10 py-10 sm:py-12 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full flex-1">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">
            {t('galleryHeroBadge')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight leading-tight mb-3">
            {t('galleryHeroTitle1')}{' '}
            <span className="text-sky-600">{t('galleryHeroTitle2')}</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">{t('galleryHeroDesc')}</p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {[
            { id: 'all', label: t('galleryCatAll') },
            { id: 'comparison', label: t('galleryCatComparison') },
            { id: 'trends', label: t('galleryCatTrends') },
            { id: 'composition', label: t('galleryCatComposition') },
            { id: 'kpi', label: t('galleryCatKpi') },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as CategoryFilter)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Graph Showcase Cards */}
        <div className="space-y-6">
          {filteredGraphs.map((graph) => (
            <div
              key={graph.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-lift overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              <div className="lg:col-span-6 min-w-0 p-5 sm:p-7 bg-slate-50/70 border-b lg:border-b-0 lg:border-e border-slate-200/80 flex flex-col justify-between text-start">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
                      {graph.categoryLabel}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" /> {t('galleryInteractiveDemo')}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-navy-900 mb-4">{graph.title}</h3>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 min-w-0">
                  {graph.renderChart()}
                </div>
              </div>

              <div className="lg:col-span-6 min-w-0 p-5 sm:p-7 flex flex-col justify-between bg-white text-start">
                <div>
                  <div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs uppercase tracking-wider mb-2">
                    <Info className="w-3.5 h-3.5" /> {t('galleryUsageTitle')}
                  </div>
                  <h4 className="text-base font-extrabold text-navy-900 mb-2">{t('galleryOverviewTitle')}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">{graph.summary}</p>

                  <h5 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t('galleryBestUseCases')}
                  </h5>
                  <ul className="space-y-2 mb-5 text-sm text-slate-700">
                    {graph.bestUseCases.map((useCase, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200/70 text-navy-900 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sky-800 block mb-0.5">{t('galleryProTip')}</span>
                    <span className="text-slate-700">{graph.keyInsight}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 p-8 sm:p-10 rounded-2xl bg-navy-900 text-white text-center shadow-lift">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3">{t('galleryCtaTitle')}</h3>
            <p className="text-slate-300 text-sm sm:text-base mb-6">{t('galleryCtaDesc')}</p>
            <button
              type="button"
              onClick={() => onNavigate(currentUser ? 'dashboard_hub' : 'signup')}
              className="px-7 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-sm transition-colors inline-flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>{t('galleryBuildBtn')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-7 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandHomeLink size={28} textSize="text-base" onNavigateHome={() => onNavigate('home')} />
          <p dir="ltr">&copy; 2026 Data Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
