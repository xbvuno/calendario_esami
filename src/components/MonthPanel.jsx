import '../../styles/MonthPanel.css'
import { toDateKey } from '../utils/dateUtils'

const MONTH_FORMATTER = new Intl.DateTimeFormat('it-IT', {
  month: 'long',
  year: 'numeric',
})

const DAY_FORMATTER = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

// Genera il background gradient per una day-cell
function generateGradientBackground(dayExams, subjectColorMap) {
  if (dayExams.length === 0) return ''
  
  if (dayExams.length === 1) {
    return subjectColorMap[dayExams[0].originalCourso]
  }

  const colors = dayExams.map(exam => {
    return subjectColorMap[exam.originalCourso]
  })
  
  return `linear-gradient(135deg, ${colors.join(', ')})`
}

function MonthPanel({ monthDate, examsByDay, subjectColorMap, today }) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingEmptySlots = (firstDay.getDay() + 6) % 7
  const totalCells = leadingEmptySlots + daysInMonth
  const trailingEmptySlots = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  const cells = []

  // Empty slots before (giorni del mese precedente)
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
  const firstDayOfPrev = daysInPrevMonth - leadingEmptySlots + 1

  for (let i = 0; i < leadingEmptySlots; i++) {
    const dayNum = firstDayOfPrev + i
    cells.push(
      <div key={`empty-before-${i}`} className="day-cell day-cell--empty">
        <div className="day-head">
          <span className="day-number">{dayNum}</span>
        </div>
      </div>
    )
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const key = toDateKey(date)
    const dayExams = examsByDay.get(key) ?? []
    const hasExams = dayExams.length > 0
    const isToday = key === toDateKey(today)

    const classes = ['day-cell']
    if (hasExams) classes.push('day-cell--has-exams')
    if (isToday) classes.push('day-cell--today')

    cells.push(
      <article
        key={`day-${day}`}
        className={classes.join(' ')}
        style={{
          background: generateGradientBackground(dayExams, subjectColorMap),
        }}
        aria-label={`${DAY_FORMATTER.format(date)}${hasExams ? `, ${dayExams.length} esami` : ''}`}
      >
        <div className="day-head">
          <span className="day-number">{day}</span>
        </div>
        <ul className="day-exams">
          {hasExams ? (
            dayExams.map((exam, idx) => (
              <li key={idx} className="day-exam">
                <span className="day-exam-course">
                  {exam.corso}
                </span>
              </li>
            ))
          ) : (
            <li className="day-empty-text">-</li>
          )}
        </ul>
      </article>
    )
  }

  // Empty slots after (giorni del mese successivo)
  for (let i = 0; i < trailingEmptySlots; i++) {
    const dayNum = i + 1
    cells.push(
      <div key={`empty-after-${i}`} className="day-cell day-cell--empty">
        <div className="day-head">
          <span className="day-number">{dayNum}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="calendar-header">
        <h2 className="month-title">{MONTH_FORMATTER.format(monthDate)}</h2>
      </div>
      <div className="weekdays">
        {WEEK_DAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">{cells}</div>
    </>
  )
}

export default MonthPanel
