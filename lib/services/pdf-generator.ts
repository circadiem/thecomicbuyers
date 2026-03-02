// PDF appraisal report builder — implementation lives in pdf-report.tsx (JSX)
// This file re-exports so callers can import from 'pdf-generator' without caring
// about the JSX file extension.
export { generatePDF } from '@/lib/services/pdf-report';
