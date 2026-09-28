// "Monta tutto": le pagine lunghe (formulario, glossario) montano i blocchi solo quando si avvicinano allo
// schermo; per la stampa servono tutti. Il contesto sta in un file suo, così i file dei componenti restano solo
// componenti (fast refresh).
import { createContext } from 'react'

export const MountAllContext = createContext(false)
