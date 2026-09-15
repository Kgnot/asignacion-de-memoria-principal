// KiB -> dirección hexadecimal de 6 dígitos, ej: 500 -> "0x07D000"
export function toHex(kib) {
    return '0x' + (kib * 1024).toString(16).toUpperCase().padStart(6, '0');
}