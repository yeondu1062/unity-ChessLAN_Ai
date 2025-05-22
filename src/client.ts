/* ____ _                      _    _ 
  / ___| |__   ___  ___ ___   / \  (_)
 | |   | '_ \ / _ \/ __/ __| / _ \ | |
 | |___| | | |  __/\__ \__ \/ ___ \| |
  \____|_| |_|\___||___/___/_/   \_\_|
    written by @yeondu1062.
*/

import dgram from 'dgram';
import Enquirer from 'enquirer';
import { apiMove } from './api';

const socket = dgram.createSocket('udp4');
const enquirer = new Enquirer();

const PORT = 51062;
const MAGIC = 'C1062;';

async function findServers(timeout = 1500): Promise<string[]> {
  return new Promise(resolve => {
    const servers = new Set<string>();
    const resHandle = (msg: Buffer, remote: dgram.RemoteInfo) => {
      if (msg.toString() == MAGIC + 'DiscoveryRes') servers.add(remote.address);
    }

    socket.bind(() => {
      const discovery = Buffer.from(MAGIC + 'Discovery');
      socket.setBroadcast(true);
      socket.send(discovery, 0, discovery.length, PORT, '255.255.255.255');
    });

    socket.on('message', resHandle);

    setTimeout(() => {
      socket.off('message', resHandle);
      resolve(Array.from(servers));
    }, timeout);
  });
}

async function main() {
  const servers = await findServers();
  if (servers.length === 0) {
    console.error("\x1b[91m[ChessLAN_Ai]\x1b[0m 열려있는 서버를 찾지 못하였습니다."); return;
  }

  const ipPrompt = await enquirer.prompt({
      type: 'select',
      name: 'ip',
      message: '서버를 선택해주세요.',
      choices: servers,
  }) as { ip: string };

  const join = Buffer.from(MAGIC + 'Join');
  socket.send(join, 0, join.length, PORT, ipPrompt.ip);

  console.log(`\x1b[92m[ChessLAN_Ai]\x1b[0m 서버 ${ipPrompt.ip}에 연결하였습니다.`);

  socket.on('message', async msg => {
    if (msg.toString().startsWith(MAGIC + 'Move')) {
      const move = Buffer.from(MAGIC + 'Move' + await apiMove(msg));
      socket.send(move, 0, move.length, PORT, ipPrompt.ip);
    }
  });
}

process.on('SIGINT', () => process.exit());
process.on('exit', () => socket.close());

main();
