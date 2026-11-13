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
};
