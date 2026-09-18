// API pubblica del motore density1d (stima di densità in una dimensione: Parzen, K-NN, istogramma).
// Un widget scrive un preset (types.ts) e rende <DensityExplorer meta={meta} preset={preset} />.
// Guida: docs/WIDGET_GUIDE.md, sezione "Come si scrive un preset del motore density1d".
export { DensityExplorer } from './DensityExplorer'
export type { DensityExplorerProps } from './DensityExplorer'
export * from './types'
export {
  FORMULA_VALUE_NAMES,
  captionFor,
  contributions,
  countLocalMaxima,
  formatH,
  formulaValues,
  iseAt,
  niceLogSteps,
  optimalBandwidth,
  regimeOf,
  resolveSteps,
  sceneAt,
} from './density1d'
export type { Contribution, Density1dValues, Regime, Scene } from './density1d'
export { KERNEL_INFO } from './kernelInfo'
export type { KernelInfo } from './kernelInfo'
export { fishLightnessScenario, mixtureScenario, mixtureTex, sensorsScenario } from './scenarios'
