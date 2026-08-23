const names = ['VPS_IP','VPS_USER','VPS_SSH_PRIVATE_KEY','VPS_ROOT_PASSWORD'];
console.log('RECOVERY_PREVIEW_ENV ' + names.map(k => `${k}=${process.env[k] ? 'present' : 'absent'}`).join(' '));
