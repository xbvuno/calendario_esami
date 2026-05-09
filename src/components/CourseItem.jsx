import { useEffect, useRef } from 'react'
import { CalendarPlus, Pencil, Pipette, RotateCcw, Trash2 } from 'lucide-react'
import csvStore from '../store/csvStore'
import { generateColorForCourse } from '../utils/colorUtils'
import '../../styles/CourseItem.css'

const dateToInput = (dateStr) => {
    const [d, m, y] = dateStr.split('/').map(Number)
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Converti HSL a Hex
const hslToHex = (hslColor) => {
    if (hslColor.startsWith('#')) return hslColor
    
    const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (!match) return '#000000'
    
    const h = parseInt(match[1])
    const s = parseInt(match[2]) / 100
    const l = parseInt(match[3]) / 100
    
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2
    
    let r, g, b
    if (h < 60) [r, g, b] = [c, x, 0]
    else if (h < 120) [r, g, b] = [x, c, 0]
    else if (h < 180) [r, g, b] = [0, c, x]
    else if (h < 240) [r, g, b] = [0, x, c]
    else if (h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    
    const toHex = (n) => {
        const hex = Math.round((n + m) * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function CourseItem({
    originalName,
    corso,
    courseIndex,
    onDateChange,
    onRemoveDate,
    selectedFileId,
    onUpdateCourseColor,
    onAddRandomDate,
    onResetCourse,
    onRemoveCourse,
}) {
    const dates = corso?.dates || []
    const bgColor = corso?.customColor || generateColorForCourse(originalName, courseIndex)
    const colorPickerRef = useRef(null)
    const rafRef = useRef(null)

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    return (<>
        <details className='corso-item'>
            <summary className="corso-header" style={{ backgroundColor: bgColor }}>{corso.displayName} [{dates.length}]</summary>
            <div>
                <div className='buttons'>
                    <button onClick={() => onAddRandomDate(selectedFileId, originalName)}>
                        <CalendarPlus size={16}/>
                    </button>
                    <button onClick={() => onResetCourse(selectedFileId, originalName)}>
                        <RotateCcw size={16}/>
                    </button>
                    <button onClick={() => onRemoveCourse(selectedFileId, originalName)}>
                        <Trash2 size={16}/>
                    </button>
                </div>
                <p>NOME CORSO</p>
                <div className='title-input'>
                    <div className="text-input">
                        <input
                            type="text"
                            value={corso.displayName}
                            onChange={(e) => {
                                csvStore.getState().renameCourse(selectedFileId, originalName, e.target.value)
                            }}
                        />
                        <span><Pencil size={16} /></span>
                    </div>
                    <button
                        style={{ backgroundColor: bgColor }}
                        onClick={() => colorPickerRef.current?.click()}
                    >
                        <Pipette size={16} />
                    </button>
                </div>
                <input
                    ref={colorPickerRef}
                    type="color"
                    value={hslToHex(bgColor)}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const newColor = e.target.value
                        if (rafRef.current) {
                            cancelAnimationFrame(rafRef.current)
                        }

                        rafRef.current = requestAnimationFrame(() => {
                            onUpdateCourseColor(selectedFileId, originalName, newColor)
                        })
                    }}
                />
                {dates.length > 0 && <p>DATE</p>}
                <div className="date-list">
                    {dates.map((dateObj) => (
                        <div key={dateObj.id} className='date-input'>
                            <input
                                type='date'
                                value={dateToInput(dateObj.value)}
                                onChange={(e) =>
                                    onDateChange(selectedFileId, originalName, dateObj.id, e.target.value)
                                }
                            />
                            <span
                                onClick={() => onRemoveDate(selectedFileId, originalName, dateObj.id)}
                            >
                                <Trash2 size={16} />
                            </span>
                        </div>
                    ))}
                </div>

            </div>
        </details>
    </>)
}

export default CourseItem
