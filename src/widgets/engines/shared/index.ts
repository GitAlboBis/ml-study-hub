// API pubblica della base comune dei motori (docs/plan/engines.md, "Parte comune a tutti i motori" e "Pezzi che
// mancano al kit"). Un motore importa da qui:
//
//   import { ChallengeRunner, ParamSlider, TabStrip, presetContract, type BasePreset } from '../shared'
//
// Il kit (src/widgets/kit) non si modifica: ciò che serve a più motori e al kit manca sta qui; se un pezzo si
// rivela generale lo si promuove al kit con un task a parte.
//
// Tre gruppi, scritti da tre costruttori:
// - tipi e cornice: tipi dei preset, contratto dei test, gemelli, sfide comuni, schede, spie, parametri, formule,
//   legenda, grafico grandezza-parametro, pannelli collegati, strumenti (quadrante, termometro, contatore),
//   Monte Carlo (a lotti per fotogramma, o in un Web Worker con monteCarloWorker.ts per le repliche lente), canale
//   dei fotogrammi;
// - maniglie e segni: manopola, maniglie su curva e retta, soglia, ellisse, matrice, chip e liste riordinabili,
//   segni in volo, disegno a mano libera, steli, violini, fasce;
// - matematica (math/): gaussiane e misure di separabilità, algebra lineare simmetrica, classificatori 2D, stima
//   non parametrica 2D, EM e k-means, proiezione 3D, funzioni speciali.

// --- tipi e cornice ---
export * from './types'
export * from './params'
export * from './presetTools'
export * from './challenges'
export * from './presetContract'
export * from './twins'
export * from './frameChannel'
export * from './monteCarloWorker'
export * from './MonteCarloRunner'
export * from './paramAxes'
export * from './meters'
export * from './sciNotation'
export * from './linked'
export * from './ChallengeRunner'
export * from './ChallengePanel'
export * from './TabStrip'
export * from './InsightLamps'
export * from './ParamSlider'
export * from './FormulaList'
export * from './TermLegend'
export * from './ParamChart'
export * from './LinkedPanels'
export * from './Gauge'
export * from './Thermometer'
export * from './SciCounter'

// --- maniglie e segni ---
export * from './handleMath'
export * from './dragKeyboard'
export * from './ellipseGeometry'
export * from './flightPath'
export * from './matrixCells'
export * from './sketchScore'
export * from './violinShape'
export * from './useFlip'
export * from './DragHandle'
export * from './Knob'
export * from './HandleOnCurve'
export * from './LineHandles'
export * from './Threshold'
export * from './Ellipse'
export * from './MatrixGrid'
export * from './DragBins'
export * from './Sortable'
export * from './Flight'
export * from './Sketch'
export * from './Stem'
export * from './Violin'
export * from './Ribbon'

// --- matematica ---
export * from './math'
