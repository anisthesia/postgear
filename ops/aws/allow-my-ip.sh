#!/usr/bin/env bash
# Point the postgear security group's SSH rule at this machine's current public IP.
# No-op when it already matches. Uses Terraform so state stays in sync.
set -euo pipefail
cd "$(dirname "$0")"
IP="$(curl -s --max-time 5 https://checkip.amazonaws.com)"
[[ "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "could not detect public IP" >&2; exit 1; }
SG="$(terraform output -raw security_group_id)"
CUR="$(aws ec2 describe-security-groups --group-ids "$SG" --region ap-south-1 \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`].IpRanges[0].CidrIp' --output text)"
if [[ "$CUR" == "$IP/32" ]]; then echo "SSH already allowed from $IP"; exit 0; fi
echo "SSH rule: $CUR -> $IP/32"
terraform apply -auto-approve -input=false -no-color -var "ssh_cidr=$IP/32" -target=aws_security_group.postgear | grep -E "Apply complete|Error"
