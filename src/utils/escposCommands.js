/**
 * ESC/POS Command Generator for 58mm Thermal Printers
 * Based on the 58MM Thermal Printer Programming Manual
 *
 * Specifications:
 * - Paper width: 58mm = ~384 dots at 203.2 dpi
 * - Font A: 12×24 dots (~48 characters per line)
 * - Font B: 9×17 dots (~64 characters per line)
 */

// ESC/POS Control Characters
const ESC = 0x1B;  // Escape
const GS = 0x1D;   // Group Separator
const FS = 0x1C;   // File Separator
const LF = 0x0A;   // Line Feed
const HT = 0x09;   // Horizontal Tab

/**
 * ESC/POS Command Builder Class
 */
export class ESCPOSBuilder {
  constructor() {
    this.buffer = [];
  }

  /**
   * Get the final byte array
   */
  getBytes() {
    return new Uint8Array(this.buffer);
  }

  /**
   * Initialize printer (ESC @)
   * Clears buffer and resets to power-on state
   */
  init() {
    this.buffer.push(ESC, 0x40);
    return this;
  }

  /**
   * Add text string
   */
  text(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.buffer.push(...bytes);
    return this;
  }

  /**
   * Line feed (LF)
   * Prints buffer and advances one line
   */
  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  /**
   * Set alignment (ESC a n)
   * n = 0: Left, 1: Center, 2: Right
   */
  align(alignment) {
    const alignMap = {
      'left': 0,
      'center': 1,
      'right': 2
    };
    const n = alignMap[alignment] ?? 0;
    this.buffer.push(ESC, 0x61, n);
    return this;
  }

  /**
   * Set text size (GS ! n)
   * width: 1-8, height: 1-8
   */
  size(width = 1, height = 1) {
    // Validate range
    width = Math.max(1, Math.min(8, width));
    height = Math.max(1, Math.min(8, height));

    // Calculate n: bits 0-2 for height (0-7), bits 4-7 for width (0-7)
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(GS, 0x21, n);
    return this;
  }

  /**
   * Set bold mode (ESC E n)
   * enabled: true/false
   */
  bold(enabled = true) {
    this.buffer.push(ESC, 0x45, enabled ? 1 : 0);
    return this;
  }

  /**
   * Set underline (ESC - n)
   * mode: 0 = off, 1 = 1-dot, 2 = 2-dot
   */
  underline(mode = 0) {
    this.buffer.push(ESC, 0x2D, mode);
    return this;
  }

  /**
   * Set line spacing (ESC 3 n)
   * n = line spacing in units of 0.125mm
   * Default: 30 (3.75mm)
   */
  lineSpacing(n = 30) {
    this.buffer.push(ESC, 0x33, n);
    return this;
  }

  /**
   * Reset line spacing to default (ESC 2)
   */
  resetLineSpacing() {
    this.buffer.push(ESC, 0x32);
    return this;
  }

  /**
   * Set character spacing (ESC SP n)
   * n = spacing in units of 0.125mm
   */
  charSpacing(n = 0) {
    this.buffer.push(ESC, 0x20, n);
    return this;
  }

  /**
   * Print and feed paper (ESC d n)
   * n = number of lines to feed
   */
  feedLines(n = 1) {
    this.buffer.push(ESC, 0x64, n);
    return this;
  }

  /**
   * Cut paper (partial cut)
   * GS V m n
   * m = 66 (partial cut), n = feed lines before cut
   */
  cut(feedLines = 3) {
    this.buffer.push(GS, 0x56, 66, feedLines);
    return this;
  }

  /**
   * Print horizontal line
   * Uses dashes for width of 48 chars (Font A)
   */
  hr(char = '-', width = 48) {
    this.text(char.repeat(width));
    this.feed();
    return this;
  }

  /**
   * Print QR Code (ESC Z m n k dL dH d1...dn)
   * According to manual page 25
   *
   * @param {string} data - QR code data
   * @param {number} errorCorrection - 0=L(7%), 1=M(15%), 2=Q(25%), 3=H(30%)
   * @param {number} moduleSize - 1-8 (cell size)
   */
  qrCode(data, errorCorrection = 1, moduleSize = 6) {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const dataLength = dataBytes.length;

    // Calculate dL and dH (little-endian 16-bit length)
    const dL = dataLength & 0xFF;
    const dH = (dataLength >> 8) & 0xFF;

    // Command: ESC Z m n k dL dH d1...dn
    // m = 0 (auto size), n = error correction, k = module size
    this.buffer.push(
      ESC, 0x5A,           // ESC Z
      0,                   // m (auto size)
      errorCorrection,     // n (error correction level)
      moduleSize,          // k (module size)
      dL, dH,              // data length (little-endian)
      ...dataBytes         // QR data
    );

    return this;
  }

  /**
   * Helper: Print centered text
   */
  centerText(text) {
    return this.align('center').text(text).feed().align('left');
  }

  /**
   * Helper: Print header (centered, bold, large)
   */
  header(text) {
    return this
      .align('center')
      .bold(true)
      .size(2, 2)
      .text(text)
      .feed()
      .size(1, 1)
      .bold(false)
      .align('left');
  }

  /**
   * Helper: Print key-value pair
   * e.g., "Cliente: Juan Pérez"
   */
  keyValue(key, value, maxWidth = 48) {
    const keyText = `${key}: `;
    const valueText = String(value);

    // Calculate available space for value
    const availableWidth = maxWidth - keyText.length;

    // Truncate value if too long
    let displayValue = valueText;
    if (valueText.length > availableWidth) {
      displayValue = valueText.substring(0, availableWidth - 3) + '...';
    }

    this.text(keyText + displayValue);
    this.feed();
    return this;
  }

  /**
   * Helper: Print table row with two columns
   * Left-aligned first column, right-aligned second column
   */
  tableRow(left, right, width = 48) {
    const leftText = String(left);
    const rightText = String(right);

    // Calculate spacing
    const spacesNeeded = width - leftText.length - rightText.length;
    const spaces = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : ' ';

    this.text(leftText + spaces + rightText);
    this.feed();
    return this;
  }

  /**
   * Open cash drawer (ESC p m t1 t2)
   * m: 0=pin2, 1=pin5
   * t1, t2: pulse timing (multiples of 2ms)
   */
  openDrawer(pin = 0, onTime = 60, offTime = 120) {
    this.buffer.push(ESC, 0x70, pin, onTime, offTime);
    return this;
  }

  /**
   * Set reverse printing (white on black)
   * ESC { n
   */
  reverse(enabled = true) {
    this.buffer.push(ESC, 0x7B, enabled ? 1 : 0);
    return this;
  }

  /**
   * Helper: Print empty line
   */
  emptyLine() {
    return this.feed();
  }
}

/**
 * Utility: Calculate text width in characters
 * Font A: 12×24 → ~48 chars
 * Font B: 9×17 → ~64 chars
 */
export function getMaxChars(fontSize = 1, fontType = 'A') {
  const baseChars = fontType === 'A' ? 48 : 64;
  return Math.floor(baseChars / fontSize);
}

/**
 * Utility: Wrap text to fit printer width
 */
export function wrapText(text, maxWidth = 48) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Utility: Format currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

/**
 * Utility: Format date
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Export convenience function to create new builder
 */
export function createESCPOS() {
  return new ESCPOSBuilder();
}
