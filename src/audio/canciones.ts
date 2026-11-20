/**
 * Canciones originales escritas como datos: cuatro canales como las portátiles de la época
 * (dos cuadradas, una triangular y ruido). Cada canal es una lista de pasos de semicorchea:
 * `C5:4` es una nota de 4 pasos, `-:2` un silencio de 2, y en el ruido `k` (bombo), `s` (caja), `h` (platillo).
 * Las barras `|` separan compases y no cuentan.
 */
export interface Cancion {
  bpm: number;
  bucle: boolean;
  p1: string;
  p2: string;
  tri: string;
  ruido: string;
}

/** Arpegio en corcheas sobre un acorde, repetido para llenar un compás de 16 pasos. */
function arp(...notas: string[]): string {
  const seq = [notas[0], notas[1], notas[2], notas[1]];
  return [...seq, ...seq].map((n) => `${n}:2`).join(' ');
}
/** Bajo «bum-chic»: raíz y quinta en negras. */
const bumChic = (raiz: string, quinta: string) => `${raiz}:4 ${quinta}:4 ${raiz}:4 ${quinta}:4`;
/** Bajo en corcheas alternando octava. */
const octavas = (baja: string, alta: string) => Array.from({ length: 4 }, () => `${baja}:2 ${alta}:2`).join(' ');
const repetir = (s: string, n: number) => Array.from({ length: n }, () => s).join(' | ');

