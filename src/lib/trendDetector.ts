// Looks at all reports and finds rising/falling trends

export interface Trend {
    parameter: string
    direction: 'rising' | 'falling' | 'stable'
    values: number[]
    dates: string[]
    change_percent: number
    is_concerning: boolean
    message: string
}

// Parameters that are dangerous when rising
const DANGEROUS_RISING = [
    'HbA1c', 'Fasting Blood Sugar', 'Creatinine',
    'Total Cholesterol', 'LDL Cholesterol',
    'Triglycerides', 'TSH', 'Uric Acid'
]

// Parameters that are dangerous when falling
const DANGEROUS_FALLING = [
    'Hemoglobin', 'Haemoglobin', 'Vitamin D3',
    'Vitamin B12', 'HDL Cholesterol', 'Platelet Count'
]

export function detectTrends(reports: any[]): Trend[] {
    if (reports.length < 2) return [] // Need at least 2 reports

    // Sort reports oldest to newest
    const sorted = [...reports].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    // Collect all parameter names across all reports
    const allParams = new Set<string>()
    sorted.forEach(r => {
        (r.parameters || []).forEach((p: any) => allParams.add(p.name))
    })

    const trends: Trend[] = []

    // Check each parameter across all reports
    allParams.forEach(paramName => {
        const dataPoints: { value: number, date: string }[] = []

        sorted.forEach(report => {
            const param = (report.parameters || []).find(
                (p: any) => p.name === paramName
            )
            if (param && param.value !== null) {
                dataPoints.push({
                    value: Number(param.value),
                    date: report.created_at
                })
            }
        })

        if (dataPoints.length < 2) return

        const first = dataPoints[0].value
        const last = dataPoints[dataPoints.length - 1].value
        const changePercent = Math.round(
            ((last - first) / first) * 100
        )

        const direction = changePercent > 3 ? 'rising'
            : changePercent < -3 ? 'falling' : 'stable'

        // Is this trend dangerous?
        const isConcerning =
            (direction === 'rising' && DANGEROUS_RISING.includes(paramName)) ||
            (direction === 'falling' && DANGEROUS_FALLING.includes(paramName))

        let message = ''
        if (isConcerning) {
            message = direction === 'rising'
                ? `⚠️ ${paramName} has risen ${Math.abs(changePercent)}% across your last ${dataPoints.length} reports`
                : `⚠️ ${paramName} has fallen ${Math.abs(changePercent)}% across your last ${dataPoints.length} reports`
        } else {
            message = `${paramName} is stable`
        }

        trends.push({
            parameter: paramName,
            direction,
            values: dataPoints.map(d => d.value),
            dates: dataPoints.map(d => d.date),
            change_percent: changePercent,
            is_concerning: isConcerning,
            message
        })
    })

    // Return concerning trends first
    return trends.sort((a, b) =>
        b.is_concerning ? 1 : -1
    )
}