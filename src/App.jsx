import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Calendar from './components/Calendar'
import csvStore from './store/csvStore'
import '../styles/App.css'
import { CalendarDays, Printer } from 'lucide-react'

function App() {
  const files = csvStore((state) => state.files)
  const [selectedFileId, setSelectedFileId] = useState(null)

  // Usa il primo file se disponibile e nessuno è selezionato, altrimenti usa quello selezionato
  const activeFileId = selectedFileId !== null ? selectedFileId : (files.length > 0 ? files[0].id : null)
  const selectedFile = files.find((f) => f.id === activeFileId)
  const corsi = selectedFile?.corsi || {}

  const handleExportPdf = () => {
    window.print()
  }

  return (
    <>
      <header>
        <h2><CalendarDays size={24}/><p>CALENDARIO ESAMI</p></h2>
        <button onClick={handleExportPdf} className='min'>
          <Printer size={16}/>
          <span>Esporta PDF</span> 
        </button>
      </header>
      <div className='layout'>
          <Sidebar selectedFileId={activeFileId} onSelectFile={setSelectedFileId} />
        <main>
          <Calendar corsi={corsi} />
        </main>
      </div>
    </>
  )
}

export default App
