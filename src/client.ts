import dgram from 'dgram';
import Enquirer from 'enquirer';

const socket = dgram.createSocket('udp4');
const enquirer = new Enquirer();

const PORT = 51062;
const MAGIC = 'C1062;';

async function findServers(timeout = 3000): Promise<string[]> {
  return new Promise(resolve => {
    const servers = new Set<string>();
    const resHandle = (msg: Buffer, remote: dgram.RemoteInfo) => {
      if (msg.toString().startsWith(MAGIC + 'DiscoveryRes')) servers.add(remote.address);
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
  if (servers.length === 0) { console.error('서버를 찾지 못했습니다.'); return; }

  const ipPrompt = await enquirer.prompt({
      type: 'select',
      name: 'ip',
      message: '서버 IP를 선택하세요',
      choices: servers,
  }) as { ip: string };

  const join = Buffer.from(MAGIC + 'Join');
  socket.send(join, 0, join.length, PORT, ipPrompt.ip);
  socket.close();
}

main();
