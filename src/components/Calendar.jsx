import '../../styles/Calendar.css'
import { SATURATION, LUMINANCE, HUE_STEP } from '../utils/colorUtils'
import MonthPanel from './MonthPanel'
import { fromMonthKey, toDateKey, toMonthKey } from '../utils/dateUtils'

function Calendar({ corsi }) {
  // Converti i dati da Zustand in formato esami
  const exams = []
  
  Object.keys(corsi).forEach((courseName) => {
    const courseData = corsi[courseName]
    const dates = courseData?.dates || []
    dates.forEach((dateObj) => {
      const [d, m, y] = dateObj.value.split('/').map(Number)
      exams.push({
        corso: courseData.displayName,
        originalCourso: courseName,
        datetime: new Date(y, m - 1, d),
      })
    })
  })

  exams.sort((a, b) => a.datetime - b.datetime)

  // Estrai materie uniche e mappa hue + customColor
  const subjects = Array.from(new Set(exams.map((e) => e.originalCourso)))
  const subjectColorMap = {}
  subjects.forEach((originalCourso) => {
    const courseData = corsi[originalCourso]
    const hue = ((courseData?.courseOrder ?? 0) * HUE_STEP) % 360
    subjectColorMap[originalCourso] = courseData?.customColor || `hsl(${hue}, ${SATURATION}%, ${LUMINANCE}%)`
  })

  // Raggruppa esami per giorno
  const examsByDay = new Map()
  exams.forEach((exam) => {
    const key = toDateKey(exam.datetime)
    const current = examsByDay.get(key) ?? []
    current.push(exam)
    examsByDay.set(key, current)
  })

  // Estrai mesi con esami
  const examMonthKeys = [...new Set(exams.map((exam) => toMonthKey(exam.datetime)))].sort()

  const today = new Date()

  if (exams.length === 0) {
    return (
      <div className="calendar-app">
        <p className="empty-calendar">Nessun esame caricato. Aggiungi un corso e una data oppure importa un file CSV</p>
      </div>
    )
  }

  return (
    <div className="calendar-app">
      <section className="board">
        <div className="months-container">
          {examMonthKeys.length === 0 ? (
            <p className="empty-calendar">Nessun mese disponibile.</p>
          ) : (
            examMonthKeys.map((monthKey) => (
              <div key={monthKey} className="calendar-panel">
                <MonthPanel
                  monthDate={fromMonthKey(monthKey)}
                  examsByDay={examsByDay}
                  subjectColorMap={subjectColorMap}
                  today={today}
                />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default Calendar
