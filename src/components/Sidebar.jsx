import { useRef, useState, useEffect } from 'react'
import csvStore, { buildCSVContent } from '../store/csvStore'
import { FileDown, FileUp, Pencil, PlusCircle, RotateCcw, Trash2 } from 'lucide-react'
import CourseItem from './CourseItem'

// Funzione per convertire data da DD/MM/YYYY a formato input date (YYYY-MM-DD)
const inputToDate = (inputDate) => {
  const [y, m, d] = inputDate.split('-')
  return `${d}/${m}/${y}`
}

function Sidebar({ selectedFileId, onSelectFile }) {
  const { files, addFile, removeFile, updateDate, removeDate, resetFile, updateCourseColor, addRandomDate, resetCourse, removeCourse, addNewCourse } = csvStore()
  const fileInputRef = useRef(null)
  const [exportName, setExportName] = useState('')

  // Aggiorna exportName quando cambia il file selezionato
  useEffect(() => {
    if (selectedFile) {
      setExportName(selectedFile.name)
    } else {
      setExportName('')
    }
  }, [selectedFileId])

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target.result
        addFile({
          name: file.name,
          content: content,
        })
      } catch (error) {
        console.error('Errore nell\'importazione del file:', error)
        alert('Errore nell\'importazione del file CSV')
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDateChange = (fileId, courseName, dateId, newDateInput) => {
    const newDate = inputToDate(newDateInput)
    updateDate(fileId, courseName, dateId, newDate)
  }

  const selectedFile = files.find((f) => f.id === selectedFileId)
  const corsi = selectedFile?.corsi || {}
  const corsiList = Object.keys(corsi).sort()

  return (
    <aside>
      <section>
        <button onClick={() => fileInputRef.current?.click()}>
          <FileUp size={16} />
          <span>Importa CSV</span>
        </button>
        <input
          ref={fileInputRef}
          id="csv-import"
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          style={{ display: 'none' }}
        />
        {files.length > 0 && (
          <div className='select-wrap'>
            <select
              id="file-dropdown"
              value={selectedFileId || ''}
              onChange={(e) => onSelectFile(e.target.value ? parseInt(e.target.value) : null)}
            >
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                removeFile(selectedFile.id)
                onSelectFile(null)
              }}
            ><Trash2 size={16} /></button>
            <button
              onClick={() => {
                resetFile(selectedFile.id)
              }}
            ><RotateCcw size={16} /></button>
          </div>
        )}
      </section>

      <section>
        {selectedFile && (
          <div className="corsi-list">
            {corsiList.map((originalName) => {
              const corso = corsi[originalName]
              return (
                <CourseItem
                  key={originalName}
                  originalName={originalName}
                  corso={corso}
                  courseIndex={corso.courseOrder}
                  onDateChange={handleDateChange}
                  onRemoveDate={removeDate}
                  selectedFileId={selectedFileId}
                  onUpdateCourseColor={updateCourseColor}
                  onAddRandomDate={addRandomDate}
                  onResetCourse={resetCourse}
                  onRemoveCourse={removeCourse}
                />
              )
            })}
          </div>
        )}
        <div
          className='corso-item add'
          onClick={() => {
            if (!selectedFile) {
              const newFile = {
                id: Date.now(),
                name: 'Nuova Configurazione',
                content: '',
                corsi: {},
              }
              addFile(newFile)
              onSelectFile(newFile.id)
              addNewCourse(newFile.id)
            } else {
              addNewCourse(selectedFileId)
            }
          }}
        >
          <PlusCircle size={16} /> Aggiungi corso
        </div>
      </section>

      {selectedFile && (
        <section>
          <small>NOME EXPORT</small>
          <div className="text-input">
            <input
              type="text"
              value={exportName}
              onChange={(e) => setExportName(e.target.value)}
            />
            <span><Pencil size={16} /></span>
          </div>
          <button
            onClick={() => {
              const currentCsv = buildCSVContent(selectedFile.corsi)
              const element = document.createElement('a')
              element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(currentCsv))
              element.setAttribute('download', exportName || selectedFile.name)
              element.style.display = 'none'
              document.body.appendChild(element)
              element.click()
              document.body.removeChild(element)
            }}
          >
            <FileDown size={16} /> 
            <span>Esporta CSV</span>
          </button>
        </section>
      )}
    </aside >
  )
}

export default Sidebar
