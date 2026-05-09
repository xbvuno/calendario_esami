export const SATURATION = 70;
export const LUMINANCE = 70;
export const HUE_STEP = 30;

// Funzione per generare colore HSL basato su indice (60 gradi di rotazione per corso)
export const generateColorForCourse = (courseName, courseIndex) => {
  // Se courseIndex è passato, usa quello per calcolare l'hue
  if (typeof courseIndex === 'number') {
    const hue = (courseIndex * HUE_STEP) % 360
    return `hsl(${hue}, ${SATURATION}%, ${LUMINANCE}%)`
  }
  
  // Fallback al sistema basato su nome se index non è passato
  let hash = 0
  for (let i = 0; i < courseName.length; i++) {
    hash = ((hash << 5) - hash) + courseName.charCodeAt(i)
    hash = hash & hash
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, ${SATURATION}%, ${LUMINANCE}%)`
}
