// a function that reverses a string
function reverseString(str) {
    return str.split('').reverse().join('');
}

// a function that sliggifies a string (URL-friendly slug)
function sliggifyString(str) {
    return str
        .normalize('NFKD')                 // split accented chars
        .replace(/[\u0300-\u036f]/g, '')   // remove diacritics
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')       // non-alphanumerics to hyphen
        .replace(/^-+|-+$/g, '')           // trim leading/trailing hyphens
        .replace(/-{2,}/g, '-');           // collapse multiple hyphens
}


 