#!/usr/bin/env bash
# SSH to the postgear host. Your public IP changes often, so this first points the
# security group's SSH rule at your current IP (only when it differs), then connects.
#   ops/aws/ssh.sh                 # interactive shell
#   ops/aws/ssh.sh 'docker compose -f /opt/postgear/compose.yaml ps'
set -euo pipefail
cd "$(dirname "$0")"
"$PWD/allow-my-ip.sh" >/dev/null
exec ssh -i "${KEY:-$HOME/.ssh/postgear_aws}" -o StrictHostKeyChecking=accept-new "ubuntu@$(terraform output -raw public_ip)" "$@"
