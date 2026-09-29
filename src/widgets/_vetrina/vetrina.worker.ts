// Il worker della vetrina: prova nel browser il calcolo Monte Carlo fuori dal thread principale (MonteCarloRunner).
import { serveMonteCarlo } from '../engines/shared/monteCarloWorker'
import { vetrinaReplica } from './vetrina-replica'

serveMonteCarlo(vetrinaReplica)
