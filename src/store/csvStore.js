import { create } from 'zustand'

const STORAGE_KEY = 'imported_csv_files'

// Funzione per ordinare le date in ordine crescente
const sortDates = (dates) => {
  return [...dates].sort((a, b) => {
    const [dA, mA, yA] = a.value.split('/').map(Number)
    const [dB, mB, yB] = b.value.split('/').map(Number)
    return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB)
  })
}

export const buildCSVContent = (corsi) => {
  const lines = ['Corso;Data']

  Object.values(corsi || {})
    .slice()
    .sort((a, b) => (a.courseOrder ?? 0) - (b.courseOrder ?? 0))
    .forEach((courseData) => {
      const courseName = courseData.displayName || courseData.originalName || ''
      sortDates(courseData.dates || []).forEach((date) => {
        lines.push(`${courseName};${date.value}`)
      })
    })

  return `${lines.join('\n')}\n`
}

// Funzione per parsare il CSV e raggruppare date per corso
const parseCSV = (content) => {
  if (!content || typeof content !== 'string') return {}
  const lines = content.trim().split('\n')
  const corsiMap = {}

  // Salta l'header (prima riga)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Dividi per semicolono (separatore CSV)
    const [corso, data] = line.split(';').map((val) => val.trim())

    if (corso && data) {
      if (!corsiMap[corso]) {
        corsiMap[corso] = []
      }
      corsiMap[corso].push(data)
    }
  }

  // Ordina le date per ogni corso
  Object.keys(corsiMap).forEach((corso) => {
    corsiMap[corso].sort((a, b) => {
      const [dA, mA, yA] = a.split('/').map(Number)
      const [dB, mB, yB] = b.split('/').map(Number)
      return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB)
    })
  })

  return corsiMap
}

// Funzione per migrare i dati dal vecchio formato al nuovo
const migrateOldFormat = (corsi) => {
  if (!corsi) return {}
  
  const migrated = {}
  let orderCounter = 0
  
  Object.keys(corsi).forEach((courseName) => {
    const courseData = corsi[courseName]
    
    // Se è un array (vecchio formato), convertilo
    if (Array.isArray(courseData)) {
      const dates = courseData.map((date) => ({
        id: `${courseName}-${date}`,
        value: date,
      }))
      migrated[courseName] = {
        originalName: courseName,
        displayName: courseName,
        originalDisplayName: courseName,
        dates: dates,
        originalDates: dates,
        courseOrder: courseData.courseOrder ?? orderCounter++,
      }
    } else if (courseData && !courseData.dates) {
      // Se è un oggetto ma senza dates (formato intermedio), convertilo
      const dates = Array.isArray(courseData.originalDates) 
        ? courseData.originalDates.map((date) => ({
            id: `${courseName}-${date}`,
            value: date,
          }))
        : []
      migrated[courseName] = {
        originalName: courseName,
        displayName: courseData.displayName || courseName,
        originalDisplayName: courseData.originalDisplayName || courseData.displayName || courseName,
        dates: dates,
        originalDates: dates,
        courseOrder: courseData.courseOrder ?? orderCounter++,
      }
    } else {
      // È già nel nuovo formato
      migrated[courseName] = {
        ...courseData,
        originalDisplayName: courseData.originalDisplayName || courseData.displayName || courseName,
        originalDates: courseData.originalDates || courseData.dates || [],
        courseOrder: courseData.courseOrder ?? orderCounter++,
      }
    }
  })
  
  return migrated
}

