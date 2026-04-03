import { processReport } from '../lib/reportPipeline'

// A fake blood test report — like what a real lab gives
const FAKE_REPORT = `
THYROCARE TECHNOLOGIES LIMITED
Patient: Rahul Sharma   Age: 35   Gender: Male
Date: 15/03/2026

CBC - COMPLETE BLOOD COUNT
Haemoglobin        11.2    g/dL     13.0 - 17.0
WBC Count          7200    cumm     4000 - 11000
Platelet Count     2.4     Lacs     1.5 - 4.5

BIOCHEMISTRY
HbA1c              5.9     %        4.0 - 5.6
Fasting Sugar      102     mg/dL    70 - 100
S. Creatinine      0.9     mg/dL    0.7 - 1.2

VITAMINS
Vitamin D3         24      ng/mL    30 - 100
Vitamin B12        380     pg/mL    200 - 900
`

async function runTest() {
    console.log('🧪 Starting test...\n')

    const buffer = Buffer.from(FAKE_REPORT)
    const result = await processReport(buffer, 'text/plain')

    console.log('✅ STRUCTURED DATA FROM CLAUDE:')
    console.log(JSON.stringify(result.structured, null, 2))

    console.log('\n✅ ENGLISH EXPLANATION:')
    console.log(result.explanation_en)

    console.log('\n✅ HINDI EXPLANATION:')
    console.log(result.explanation_hi)
}

runTest().catch(console.error)