export const CANCIONES: Record<string, Cancion> = {
  // Título: épica y luminosa, Do – Sol – La menor – Fa. Es la identidad sonora del juego.
  titulo: {
    bpm: 120,
    bucle: true,
    p1: 'C5:4 E5:2 G5:2 C6:4 B5:2 G5:2 | D5:4 G5:2 B5:2 D6:4 C6:2 B5:2 | A5:4 E5:2 A5:2 C6:4 B5:2 A5:2 | F5:2 G5:2 A5:2 C6:2 B5:4 G5:4',
    p2: [arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4')].join(' | '),
    tri: [octavas('C2', 'C3'), octavas('G2', 'G3'), octavas('A2', 'A3'), octavas('F2', 'F3')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 -:2 s:2 -:2 h:2 h:2', 4),
  },
  // Menú: tranquila, Fa – Sol – Mi menor – La menor.
  menu: {
    bpm: 104,
    bucle: true,
    p1: 'A4:4 C5:2 A4:2 G4:4 F4:4 | G4:2 A4:2 B4:2 D5:2 C5:4 B4:4 | E5:6 D5:2 B4:4 G4:4 | A4:4 C5:4 B4:2 G4:2 A4:4',
    p2: [arp('F4', 'A4', 'C5'), arp('G4', 'B4', 'D5'), arp('E4', 'G4', 'B4'), arp('A4', 'C5', 'E5')].join(' | '),
    tri: [bumChic('F2', 'C3'), bumChic('G2', 'D3'), bumChic('E2', 'B2'), bumChic('A2', 'E3')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 -:2 s:2 -:2 h:2 -:2', 4),
  },
  // Combate: La menor – Fa – Sol – Mi, con empuje.
  combate: {
    bpm: 140,
    bucle: true,
    p1: 'A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 | F5:4 E5:2 D5:2 C5:4 A4:4 | B4:2 D5:2 G5:4 F5:2 D5:2 B4:4 | G#4:2 B4:2 E5:4 D5:2 B4:2 G#4:4',
    p2: [arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('G3', 'B3', 'D4'), arp('E3', 'G#3', 'B3')].join(' | '),
    tri: [octavas('A2', 'A3'), octavas('F2', 'F3'), octavas('G2', 'G3'), octavas('E2', 'E3')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 k:2 s:2 -:2 h:2 -:2', 4),
  },
  // Jefe y Torre: Re menor – Si bemol – Do – La, más tensa y rápida.
  jefe: {
    bpm: 152,
    bucle: true,
    p1: 'D5:2 -:2 D5:2 F5:2 A5:4 G5:2 F5:2 | A#4:2 D5:2 F5:4 E5:2 D5:2 A#4:4 | C5:2 E5:2 G5:4 F5:2 E5:2 C5:4 | C#5:4 E5:4 A5:4 G5:2 E5:2',
    p2: [arp('D4', 'F4', 'A4'), arp('A#3', 'D4', 'F4'), arp('C4', 'E4', 'G4'), arp('A3', 'C#4', 'E4')].join(' | '),
    tri: [octavas('D2', 'D3'), octavas('A#1', 'A#2'), octavas('C2', 'C3'), octavas('A1', 'A2')].join(' | '),
    ruido: repetir('k:2 -:2 k:2 -:2 s:2 -:2 h:2 -:2', 3) + ' | k:2 -:2 k:2 -:2 s:2 s:2 s:2 s:2',
  },
  // Combate (variante 2): Mi menor – Do – Re – Si, vivaz.
  combate2: {
    bpm: 148,
    bucle: true,
    p1: 'E5:2 G5:2 B5:4 A5:2 G5:2 E5:4 | C5:2 E5:2 G5:4 E5:2 C5:2 G4:4 | D5:2 F#5:2 A5:4 F#5:2 D5:2 A4:4 | B4:2 D#5:2 F#5:4 D#5:2 B4:2 F#5:4',
    p2: [arp('E4', 'G4', 'B4'), arp('C4', 'E4', 'G4'), arp('D4', 'F#4', 'A4'), arp('B3', 'D#4', 'F#4')].join(' | '),
    tri: [octavas('E2', 'E3'), octavas('C2', 'C3'), octavas('D2', 'D3'), octavas('B1', 'B2')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 h:2 s:2 -:2 h:2 k:2', 4),
  },
  // Combate (variante 3): Sol – Mi menor – Do – Re, más abierta y valiente.
  combate3: {
    bpm: 136,
    bucle: true,
    p1: 'G4:4 B4:2 D5:2 G5:4 D5:4 | E5:4 B4:2 G4:2 E5:4 B4:4 | C5:2 E5:2 G5:2 E5:2 C6:4 G5:4 | D5:2 F#5:2 A5:2 F#5:2 D5:4 A4:4',
    p2: [arp('G4', 'B4', 'D5'), arp('E4', 'G4', 'B4'), arp('C4', 'E4', 'G4'), arp('D4', 'F#4', 'A4')].join(' | '),
    tri: [bumChic('G2', 'D3'), bumChic('E2', 'B2'), bumChic('C3', 'G2'), bumChic('D3', 'A2')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 -:2 s:2 -:2 h:2 h:2', 4),
  },
  // Torre de Desafíos: Do menor – La bemol – Si bemol – Sol, seria y constante.
  torre: {
    bpm: 144,
    bucle: true,
    p1: 'C5:2 -:2 C5:2 D#5:2 G5:4 F5:2 D#5:2 | G#4:2 C5:2 D#5:4 D5:2 C5:2 G#4:4 | A#4:2 D5:2 F5:4 D#5:2 D5:2 A#4:4 | B4:4 D5:4 G5:4 F5:2 D5:2',
    p2: [arp('C4', 'D#4', 'G4'), arp('G#3', 'C4', 'D#4'), arp('A#3', 'D4', 'F4'), arp('G3', 'B3', 'D4')].join(' | '),
    tri: [octavas('C2', 'C3'), octavas('G#1', 'G#2'), octavas('A#1', 'A#2'), octavas('G1', 'G2')].join(' | '),
    ruido: repetir('k:2 -:2 k:2 -:2 s:2 -:2 h:2 k:2', 4),
  },
  // Entrenador del día: Fa – Re menor – Si bemol – Do, alegre pero competitiva.
  entrenador: {
    bpm: 128,
    bucle: true,
    p1: 'F5:4 A4:2 C5:2 F5:2 E5:2 D5:2 C5:2 | D5:4 F5:2 A5:2 G5:2 F5:2 E5:2 D5:2 | A#4:2 D5:2 F5:4 D5:2 A#4:2 F5:4 | C5:2 E5:2 G5:2 E5:2 C6:4 B5:2 G5:2',
    p2: [arp('F3', 'A3', 'C4'), arp('D4', 'F4', 'A4'), arp('A#3', 'D4', 'F4'), arp('C4', 'E4', 'G4')].join(' | '),
    tri: [bumChic('F2', 'C3'), bumChic('D3', 'A2'), bumChic('A#2', 'F2'), bumChic('C3', 'G2')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 -:2 s:2 -:2 h:2 h:2', 4),
  },
  // Jefe de la semana: La menor – Fa – Mi – La menor, dramática y veloz.
  semanal: {
    bpm: 160,
    bucle: true,
    p1: 'A4:2 C5:2 E5:2 A5:2 G#5:2 E5:2 C5:2 A4:2 | F4:2 A4:2 C5:2 F5:2 E5:2 C5:2 A4:2 F4:2 | E4:2 G#4:2 B4:2 E5:2 D5:2 B4:2 G#4:2 B4:2 | A4:4 C5:4 E5:4 A5:4',
    p2: [arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('E3', 'G#3', 'B3'), arp('A3', 'C4', 'E4')].join(' | '),
    tri: [octavas('A2', 'A3'), octavas('F2', 'F3'), octavas('E2', 'E3'), octavas('A1', 'A2')].join(' | '),
    ruido: repetir('k:2 k:2 h:2 -:2 s:2 -:2 k:2 h:2', 3) + ' | k:2 -:2 k:2 -:2 s:2 s:2 s:2 s:2',
  },
  // Guardianes: Re menor – Sol menor – La – Re menor, lenta y pesada, como un jefe final.
  guardian: {
    bpm: 120,
    bucle: true,
    p1: 'D5:6 F5:2 A5:4 G5:2 F5:2 | G5:6 A#5:2 G5:4 F5:2 D5:2 | E5:4 C#5:4 A4:4 E5:4 | D5:4 F5:4 A5:6 D5:2',
    p2: [arp('D4', 'F4', 'A4'), arp('G3', 'A#3', 'D4'), arp('A3', 'C#4', 'E4'), arp('D4', 'F4', 'A4')].join(' | '),
    tri: [bumChic('D2', 'A2'), bumChic('G2', 'D3'), bumChic('A2', 'E3'), bumChic('D2', 'A2')].join(' | '),
    ruido: repetir('k:4 -:2 k:2 s:4 -:2 h:2', 4),
  },
  // Minijuegos: Sol – Do – Re – Sol, saltarina.
  minijuego: {
    bpm: 132,
    bucle: true,
    p1: 'G4:2 B4:2 D5:2 B4:2 G5:4 D5:4 | E5:2 C5:2 E5:2 G5:2 E5:4 C5:4 | F#5:2 D5:2 A4:2 D5:2 F#5:2 A5:2 F#5:4 | G5:4 D5:2 B4:2 G4:8',
    p2: [arp('G4', 'B4', 'D5'), arp('C4', 'E4', 'G4'), arp('D4', 'F#4', 'A4'), arp('G4', 'B4', 'D5')].join(' | '),
    tri: [bumChic('G2', 'D3'), bumChic('C3', 'G2'), bumChic('D3', 'A2'), bumChic('G2', 'D3')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 -:2 s:2 -:2 h:2 h:2', 4),
  },
  victoria: {
    bpm: 150,
    bucle: false,
    p1: 'G4:2 C5:2 E5:2 G5:6 E5:2 G5:2 | C6:12 -:4',
    p2: 'E4:2 G4:2 C5:2 E5:6 C5:2 E5:2 | G5:12 -:4',
    tri: 'C3:4 G2:4 C3:4 E3:4 | C3:12 -:4',
    ruido: 's:2 -:10 s:2 s:2 | k:4 -:12',
  },
  derrota: {
    bpm: 90,
    bucle: false,
    p1: 'E5:4 D5:4 C5:4 B4:4 | A4:12 -:4',
    p2: 'C5:4 B4:4 A4:4 G#4:4 | E4:12 -:4',
    tri: 'A2:8 E2:8 | A1:12 -:4',
    ruido: '-:16 | -:16',
  },
  // ───────────── Historia (D274): 8 compases, parte A (4) + parte B (4) ─────────────
  // Mapa de la historia: aventura abierta, Do – Sol – La menor – Fa.
  mapa: {
    bpm: 112,
    bucle: true,
    p1: 'E5:4 G5:2 E5:2 C5:4 D5:4 | D5:4 B4:2 D5:2 G5:8 | C5:4 E5:2 C5:2 A4:4 C5:4 | A4:2 C5:2 F5:4 E5:2 D5:2 C5:4 | A5:4 F5:2 A5:2 C6:4 A5:4 | B5:4 G5:2 B5:2 D6:8 | E6:4 B5:2 G5:2 B5:4 G5:4 | A5:4 C6:2 B5:2 A5:4 G5:4',
    p2: [arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('F3', 'A3', 'C4'), arp('G3', 'B3', 'D4'), arp('E3', 'G3', 'B3'), arp('A3', 'C4', 'E4')].join(' | '),
    tri: [bumChic('C2', 'G2'), bumChic('G2', 'D3'), bumChic('A2', 'E3'), bumChic('F2', 'C3'), octavas('F2', 'F3'), octavas('G2', 'G3'), octavas('E2', 'E3'), octavas('A2', 'A3')].join(' | '),
    ruido: repetir('k:2 -:2 h:2 -:2 s:2 -:2 h:2 -:2', 4) + ' | ' + repetir('k:2 -:2 h:2 k:2 s:2 -:2 h:2 h:2', 4),
  },
  // Bosque (Brote): pastoral, Sol mayor, suave.
  region_bosque: {
    bpm: 108,
    bucle: true,
    p1: 'B4:4 D5:2 G5:2 F#5:4 D5:4 | E5:4 G5:2 E5:2 C5:4 E5:4 | F#5:4 A5:2 F#5:2 D5:4 A4:4 | G5:6 D5:2 B4:8 | E5:4 G5:2 B5:2 A5:4 G5:4 | G5:4 E5:2 C5:2 E5:8 | F#5:4 A5:4 D6:4 C#6:2 A5:2 | A5:4 F#5:4 D5:8',
    p2: [arp('G4', 'B4', 'D5'), arp('C4', 'E4', 'G4'), arp('D4', 'F#4', 'A4'), arp('G4', 'B4', 'D5'), arp('E4', 'G4', 'B4'), arp('C4', 'E4', 'G4'), arp('D4', 'F#4', 'A4'), arp('D4', 'F#4', 'A4')].join(' | '),
    tri: [bumChic('G2', 'D3'), bumChic('C3', 'G2'), bumChic('D3', 'A2'), bumChic('G2', 'D3'), bumChic('E2', 'B2'), bumChic('C3', 'G2'), bumChic('D3', 'A2'), bumChic('D3', 'A2')].join(' | '),
    ruido: repetir('-:2 -:2 h:2 -:2 s:2 -:2 h:2 -:2', 8),
  },
  // Volcán (Brasa): pesada y ardiente, Re menor con Mi bemol.
  region_volcan: {
    bpm: 144,
    bucle: true,
    p1: 'D5:2 D5:2 F5:2 A5:2 G5:4 F5:4 | D#5:2 D#5:2 G5:2 A#5:2 A5:4 G5:4 | F5:2 A5:2 D6:4 C6:2 A5:2 F5:4 | E5:4 C#5:4 A4:4 C#5:2 E5:2 | G5:2 G5:2 A#5:2 D6:2 C6:4 A#5:4 | D#6:4 D6:2 A#5:2 G5:8 | C6:2 E6:2 G6:4 E6:2 C6:2 G5:4 | A5:4 C#6:4 E6:4 A5:4',
    p2: [arp('D4', 'F4', 'A4'), arp('D#4', 'G4', 'A#4'), arp('D4', 'F4', 'A4'), arp('A3', 'C#4', 'E4'), arp('G3', 'A#3', 'D4'), arp('D#4', 'G4', 'A#4'), arp('C4', 'E4', 'G4'), arp('A3', 'C#4', 'E4')].join(' | '),
    tri: [octavas('D2', 'D3'), octavas('D#2', 'D#3'), octavas('D2', 'D3'), octavas('A1', 'A2'), octavas('G1', 'G2'), octavas('D#2', 'D#3'), octavas('C2', 'C3'), octavas('A1', 'A2')].join(' | '),
    ruido: repetir('k:2 k:2 h:2 -:2 s:2 -:2 k:2 h:2', 8),
  },
  // Costa (Marea): oleaje, Fa mayor, balanceada.
  region_costa: {
    bpm: 100,
    bucle: true,
    p1: 'A4:4 C5:2 F5:2 E5:4 C5:4 | D5:4 F5:2 A#5:2 A5:4 F5:4 | G5:4 A#5:2 G5:2 D5:4 A#4:4 | E5:4 G5:4 C6:4 G5:4 | D5:4 F5:2 A5:2 G5:4 F5:4 | F5:4 A#5:2 D6:2 C6:4 A#5:4 | G5:4 C6:2 E6:2 D6:4 C6:4 | B5:4 G5:4 E5:4 G5:4',
    p2: [arp('F4', 'A4', 'C5'), arp('A#3', 'D4', 'F4'), arp('G3', 'A#3', 'D4'), arp('C4', 'E4', 'G4'), arp('D4', 'F4', 'A4'), arp('A#3', 'D4', 'F4'), arp('C4', 'E4', 'G4'), arp('C4', 'E4', 'G4')].join(' | '),
    tri: [bumChic('F2', 'C3'), bumChic('A#2', 'F2'), bumChic('G2', 'D3'), bumChic('C3', 'G2'), bumChic('D3', 'A2'), bumChic('A#2', 'F2'), bumChic('C3', 'G2'), bumChic('C3', 'G2')].join(' | '),
    ruido: repetir('k:2 -:2 -:2 -:2 s:2 -:2 h:2 -:2', 8),
  },
  // Desierto (Rayo): La menor armónica, ritmo de tambores.
  region_desierto: {
    bpm: 126,
    bucle: true,
    p1: 'A4:2 C5:2 E5:4 F5:2 E5:2 C5:4 | B4:2 G#4:2 E5:4 D5:2 C5:2 B4:4 | A4:2 C5:2 E5:2 A5:2 G#5:4 E5:4 | F5:4 E5:4 D5:2 C5:2 B4:4 | D5:2 F5:2 A5:4 G5:2 F5:2 E5:4 | C6:2 B5:2 A5:2 E5:2 A5:8 | F5:2 A5:2 C6:4 B5:2 A5:2 F5:4 | G#5:4 B5:4 E6:4 B5:4',
    p2: [arp('A3', 'C4', 'E4'), arp('E3', 'G#3', 'B3'), arp('A3', 'C4', 'E4'), arp('E3', 'G#3', 'B3'), arp('D4', 'F4', 'A4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('E3', 'G#3', 'B3')].join(' | '),
    tri: [octavas('A2', 'A3'), octavas('E2', 'E3'), octavas('A2', 'A3'), octavas('E2', 'E3'), octavas('D2', 'D3'), octavas('A2', 'A3'), octavas('F2', 'F3'), octavas('E2', 'E3')].join(' | '),
    ruido: repetir('k:2 -:2 s:2 k:2 -:2 k:2 s:2 h:2', 8),
  },
  // Cumbre helada (Cielo): notas largas y cristalinas, Mi menor.
  region_cumbre_helada: {
    bpm: 96,
    bucle: true,
    p1: 'B5:6 G5:2 E5:4 G5:4 | G5:6 E5:2 C5:4 E5:4 | D5:4 G5:4 B5:8 | A5:6 F#5:2 D5:8 | C6:4 A5:4 E5:4 A5:4 | B5:4 G5:2 B5:2 E6:8 | D6:4 A5:2 F#5:2 A5:4 D5:4 | F#5:6 A5:2 D6:8',
    p2: [arp('E4', 'G4', 'B4'), arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'), arp('D4', 'F#4', 'A4'), arp('A3', 'C4', 'E4'), arp('E4', 'G4', 'B4'), arp('D4', 'F#4', 'A4'), arp('D4', 'F#4', 'A4')].join(' | '),
    tri: [bumChic('E2', 'B2'), bumChic('C3', 'G2'), bumChic('G2', 'D3'), bumChic('D3', 'A2'), bumChic('A2', 'E3'), bumChic('E2', 'B2'), bumChic('D3', 'A2'), bumChic('D3', 'A2')].join(' | '),
    ruido: repetir('k:4 -:4 s:4 -:2 h:2', 8),
  },
  // Ruinas (Sombra): inquietante, Do menor.
  region_ruinas: {
    bpm: 112,
    bucle: true,
    p1: 'C5:6 D#5:2 G5:4 F5:2 D#5:2 | D#5:4 C5:4 G#4:8 | F5:6 G#5:2 C6:4 G#5:4 | B5:4 G5:4 D5:4 B4:4 | G5:2 G5:2 G5:2 D#5:2 C5:8 | F5:4 G#5:4 C6:8 | G#5:2 C6:2 D#6:4 C6:2 G#5:2 D#5:4 | G5:4 B5:4 D6:4 B5:2 G5:2',
    p2: [arp('C4', 'D#4', 'G4'), arp('G#3', 'C4', 'D#4'), arp('F3', 'G#3', 'C4'), arp('G3', 'B3', 'D4'), arp('C4', 'D#4', 'G4'), arp('F3', 'G#3', 'C4'), arp('G#3', 'C4', 'D#4'), arp('G3', 'B3', 'D4')].join(' | '),
    tri: [bumChic('C2', 'G2'), bumChic('G#1', 'D#2'), bumChic('F2', 'C3'), bumChic('G1', 'D2'), bumChic('C2', 'G2'), bumChic('F2', 'C3'), bumChic('G#1', 'D#2'), bumChic('G1', 'D2')].join(' | '),
    ruido: repetir('k:4 -:2 k:2 s:4 -:2 h:2', 8),
  },
  // Prólogo: nana tranquila, Do mayor.
  prologo: {
    bpm: 88,
    bucle: true,
    p1: 'E5:6 D5:2 C5:4 E5:4 | A4:4 C5:4 E5:8 | F5:6 E5:2 D5:4 C5:4 | D5:4 B4:4 G4:8 | G5:6 E5:2 C5:4 E5:4 | B4:4 E5:4 G5:8 | A5:4 G5:2 F5:2 E5:4 D5:4 | D5:6 B4:2 G4:8',
    p2: [arp('C4', 'E4', 'G4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('G3', 'B3', 'D4'), arp('C4', 'E4', 'G4'), arp('E4', 'G4', 'B4'), arp('F3', 'A3', 'C4'), arp('G3', 'B3', 'D4')].join(' | '),
    tri: [bumChic('C2', 'G2'), bumChic('A2', 'E3'), bumChic('F2', 'C3'), bumChic('G2', 'D3'), bumChic('C2', 'G2'), bumChic('E2', 'B2'), bumChic('F2', 'C3'), bumChic('G2', 'D3')].join(' | '),
    ruido: repetir('h:2 -:6 h:2 -:6', 8),
  },
  // Eclipse: tensión lenta, La menor – Fa – Re menor – Mi.
  eclipse: {
    bpm: 76,
    bucle: true,
    p1: 'E5:8 -:2 E5:2 F5:4 | C5:8 -:4 A4:4 | D5:8 F5:4 E5:4 | G#4:8 B4:4 E5:4 | A5:8 G#5:4 A5:4 | F5:8 E5:4 C5:4 | D5:4 B4:4 G#4:8 | E4:16',
    p2: [arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('D4', 'F4', 'A4'), arp('E3', 'G#3', 'B3'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('E3', 'G#3', 'B3'), arp('E3', 'G#3', 'B3')].join(' | '),
    tri: 'A2:16 | F2:16 | D2:16 | E2:16 | A2:16 | F2:16 | E2:16 | E2:16',
    ruido: repetir('k:4 -:4 k:2 -:6', 8),
  },
  // Arquitecto (jefe final): oscura, rápida, Mi menor con Fa frigio y cromatismos.
  arquitecto: {
    bpm: 164,
    bucle: true,
    p1: 'E5:2 E5:2 G5:2 B5:2 C6:4 B5:4 | F5:2 F5:2 A5:2 C6:2 D#6:4 C6:4 | E5:2 G5:2 B5:4 A5:2 G5:2 E5:4 | D#5:4 F#5:4 B5:4 F#5:4 | A5:2 A5:2 C6:2 E6:2 D6:4 C6:4 | C6:2 A5:2 F5:2 A5:2 C6:8 | B5:2 D#6:2 F#6:4 E6:2 D#6:2 B5:4 | B5:2 -:2 B5:2 -:2 B5:2 B5:2 B5:4',
    p2: [arp('E4', 'G4', 'B4'), arp('F4', 'A4', 'C5'), arp('E4', 'G4', 'B4'), arp('B3', 'D#4', 'F#4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('B3', 'D#4', 'F#4'), arp('B3', 'D#4', 'F#4')].join(' | '),
    tri: [octavas('E2', 'E3'), octavas('F2', 'F3'), octavas('E2', 'E3'), octavas('B1', 'B2'), octavas('A1', 'A2'), octavas('F2', 'F3'), octavas('B1', 'B2'), octavas('B1', 'B2')].join(' | '),
    ruido: repetir('k:2 k:2 s:2 -:2 k:2 -:2 s:2 s:2', 7) + ' | k:2 -:2 k:2 -:2 s:2 s:2 s:2 s:2',
  },
  // Final de la historia: fanfarria larga y luminosa, Do mayor.
  final: {
    bpm: 132,
    bucle: false,
    p1: 'C5:2 E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 C6:2 | D6:4 B5:4 G5:8 | A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 | F5:2 A5:2 C6:4 B5:2 A5:2 G5:4 | C6:2 E6:2 G6:4 E6:2 C6:2 E6:4 | D6:2 G6:2 B5:4 D6:2 G6:2 D6:4 | A5:4 C6:4 F6:4 E6:2 D6:2 | C6:12 -:4',
    p2: [arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'), arp('A3', 'C4', 'E4'), arp('F3', 'A3', 'C4'), arp('C4', 'E4', 'G4'), arp('G3', 'B3', 'D4'), arp('F3', 'A3', 'C4'), 'G4:12 -:4'].join(' | '),
    tri: [octavas('C2', 'C3'), octavas('G2', 'G3'), octavas('A2', 'A3'), octavas('F2', 'F3'), octavas('C2', 'C3'), octavas('G2', 'G3'), octavas('F2', 'F3'), 'C2:12 -:4'].join(' | '),
    ruido: repetir('k:2 -:2 h:2 h:2 s:2 -:2 h:2 h:2', 7) + ' | k:4 -:12',
  },
};
