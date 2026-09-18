// I kernel del corso visti dal motore: nome in italiano e in inglese, definizione nella notazione del
// docente (inventario m09, concetti c05, c13, c33-c39) e raggio del supporto nella variabile normalizzata
// u = (x − x_k)/h, che serve a disegnare ogni campana solo dove non è zero.
// I valori numerici NON sono qui: li dà sempre kernelValue di src/lib/ml/nonparam.ts.
import type { Kernel } from '../../../lib/ml/nonparam'

export interface KernelInfo {
  it: string
  en: string
  /** definizione in LaTeX, come nelle slide: γ(x) = Π(x) … */
  tex: string
  /**
   * Oltre questo |u| il kernel vale zero (supporto compatto) oppure meno di un decimillesimo del picco
   * (gaussiano, esponenziale). Infinity per le code pesanti (Cauchy, sinc²): si disegnano su tutto l'asse.
   */
  support: number
}

export const KERNEL_INFO: Readonly<Record<Kernel, KernelInfo>> = {
  rettangolare: {
    it: 'rettangolare',
    en: 'rectangular',
    tex: String.raw`\gamma(x)=\Pi(x)=\begin{cases}1, & |x|\le \tfrac{1}{2}\\ 0, & \text{altrove}\end{cases}`,
    support: 0.5,
  },
  triangolare: {
    it: 'triangolare',
    en: 'triangular',
    tex: String.raw`\gamma(x)=\Lambda(x)=\begin{cases}1-|x|, & |x|\le 1\\ 0, & \text{altrove}\end{cases}`,
    support: 1,
  },
  gaussiano: {
    it: 'gaussiano',
    en: 'Gaussian',
    tex: String.raw`\gamma(x)=\frac{1}{\sqrt{2\pi}}\exp\left(-\frac{x^2}{2}\right)`,
    // γ(4.3)/γ(0) ≈ 1e-4
    support: 4.3,
  },
  epanechnikov: {
    it: 'Epanechnikov',
    en: 'Epanechnikov',
    tex: String.raw`\gamma(x)=\begin{cases}\tfrac{3}{4}\,(1-x^2), & |x|\le 1\\ 0, & \text{altrove}\end{cases}`,
    support: 1,
  },
  esponenziale: {
    it: 'esponenziale',
    en: 'exponential',
    tex: String.raw`\gamma(x)=\tfrac{1}{2}\,e^{-|x|}`,
    // e^{-9.2} ≈ 1e-4
    support: 9.2,
  },
  cauchy: {
    it: 'Cauchy',
    en: 'Cauchy',
    tex: String.raw`\gamma(x)=\frac{1}{\pi\,(1+x^2)}`,
    support: Number.POSITIVE_INFINITY,
  },
  sinc2: {
    it: 'sinc²',
    en: 'sinc²',
    tex: String.raw`\gamma(x)=\frac{1}{2\pi}\left(\frac{\sin(x/2)}{x/2}\right)^2`,
    support: Number.POSITIVE_INFINITY,
  },
}
