const HISTORY_LIMIT = 50;
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_RESUME_KEYWORD_MATCHES = 2;
const RESUME_KEYWORDS = [
    'experience',
    'education',
    'skills',
    'projects',
    'work history',
    'professional summary',
    'certifications',
    'contact',
    'objective',
];

const NON_RESUME_HINTS = [
    { keyword: 'roadmap', message: 'The file you uploaded looks like a roadmap, not a resume.' },
    { keyword: 'tutorial', message: 'It seems you uploaded a tutorial. Please upload a resume.' },
    { keyword: 'syllabus', message: 'This document looks like a syllabus, not a resume.' },
    { keyword: 'notes', message: 'Study notes detected. Please upload a resume instead.' },
    { keyword: 'assignment', message: 'Assignments are not supported. Upload your resume for analysis.' },
    { keyword: 'cheatsheet', message: 'Cheatsheets cannot be scored. Please use a resume PDF.' },
];

module.exports = {
    HISTORY_LIMIT,
    MAX_UPLOAD_SIZE_BYTES,
    MIN_RESUME_KEYWORD_MATCHES,
    RESUME_KEYWORDS,
    NON_RESUME_HINTS,
};

