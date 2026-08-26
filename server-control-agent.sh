#!/usr/bin/env bash
set -Eeuo pipefail

# One-shot owner-authorized NL bootstrap for Planeta AI egress.
# Deliberately does nothing on any host except the canonical Netherlands VPS.
if [[ "$(id -u)" != "0" ]]; then
  echo 'Run as root' >&2
  exit 1
fi

if ! ip -4 addr show scope global 2>/dev/null | grep -qE 'inet 88\.218\.169\.68/'; then
  echo "PLANETA_EGRESS_BOOTSTRAP_SKIPPED host=$(hostname)"
  exit 0
fi

USER='planeta-egress'
PUB='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMqRILNRt5DAtlGBqdE8G5i0ypjIRAfGP0Fnc1D/8UQ5 planeta-ai-egress'

id "$USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$USER"
install -d -m 700 -o "$USER" -g "$USER" "/home/$USER/.ssh"
printf '%s\n' "from=\"62.173.146.111\",no-agent-forwarding,no-X11-forwarding,no-pty,no-user-rc $PUB" > "/home/$USER/.ssh/authorized_keys"
chown "$USER:$USER" "/home/$USER/.ssh/authorized_keys"
chmod 600 "/home/$USER/.ssh/authorized_keys"

cat > /etc/ssh/sshd_config.d/65-planeta-egress.conf <<'EOF'
Match User planeta-egress
    AllowTcpForwarding yes
    GatewayPorts no
    X11Forwarding no
    PermitTTY no
    AllowAgentForwarding no
EOF

sshd -t
systemctl reload ssh

echo "USER=$(id -un "$USER")"
echo "AUTHORIZED_KEYS=$(wc -l < /home/$USER/.ssh/authorized_keys)"
echo "SSHD=$(systemctl is-active ssh)"
echo 'PLANETA_EGRESS_NL_BOOTSTRAP_OK=1'