const csvStore = create((set) => ({
  files: [],
  
  // Inizializza da localStorage
  initializeFromStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const files = JSON.parse(stored)
        const migratedFiles = files.map((file) => ({
          ...file,
          corsi: migrateOldFormat(file.corsi),
        }))
        set({ files: migratedFiles })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedFiles))
      } catch (error) {
        console.error('Errore nel caricamento dei file da localStorage:', error)
      }
    }
  },

  // Aggiungi un file importato
  addFile: (file) => {
    set((state) => {
      // Parsa il CSV
      const corsiMap = parseCSV(file.content)
      
      // Trasforma in struttura con metadata
      const corsiWithMetadata = {}
      let orderCounter = 0
      Object.keys(corsiMap).forEach((corso) => {
        const datesList = sortDates(corsiMap[corso].map((date) => ({
          id: `${corso}-${date}`,
          value: date,
        })))
        corsiWithMetadata[corso] = {
          originalName: corso,
          displayName: corso,
          originalDisplayName: corso,
          dates: datesList,
          originalDates: datesList,
          courseOrder: orderCounter++,
        }
      })
      
      const newFile = {
        id: Date.now(),
        name: file.name,
        date: new Date().toLocaleString('it-IT'),
        content: file.content,
        corsi: corsiWithMetadata,
      }
      const updatedFiles = [...state.files, newFile]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Rinomina un corso
  renameCourse: (fileId, originalCourseName, newName) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[originalCourseName]) {
          const updatedCorsi = { ...file.corsi }
          updatedCorsi[originalCourseName] = {
            ...updatedCorsi[originalCourseName],
            displayName: newName,
          }
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Modifica una data
  updateDate: (fileId, courseName, dateId, newDate) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[courseName]) {
          const updatedCorsi = { ...file.corsi }
          const courseData = { ...updatedCorsi[courseName] }
          courseData.dates = courseData.dates.map((d) =>
            d.id === dateId ? { ...d, value: newDate } : d
          )
          courseData.dates = sortDates(courseData.dates)
          updatedCorsi[courseName] = courseData
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Rimuovi una data
  removeDate: (fileId, courseName, dateId) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[courseName]) {
          const updatedCorsi = { ...file.corsi }
          const courseData = { ...updatedCorsi[courseName] }
          courseData.dates = courseData.dates.filter((d) => d.id !== dateId)
          
          // Se non ci sono più date, rimuovi il corso
          if (courseData.dates.length === 0) {
            delete updatedCorsi[courseName]
          } else {
            updatedCorsi[courseName] = courseData
          }
          
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Rimuovi un file importato
  removeFile: (fileId) => {
    set((state) => {
      const updatedFiles = state.files.filter((f) => f.id !== fileId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Ottieni un file specifico
  getFile: (fileId) => {
    const state = csvStore.getState()
    return state.files.find((f) => f.id === fileId)
  },

  // Reset file al suo stato originale (riparsare il CSV)
  resetFile: (fileId) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.content) {
          // Re-parsa il content originale
          const corsiMap = parseCSV(file.content)
          
          // Ricrea la struttura
          const corsiWithMetadata = {}
          let orderCounter = 0
          Object.keys(corsiMap).forEach((corso) => {
            const datesList = sortDates(corsiMap[corso].map((date) => ({
              id: `${corso}-${date}`,
              value: date,
            })))
            corsiWithMetadata[corso] = {
              originalName: corso,
              displayName: corso,
              originalDisplayName: corso,
              dates: datesList,
              originalDates: datesList,
              courseOrder: orderCounter++,
            }
          })
          
          return { ...file, corsi: corsiWithMetadata }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Aggiorna il colore di un corso
  updateCourseColor: (fileId, courseName, color) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[courseName]) {
          const updatedCorsi = { ...file.corsi }
          updatedCorsi[courseName] = {
            ...updatedCorsi[courseName],
            customColor: color,
          }
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Aggiungi una data random al corso
  addRandomDate: (fileId, courseName) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[courseName]) {
          const updatedCorsi = { ...file.corsi }
          const courseData = { ...updatedCorsi[courseName] }
          
          // Genera il 1 gennaio dell'anno corrente
          const today = new Date()
          const fixedDate = new Date(today.getFullYear(), 0, 1)
          const [d, m, y] = [
            String(fixedDate.getDate()).padStart(2, '0'),
            String(fixedDate.getMonth() + 1).padStart(2, '0'),
            fixedDate.getFullYear(),
          ]
          const dateValue = `${d}/${m}/${y}`
          
          const newDateId = `${courseName}-${dateValue}-${Date.now()}`
          courseData.dates = sortDates([...courseData.dates, { id: newDateId, value: dateValue }])
          updatedCorsi[courseName] = courseData
          
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Resetta un corso al suo stato originale
  resetCourse: (fileId, courseName) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[courseName]) {
          const updatedCorsi = { ...file.corsi }
          const originalData = sortDates(updatedCorsi[courseName].originalDates || [])
          
          updatedCorsi[courseName] = {
            ...updatedCorsi[courseName],
            displayName: courseName,
            dates: originalData,
            originalDates: originalData,
          }
          delete updatedCorsi[courseName].customColor
          
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Rimuovi un corso dal file
  removeCourse: (fileId, courseName) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId && file.corsi[courseName]) {
          const updatedCorsi = { ...file.corsi }
          delete updatedCorsi[courseName]
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Aggiungi un nuovo corso vuoto
  addNewCourse: (fileId) => {
    set((state) => {
      const updatedFiles = state.files.map((file) => {
        if (file.id === fileId) {
          const updatedCorsi = { ...file.corsi }
          // Genera un nome univoco
          let courseName = 'Nuovo Corso'
          let counter = 1
          while (updatedCorsi[courseName]) {
            counter++
            courseName = `Nuovo Corso ${counter}`
          }
          // Trova il massimo courseOrder
          let maxOrder = -1
          Object.values(updatedCorsi).forEach((corso) => {
            if (typeof corso.courseOrder === 'number' && corso.courseOrder > maxOrder) {
              maxOrder = corso.courseOrder
            }
          })
          updatedCorsi[courseName] = {
            originalName: courseName,
            displayName: courseName,
            originalDisplayName: courseName,
            dates: [],
            originalDates: [],
            courseOrder: maxOrder + 1,
          }
          // Aggiungi subito una data random
          const today = new Date()
          const fixedDate = new Date(today.getFullYear(), 0, 1)
          const [d, m, y] = [
            String(fixedDate.getDate()).padStart(2, '0'),
            String(fixedDate.getMonth() + 1).padStart(2, '0'),
            fixedDate.getFullYear(),
          ]
          const dateValue = `${d}/${m}/${y}`
          const newDateId = `${courseName}-${dateValue}-${Date.now()}`
          updatedCorsi[courseName].dates = [{ id: newDateId, value: dateValue }]
          updatedCorsi[courseName].originalDates = [{ id: newDateId, value: dateValue }]
          return { ...file, corsi: updatedCorsi }
        }
        return file
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles))
      return { files: updatedFiles }
    })
  },

  // Cancella tutti i file
  clearAllFiles: () => {
    set({ files: [] })
    localStorage.removeItem(STORAGE_KEY)
  },
}))

// Inizializza da localStorage al caricamento
csvStore.getState().initializeFromStorage()

export default csvStore
