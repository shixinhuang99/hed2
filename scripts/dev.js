import { execFile, spawn } from 'node:child_process';

function main() {
  const cmds = [
    {
      name: 'tailwindcss',
      runner: 'node',
      args: ['--run', 'tailwindcss'],
      closed: false,
      cp: null,
    },
    {
      name: 'vite',
      runner: 'node',
      args: ['--run', 'dev'],
      closed: false,
      cp: null,
    },
    {
      name: 'tauri',
      runner: 'cargo',
      args: ['run'],
      closed: false,
      cp: null,
    },
  ];

  const checkAndExit = () => {
    if (cmds.every((cmd) => cmd.closed)) {
      process.exit();
    }
  };

  for (const cmd of cmds) {
    const cp = spawn(cmd.runner, cmd.args);

    cp.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    cp.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    cp.on('error', (err) => {
      cmd.closed = true;
      console.error(err);
      checkAndExit();
    });

    cp.on('spawn', () => {
      cmd.cp = cp;
    });

    cp.on('close', () => {
      cmd.closed = true;
      if (cmd.name === 'tauri') {
        for (const cmd of cmds) {
          if (cmd.closed) {
            continue;
          }
          if (
            cmd.name === 'vite' &&
            process.platform === 'win32' &&
            cmd.cp.pid
          ) {
            execFile('taskkill', ['/PID', cmd.cp.pid, '/F', '/T']);
          } else {
            cmd.cp.kill();
          }
        }
      }
      checkAndExit();
    });
  }
}

main();
