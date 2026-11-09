import './styles.css'
import { createCalculator } from './ui/app'

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('No se encontró el contenedor de la aplicación')

createCalculator(root)
