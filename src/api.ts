import fetch from 'node-fetch';
import { Chess } from 'chess.js';

const internalChess = new Chess();

export async function apiMove(movePacket: Buffer): Promise<string> {
  const toCol = (n: number) => String.fromCharCode(97 + Math.round(n + 3.5));
  const toRow = (n: number) => Math.round(n + 3.5) + 1;
  const toPos = (c: string, r: string) => [c.charCodeAt(0) - 100.5, parseInt(r) - 4.5];

  const [, , fx, fz, tx, tz] = movePacket.toString().split(';');
  const move = `${toCol(+fx)}${toRow(+fz)}${toCol(+tx)}${toRow(+tz)}`;
  internalChess.move(move); console.log('user: ' + move);

  const res = await fetch('https://chess-api.com/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fen: internalChess.fen(),
      variants: 3,
      depth: 12,
      maxThinkingTime: 50,
    }),
  });

  const apiData = await res.json() as { move: string };
  internalChess.move(apiData.move); console.log('ai:   ' + apiData.move);

  const [fx_, fz_] = toPos(apiData.move[0], apiData.move[1]);
  const [tx_, tz_] = toPos(apiData.move[2], apiData.move[3]);

  return `;${fx_};${fz_};${tx_};${tz_}`;
}
